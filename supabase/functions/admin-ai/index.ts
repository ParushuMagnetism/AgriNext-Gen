import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'cluster_health':
        systemPrompt = `You are an agricultural ecosystem analyst for Agri Mitra platform. 
Analyze the provided cluster data and generate a comprehensive health report.
Focus on:
1. Overall cluster health summary
2. Hotspots (areas with high activity or issues)
3. Bottlenecks (delays, capacity issues)
4. Risk factors (crop diseases, weather, market volatility)
5. Recommended immediate actions
6. Long-term strategic recommendations

Be specific with numbers and actionable insights. Format the response clearly with sections.`;
        
        userPrompt = `Generate a Cluster Health Intelligence Report based on this ecosystem data:

**Farmers:** ${data.totalFarmers} registered
**Crops:** ${data.totalCrops} total, ${data.harvestReady} harvest-ready, ${data.oneWeekAway} within one week
**Transport:** ${data.pendingTransport} pending requests, ${data.activeTransport} in progress
**Marketplace:** ${data.totalOrders} orders, ${data.pendingOrders} pending
**Buyers:** ${data.totalBuyers} active
**Transporters:** ${data.activeTransporters} active

District Distribution: ${data.districts || 'Multiple districts'}
Recent Issues: ${data.recentIssues || 'None reported'}

Provide a detailed cluster health analysis with actionable recommendations.`;
        break;

      case 'supply_demand':
        systemPrompt = `You are an agricultural supply-demand forecasting expert for Agri Mitra.
Analyze the provided data to predict supply vs demand for the next 7 days.
Consider:
1. Current harvest-ready crops
2. Incoming harvests (one week away)
3. Current buyer demand patterns
4. Market price trends
5. Seasonal factors

Provide specific predictions for each major crop category with surplus/shortage alerts.`;

        userPrompt = `Predict Supply vs Demand for the next 7 days:

**Current Supply:**
- Harvest-ready crops: ${data.harvestReady}
- One week to harvest: ${data.oneWeekAway}
- Crop types: ${data.cropTypes?.join(', ') || 'Various'}

**Current Demand:**
- Pending orders: ${data.pendingOrders}
- Active buyers: ${data.totalBuyers}
- Preferred crops: ${data.preferredCrops?.join(', ') || 'Various'}

**Market Trends:**
${data.marketPrices?.map((p: { crop_name: string; modal_price: number; trend_direction: string }) => 
  `- ${p.crop_name}: ₹${p.modal_price}/quintal (${p.trend_direction})`
).join('\n') || 'No recent data'}

Generate a 7-day supply-demand forecast with specific alerts and recommendations.`;
        break;

      case 'price_anomaly':
        systemPrompt = `You are a market price analyst for agricultural commodities in India.
Detect anomalies and irregularities in the provided price data.
Look for:
1. Sudden price spikes or crashes
2. Unusual patterns compared to seasonal norms
3. Discrepancies between regions
4. Signs of market manipulation
5. Supply-demand mismatches affecting prices

Flag any concerns with severity levels (Low/Medium/High).`;

        userPrompt = `Analyze these market prices for anomalies:

**Recent Price Data:**
${data.prices?.map((p: { crop_name: string; market_name: string; modal_price: number; min_price: number; max_price: number; trend_direction: string; date: string }) => 
  `- ${p.crop_name} at ${p.market_name}: ₹${p.modal_price} (range: ₹${p.min_price}-₹${p.max_price}), trend: ${p.trend_direction}, date: ${p.date}`
).join('\n') || 'Limited data available'}

**Order Patterns:**
- Total orders: ${data.totalOrders}
- Average price offered: ₹${data.avgPriceOffered || 'N/A'}

Identify any price irregularities, manipulation risks, or market anomalies.`;
        break;

      case 'efficiency_advisor':
        systemPrompt = `You are an operations efficiency consultant for Agri Mitra agricultural platform.
Analyze operational data to identify inefficiencies and recommend optimizations.
Focus on:
1. Agent productivity metrics
2. Transport utilization and delays
3. Farmer verification frequency
4. Regional workload distribution
5. Process bottlenecks

Provide specific, actionable efficiency improvements with expected impact.`;

        userPrompt = `Analyze operational efficiency:

**Agent Operations:**
- Total agents: ${data.totalAgents}
- Average tasks per agent: ${data.avgTasksPerAgent || 'N/A'}
- Task completion rate: ${data.taskCompletionRate || 'N/A'}%

**Transport Efficiency:**
- Active transporters: ${data.activeTransporters}
- Pending requests: ${data.pendingTransport}
- Average delivery time: ${data.avgDeliveryTime || 'N/A'}
- Delayed deliveries: ${data.delayedDeliveries || 0}

**Farmer Coverage:**
- Total farmers: ${data.totalFarmers}
- Farmers with recent verification: ${data.recentlyVerified || 'N/A'}
- District distribution: ${data.districtDistribution || 'Even'}

**Regional Metrics:**
${data.regionMetrics || 'Standard distribution across regions'}

Provide efficiency optimization recommendations with priority rankings.`;
        break;

      default:
        throw new Error('Invalid AI module type');
    }

    console.log(`Admin AI request: ${type}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || 'No analysis generated.';

    console.log(`Admin AI response generated for: ${type}`);

    return new Response(
      JSON.stringify({ 
        analysis: content,
        type,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin AI error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
