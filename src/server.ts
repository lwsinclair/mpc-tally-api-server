import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type Tool,
  type TextContent,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { TallyService } from "./services/tally.service.js";
import type { OrganizationsSortBy } from "./services/organizations/organizations.types.js";
import type { 
  AddressVotesInput,
  AddressProposalsInput,
  AddressDAOProposalsInput,
  AddressCreatedProposalsInput,
  AddressGovernancesInput,
  AddressMetadataInput,
} from './services/addresses/addresses.types.js';
import type {
  ProposalsInput,
  ProposalInput,
} from './services/proposals/index.js';
import type {
  GetDelegateStatementInput,
} from './services/delegates/delegates.types.js';
import type {
  GetDelegatorsParams,
} from './services/delegators/delegators.types.js';

interface RequestParams {
  name: string;
  input: Record<string, unknown>;
}

export class TallyServer {
  private server: Server;
  private service: TallyService;

  constructor(apiKey: string) {
    // Initialize service
    this.service = new TallyService({ apiKey });

    // Create server instance
    this.server = new Server(
      {
        name: "tally-api",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "list-daos",
          description: "List DAOs on Tally sorted by specified criteria",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description:
                  "Maximum number of DAOs to return (default: 20, max: 50)",
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination",
              },
              sortBy: {
                type: "string",
                enum: ["id", "name", "explore", "popular"],
                description:
                  "How to sort the DAOs (default: popular). 'explore' prioritizes DAOs with live proposals",
              },
            },
          },
        },
        {
          name: "get-dao",
          description: "Get detailed information about a specific DAO",
          inputSchema: {
            type: "object",
            required: ["slug"],
            properties: {
              slug: {
                type: "string",
                description: "The DAO's slug (e.g., 'uniswap' or 'aave')",
              },
            },
          },
        },
        {
          name: "list-delegates",
          description:
            "List delegates for a specific organization with their metadata",
          inputSchema: {
            type: "object",
            required: ["organizationIdOrSlug"],
            properties: {
              organizationIdOrSlug: {
                type: "string",
                description:
                  "The organization's ID, governor ID (eip155 format), or slug (e.g., 'arbitrum', 'eip155:1:123', or numeric ID)",
              },
              limit: {
                type: "number",
                description:
                  "Maximum number of delegates to return (default: 20, max: 50)",
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination",
              },
              hasVotes: {
                type: "boolean",
                description: "Filter for delegates with votes",
              },
              hasDelegators: {
                type: "boolean",
                description: "Filter for delegates with delegators",
              },
              isSeekingDelegation: {
                type: "boolean",
                description: "Filter for delegates seeking delegation",
              },
            },
          },
        },
        {
          name: "get-delegators",
          description: "Get list of delegators for a specific address",
          inputSchema: {
            type: "object",
            required: ["address"],
            properties: {
              address: {
                type: "string",
                description:
                  "The Ethereum address to get delegators for (0x format)",
              },
              organizationId: {
                type: "string",
                description: "Filter by specific organization ID",
              },
              organizationSlug: {
                type: "string",
                description:
                  "Filter by organization slug (e.g., 'uniswap'). Alternative to organizationId",
              },
              governorId: {
                type: "string",
                description: "Filter by specific governor ID",
              },
              limit: {
                type: "number",
                description:
                  "Maximum number of delegators to return (default: 20, max: 50)",
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination",
              },
              beforeCursor: {
                type: "string",
                description: "Cursor for previous page pagination",
              },
              sortBy: {
                type: "string",
                enum: ["id", "votes"],
                description: "How to sort the delegators (default: id)",
              },
              isDescending: {
                type: "boolean",
                description: "Sort in descending order (default: true)",
              },
            },
          },
        },
        {
          name: "list-proposals",
          description: "List proposals for a specific organization or governor",
          inputSchema: {
            type: "object",
            properties: {
              organizationId: {
                type: "string",
                description:
                  "Filter by organization ID (large integer as string)",
              },
              organizationSlug: {
                type: "string",
                description:
                  "Filter by organization slug (e.g., 'uniswap'). Alternative to organizationId",
              },
              governorId: {
                type: "string",
                description: "Filter by governor ID",
              },
              includeArchived: {
                type: "boolean",
                description: "Include archived proposals",
              },
              isDraft: {
                type: "boolean",
                description: "Filter for draft proposals",
              },
              limit: {
                type: "number",
                description:
                  "Maximum number of proposals to return (default: 20, max: 50)",
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination (string ID)",
              },
              beforeCursor: {
                type: "string",
                description: "Cursor for previous page pagination (string ID)",
              },
              isDescending: {
                type: "boolean",
                description: "Sort in descending order (default: true)",
              },
            },
          },
        },
        {
          name: "get-proposal",
          description:
            "Get detailed information about a specific proposal. You must provide either the Tally ID (globally unique) or both onchainId and governorId (unique within a governor).",
          inputSchema: {
            type: "object",
            oneOf: [
              {
                required: ["id"],
                properties: {
                  id: {
                    type: "string",
                    description:
                      "The proposal's Tally ID (globally unique across all governors)",
                  },
                  includeArchived: {
                    type: "boolean",
                    description: "Include archived proposals",
                  },
                  isLatest: {
                    type: "boolean",
                    description: "Get the latest version of the proposal",
                  },
                },
              },
              {
                required: ["onchainId", "governorId"],
                properties: {
                  onchainId: {
                    type: "string",
                    description:
                      "The proposal's onchain ID (only unique within a governor)",
                  },
                  governorId: {
                    type: "string",
                    description:
                      "The governor's ID (required when using onchainId)",
                  },
                  includeArchived: {
                    type: "boolean",
                    description: "Include archived proposals",
                  },
                  isLatest: {
                    type: "boolean",
                    description: "Get the latest version of the proposal",
                  },
                },
              },
            ],
          },
        },
        {
          name: "get-address-votes",
          description: "Get votes cast by a specific address for a given organization",
          inputSchema: {
            type: "object",
            required: ["address", "organizationSlug"],
            properties: {
              address: {
                type: "string",
                description: "The Ethereum address to get votes for (0x format)",
              },
              organizationSlug: {
                type: "string",
                description: "The organization's slug (e.g., 'uniswap')",
              },
              limit: {
                type: "number",
                description: "Maximum number of votes to return (default: 20, max: 50)",
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination",
              },
            },
          },
        },
        {
          name: "get-address-created-proposals",
          description: "Returns proposals created by a given address",
          inputSchema: {
            type: "object",
            required: ["address"],
            properties: {
              address: {
                type: "string",
                description: "The Ethereum address",
              },
              limit: {
                type: "number",
                description:
                  "Maximum number of proposals to return (default: 20, max: 50)",
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination",
              },
            },
          },
        },
        {
          name: "get-address-daos-proposals",
          description:
            "Returns proposals from DAOs where a given address has participated (voted, proposed, etc.)",
          inputSchema: {
            type: "object",
            required: ["address"],
            properties: {
              address: {
                type: "string",
                description: "The Ethereum address",
              },
              limit: {
                type: "number",
                description:
                  "Maximum number of proposals to return (default: 20, max: 50)",
              },
              afterCursor: {
                type: "string",
                description: "Cursor for pagination",
              },
            },
          },
        },
        {
          name: "get-address-received-delegations",
          description: "Returns delegations received by an address",
          inputSchema: {
            type: "object",
            required: ["address"],
            properties: {
              address: {
                type: "string",
                description:
                  "The Ethereum address to get received delegations for (0x format)",
              },
              organizationSlug: {
                type: "string",
                description: "Filter by organization slug",
              },
              governorId: {
                type: "string",
                description: "Filter by governor ID",
              },
              limit: {
                type: "number",
                description:
                  "Maximum number of delegations to return (default: 20, max: 50)",
              },
              sortBy: {
                type: "string",
                enum: ["votes"],
                description: "Field to sort by",
              },
              isDescending: {
                type: "boolean",
                description: "Sort in descending order",
              },
            },
          },
        },
        {
          name: "get-delegate-statement",
          description:
            "Get a delegate's statement for a specific governor or organization",
          inputSchema: {
            type: "object",
            required: ["address"],
            oneOf: [
              {
                required: ["governorId"],
                properties: {
                  address: {
                    type: "string",
                    description: "The delegate's Ethereum address",
                  },
                  governorId: {
                    type: "string",
                    description: "The governor's ID",
                  },
                },
              },
              {
                required: ["organizationSlug"],
                properties: {
                  address: {
                    type: "string",
                    description: "The delegate's Ethereum address",
                  },
                  organizationSlug: {
                    type: "string",
                    description: "The organization's slug (e.g., 'uniswap')",
                  },
                },
              },
            ],
          },
        },
        {
          name: "get-address-governances",
          description:
            "Returns the list of governances (DAOs) an address has delegated to",
          inputSchema: {
            type: "object",
            required: ["address"],
            properties: {
              address: {
                type: "string",
                description:
                  "The Ethereum address to get governances for (0x format)",
              },
            },
          },
        },
      ];

      return { tools };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args = {} } = request.params;
      
      switch (name) {
        case "list-daos": {
          try {
            const data = await this.service.listDAOs({
              limit: typeof args.limit === "number" ? args.limit : undefined,
              afterCursor:
                typeof args.afterCursor === "string"
                  ? args.afterCursor
                  : undefined,
              sortBy:
                typeof args.sortBy === "string"
                  ? (args.sortBy as OrganizationsSortBy)
                  : undefined,
            });

            const content: TextContent[] = [
              {
                type: "text",
                text: TallyService.formatDAOList(data.organizations.nodes),
              },
            ];

            return { content };
          } catch (error) {
            throw new Error(
              `Error fetching DAOs: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }
        case "get-dao": {
          try {
            if (typeof args.slug !== "string") {
              throw new Error("slug must be a string");
            }

            const data = await this.service.getDAO(args.slug);
            const content: TextContent[] = [
              {
                type: "text",
                text: TallyService.formatDAO(data),
              },
            ];

            return { content };
          } catch (error) {
            throw new Error(
              `Error fetching DAO: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }
        case "list-delegates": {
          try {
            if (typeof args.organizationIdOrSlug !== "string") {
              throw new Error("organizationIdOrSlug must be a string");
            }

            const data = await this.service.listDelegates({
              organizationId: args.organizationIdOrSlug.match(/^\d+$/)
                ? args.organizationIdOrSlug
                : undefined,
              organizationSlug:
                !args.organizationIdOrSlug.match(/^\d+$/) &&
                !args.organizationIdOrSlug.startsWith("eip155:")
                  ? args.organizationIdOrSlug
                  : undefined,
              governorId: args.organizationIdOrSlug.startsWith("eip155:")
                ? args.organizationIdOrSlug
                : undefined,
              limit: typeof args.limit === "number" ? args.limit : undefined,
              hasVotes:
                typeof args.hasVotes === "boolean" ? args.hasVotes : undefined,
              hasDelegators:
                typeof args.hasDelegators === "boolean"
                  ? args.hasDelegators
                  : undefined,
              isSeekingDelegation:
                typeof args.isSeekingDelegation === "boolean"
                  ? args.isSeekingDelegation
                  : undefined,
            });

            const content: TextContent[] = [
              {
                type: "text",
                text: TallyService.formatDelegatesList(data.delegates),
              },
            ];

            return { content };
          } catch (error) {
            throw new Error(
              `Error fetching delegates: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }
        case "get-delegators": {
          try {
            if (typeof args.address !== "string") {
              throw new Error("address must be a string");
            }

            const data = await this.service.getDelegators({
              address: args.address,
              organizationId:
                typeof args.organizationId === "string"
                  ? args.organizationId
                  : undefined,
              organizationSlug:
                typeof args.organizationSlug === "string"
                  ? args.organizationSlug
                  : undefined,
              governorId:
                typeof args.governorId === "string" ? args.governorId : undefined,
              limit: typeof args.limit === "number" ? args.limit : undefined,
              afterCursor:
                typeof args.afterCursor === "string"
                  ? args.afterCursor
                  : undefined,
              beforeCursor:
                typeof args.beforeCursor === "string"
                  ? args.beforeCursor
                  : undefined,
              sortBy:
                typeof args.sortBy === "string"
                  ? (args.sortBy as "id" | "votes")
                  : undefined,
              isDescending:
                typeof args.isDescending === "boolean"
                  ? args.isDescending
                  : undefined,
            });

            const content: TextContent[] = [
              {
                type: "text",
                text: TallyService.formatDelegatorsList(data.delegators),
              },
            ];

            return { content };
          } catch (error) {
            throw new Error(
              `Error fetching delegators: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }
        case "list-proposals": {
          const params = args as Partial<ProposalsInput>;
          
          const input: ProposalsInput = {
            filters: {
              organizationId: typeof params.filters?.organizationId === 'string' ? params.filters.organizationId : undefined,
              governorId: typeof params.filters?.governorId === 'string' ? params.filters.governorId : undefined,
              includeArchived: typeof params.filters?.includeArchived === 'boolean' ? params.filters.includeArchived : undefined,
              isDraft: typeof params.filters?.isDraft === 'boolean' ? params.filters.isDraft : undefined,
            },
            page: {
              limit: typeof params.page?.limit === 'number' ? params.page.limit : undefined,
              afterCursor: typeof params.page?.afterCursor === 'string' ? params.page.afterCursor : undefined,
              beforeCursor: typeof params.page?.beforeCursor === 'string' ? params.page.beforeCursor : undefined,
            },
            sort: params.sort,
          };

          const response = await this.service.listProposals(input);

          return {
            content: {
              type: "text" as const,
              text: JSON.stringify(response, null, 2),
            },
          };
        }
        case "get-proposal": {
          const params = args as Partial<ProposalInput>;
          
          if (params.id) {
            const input: ProposalInput = {
              id: params.id,
              includeArchived: typeof params.includeArchived === 'boolean' ? params.includeArchived : undefined,
              isLatest: typeof params.isLatest === 'boolean' ? params.isLatest : undefined,
            };
            const response = await this.service.getProposal(input);
            return {
              content: {
                type: "text" as const,
                text: JSON.stringify(response, null, 2),
              },
            };
          }
          
          if (params.onchainId && params.governorId) {
            const input: ProposalInput = {
              onchainId: params.onchainId,
              governorId: params.governorId,
              includeArchived: typeof params.includeArchived === 'boolean' ? params.includeArchived : undefined,
              isLatest: typeof params.isLatest === 'boolean' ? params.isLatest : undefined,
            };
            const response = await this.service.getProposal(input);
            return {
              content: {
                type: "text" as const,
                text: JSON.stringify(response, null, 2),
              },
            };
          }
          
          throw new Error('Either id or both onchainId and governorId must be provided');
        }
        case "get-address-votes": {
          const params = args as Partial<AddressVotesInput>;
          
          if (!params.address || !params.organizationSlug || 
              typeof params.address !== 'string' || 
              typeof params.organizationSlug !== 'string') {
            throw new Error('Invalid input: address and organizationSlug must be strings');
          }

          const input: AddressVotesInput = {
            address: params.address,
            organizationSlug: params.organizationSlug,
            limit: typeof params.limit === 'number' ? params.limit : undefined,
            afterCursor: typeof params.afterCursor === 'string' ? params.afterCursor : undefined,
          };

          const response = await this.service.getAddressVotes(input);

          return {
            content: {
              type: "text" as const,
              text: JSON.stringify(response, null, 2),
            },
          };
        }
        case "get-address-proposals-created": {
          const params = args as Partial<AddressProposalsInput>;
          
          if (!params.address || typeof params.address !== 'string') {
            throw new Error('Invalid input: address must be a string');
          }

          const input: AddressProposalsInput = {
            address: params.address,
            limit: typeof params.limit === 'number' ? params.limit : undefined,
            afterCursor: typeof params.afterCursor === 'string' ? params.afterCursor : undefined,
          };

          const response = await this.service.getAddressProposals(input);

          return {
            content: {
              type: "text" as const,
              text: JSON.stringify(response, null, 2),
            },
          };
        }
        case "get-address-daos-proposals": {
          const params = args as Partial<AddressDAOProposalsInput>;
          
          if (!params.address || !params.organizationSlug || 
              typeof params.address !== 'string' || 
              typeof params.organizationSlug !== 'string') {
            throw new Error('Invalid input: address and organizationSlug must be strings');
          }

          const input: AddressDAOProposalsInput = {
            address: params.address,
            organizationSlug: params.organizationSlug,
            limit: typeof params.limit === 'number' ? params.limit : undefined,
            afterCursor: typeof params.afterCursor === 'string' ? params.afterCursor : undefined,
          };

          const response = await this.service.getAddressDAOProposals(input);

          return {
            content: {
              type: "text" as const,
              text: JSON.stringify(response, null, 2),
            },
          };
        }
        case "get-address-created-proposals": {
          try {
            if (typeof args.address !== "string") {
              throw new Error("address must be a string");
            }

            const result = await this.service.getAddressCreatedProposals({
              address: args.address,
              limit: args.limit,
              afterCursor: args.afterCursor,
            });

            const proposals = result.proposals.nodes;
            const content = proposals.map((proposal) => ({
              id: proposal.id,
              onchainId: proposal.onchainId,
              governorId: proposal.governor.id,
              description: proposal.metadata?.description,
              status: proposal.status,
              createdAt: proposal.createdAt,
              blockTimestamp: proposal.block?.timestamp,
              voteStats: proposal.voteStats,
            }));

            return {
              content,
              pageInfo: result.proposals.pageInfo,
            };
          } catch (error) {
            throw new Error(
              `Error fetching address proposals: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }
        case "get-address-received-delegations": {
          try {
            if (typeof args.address !== "string") {
              throw new Error("address must be a string");
            }

            const result = await this.service.getAddressReceivedDelegations({
              address: args.address,
              organizationSlug:
                typeof args.organizationSlug === "string"
                  ? args.organizationSlug
                  : undefined,
              governorId:
                typeof args.governorId === "string" ? args.governorId : undefined,
              limit: typeof args.limit === "number" ? args.limit : undefined,
              sortBy:
                typeof args.sortBy === "string"
                  ? (args.sortBy as "votes")
                  : undefined,
              isDescending:
                typeof args.isDescending === "boolean"
                  ? args.isDescending
                  : undefined,
            });

            const content: TextContent[] = [
              {
                type: "text",
                text:
                  `Received delegations for ${args.address}:\n\n` +
                  result.nodes
                    .map(
                      (node) =>
                        `- From: ${node.delegator.address}${
                          node.delegator.name ? ` (${node.delegator.name})` : ""
                        }\n` +
                        `  Votes: ${node.votes}\n` +
                        `  Block: ${node.blockNumber}`
                    )
                    .join("\n\n"),
              },
            ];

            return { content };
          } catch (error) {
            throw new Error(
              `Error fetching received delegations: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }
        case "get-delegate-statement": {
          const params = args as Partial<GetDelegateStatementInput>;
          
          if (!params.address || typeof params.address !== 'string') {
            throw new Error('Invalid input: address must be a string');
          }

          const input: GetDelegateStatementInput = {
            address: params.address,
            governorId: typeof params.governorId === 'string' ? params.governorId : undefined,
            organizationSlug: typeof params.organizationSlug === 'string' ? params.organizationSlug : undefined,
          };

          const response = await this.service.getDelegateStatement(input);

          return {
            content: {
              type: "text" as const,
              text: response ? JSON.stringify(response, null, 2) : 'No delegate statement found',
            },
          };
        }
        case "get-address-governances": {
          try {
            if (typeof args.address !== "string") {
              throw new Error("address must be a string");
            }

            const result = await this.service.getAddressGovernances({
              address: args.address,
            });

            const content: TextContent[] = [
              {
                type: "text",
                text:
                  `Governances for ${args.address}:\n\n` +
                  result.account.delegatedGovernors
                    .map(
                      (gov) => `- Name: ${gov.name}\n` + `  Type: ${gov.type}\n`
                    )
                    .join("\n\n"),
              },
            ];

            return { content };
          } catch (error) {
            throw new Error(
              `Error fetching address governances: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }
        default: {
          throw new Error(`Unknown tool: ${name}`);
        }
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Tally MCP Server running on stdio");
  }
}
