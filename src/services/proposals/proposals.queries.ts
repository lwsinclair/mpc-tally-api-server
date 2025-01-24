import { gql } from 'graphql-request';

export const LIST_PROPOSALS_QUERY = gql`
  query ListProposals($input: ProposalsInput!) {
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
  query GetVotes($input: VotesInput!) {
    votes(input: $input) {
      nodes {
        ... on Vote {
          id
          type
          voter {
            address
            name
          }
          amount
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

export const GET_PROPOSAL_VOTES_CAST_QUERY = gql`
  query ProposalVotesCast($input: ProposalInput!) {
    proposal(input: $input) {
      id
      onchainId
      status
      quorum
      createdAt
      metadata {
        title
        description
      }
      voteStats {
        votesCount
        votersCount
        type
        percent
      }
      governor {
        id
        type
        quorum
        token {
          decimals
          supply
          symbol
          name
        }
        organization {
          name
          slug
          metadata {
            icon
          }
        }
      }
    }
  }
`;

export const GET_GOVERNANCE_PROPOSALS_STATS_QUERY = gql`
  query GovernanceProposalsStats($input: GovernorInput!) {
    governor(input: $input) {
      id
      chainId
      proposalStats {
        passed
        failed
      }
      organization {
        slug
      }
    }
  }
`;

export const GET_PROPOSAL_VOTES_CAST_LIST_QUERY = gql`
  query ProposalVotesCastList($forInput: VotesInput!, $againstInput: VotesInput!, $abstainInput: VotesInput!) {
    forVotes: votes(input: $forInput) {
      nodes {
        ... on Vote {
          id
          isBridged
          voter {
            name
            picture
            address
            twitter
          }
          amount
          reason
          type
          chainId
          block {
            id
            timestamp
          }
        }
      }
      pageInfo {
        firstCursor
        lastCursor
        count
      }
    }

    againstVotes: votes(input: $againstInput) {
      nodes {
        ... on Vote {
          id
          isBridged
          voter {
            name
            picture
            address
            twitter
          }
          amount
          reason
          type
          chainId
          block {
            id
            timestamp
          }
        }
      }
      pageInfo {
        firstCursor
        lastCursor
        count
      }
    }

    abstainVotes: votes(input: $abstainInput) {
      nodes {
        ... on Vote {
          id
          isBridged
          voter {
            name
            picture
            address
            twitter
          }
          amount
          reason
          type
          chainId
          block {
            id
            timestamp
          }
        }
      }
      pageInfo {
        firstCursor
        lastCursor
        count
      }
    }
  }
`; 