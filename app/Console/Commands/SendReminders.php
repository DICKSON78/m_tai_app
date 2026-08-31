<?php
namespace App\Console\Commands;

use App\Http\Controllers\Api\PushNotificationController;
use App\Models\Bill;
use App\Models\Business;
use App\Models\CreditSale;
use App\Models\Loan;
use App\Models\Product;
use App\Models\UserNotification;
use Illuminate\Console\Command;

class SendReminders extends Command
{
    protected $signature = 'notifications:send-reminders {--days=3 : Days ahead to warn for upcoming due dates}';
    protected $description = 'Send scheduled reminders: overdue kopesha, loan/bill due dates and stock alerts';

    public function handle()
    {
        $days = (int) $this->option('days');
        $sent = 0;

        $businesses = Business::with('user')->get();

        foreach ($businesses as $business) {
            $owner = $business->user;
            if (! $owner) {
                continue;
            }

            $sent += $this->creditSaleReminders($business, $owner, $days);
            $sent += $this->loanReminders($business, $owner, $days);
            $sent += $this->billReminders($business, $owner, $days);
            $sent += $this->stockAlerts($business, $owner);
        }

        $this->info("Sent {$sent} reminder(s).");

        return 0;
    }

    private function alreadySentToday(int $userId, string $type): bool
    {
        return UserNotification::where('user_id', $userId)
            ->where('type', $type)
            ->whereDate('created_at', now()->toDateString())
            ->exists();
    }

    private function notify(int $userId, string $type, string $title, string $body, array $data = []): bool
    {
        if ($this->alreadySentToday($userId, $type)) {
            return false;
        }

        UserNotification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $body,
            'type' => $type,
        ]);

        PushNotificationController::sendNotification(
            \App\Models\User::find($userId),
            $title,
            $body,
            array_merge(['type' => $type], $data)
        );

        return true;
    }

    private function creditSaleReminders(Business $business, $owner, int $days): int
    {
        $count = 0;

        $upcoming = $business->creditSales()
            ->where('status', '!=', 'paid')
            ->whereBetween('due_date', [now()->toDateString(), now()->addDays($days)->toDateString()])
            ->get();

        foreach ($upcoming as $cs) {
            $type = 'credit_sale_upcoming';
            $label = 'muda wake ukifika leo';
            if ($cs->due_date->isAfter(now()->startOfDay()) && $cs->due_date->isBefore(now()->addDays($days + 1)->startOfDay())) {
                $label = 'likifika siku ' . $cs->due_date->format('d/m/Y');
            }
            $idType = $type . '_' . $cs->id;
            if ($this->notify($owner->id, $idType, 'Mkopo (Kopesha) unakaribia kukomaa',
                "Mkopo wa {$cs->customer_name} (TZS " . number_format((float) $cs->amount - (float) $cs->amount_paid, 0) . ") {$label}.", ['entity' => 'credit_sale', 'id' => $cs->id])) {
                $count++;
            }
        }

        $overdue = $business->creditSales()
            ->where('status', '!=', 'paid')
            ->whereDate('due_date', '<', now()->toDateString())
            ->get();

        foreach ($overdue as $cs) {
            $type = 'credit_sale_overdue_' . $cs->id;
            if ($this->notify($owner->id, $type, 'Deni la Kopesha limekwisha muda',
                "Mkopo wa {$cs->customer_name} (TZS " . number_format((float) $cs->amount - (float) $cs->amount_paid, 0) . ") umechelewa tangu {$cs->due_date->format('d/m/Y')}.", ['entity' => 'credit_sale', 'id' => $cs->id])) {
                $count++;
            }
        }

        return $count;
    }

    private function loanReminders(Business $business, $owner, int $days): int
    {
        $count = 0;

        $upcoming = $business->loans()
            ->where('status', '!=', 'paid')
            ->whereBetween('due_date', [now()->toDateString(), now()->addDays($days)->toDateString()])
            ->get();

        foreach ($upcoming as $loan) {
            $type = 'loan_due_' . $loan->id;
            if ($this->notify($owner->id, $type, 'Malipo ya Hisa yanakaribia',
                "Hisa (TZS " . number_format((float) $loan->loan_balance, 0) . ") kwa mteja linastahili kulipwa ifikapo {$loan->due_date->format('d/m/Y')}.",
                ['entity' => 'loan', 'id' => $loan->id])) {
                $count++;
            }
        }

        $overdue = $business->loans()
            ->where('status', '!=', 'paid')
            ->whereDate('due_date', '<', now()->toDateString())
            ->get();

        foreach ($overdue as $loan) {
            if ($loan->status === 'active') {
                $loan->update(['status' => 'overdue']);
            }
            $type = 'loan_overdue_' . $loan->id;
            if ($this->notify($owner->id, $type, 'Hisa limekwisha muda',
                "Hisa (TZS " . number_format((float) $loan->loan_balance, 0) . ") limechelewa kulipwa tangu {$loan->due_date->format('d/m/Y')}.",
                ['entity' => 'loan', 'id' => $loan->id])) {
                $count++;
            }
        }

        return $count;
    }

    private function billReminders(Business $business, $owner, int $days): int
    {
        $count = 0;

        $upcoming = Bill::where('business_id', $business->id)
            ->where('status', '!=', 'paid')
            ->whereBetween('due_date', [now()->toDateString(), now()->addDays($days)->toDateString()])
            ->get();

        foreach ($upcoming as $bill) {
            $type = 'bill_due_' . $bill->id;
            if ($this->notify($owner->id, $type, 'Bili inakaribia',
                "Bili ya {$bill->vendor_name} (TZS " . number_format($bill->getBalanceAttribute(), 0) . ") inastahili kulipwa ifikapo {$bill->due_date->format('d/m/Y')}.",
                ['entity' => 'bill', 'id' => $bill->id])) {
                $count++;
            }
        }

        $overdue = Bill::where('business_id', $business->id)
            ->where('status', '!=', 'paid')
            ->whereDate('due_date', '<', now()->toDateString())
            ->get();

        foreach ($overdue as $bill) {
            $type = 'bill_overdue_' . $bill->id;
            if ($this->notify($owner->id, $type, 'Bili imekwisha muda',
                "Bili ya {$bill->vendor_name} (TZS " . number_format($bill->getBalanceAttribute(), 0) . ") imechelewa tangu {$bill->due_date->format('d/m/Y')}.",
                ['entity' => 'bill', 'id' => $bill->id])) {
                $count++;
            }
        }

        return $count;
    }

    private function stockAlerts(Business $business, $owner): int
    {
        $count = 0;

        $alerts = $business->products()
            ->where('is_track_stock', true)
            ->where(function ($q) {
                $q->where('quantity', '<=', 0)
                    ->orWhereRaw('quantity <= low_stock_threshold');
            })
            ->get();

        foreach ($alerts as $product) {
            $out = (int) $product->quantity <= 0;
            $type = 'stock_' . ($out ? 'out_' : 'low_') . $product->id;
            if ($this->notify($owner->id, $type,
                $out ? 'Bidhaa imeisha (Out of stock)' : 'Bidhaa iko chini (Low stock)',
                "{$product->name}: stock iliyobaki ni {$product->quantity}.",
                ['entity' => 'product', 'id' => $product->id])) {
                $count++;
            }
        }

        return $count;
    }
}
