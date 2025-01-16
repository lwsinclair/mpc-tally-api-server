import { formatDAO } from '../organizations.service';

describe('Organizations Service', () => {
  describe('formatDAO', () => {
    it('should format DAO data correctly', () => {
      const mockRawDAO = {
        id: '1',
        name: 'Test DAO',
        slug: 'test-dao',
        chainIds: ['eip155:1'],
        tokenIds: ['token1'],
        governorIds: ['gov1'],
        metadata: {
          description: 'Test Description',
          icon: 'icon.png',
          socials: {
            website: 'website.com',
            discord: 'discord.com',
            twitter: 'twitter.com'
          }
        },
        proposalsCount: 5,
        tokenOwnersCount: 100,
        delegatesCount: 10,
        delegatesVotesCount: '1000',
        hasActiveProposals: true
      };

      const formattedDAO = formatDAO(mockRawDAO);

      expect(formattedDAO).toEqual({
        id: '1',
        name: 'Test DAO',
        slug: 'test-dao',
        chainIds: ['eip155:1'],
        tokenIds: ['token1'],
        governorIds: ['gov1'],
        metadata: {
          description: 'Test Description',
          icon: 'icon.png',
          socials: {
            website: 'website.com',
            discord: 'discord.com',
            twitter: 'twitter.com'
          }
        },
        stats: {
          proposalsCount: 5,
          tokenOwnersCount: 100,
          delegatesCount: 10,
          delegatesVotesCount: '1000',
          hasActiveProposals: true
        }
      });
    });

    it('should handle missing data', () => {
      const mockRawDAO = {
        id: '1',
        name: 'Test DAO',
        slug: 'test-dao',
        chainIds: [],
        tokenIds: [],
        governorIds: []
      };

      const formattedDAO = formatDAO(mockRawDAO);

      expect(formattedDAO).toEqual({
        id: '1',
        name: 'Test DAO',
        slug: 'test-dao',
        chainIds: [],
        tokenIds: [],
        governorIds: [],
        metadata: {
          description: '',
          icon: '',
          socials: {
            website: '',
            discord: '',
            twitter: ''
          }
        },
        stats: {
          proposalsCount: 0,
          tokenOwnersCount: 0,
          delegatesCount: 0,
          delegatesVotesCount: '0',
          hasActiveProposals: false
        }
      });
    });
  });
}); 