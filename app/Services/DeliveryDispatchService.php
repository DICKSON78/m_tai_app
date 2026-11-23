<?php

namespace App\Services;

use App\Http\Controllers\Api\PushNotificationController;
use App\Models\Delivery;
use App\Models\Transporter;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Log;

/**
 * Uber/Bolt style dispatch: finds the closest online transporter to the
 * pickup point, reserves the load for them for a short window and alerts
 * them immediately. Acceptance is still explicit from the transporter app.
 */
class DeliveryDispatchService
{
    public const OFFER_SECONDS = 120;

    public const MAX_RADIUS_KM = 60;

    /**
     * Release offers that were not answered in time.
     *
     * When $reoffer is true, each released load is immediately passed to the
     * next closest online transporter instead of waiting for manual assignment.
     */
    public function expireStaleOffers(bool $reoffer = false): void
    {
        $stale = Delivery::where('status', 'pending')
            ->whereNotNull('transporter_id')
            ->whereNotNull('offer_expires_at')
            ->where('offer_expires_at', '<', now())
            ->get();

        if ($stale->isEmpty()) {
            return;
        }

        Delivery::whereIn('id', $stale->pluck('id'))->update([
            'transporter_id' => null,
            'offered_at' => null,
            'offer_expires_at' => null,
            'auto_dispatched' => false,
        ]);

        if (! $reoffer) {
            return;
        }

        foreach ($stale as $delivery) {
            $previousTransporterId = $delivery->transporter_id;

            try {
                $this->offer($delivery->fresh(), $previousTransporterId ? [$previousTransporterId] : []);
            } catch (\Throwable $exception) {
                Log::warning('Delivery re-offer after expiry failed', [
                    'delivery' => $delivery->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }
    }

    public function nearestTransporter(Delivery $delivery, array $excludeIds = []): ?Transporter
    {
        $this->expireStaleOffers();

        // A driver with a live offer or an active load cannot take another one.
        $busyTransporterIds = Delivery::whereNotNull('transporter_id')
            ->where(function ($query) {
                $query->whereIn('status', ['accepted', 'in_transit'])
                    ->orWhere(function ($pending) {
                        $pending->where('status', 'pending')
                            ->where(function ($offer) {
                                $offer->whereNull('offer_expires_at')
                                    ->orWhere('offer_expires_at', '>', now());
                            });
                    });
            })
            ->pluck('transporter_id')
            ->all();

        $excludedIds = array_values(array_unique(array_merge($excludeIds, $busyTransporterIds)));

        $candidates = Transporter::where('is_active', true)
            ->where('is_online', true)
            ->when(! empty($excludedIds), fn ($query) => $query->whereNotIn('id', $excludedIds))
            ->get();

        if ($candidates->isEmpty()) {
            return null;
        }

        if ($delivery->pickup_latitude !== null && $delivery->pickup_longitude !== null) {
            $scored = $candidates
                ->filter(fn (Transporter $transporter) => $transporter->latitude !== null && $transporter->longitude !== null)
                ->map(fn (Transporter $transporter) => [
                    'transporter' => $transporter,
                    'km' => $this->distanceKm(
                        (float) $delivery->pickup_latitude,
                        (float) $delivery->pickup_longitude,
                        (float) $transporter->latitude,
                        (float) $transporter->longitude
                    ),
                ])
                ->filter(fn (array $row) => $row['km'] <= self::MAX_RADIUS_KM)
                ->sortBy('km');

            $best = $scored->first();

            return $best ? $best['transporter'] : null;
        }

        // No pickup coordinates: prefer a transporter in the business region,
        // otherwise fall back to the first driver who went online.
        $region = $delivery->business ? $delivery->business->region : null;
        if ($region) {
            $regional = $candidates->first(
                fn (Transporter $transporter) => strcasecmp((string) $transporter->region, (string) $region) === 0
            );
            if ($regional) {
                return $regional;
            }
        }

        return $candidates->sortBy('id')->first();
    }

    /**
     * Offer a pending delivery to a transporter (closest one when not given).
     * The delivery stays 'pending' until the transporter explicitly accepts.
     */
    /**
     * @param  array<int, int>  $excludeIds  Transporters to skip (e.g. the driver who just rejected).
     */
    public function offer(Delivery $delivery, array $excludeIds = [], ?Transporter $force = null): bool
    {
        $this->expireStaleOffers();
        $delivery->refresh();

        if ($delivery->status !== 'pending') {
            return false;
        }

        if ($delivery->transporter_id !== null && $delivery->hasActiveOffer()) {
            return false;
        }

        $transporter = $force ?: $this->nearestTransporter($delivery, $excludeIds);
        if (! $transporter) {
            return false;
        }

        $delivery->update([
            'transporter_id' => $transporter->id,
            'status' => 'pending',
            'offered_at' => now(),
            'offer_expires_at' => now()->addSeconds(self::OFFER_SECONDS),
            'auto_dispatched' => true,
        ]);

        $distance = null;
        if ($delivery->pickup_latitude !== null && $delivery->pickup_longitude !== null
            && $transporter->latitude !== null && $transporter->longitude !== null) {
            $distance = $this->distanceKm(
                (float) $delivery->pickup_latitude,
                (float) $delivery->pickup_longitude,
                (float) $transporter->latitude,
                (float) $transporter->longitude
            );
        }

        $price = 'TZS '.number_format((float) $delivery->offered_price, 0);
        $title = 'Mzigo mpya karibu nawe';
        $body = "{$delivery->pickup_location} → {$delivery->destination}. {$price}."
            .($distance !== null ? ' '.round($distance, 1).' km kutoka kwako.' : '')
            .' Kubali au kataa sasa.';
        $link = "/(transporter)/delivery-request?id={$delivery->id}";
        $data = [
            'type' => 'delivery_update',
            'status' => 'offered',
            'delivery_id' => $delivery->id,
            'link' => $link,
        ];

        if ($transporter->user) {
            try {
                PushNotificationController::sendNotification($transporter->user, $title, $body, $data);
            } catch (\Throwable $exception) {
                Log::warning('Delivery dispatch push failed', ['delivery' => $delivery->id, 'error' => $exception->getMessage()]);
            }

            UserNotification::create([
                'user_id' => $transporter->user_id,
                'title' => $title,
                'message' => $body,
                'type' => 'delivery_update',
                'link' => $link,
            ]);
        }

        return true;
    }

    /**
     * When a driver comes online (or shares a location), hand them the oldest
     * waiting load if they are the closest available transporter to its pickup.
     */
    public function offerPendingFor(Transporter $transporter): int
    {
        $this->expireStaleOffers(true);

        $transporter->refresh();

        if (! $transporter->is_active || ! $transporter->is_online) {
            return 0;
        }

        $pending = Delivery::where('status', 'pending')
            ->whereNull('transporter_id')
            ->orderBy('created_at')
            ->get();

        $offered = 0;

        foreach ($pending as $delivery) {
            $nearest = $this->nearestTransporter($delivery);

            if (! $nearest || $nearest->id !== $transporter->id) {
                continue;
            }

            if ($this->offer($delivery->fresh(), [], $transporter)) {
                $offered++;
            }

            // One request at a time, like Uber/Bolt.
            break;
        }

        return $offered;
    }

    public function distanceKm(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371;
        $toRad = fn (float $deg) => $deg * M_PI / 180;

        $dLat = $toRad($lat2 - $lat1);
        $dLon = $toRad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2
            + cos($toRad($lat1)) * cos($toRad($lat2)) * sin($dLon / 2) ** 2;

        return 2 * $earthRadius * asin(sqrt($a));
    }
}
