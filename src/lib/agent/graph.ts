import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentStateAnnotation } from './state';
import { companyIdentification } from './nodes/companyIdentification';
import { financialAnalysis } from './nodes/financialAnalysis';
import { newsSentiment } from './nodes/newsSentiment';
import { industryCompetitors } from './nodes/industryCompetitors';
import { investmentDecision } from './nodes/investmentDecision';

const graph = new StateGraph(AgentStateAnnotation)
  .addNode('companyIdentificationNode', companyIdentification)
  .addNode('financialAnalysisNode', financialAnalysis)
  .addNode('newsSentimentNode', newsSentiment)
  .addNode('industryCompetitorsNode', industryCompetitors)
  .addNode('investmentDecisionNode', investmentDecision)
  .addEdge(START, 'companyIdentificationNode')
  .addConditionalEdges('companyIdentificationNode', () => [
    'financialAnalysisNode',
    'newsSentimentNode', 
    'industryCompetitorsNode'
  ])
  .addEdge('financialAnalysisNode', 'investmentDecisionNode')
  .addEdge('newsSentimentNode', 'investmentDecisionNode')
  .addEdge('industryCompetitorsNode', 'investmentDecisionNode')
  .addEdge('investmentDecisionNode', END);

export const researchAgent = graph.compile();
