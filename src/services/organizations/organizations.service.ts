import { Organization } from './organizations.types';

export const formatDAO = (dao: any): Organization => {
  return {
    id: dao.id,
    name: dao.name,
    slug: dao.slug,
    chainIds: dao.chainIds,
    tokenIds: dao.tokenIds,
    governorIds: dao.governorIds,
    metadata: {
      description: dao.metadata?.description || '',
      icon: dao.metadata?.icon || '',
      socials: {
        website: dao.metadata?.socials?.website || '',
        discord: dao.metadata?.socials?.discord || '',
        twitter: dao.metadata?.socials?.twitter || '',
      }
    },
    stats: {
      proposalsCount: dao.proposalsCount || 0,
      tokenOwnersCount: dao.tokenOwnersCount || 0,
      delegatesCount: dao.delegatesCount || 0,
      delegatesVotesCount: dao.delegatesVotesCount || '0',
      hasActiveProposals: dao.hasActiveProposals || false,
    }
  };
}; 