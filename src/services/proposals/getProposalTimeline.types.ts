import { IntID } from './listProposals.types.js';

// Input Types
export interface GetProposalTimelineInput {
  proposalId: IntID;
}

// Response Types
export interface ProposalEvent {
  type: string;
  createdAt: string;
}

export interface ProposalTimelineResponse {
  proposal: {
    id: string;
    onchainId: string;
    chainId: string;
    status: string;
    createdAt: string;
    events: ProposalEvent[];
  };
} 