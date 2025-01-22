import { GraphQLResponse } from 'graphql-request';

export class RateLimiter {
  private lastRequestTime = 0;
  private remainingRequests: number | null = null;
  private resetTime: number | null = null;
  private readonly baseDelay: number;
  private readonly maxDelay: number;

  constructor(baseDelay = 1000, maxDelay = 5000) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  public updateFromHeaders(headers: Record<string, string>): void {
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];
    
    if (remaining) {
      this.remainingRequests = parseInt(remaining, 10);
    }
    if (reset) {
      this.resetTime = parseInt(reset, 10) * 1000; // Convert to milliseconds
    }
    
    this.lastRequestTime = Date.now();
  }

  public async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // If we have rate limit information from headers
    if (this.remainingRequests !== null && this.remainingRequests <= 0 && this.resetTime) {
      const waitTime = this.resetTime - now;
      if (waitTime > 0) {
        if (process.env.NODE_ENV === 'test') {
          console.log(`Rate limit reached. Waiting ${waitTime}ms until reset`);
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return;
      }
    }

    // Fallback to basic rate limiting
    if (timeSinceLastRequest < this.baseDelay) {
      const waitTime = this.baseDelay - timeSinceLastRequest;
      if (process.env.NODE_ENV === 'test') {
        console.log(`Basic rate limit: Waiting ${waitTime}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  public async exponentialBackoff(retryCount: number): Promise<void> {
    const delay = Math.min(this.baseDelay * Math.pow(2, retryCount), this.maxDelay);
    if (process.env.NODE_ENV === 'test') {
      console.log(`Exponential backoff: Waiting ${delay}ms on retry ${retryCount}`);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Create a singleton instance for use across the application
export const globalRateLimiter = new RateLimiter(); 