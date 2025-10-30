import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, severityLevel, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing health analysis for user:', userId);
    console.log('Severity level:', severityLevel);

    const systemPrompt = `You are a knowledgeable AI health assistant integrated into Medi Portal. Your role is to:

1. Analyze symptoms provided by users
2. Predict possible diseases or conditions based on symptoms
3. Provide personalized health recommendations including:
   - Detailed diet plans specific to the condition
   - Activity and exercise recommendations
   - Lifestyle modifications
   - Precautionary measures

IMPORTANT GUIDELINES:
- Always be empathetic and professional
- If symptoms suggest serious conditions or severity is high, strongly recommend seeking immediate medical attention
- Provide specific, actionable advice
- Format your response clearly with sections for: Analysis, Possible Conditions, Diet Recommendations, Activity Recommendations, Lifestyle Tips, and Precautions
- Never diagnose definitively - always suggest consulting healthcare professionals
- For each predicted condition, provide unique, specific recommendations
- Include at least 3-5 recommendations in each category

Remember: You're providing guidance, not replacing medical professionals.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Extract diseases and recommendations from the response
    const diseases = extractDiseases(assistantMessage);
    const recommendations = extractRecommendations(assistantMessage);
    const isEmergency = severityLevel === 'high' || checkEmergencyKeywords(assistantMessage);

    console.log('Analysis complete. Emergency:', isEmergency);

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        diseases,
        recommendations,
        emergency: isEmergency,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in health-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractDiseases(text: string): string[] {
  const diseases: string[] = [];
  const patterns = [
    /possible (?:conditions?|diseases?):\s*([^\n]+)/i,
    /may (?:have|be|indicate):\s*([^\n]+)/i,
    /could be:\s*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const items = match[1].split(/,|;|\n/).map((d) => d.trim());
      diseases.push(...items.filter((d) => d.length > 0 && d.length < 50));
    }
  }

  return [...new Set(diseases)].slice(0, 5);
}

function extractRecommendations(text: string): any {
  const recommendations: any = {};

  const dietMatch = text.match(/diet(?:\s+plan)?(?:\s+recommendations)?:([^]*?)(?=activity|lifestyle|precautions|$)/i);
  if (dietMatch) {
    recommendations.diet = dietMatch[1].trim().substring(0, 500);
  }

  const activityMatch = text.match(
    /activity(?:\s+recommendations)?(?:\s+and\s+exercise)?:([^]*?)(?=lifestyle|diet|precautions|$)/i
  );
  if (activityMatch) {
    recommendations.activities = activityMatch[1].trim().substring(0, 500);
  }

  const lifestyleMatch = text.match(/lifestyle(?:\s+tips)?(?:\s+modifications)?:([^]*?)(?=precautions|diet|activity|$)/i);
  if (lifestyleMatch) {
    recommendations.lifestyle = lifestyleMatch[1].trim().substring(0, 500);
  }

  const precautionsMatch = text.match(/precautions?:([^]*?)(?=diet|lifestyle|activity|$)/i);
  if (precautionsMatch) {
    recommendations.precautions = precautionsMatch[1].trim().substring(0, 500);
  }

  return recommendations;
}

function checkEmergencyKeywords(text: string): boolean {
  const emergencyKeywords = [
    'emergency',
    'urgent',
    'immediately',
    'right away',
    'serious',
    'severe',
    'life-threatening',
    'critical',
    'seek medical attention',
    'call 108',
    'hospital',
  ];

  const lowerText = text.toLowerCase();
  return emergencyKeywords.some((keyword) => lowerText.includes(keyword));
}
