import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  type Tool,
  type TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import { TallyService } from "./services/tally.service.js";
import type { OrganizationsSortBy } from "./services/organizations/organizations.types.js";
import { tools } from "./tools.js";

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
      return { tools };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      if (name === "list-daos") {
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
              text: JSON.stringify(data, null, 2),
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

      if (name === "get-dao") {
        try {
          if (typeof args.slug !== "string") {
            throw new Error("slug must be a string");
          }

          const result = await this.service.getDAO(args.slug);

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error getting DAO: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      if (name === "list-delegates") {
        try {
          if (typeof args.organizationIdOrSlug !== "string") {
            throw new Error("organizationIdOrSlug must be a string");
          }

          const limit = typeof args.limit === "number" ? args.limit : 20;
          const afterCursor = typeof args.afterCursor === "string" ? args.afterCursor : undefined;
          const hasVotes = typeof args.hasVotes === "boolean" ? args.hasVotes : undefined;
          const hasDelegators = typeof args.hasDelegators === "boolean" ? args.hasDelegators : undefined;
          const isSeekingDelegation = typeof args.isSeekingDelegation === "boolean" ? args.isSeekingDelegation : undefined;

          const result = await this.service.listDelegates({
            organizationIdOrSlug: args.organizationIdOrSlug,
            limit,
            afterCursor,
            hasVotes,
            hasDelegators,
            isSeekingDelegation,
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error listing delegates: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      if (name === "get-delegators") {
        try {
          if (typeof args.address !== "string") {
            throw new Error("address must be a string");
          }

          const organizationId = typeof args.organizationId === "string" ? args.organizationId : undefined;
          const organizationSlug = typeof args.organizationSlug === "string" ? args.organizationSlug : undefined;
          const governorId = typeof args.governorId === "string" ? args.governorId : undefined;
          const limit = typeof args.limit === "number" ? args.limit : 20;
          const afterCursor = typeof args.afterCursor === "string" ? args.afterCursor : undefined;
          const beforeCursor = typeof args.beforeCursor === "string" ? args.beforeCursor : undefined;
          const sortBy = typeof args.sortBy === "string" && (args.sortBy === "votes" || args.sortBy === "id") ? args.sortBy : undefined;
          const isDescending = typeof args.isDescending === "boolean" ? args.isDescending : undefined;

          const result = await this.service.getDelegators({
            address: args.address,
            organizationId,
            organizationSlug,
            governorId,
            limit,
            afterCursor,
            beforeCursor,
            sortBy,
            isDescending,
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error getting delegators: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      if (name === "list-proposals") {
        try {
          if (typeof args.slug !== "string") {
            throw new Error("slug must be a string");
          }

          const data = await this.service.listProposals({
            slug: args.slug,
            includeArchived: typeof args.includeArchived === "boolean" ? args.includeArchived : undefined,
            isDraft: typeof args.isDraft === "boolean" ? args.isDraft : undefined,
            limit: typeof args.limit === "number" ? args.limit : undefined,
            afterCursor: typeof args.afterCursor === "string" ? args.afterCursor : undefined,
            beforeCursor: typeof args.beforeCursor === "string" ? args.beforeCursor : undefined,
            isDescending: typeof args.isDescending === "boolean" ? args.isDescending : undefined
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: TallyService.formatProposalsList(data.proposals.nodes),
            },
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error fetching proposals: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      if (name === "get-proposal") {
        try {
          const id = typeof args.id === "string" ? args.id : undefined;
          const onchainId = typeof args.onchainId === "string" ? args.onchainId : undefined;
          const governorId = typeof args.governorId === "string" ? args.governorId : undefined;
          const includeArchived = typeof args.includeArchived === "boolean" ? args.includeArchived : undefined;
          const isLatest = typeof args.isLatest === "boolean" ? args.isLatest : undefined;

          if (!id && (!onchainId || !governorId)) {
            throw new Error("Must provide either id or both onchainId and governorId");
          }

          const result = await this.service.getProposal({
            id,
            onchainId,
            governorId,
            includeArchived,
            isLatest,
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error getting proposal: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      if (name === "get-address-created-proposals") {
        try {
          if (typeof args.address !== "string") {
            throw new Error("address must be a string");
          }
          if (typeof args.organizationSlug !== "string") {
            throw new Error("organizationSlug must be a string");
          }

          const result = await (this.service as any).getAddressCreatedProposals({
            address: args.address,
            organizationSlug: args.organizationSlug,
            limit: typeof args.limit === "number" ? args.limit : undefined,
            afterCursor: typeof args.afterCursor === "string" ? args.afterCursor : undefined,
            beforeCursor: typeof args.beforeCursor === "string" ? args.beforeCursor : undefined
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error fetching address created proposals: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      if (name === "get-address-daos-proposals") {
        try {
          if (typeof args.address !== "string") {
            throw new Error("address must be a string");
          }
          if (typeof args.organizationSlug !== "string") {
            throw new Error("organizationSlug must be a string");
          }

          const result = await this.service.getAddressDAOProposals({
            address: args.address,
            organizationSlug: args.organizationSlug,
            limit: typeof args.limit === "number" ? args.limit : undefined,
            afterCursor: typeof args.afterCursor === "string" ? args.afterCursor : undefined,
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error fetching address DAO proposals: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      if (name === "get-address-votes") {
        try {
          if (typeof args.address !== "string") {
            throw new Error("address must be a string");
          }
          if (typeof args.organizationSlug !== "string") {
            throw new Error("organizationSlug must be a string");
          }

          const result = await this.service.getAddressVotes({
            address: args.address,
            organizationSlug: args.organizationSlug,
            limit: typeof args.limit === "number" ? args.limit : undefined,
            afterCursor:
              typeof args.afterCursor === "string"
                ? args.afterCursor
                : undefined,
          });

          if (!result?.votes?.nodes) {
            return {
              content: [],
              pageInfo: {
                firstCursor: null,
                lastCursor: null,
              },
            };
          }

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result.votes.nodes),
            },
          ];

          return {
            content,
            pageInfo: {
              firstCursor: result.votes.pageInfo.firstCursor || null,
              lastCursor: result.votes.pageInfo.lastCursor || null,
            },
          };
        } catch (error) {
          throw new Error(
            `Error fetching address votes: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      if (name === "get-address-received-delegations") {
        try {
          if (typeof args.address !== "string") {
            throw new Error("address must be a string");
          }
          if (typeof args.organizationSlug !== "string") {
            throw new Error("organizationSlug must be a string");
          }

          const result = await this.service.getAddressReceivedDelegations({
            address: args.address,
            organizationSlug: args.organizationSlug,
            limit: typeof args.limit === "number" ? args.limit : undefined,
            sortBy: typeof args.sortBy === "string" ? (args.sortBy as "votes") : undefined,
            isDescending: typeof args.isDescending === "boolean" ? args.isDescending : undefined,
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result),
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

      if (name === "get-delegate-statement") {
        try {
          if (typeof args.address !== "string") {
            throw new Error("address must be a string");
          }

          // Check for mutually exclusive parameters
          if (typeof args.governorId === "string" && typeof args.organizationSlug === "string") {
            throw new Error("Cannot provide both governorId and organizationSlug");
          }

          let result;
          if (typeof args.governorId === "string") {
            result = await this.service.getDelegateStatement({
              address: args.address,
              governorId: args.governorId
            });
          } else if (typeof args.organizationSlug === "string") {
            result = await this.service.getDelegateStatement({
              address: args.address,
              organizationSlug: args.organizationSlug
            });
          } else {
            throw new Error("Either governorId or organizationSlug must be provided");
          }

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error fetching delegate statement: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      if (name === "get-address-governances") {
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
              text: JSON.stringify(result),
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

      if (name === "get-proposal-timeline") {
        try {
          if (typeof args.proposalId !== 'string') {
            throw new Error('proposalId must be a string');
          }
          const result = await this.service.getProposalTimeline({
            proposalId: args.proposalId
          });
          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result)
            }
          ];
          return { content };
        } catch (error) {
          throw new Error(
            `Error fetching proposal timeline: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      if (name === "get-proposal-voters") {
        try {
          if (typeof args.proposalId !== "string") {
            throw new Error("proposalId must be a string");
          }

          const result = await this.service.getProposalVoters({
            proposalId: args.proposalId,
            limit: typeof args.limit === "number" ? args.limit : undefined,
            afterCursor: typeof args.afterCursor === "string" ? args.afterCursor : undefined,
            beforeCursor: typeof args.beforeCursor === "string" ? args.beforeCursor : undefined,
            sortBy: typeof args.sortBy === "string" ? args.sortBy as "votes" | "timestamp" : undefined,
            isDescending: typeof args.isDescending === "boolean" ? args.isDescending : undefined
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result)
            }
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error fetching proposal voters: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      if (name === "get-address-metadata") {
        const { address } = args as { address: string };
        const result = await this.service.getAddressMetadata({
          address,
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      if (name === "get-proposal-security-analysis") {
        try {
          if (typeof args.proposalId !== "string") {
            throw new Error("proposalId must be a string");
          }

          const result = await this.service.getProposalSecurityAnalysis({
            proposalId: args.proposalId
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error fetching proposal security analysis: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      if (name === "get-proposal-votes-cast") {
        try {
          if (typeof args.id !== "string") {
            throw new Error("id must be a string");
          }

          const result = await this.service.getProposalVotesCast({
            id: args.id
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error fetching proposal votes cast: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      if (name === "get-proposal-votes-cast-list") {
        try {
          if (typeof args.id !== "string") {
            throw new Error("id must be a string");
          }

          const result = await this.service.getProposalVotesCastList({
            id: args.id
          });

          const content: TextContent[] = [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ];

          return { content };
        } catch (error) {
          throw new Error(
            `Error fetching proposal votes cast list: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Tally MCP Server running on stdio");
  }
}
