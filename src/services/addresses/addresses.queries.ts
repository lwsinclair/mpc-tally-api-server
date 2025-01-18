import { gql } from 'graphql-request';

export const GET_ADDRESS_PROPOSALS_QUERY = gql`
  query GetAddressCreatedProposals($input: ProposalsInput!) {
    proposals(input: $input) {
      nodes {
        ... on Proposal {
          id
          onchainId
          originalId
          governor {
            id
          }
          metadata {
            description
          }
          status
          createdAt
          block {
            timestamp
          }
          voteStats {
            votesCount
            votersCount
            type
            percent
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

export const GET_ADDRESS_DAO_PROPOSALS_QUERY = gql`
  query GetAddressDAOSProposals($input: ProposalsInput!, $address: Address!) {
    proposals(input: $input) {
      nodes {
        ... on Proposal {
          id
          createdAt
          onchainId
          originalId
          metadata {
            description
          }
          governor {
            id
            organization {
              id
              name
              slug
            }
          }
          block {
            timestamp
          }
          proposer {
            address
          }
          creator {
            address
          }
          start {
            ... on Block {
              timestamp
            }
            ... on BlocklessTimestamp {
              timestamp
            }
          }
          status
          voteStats {
            votesCount
            votersCount
            type
            percent
          }
          participationType(address: $address)
        }
      }
      pageInfo {
        firstCursor
        lastCursor
      }
    }
  }
`;

export const GET_ADDRESS_VOTES_QUERY = gql`
  query GetAddressVotes($input: VotesInput!) {
    votes(input: $input) {
      nodes {
        ... on Vote {
          id
          type
          amount
          voter {
            address
          }
          proposal {
            id
          }
          block {
            timestamp
            number
          }
          chainId
          txHash
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

export const GET_ADDRESS_CREATED_PROPOSALS_QUERY = gql`
  query GetAddressCreatedProposals($input: ProposalsInput!) {
    proposals(input: $input) {
      nodes {
        ... on Proposal {
          id
          onchainId
          originalId
          governor {
            id
            name
            organization {
              id
              name
              slug
            }
          }
          metadata {
            title
            description
          }
          status
          createdAt
          block {
            timestamp
          }
          proposer {
            address
            name
          }
          voteStats {
            votesCount
            votersCount
            type
            percent
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

export const GET_ADDRESS_METADATA_QUERY = gql`
  query GetAddressMetadata($address: Address!) {
    address(address: $address) {
      address
      accounts {
        id
        address
        ens
        name
        bio
        picture
      }
    }
  }
`;

export const GET_ADDRESS_SAFES_QUERY = gql`
  query GetAddressSafes($accountId: AccountID!) {
    account(id: $accountId) {
      safes
    }
  }
`;

export const GET_ADDRESS_GOVERNANCES_QUERY = gql`
  query GetAddressGovernances($accountId: AccountID!) {
    account(id: $accountId) {
      delegatedGovernors {
        id
        name
        type
        organization {
          id
          name
          slug
          metadata {
            icon
          }
        }
        stats {
          proposalsCount
          delegatesCount
          tokenHoldersCount
        }
        tokens {
          id
          name
          symbol
          decimals
        }
      }
    }
  }
`;

export const GET_ADDRESS_RECEIVED_DELEGATIONS_QUERY = gql`
  query GetAddressReceivedDelegations($accountId: AccountID!, $governorId: ID!, $pagination: PaginationInput, $sort: DelegationSort) {
    account(id: $accountId) {
      delegationsReceived(governorId: $governorId, pagination: $pagination, sort: $sort) {
        nodes {
          id
          blockNumber
          blockTimestamp
          votes
          delegator {
            id
            address
          }
          delegate {
            id
            address
          }
          token {
            id
            symbol
            decimals
          }
          governor {
            id
            name
            type
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  }
`;

export const GET_DELEGATE_STATEMENT_QUERY = gql`
  query GetDelegateStatement($accountId: AccountID!, $governorId: ID!) {
    account(id: $accountId) {
      delegateStatement(governorId: $governorId) {
        id
        address
        statement
        statementSummary
        isSeekingDelegation
        issues {
          id
          name
        }
        lastUpdated
        governor {
          id
          name
          type
        }
      }
    }
  }
`; 