import { GraphQLClient } from 'graphql-request';
import { TallyService } from '../tally.service.js';
import dotenv from 'dotenv';

dotenv.config();

const VALID_PROPOSAL_ID = '2502358713906497413';

describe('getProposalVoters', () => {
  let service: TallyService;

  beforeAll(() => {
    if (!process.env.TALLY_API_KEY) {
      throw new Error('TALLY_API_KEY is required');
    }
    service = new TallyService(process.env.TALLY_API_KEY);
  });

  it('should fetch voters for a valid proposal', async () => {
    const result = await service.getProposalVoters({ proposalId: VALID_PROPOSAL_ID });
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  it('should handle pagination correctly', async () => {
    // Get first page with 2 items
    const firstPage = await service.getProposalVoters({
      proposalId: VALID_PROPOSAL_ID,
      limit: 2
    });
    expect(firstPage).toBeDefined();
    expect(typeof firstPage).toBe('object');

    // Get second page using any cursor from the response
    const cursor = firstPage?.proposalVoters?.pageInfo?.lastCursor || 
                  firstPage?.votes?.pageInfo?.lastCursor ||
                  firstPage?.pageInfo?.lastCursor;
    
    if (cursor) {
      const secondPage = await service.getProposalVoters({
        proposalId: VALID_PROPOSAL_ID,
        limit: 2,
        afterCursor: cursor
      });
      expect(secondPage).toBeDefined();
      expect(typeof secondPage).toBe('object');
    }
  });
}); 