<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmActivity;
use App\Models\CrmCampaign;
use App\Models\CrmDeal;
use App\Models\Lead;
use Illuminate\Http\Request;

class CrmController extends Controller
{
    private function businessId(Request $r): int
    {
        return $r->user()->current_business_id ?? $r->user()->businesses()->first()?->id;
    }

    // ── Leads ──────────────────────────────────────────

    public function leads(Request $request)
    {
        $q = Lead::where('business_id', $this->businessId($request))
            ->withCount('activities');

        if ($request->status) {
            $q->where('status', $request->status);
        }
        if ($request->search) {
            $q->where(function ($w) use ($request) {
                $s = $request->search;
                $w->where('name', 'like', "%$s%")->orWhere('email', 'like', "%$s%")->orWhere('company', 'like', "%$s%");
            });
        }

        return response()->json($q->orderByDesc('created_at')->paginate($request->per_page ?? 20));
    }

    public function storeLead(Request $request)
    {
        $v = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
            'source' => 'sometimes|in:website,referral,social_media,cold_call,advertisement,other',
            'estimated_value' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);
        $v['business_id'] = $this->businessId($request);
        $v['status'] = 'new';

        return response()->json(Lead::create($v), 201);
    }

    public function updateLead(Request $request, Lead $lead)
    {
        $v = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
            'status' => 'sometimes|in:new,contacted,qualified,proposal,negotiation,won,lost',
            'source' => 'sometimes|in:website,referral,social_media,cold_call,advertisement,other',
            'estimated_value' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);
        $lead->update($v);

        return response()->json($lead);
    }

    public function destroyLead(Lead $lead)
    {
        $lead->activities()->delete();
        $lead->deals()->delete();
        $lead->delete();

        return response()->json(['message' => 'Lead deleted']);
    }

    // ── Deals ──────────────────────────────────────────

    public function deals(Request $request)
    {
        $q = CrmDeal::where('business_id', $this->businessId($request))->with('lead:id,name', 'customer:id,name');

        if ($request->stage) {
            $q->where('stage', $request->stage);
        }
        if ($request->search) {
            $q->where('title', 'like', "%{$request->search}%");
        }

        return response()->json($q->orderByDesc('created_at')->paginate($request->per_page ?? 20));
    }

    public function storeDeal(Request $request)
    {
        $v = $request->validate([
            'title' => 'required|string|max:255',
            'lead_id' => 'nullable|exists:crm_leads,id',
            'customer_id' => 'nullable|exists:customers,id',
            'amount' => 'nullable|numeric|min:0',
            'stage' => 'sometimes|in:prospecting,qualification,proposal,negotiation,closed_won,closed_lost',
            'expected_close_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);
        $v['business_id'] = $this->businessId($request);

        return response()->json(CrmDeal::create($v), 201);
    }

    public function updateDeal(Request $request, CrmDeal $deal)
    {
        $v = $request->validate([
            'title' => 'sometimes|string|max:255',
            'amount' => 'nullable|numeric|min:0',
            'stage' => 'sometimes|in:prospecting,qualification,proposal,negotiation,closed_won,closed_lost',
            'expected_close_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);
        $deal->update($v);

        return response()->json($deal);
    }

    public function destroyDeal(CrmDeal $deal)
    {
        $deal->delete();

        return response()->json(['message' => 'Deal deleted']);
    }

    // ── Activities ─────────────────────────────────────

    public function activities(Request $request)
    {
        $q = CrmActivity::where('business_id', $this->businessId($request))
            ->with('lead:id,name', 'deal:id,title', 'customer:id,name');

        if ($request->type) {
            $q->where('type', $request->type);
        }
        if (! $request->boolean('show_completed')) {
            $q->where('completed', false);
        }

        return response()->json($q->orderByDesc('created_at')->paginate($request->per_page ?? 20));
    }

    public function storeActivity(Request $request)
    {
        $v = $request->validate([
            'type' => 'required|in:call,email,meeting,task,note',
            'subject' => 'required|string|max:255',
            'description' => 'nullable|string',
            'lead_id' => 'nullable|exists:crm_leads,id',
            'deal_id' => 'nullable|exists:crm_deals,id',
            'customer_id' => 'nullable|exists:customers,id',
            'due_date' => 'nullable|date',
        ]);
        $v['business_id'] = $this->businessId($request);

        return response()->json(CrmActivity::create($v), 201);
    }

    public function completeActivity(CrmActivity $activity)
    {
        $activity->update(['completed' => true]);

        return response()->json($activity);
    }

    public function destroyActivity(CrmActivity $activity)
    {
        $activity->delete();

        return response()->json(['message' => 'Activity deleted']);
    }

    // ── Campaigns ──────────────────────────────────────

    public function campaigns(Request $request)
    {
        $q = CrmCampaign::where('business_id', $this->businessId($request));
        if ($request->status) {
            $q->where('status', $request->status);
        }

        return response()->json($q->orderByDesc('created_at')->paginate($request->per_page ?? 20));
    }

    public function storeCampaign(Request $request)
    {
        $v = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:email,sms,social_media,event,other',
            'budget' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);
        $v['business_id'] = $this->businessId($request);

        return response()->json(CrmCampaign::create($v), 201);
    }

    public function updateCampaign(Request $request, CrmCampaign $campaign)
    {
        $v = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:draft,active,paused,completed',
            'budget' => 'nullable|numeric|min:0',
            'spent' => 'nullable|numeric|min:0',
            'leads_generated' => 'nullable|integer|min:0',
            'conversions' => 'nullable|integer|min:0',
        ]);
        $campaign->update($v);

        return response()->json($campaign);
    }

    public function destroyCampaign(CrmCampaign $campaign)
    {
        $campaign->delete();

        return response()->json(['message' => 'Campaign deleted']);
    }

    // ── Summary ────────────────────────────────────────

    public function summary(Request $request)
    {
        $bid = $this->businessId($request);

        return response()->json([
            'total_leads' => Lead::where('business_id', $bid)->count(),
            'new_leads' => Lead::where('business_id', $bid)->where('status', 'new')->count(),
            'won_leads' => Lead::where('business_id', $bid)->where('status', 'won')->count(),
            'total_deals' => CrmDeal::where('business_id', $bid)->count(),
            'open_deals' => CrmDeal::where('business_id', $bid)->whereNotIn('stage', ['closed_won', 'closed_lost'])->count(),
            'won_deals_value' => CrmDeal::where('business_id', $bid)->where('stage', 'closed_won')->sum('amount'),
            'open_deals_value' => CrmDeal::where('business_id', $bid)->whereNotIn('stage', ['closed_won', 'closed_lost'])->sum('amount'),
            'pending_activities' => CrmActivity::where('business_id', $bid)->where('completed', false)->count(),
            'total_campaigns' => CrmCampaign::where('business_id', $bid)->count(),
            'active_campaigns' => CrmCampaign::where('business_id', $bid)->where('status', 'active')->count(),
        ]);
    }
}
