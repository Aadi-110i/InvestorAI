import { ChatGroq } from '@langchain/groq';
import { AgentStateAnnotation } from '../state';
import type { InvestmentDecision } from '../../types';
import { parseJSON } from '../parseJSON';

export async function investmentDecision(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  const llm = new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.3 });
  try {
    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a senior investment analyst at a top-tier hedge fund.
Synthesize the research data and return a final investment decision as a single raw JSON object.
CRITICAL: Output ONLY the JSON object. No markdown, no code fences, no explanation text before or after.

Required JSON structure:
{"verdict":"INVEST","confidence":85,"targetPrice":"$950","currentPrice":"$850","timeHorizon":"12 months","summary":"...","bullCase":["...","..."],"bearCase":["...","..."],"keyFactors":[{"factor":"...","impact":"positive","weight":"High"}],"riskLevel":"Medium"}

Rules:
- verdict: 'INVEST' | 'PASS' | 'WATCH'
- confidence: integer 0-100 (use real data to estimate; a company like NVIDIA should score 70-90)
- impact: 'positive' | 'negative' | 'neutral'
- riskLevel: 'Low' | 'Medium' | 'High' | 'Very High'
- If some data failed to load, make your best estimate using your own training knowledge — do NOT default to WATCH/0%`
      },
      {
        role: 'user',
        content: `Company: ${state.companyName}

Company Info:
${JSON.stringify(state.companyInfo ?? {}, null, 2)}

Financial Analysis:
${JSON.stringify(state.financialAnalysis ?? {}, null, 2)}

News & Sentiment:
${JSON.stringify(state.newsSentiment ?? {}, null, 2)}

Industry & Competitors:
${JSON.stringify(state.industryAnalysis ?? {}, null, 2)}

Make a decisive, well-reasoned investment verdict based on all available data.`
      }
    ]);

    const content = typeof response.content === 'string' ? response.content : '';
    const investmentDecision: InvestmentDecision = parseJSON<InvestmentDecision>(content);
    return { investmentDecision };
  } catch (error) {
    console.error('Investment decision error:', error);
    return {
      investmentDecision: {
        verdict: 'WATCH', confidence: 0, targetPrice: 'N/A', currentPrice: 'N/A',
        timeHorizon: 'N/A', summary: 'Failed to generate investment decision due to an error.',
        bullCase: [], bearCase: [], keyFactors: [], riskLevel: 'High'
      },
      errors: [`Investment decision failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}
