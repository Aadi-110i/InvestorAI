import { ChatGroq } from '@langchain/groq';
import { AgentStateAnnotation } from '../state';
import type { InvestmentDecision } from '../../types';

const llm = new ChatGroq({ apiKey: process.env.GROQ_API_KEY || 'dummy', model: 'llama-3.3-70b-versatile', temperature: 0.2 });

export async function investmentDecision(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  try {
    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a senior investment analyst at a top-tier hedge fund. Your task is to synthesize all research data provided and make a final investment decision.
You must return ONLY valid JSON matching this exact structure (no markdown, no code fences):
{"verdict": "INVEST", "confidence": 85, "targetPrice": "...", "currentPrice": "...", "timeHorizon": "...", "summary": "...", "bullCase": ["...", "..."], "bearCase": ["...", "..."], "keyFactors": [{"factor": "...", "impact": "positive", "weight": "High"}], "riskLevel": "Medium"}

Guidelines:
- verdict must be one of: 'INVEST' | 'PASS' | 'WATCH'
- confidence must be a number from 0 to 100
- Weigh financial health heavily (40%)
- Consider news sentiment (20%)
- Evaluate competitive moat (25%)
- Account for risk factors (15%)
- Be decisive but nuanced in your summary.
- impact in keyFactors must be 'positive' | 'negative' | 'neutral'
- riskLevel must be 'Low' | 'Medium' | 'High' | 'Very High'
`
      },
      {
        role: 'user',
        content: `Company: ${state.companyName}

Company Info:
${JSON.stringify(state.companyInfo, null, 2)}

Financial Analysis:
${JSON.stringify(state.financialAnalysis, null, 2)}

News & Sentiment:
${JSON.stringify(state.newsSentiment, null, 2)}

Industry & Competitors:
${JSON.stringify(state.industryAnalysis, null, 2)}
`
      }
    ]);
    
    const content = typeof response.content === 'string' ? response.content : '';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const investmentDecision: InvestmentDecision = JSON.parse(cleaned);
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
