import { GraphQLClient } from 'graphql-request';
import { GetProposalSecurityAnalysisInput, ProposalSecurityAnalysisResponse } from './getProposalSecurityAnalysis.types.js';
import { GET_PROPOSAL_SECURITY_ANALYSIS_QUERY } from './proposals.queries.js';

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const MAX_DELAY = 5000;

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function getProposalSecurityAnalysis(
  client: GraphQLClient,
  input: GetProposalSecurityAnalysisInput
): Promise<ProposalSecurityAnalysisResponse> {
  let retries = 0;
  let lastError: unknown = null;

  while (retries < MAX_RETRIES) {
    try {
      const variables = {
        proposalId: input.proposalId
      };

      const response = await client.request<{ proposalSecurityCheck: ProposalSecurityAnalysisResponse }>(
        GET_PROPOSAL_SECURITY_ANALYSIS_QUERY,
        variables
      );

      // If we get a valid response with no metadata, return empty data
      if (!response.proposalSecurityCheck?.metadata) {
        return {
          metadata: {
            metadata: {
              threatAnalysis: {
                actionsData: {
                  events: [],
                  result: ''
                },
                proposerRisk: ''
              }
            },
            simulations: []
          },
          createdAt: new Date().toISOString()
        };
      }

      return response.proposalSecurityCheck;
    } catch (error) {
      lastError = error;
      if (error instanceof Error) {
        const graphqlError = error as any;
        
        // Handle rate limiting (429)
        if (graphqlError.response?.status === 429) {
          retries++;
          if (retries < MAX_RETRIES) {
            await exponentialBackoff(retries);
            continue;
          }
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Handle invalid input (422) or other GraphQL errors
        if (graphqlError.response?.status === 422 || graphqlError.response?.errors) {
          return {
            metadata: {
              metadata: {
                threatAnalysis: {
                  actionsData: {
                    events: [],
                    result: ''
                  },
                  proposerRisk: ''
                }
              },
              simulations: []
            },
            createdAt: new Date().toISOString()
          };
        }
      }
      
      // If we've reached here, it's an unexpected error
      throw new Error(`Failed to fetch proposal security analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  throw new Error('Maximum retries exceeded. Please try again later.');
} 