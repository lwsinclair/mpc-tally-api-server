import { gql } from 'graphql-request';

export const LIST_PROPOSALS_QUERY = gql`
  query GovernanceProposals($input: ProposalsInput!) {
    proposals(input: $input) {
      nodes {
        ... on Proposal {
          id
          onchainId
          status
          createdAt
          quorum
          metadata {
            description
            title
            discourseURL
            snapshotURL
          }
          start {
            ... on Block {
              timestamp
            }
            ... on BlocklessTimestamp {
              timestamp
            }
          }
          end {
            ... on Block {
              timestamp
            }
            ... on BlocklessTimestamp {
              timestamp
            }
          }
          executableCalls {
            value
            target
            calldata
            signature
            type
          }
          voteStats {
            votesCount
            percent
            type
            votersCount
          }
          governor {
            id
            chainId
            name
            token {
              decimals
            }
            organization {
              name
              slug
            }
          }
          proposer {
            address
            name
            picture
          }
        }
      }
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`;

export const GET_PROPOSAL_QUERY = gql`
  query ProposalDetails($input: ProposalInput!) {
    proposal(input: $input) {
      id
      onchainId
      metadata {
        title
        description
        discourseURL
        snapshotURL
      }
      status
      quorum
      start {
        ... on Block {
          timestamp
        }
        ... on BlocklessTimestamp {
          timestamp
        }
      }
      end {
        ... on Block {
          timestamp
        }
        ... on BlocklessTimestamp {
          timestamp
        }
      }
      executableCalls {
        value
        target
        calldata
        signature
        type
      }
      voteStats {
        votesCount
        votersCount
        type
        percent
      }
      governor {
        id
        chainId
        name
        token {
          decimals
        }
        organization {
          name
          slug
        }
      }
      proposer {
        address
        name
        picture
      }
    }
  }
`;

export const GET_PROPOSAL_VOTERS_QUERY = gql`
  fragment VoterFields on Vote {
    id
    address
    name
    timestamp
    votes
    reason
    support
    voter {
      id
      address
      name
      ens
    }
    proposal {
      id
      onchainId
      governor {
        id
        name
      }
    }
  }

  query GetProposalVoters($input: ProposalVotersInput!) {
    proposalVoters(input: $input) {
      nodes {
        ... on Vote {
          ...VoterFields
        }
      }
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`;

export const GET_PROPOSAL_TIMELINE_QUERY = gql`
  fragment TimelineEventFields on ProposalEvent {
    id
    type
    timestamp
    data {
      ... on ProposalCreatedEvent {
        title
        description
      }
      ... on ProposalStatusChangedEvent {
        status
      }
      ... on ProposalVoteCastEvent {
        votes
        support
      }
      ... on ProposalExecutedEvent {
        txHash
      }
    }
  }

  query GetProposalTimeline($input: ProposalInput!) {
    proposal(input: $input) {
      id
      onchainId
      chainId
      status
      events {
        ...TimelineEventFields
      }
    }
  }
`;

export const GET_PROPOSAL_SECURITY_ANALYSIS_QUERY = gql`
  query ProposalSecurityAnalysis($proposalId: ID!) {
    proposalSecurityCheck(proposalId: $proposalId) {
      metadata {
        metadata {
          threatAnalysis {
            actionsData {
              events {
                eventType
                severity
                description
              }
              result
            }
            proposerRisk
          }
        }
        simulations {
          publicURI
          result
        }
      }
      createdAt
    }
  }
`;

export const GET_PROPOSAL_VOTES_CAST_QUERY = `
  fragment ProposalMetadataFields on Proposal {
    metadata {
      title
      description
    }
  }

  fragment VoteStatsFields on Proposal {
    voteStats {
      votesCount
      votersCount
      type
      percent
    }
  }

  fragment GovernorTokenFields on Governor {
    token {
      decimals
      supply
      symbol
      name
    }
  }

  fragment GovernorOrganizationFields on Governor {
    organization {
      name
      slug
      metadata {
        icon
      }
    }
  }

  query ProposalVotesCast($input: ProposalInput!) {
    proposal(input: $input) {
      ... on Proposal {
        id
        onchainId
        status
        quorum
        createdAt
        ...ProposalMetadataFields
        ...VoteStatsFields
        governor {
          id
          type
          quorum
          ...GovernorTokenFields
          ...GovernorOrganizationFields
        }
      }
    }
  }
`; 