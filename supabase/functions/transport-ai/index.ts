import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, loads, currentLocation, homeBase } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'route_optimization') {
      systemPrompt = `You are an AI logistics optimizer for agricultural transport in rural India. 
Your task is to suggest the most efficient pickup order for a transport vehicle.
Consider:
- Distance between villages
- Time sensitivity (crops ready to harvest should be prioritized)
- Quantity (optimize vehicle capacity)
- Road conditions (main roads preferred)
Respond in a clear, numbered format with reasoning.`;

      userPrompt = `Here are the available loads to pick up:

${loads.map((load: any, idx: number) => `
Load ${idx + 1}:
- Farmer: ${load.farmer_name || 'Unknown'}
- Village: ${load.village || load.pickup_location}
- Crop: ${load.crop_name || 'Unknown'}
- Quantity: ${load.quantity} ${load.quantity_unit || 'quintals'}
- Ready Date: ${load.preferred_date || 'Flexible'}
- Priority: ${load.priority || 'Normal'}
`).join('\n')}

Current Location: ${currentLocation || 'Transporter base'}

Please suggest the optimal pickup sequence and explain your reasoning. Keep the response concise and actionable.`;

    } else if (type === 'reverse_logistics') {
      systemPrompt = `You are an AI logistics advisor for agricultural transport in rural India.
Your task is to find reverse load opportunities - cargo that can be transported on the return trip.
Consider:
- Farmers needing fertilizers or seeds
- Market goods to distribute
- Agricultural equipment rentals
- Empty vehicle utilization
Provide practical suggestions that maximize earnings.`;

      userPrompt = `The transporter is completing deliveries and returning from:
Drop Location: ${currentLocation || 'Market/Mandi'}
Home Base: ${homeBase || 'Base village'}

Available information about the area:
${loads?.map((load: any) => `- ${load.village}: ${load.info || 'No specific info'}`).join('\n') || 'No specific area data available'}

Suggest reverse load opportunities for the return journey. Include:
1. Potential cargo types
2. Possible pickup points
3. Estimated additional earnings potential
4. Time considerations

Keep response practical and actionable for a rural transporter.`;

    } else {
      throw new Error('Invalid AI request type');
    }

    console.log('Calling Lovable AI for transport optimization...');
    
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
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || 'No suggestions available';

    console.log('AI response received successfully');

    return new Response(
      JSON.stringify({ result, type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transport AI error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
