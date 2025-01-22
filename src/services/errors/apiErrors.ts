export class TallyAPIError extends Error {
  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message);
    this.name = 'TallyAPIError';
  }
}

export class RateLimitError extends TallyAPIError {
  constructor(message = 'Rate limit exceeded', context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'RateLimitError';
  }
}

export class ResourceNotFoundError extends TallyAPIError {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`);
    this.name = 'ResourceNotFoundError';
  }
}

export class ValidationError extends TallyAPIError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class GraphQLRequestError extends TallyAPIError {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly variables?: Record<string, unknown>
  ) {
    super(message, { operation, variables });
    this.name = 'GraphQLRequestError';
  }
} 