import { LIST_DAOS_QUERY, GET_DAO_QUERY } from '../organizations.queries';

describe('Organization Queries', () => {
  describe('LIST_DAOS_QUERY', () => {
    it('should have all required fields', () => {
      expect(LIST_DAOS_QUERY).toContain('id');
      expect(LIST_DAOS_QUERY).toContain('slug');
      expect(LIST_DAOS_QUERY).toContain('name');
      expect(LIST_DAOS_QUERY).toContain('chainIds');
      expect(LIST_DAOS_QUERY).toContain('tokenIds');
      expect(LIST_DAOS_QUERY).toContain('governorIds');
      expect(LIST_DAOS_QUERY).toContain('metadata');
      expect(LIST_DAOS_QUERY).toContain('description');
      expect(LIST_DAOS_QUERY).toContain('icon');
      expect(LIST_DAOS_QUERY).toContain('socials');
      expect(LIST_DAOS_QUERY).toContain('website');
      expect(LIST_DAOS_QUERY).toContain('discord');
      expect(LIST_DAOS_QUERY).toContain('twitter');
      expect(LIST_DAOS_QUERY).toContain('hasActiveProposals');
      expect(LIST_DAOS_QUERY).toContain('proposalsCount');
      expect(LIST_DAOS_QUERY).toContain('delegatesCount');
      expect(LIST_DAOS_QUERY).toContain('delegatesVotesCount');
      expect(LIST_DAOS_QUERY).toContain('tokenOwnersCount');
      expect(LIST_DAOS_QUERY).toContain('pageInfo');
    });
  });

  describe('GET_DAO_QUERY', () => {
    it('should have all required fields', () => {
      expect(GET_DAO_QUERY).toContain('id');
      expect(GET_DAO_QUERY).toContain('name');
      expect(GET_DAO_QUERY).toContain('slug');
      expect(GET_DAO_QUERY).toContain('chainIds');
      expect(GET_DAO_QUERY).toContain('tokenIds');
      expect(GET_DAO_QUERY).toContain('governorIds');
      expect(GET_DAO_QUERY).toContain('proposalsCount');
      expect(GET_DAO_QUERY).toContain('tokenOwnersCount');
      expect(GET_DAO_QUERY).toContain('delegatesCount');
      expect(GET_DAO_QUERY).toContain('delegatesVotesCount');
      expect(GET_DAO_QUERY).toContain('hasActiveProposals');
      expect(GET_DAO_QUERY).toContain('metadata');
      expect(GET_DAO_QUERY).toContain('description');
      expect(GET_DAO_QUERY).toContain('icon');
      expect(GET_DAO_QUERY).toContain('socials');
      expect(GET_DAO_QUERY).toContain('website');
      expect(GET_DAO_QUERY).toContain('discord');
      expect(GET_DAO_QUERY).toContain('twitter');
    });
  });
}); 