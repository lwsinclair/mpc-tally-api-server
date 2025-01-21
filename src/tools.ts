import { type Tool } from "@modelcontextprotocol/sdk/types.js";

export const tools: Tool[] = [
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
          description: "The Ethereum address to get delegators for (0x format)",
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
          description: "Filter by organization ID (large integer as string)",
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
              description: "The governor's ID (required when using onchainId)",
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
    description: "Get votes cast by an address for a specific organization",
    inputSchema: {
      type: "object",
      required: ["address", "organizationSlug"],
      properties: {
        address: {
          type: "string",
          description: "The address to get votes for",
        },
        organizationSlug: {
          type: "string",
          description: "The organization slug to get votes from",
        },
        limit: {
          type: "number",
          description: "Maximum number of votes to return (default: 20)",
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
    description:
      "Get proposals created by an address for a specific organization",
    inputSchema: {
      type: "object",
      required: ["address", "organizationSlug"],
      properties: {
        address: {
          type: "string",
          description: "The Ethereum address to get created proposals for",
        },
        organizationSlug: {
          type: "string",
          description: "The organization slug to get proposals from",
        },
        limit: {
          type: "number",
          description: "Maximum number of proposals to return (default: 20)",
        },
        afterCursor: {
          type: "string",
          description: "Cursor for pagination",
        },
        beforeCursor: {
          type: "string",
          description: "Cursor for previous page pagination",
        },
      },
    },
    handler: async function (
      this: { service: TallyService },
      input: Record<string, unknown>
    ) {
      const { address, organizationSlug } = input;
      if (typeof address !== "string") {
        throw new Error("address must be a string");
      }
      if (typeof organizationSlug !== "string") {
        throw new Error("organizationSlug must be a string");
      }
      const result = await (this.service as any).getAddressCreatedProposals({
        address,
        organizationSlug,
        limit: typeof input.limit === "number" ? input.limit : undefined,
        afterCursor:
          typeof input.afterCursor === "string" ? input.afterCursor : undefined,
        beforeCursor:
          typeof input.beforeCursor === "string"
            ? input.beforeCursor
            : undefined,
      });
      return JSON.stringify(result);
    },
  },
  {
    name: "get-address-daos-proposals",
    description:
      "Returns proposals from DAOs where a given address has participated (voted, proposed, etc.)",
    inputSchema: {
      type: "object",
      required: ["address", "organizationSlug"],
      properties: {
        address: {
          type: "string",
          description: "The Ethereum address",
        },
        organizationSlug: {
          type: "string",
          description: "The organization slug to get proposals from",
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
      required: ["address", "organizationSlug"],
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
  {
    name: "get-proposal-timeline",
    description: "Get the timeline of events for a specific proposal",
    inputSchema: {
      type: "object",
      required: ["proposalId"],
      properties: {
        proposalId: {
          type: "string",
          description: "The ID of the proposal to get the timeline for",
        },
      },
    },
    handler: async function (
      this: { service: TallyService },
      input: Record<string, unknown>
    ) {
      if (typeof input.proposalId !== "string") {
        throw new Error("proposalId must be a string");
      }
      const result = await this.service.getProposalTimeline({
        proposalId: input.proposalId,
      });
      const content: TextContent[] = [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ];
      return { content };
    },
  },
  {
    name: "get-proposal-voters",
    description:
      "Get a list of all voters who have voted on a specific proposal",
    inputSchema: {
      type: "object",
      required: ["proposalId"],
      properties: {
        proposalId: {
          type: "string",
          description: "The ID of the proposal to get voters for",
        },
        limit: {
          type: "number",
          description: "Maximum number of voters to return (default: 20)",
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
          enum: ["votes", "timestamp"],
          description: "How to sort the voters",
        },
        isDescending: {
          type: "boolean",
          description: "Sort in descending order",
        },
      },
    },
  },
  {
    name: "get-address-metadata",
    description: "Get metadata information about a specific Ethereum address",
    inputSchema: {
      type: "object",
      required: ["address"],
      properties: {
        address: {
          type: "string",
          description: "The Ethereum address to get metadata for (0x format)",
        },
      },
    },
  },
  {
    name: "get-proposal-security-analysis",
    description:
      "Get security analysis for a specific proposal, including threat analysis and simulations",
    inputSchema: {
      type: "object",
      required: ["proposalId"],
      properties: {
        proposalId: {
          type: "string",
          description: "The ID of the proposal to get security analysis for",
        },
      },
    },
  },
  {
    name: "get-proposal-votes-cast",
    description:
      "Get vote statistics and formatted vote counts for a specific proposal",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          description: "The proposal's ID",
        },
      },
    },
  },
  {
    name: "get-proposal-votes-cast-list",
    description:
      "Get a list of votes cast for a specific proposal, including formatted vote amounts",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          description:
            "The proposal's Tally ID (globally unique across all governors)",
        },
      },
    },
  },
];
