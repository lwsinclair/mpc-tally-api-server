import { IntID } from './listProposals.types.js';

// Input Types
export interface GetProposalTimelineInput {
  proposalId: IntID;
}

// Response Types
export interface ProposalCreatedEvent {
  title: string;
  description: string;
}

export interface ProposalStatusChangedEvent {
  status: string;
}

export interface ProposalVoteCastEvent {
  votes: string;
  support: 'for' | 'against' | 'abstain';
}

export interface ProposalExecutedEvent {
  txHash: string;
}

export type EventData = 
  | ProposalCreatedEvent 
  | ProposalStatusChangedEvent 
  | ProposalVoteCastEvent 
  | ProposalExecutedEvent;

export interface ProposalEvent {
  id: string;
  type: string;
  timestamp: string;
  data: EventData;
}

export interface ProposalTimelineResponse {
  proposal: {
    id: string;
    onchainId: string;
    chainId: string;
    status: string;
    events: ProposalEvent[];
  };
} 