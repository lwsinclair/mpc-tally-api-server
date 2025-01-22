import { GraphQLClient } from "graphql-request";
import { GET_DELEGATORS_QUERY } from "./delegators.queries.js";
import {
  GetDelegatorsParams,
  DelegationsResponse,
  Delegation,
} from "./delegators.types.js";
import { PageInfo } from "../organizations/organizations.types.js";
import { getDAO } from "../organizations/getDAO.js";

export async function getDelegators(
  client: GraphQLClient,
  params: GetDelegatorsParams
): Promise<{
  delegators: Delegation[];
  pageInfo: PageInfo;
}> {
  try {
    let organizationId;

    if (!params.organizationSlug) {
      throw new Error("OrganizationSlug must be provided");
    }

    const { organization: dao } = await getDAO(client, params.organizationSlug);
    organizationId = dao.id;

    const input = {
      filters: {
        address: params.address,
        ...(organizationId && { organizationId }),
        ...(params.governorId && { governorId: params.governorId }),
      },
      page: {
        limit: Math.min(params.limit || 20, 50),
        ...(params.afterCursor && { afterCursor: params.afterCursor }),
        ...(params.beforeCursor && { beforeCursor: params.beforeCursor }),
      },
      ...(params.sortBy && {
        sort: {
          sortBy: params.sortBy,
          isDescending: params.isDescending ?? true,
        },
      }),
    };

    const response = await client.request<DelegationsResponse>(
      GET_DELEGATORS_QUERY,
      { input }
    );

    return {
      delegators: response.delegators.nodes,
      pageInfo: response.delegators.pageInfo,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch delegators: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
