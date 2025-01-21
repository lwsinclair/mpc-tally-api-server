export class TallyAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TallyAPIError';
  }
}

export class RateLimitError extends TallyAPIError {
  constructor(message: string, public details?: Record<string, any>) {
    super(message);
    this.name = 'RateLimitError';
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
    public operation: string,
    public variables: Record<string, any>
  ) {
    super(message);
    this.name = 'GraphQLRequestError';
  }
} 