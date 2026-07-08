import { NextRequest } from 'next/server';
import { researchAgent } from '@/lib/agent/graph';
import type { StreamEvent } from '@/lib/types';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { companyName } = await req.json();
  
  if (!companyName || typeof companyName !== 'string') {
    return new Response(JSON.stringify({ error: 'Company name is required' }), { status: 400 });
  }
  
  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), { status: 500 });
  }
  
  if (!process.env.TAVILY_API_KEY) {
    return new Response(JSON.stringify({ error: 'TAVILY_API_KEY not configured' }), { status: 500 });
  }
  
  const encoder = new TextEncoder();
  
    const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      
      try {
        sendEvent({
          type: 'status',
          message: `Starting research on ${companyName}...`,
          timestamp: Date.now()
        });
        
        // --- MOCK MODE IF KEYS ARE MISSING ---
        if (!process.env.GROQ_API_KEY || !process.env.TAVILY_API_KEY) {
          const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
          
          sendEvent({ type: 'node_start', node: 'companyIdentificationNode', message: 'Researching: companyIdentification...', timestamp: Date.now() });
          await delay(2000);
          sendEvent({ type: 'node_complete', node: 'companyIdentificationNode', message: 'Completed: companyIdentification', data: {
            companyInfo: { ticker: 'MOCK', sector: 'Technology', industry: 'Consumer Electronics', marketCap: '$3T', ceo: 'Jane Doe', founded: '1976', headquarters: 'Cupertino, CA', employees: '164,000', description: `${companyName} is a mock response because API keys were not found in .env.local. Please add GROQ_API_KEY and TAVILY_API_KEY.` }
          }, timestamp: Date.now() });

          sendEvent({ type: 'node_start', node: 'financialAnalysisNode', message: 'Researching: financialAnalysis...', timestamp: Date.now() });
          await delay(2500);
          sendEvent({ type: 'node_complete', node: 'financialAnalysisNode', message: 'Completed: financialAnalysis', data: {
            financialAnalysis: { revenue: '$383B', revenueGrowth: '+5.2%', netIncome: '$97B', profitMargin: '25.3%', peRatio: '28.5', roe: '150%', debtToEquity: '1.2', currentRatio: '1.05', freeCashFlow: '$100B', highlights: ['Strong cash flow', 'High margin services'], risks: ['Hardware saturation', 'Regulatory scrutiny'], score: 8 }
          }, timestamp: Date.now() });

          sendEvent({ type: 'node_start', node: 'newsSentimentNode', message: 'Researching: newsSentiment...', timestamp: Date.now() });
          await delay(2000);
          sendEvent({ type: 'node_complete', node: 'newsSentimentNode', message: 'Completed: newsSentiment', data: {
            newsSentiment: { overallSentiment: 'positive', analystConsensus: 'Strong Buy', sentimentScore: 0.65, recentNews: [{title: 'New product launch exceeds expectations', source: 'TechNews', date: '2 days ago', summary: 'The latest release saw record pre-orders.', sentiment: 'positive'}, {title: 'Regulatory fine in EU', source: 'Finance Daily', date: '5 days ago', summary: 'A small fine was issued regarding app store policies.', sentiment: 'negative'}], keyThemes: ['Innovation', 'Ecosystem growth'], risks: ['Antitrust investigations'] }
          }, timestamp: Date.now() });

          sendEvent({ type: 'node_start', node: 'industryCompetitorsNode', message: 'Researching: industryCompetitors...', timestamp: Date.now() });
          await delay(2000);
          sendEvent({ type: 'node_complete', node: 'industryCompetitorsNode', message: 'Completed: industryCompetitors', data: {
            industryAnalysis: { industry: 'Tech Hardware', marketSize: '$1.5T', growthRate: '4%', moatRating: 'Wide', competitors: [{name: 'Samsung', marketPosition: 'Market Leader in Smartphones', strengths: ['Display tech', 'Global reach']}, {name: 'Microsoft', marketPosition: 'Dominant OS', strengths: ['Cloud', 'Enterprise']}], competitiveAdvantages: ['Brand loyalty', 'Closed ecosystem'], threats: ['Geopolitical tensions'], industryTrends: ['AI integration', 'Wearables growth'], score: 9 }
          }, timestamp: Date.now() });

          sendEvent({ type: 'node_start', node: 'investmentDecisionNode', message: 'Researching: investmentDecision...', timestamp: Date.now() });
          await delay(2500);
          const mockDecision = { verdict: 'Invest', confidence: 85, summary: 'Despite regulatory risks, the strong balance sheet and wide economic moat make this a solid investment.', targetPrice: '$200', currentPrice: '$175', timeHorizon: 'Long-term (1-3 years)', riskLevel: 'Medium', bullCase: ['Services revenue growing rapidly', 'Unmatched brand loyalty'], bearCase: ['Valuation is historically high', 'Dependent on hardware cycle'], keyFactors: [{factor: 'Cash Flow', impact: 'positive', weight: 'High'}, {factor: 'Regulation', impact: 'negative', weight: 'Medium'}] };
          sendEvent({ type: 'node_complete', node: 'investmentDecisionNode', message: 'Completed: investmentDecision', data: { investmentDecision: mockDecision }, timestamp: Date.now() });
          
          sendEvent({ type: 'final', message: 'Research complete', data: { investmentDecision: mockDecision }, timestamp: Date.now() });
          controller.close();
          return;
        }
        // --- END MOCK MODE ---

        const nodeOrder = [
          'companyIdentificationNode',
          'financialAnalysisNode', 
          'newsSentimentNode',
          'industryCompetitorsNode',
          'investmentDecisionNode'
        ];
        
        let completedNodes = new Set<string>();
        let finalState: any = null;
        
        const eventStream = researchAgent.streamEvents(
          { companyName },
          { version: 'v2' }
        );
        
        for await (const event of eventStream) {
          if (event.event === 'on_chain_start' && event.metadata?.langgraph_node) {
            const nodeName = event.metadata.langgraph_node;
            if (nodeOrder.includes(nodeName) && !completedNodes.has(nodeName)) {
              sendEvent({
                type: 'node_start',
                node: nodeName,
                message: `Researching: ${nodeName}...`,
                timestamp: Date.now()
              });
            }
          }
          
          if (event.event === 'on_chain_end' && event.metadata?.langgraph_node) {
            const nodeName = event.metadata.langgraph_node;
            if (nodeOrder.includes(nodeName) && !completedNodes.has(nodeName)) {
              completedNodes.add(nodeName);
              
              const output = event.data?.output;
              sendEvent({
                type: 'node_complete',
                node: nodeName,
                message: `Completed: ${nodeName}`,
                data: output,
                timestamp: Date.now()
              });
            }
          }
          
          if (event.event === 'on_chain_end' && event.name === 'LangGraph') {
            finalState = event.data?.output;
          }
        }
        
        if (finalState) {
          sendEvent({
            type: 'final',
            message: 'Research complete',
            data: finalState,
            timestamp: Date.now()
          });
        }
        
      } catch (error) {
        sendEvent({
          type: 'error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          timestamp: Date.now()
        });
      }
      
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  });
}
