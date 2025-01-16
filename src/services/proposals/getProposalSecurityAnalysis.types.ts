import { IntID } from './listProposals.types.js';

// Input Types
export interface GetProposalSecurityAnalysisInput {
  proposalId: IntID;
}

// Response Types
export interface SecurityEvent {
  eventType: string;
  severity: string;
  description: string;
}

export interface ActionsData {
  events: SecurityEvent[];
  result: string;
}

export interface ThreatAnalysis {
  actionsData: ActionsData;
  proposerRisk: string;
}

export interface SecurityMetadata {
  threatAnalysis: ThreatAnalysis;
}

export interface Simulation {
  publicURI: string;
  result: string;
}

export interface ProposalSecurityAnalysisResponse {
  metadata: {
    metadata: SecurityMetadata;
    simulations: Simulation[];
  };
  createdAt: string;
} 