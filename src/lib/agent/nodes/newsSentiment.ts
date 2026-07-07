import { TavilySearch as TavilySearchResults } from '@langchain/tavily';
import { ChatGroq } from '@langchain/groq';
import { AgentStateAnnotation } from '../state';
import type { NewsSentiment } from '../../types';

const llm = new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.2 });
const searchTool = new TavilySearchResults({ maxResults: 10 });

export async function newsSentiment(
  state: typeof AgentStateAnnotation.State
): Promise<Partial<typeof AgentStateAnnotation.State>> {
  try {
    const searchResults = await searchTool.invoke({ query: `${state.companyName} latest news analyst rating sentiment 2025` });
    const resultsText = typeof searchResults === 'string' ? searchResults : JSON.stringify(searchResults);
    
    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a financial research analyst. Extract news and sentiment information from the search results and return ONLY valid JSON matching this exact structure (no markdown, no code fences):
{"overallSentiment": "positive", "sentimentScore": 0.8, "recentNews": [{"title": "...", "summary": "...", "sentiment": "positive", "date": "...", "source": "..."}], "analystConsensus": "...", "keyThemes": ["...", "..."], "risks": ["...", "..."]}
overallSentiment must be one of 'positive' | 'negative' | 'neutral' | 'mixed'.
sentimentScore must be a number from -1 to 1.
recentNews array should have 3-5 items if available.
Fill in all fields. If specific data is not found in the search results, YOU MUST USE YOUR INTERNAL KNOWLEDGE BASE to estimate or provide the most recently known accurate data for the company. ONLY use "N/A" if the metric is completely inapplicable.`
      },
      {
        role: 'user',
        content: `Company to research: ${state.companyName}\n\nSearch results:\n${resultsText}`
      }
    ]);
    
    const content = typeof response.content === 'string' ? response.content : '';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const newsSentiment: NewsSentiment = JSON.parse(cleaned);
    return { newsSentiment };
  } catch (error) {
    console.error('News sentiment error:', error);
    return {
      newsSentiment: {
        overallSentiment: 'neutral', sentimentScore: 0,
        recentNews: [], analystConsensus: 'N/A',
        keyThemes: [], risks: ['Failed to retrieve news sentiment.']
      },
      errors: [`News sentiment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}
