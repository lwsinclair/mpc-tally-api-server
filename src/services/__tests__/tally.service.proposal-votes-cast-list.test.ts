import { GraphQLClient } from 'graphql-request';
import { getProposalVotesCastList } from '../proposals/getProposalVotesCastList.js';
import { TallyAPIError } from '../errors/apiErrors.js';

const VALID_PROPOSAL_ID = '2502358713906497413';
const apiKey = process.env.TALLY_API_KEY;

const client = new GraphQLClient('https://api.tally.xyz/query', {
  headers: {
    'Api-Key': apiKey || '',
  },
});

describe('getProposalVotesCastList', () => {
  it('should fetch and format votes correctly', async () => {
    const result = await getProposalVotesCastList(client, { id: VALID_PROPOSAL_ID });
    expect(result).toBeDefined();
    expect(result.forVotes).toBeDefined();
    expect(result.forVotes.nodes).toBeDefined();
    expect(result.forVotes.nodes.length).toBeGreaterThan(0);
  });

  it('should throw error for invalid proposal ID', async () => {
    await expect(getProposalVotesCastList(client, { id: 'invalid-id' })).rejects.toThrow(TallyAPIError);
  });
}); 