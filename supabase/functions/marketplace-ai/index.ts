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
    const { type, product, buyerProfile, marketData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'price_forecast') {
      systemPrompt = `You are an AI agricultural market analyst for Indian markets.
Analyze crop prices and provide buying recommendations.
Consider: seasonal trends, market demand, quality grades, regional factors.
Be concise and actionable. Format with clear sections.`;

      userPrompt = `Analyze this purchase opportunity:

Crop: ${product.crop_name} (${product.variety || 'Standard'})
Quantity Available: ${product.quantity} ${product.quantity_unit || 'quintals'}
Harvest Status: ${product.status}
Region: ${product.farmer?.district || 'Unknown'}
${product.market_price ? `Current Market Price: ₹${product.market_price.modal_price}/quintal (Trend: ${product.market_price.trend_direction})` : ''}

Provide:
1. Price Direction (next 5-7 days)
2. Risk Assessment (Low/Medium/High)
3. Recommendation: Buy Now / Wait / Partial Buy
4. Brief reasoning (2-3 sentences)`;

    } else if (type === 'alternatives') {
      systemPrompt = `You are an AI agricultural advisor helping buyers find alternatives.
Suggest similar crops, grades, or regions based on availability and pricing.
Focus on practical substitutes available in Indian markets.`;

      userPrompt = `The buyer is looking at:
Crop: ${product.crop_name}
Quantity Needed: ${product.quantity} ${product.quantity_unit || 'quintals'}
Region: ${product.farmer?.district || 'Unknown'}

Suggest 3-4 alternatives:
1. Similar crops (same usage)
2. Same crop from different regions
3. Different grade options
4. Timing alternatives

Keep suggestions practical and available in Indian agricultural markets.`;

    } else if (type === 'stock_recommendation') {
      systemPrompt = `You are an AI procurement advisor for agricultural buyers in India.
Provide weekly stocking recommendations based on buyer type and market conditions.
Consider: seasonal availability, price trends, storage requirements, demand patterns.`;

      userPrompt = `Buyer Profile:
Type: ${buyerProfile?.buyer_type || 'retail'}
Location: ${buyerProfile?.district || 'Not specified'}
Preferred Crops: ${buyerProfile?.preferred_crops?.join(', ') || 'Various'}

Market Context:
${marketData?.available_crops?.slice(0, 5).map((c: any) => `- ${c.crop_name}: ${c.quantity} quintals (${c.status})`).join('\n') || 'Various crops available'}

Provide weekly stocking advice:
1. Top 3 crops to buy this week
2. Suggested quantities
3. Risk alerts (if any)
4. Profit potential indicators
5. Timing recommendations`;

    } else {
      throw new Error('Invalid AI module type');
    }

    console.log(`Marketplace AI: Processing ${type} request`);
    
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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || 'No analysis available';

    return new Response(
      JSON.stringify({ result, type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Marketplace AI error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
