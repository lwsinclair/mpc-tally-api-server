class RateLimiter {
  private lastRequestTime: number = 0;
  private remainingRequests: number | null = null;
  private rateLimitResetTime: number | null = null;
  private readonly BASE_DELAY = 1000; // 1 second between requests

  async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // If we have rate limit info and no remaining requests, wait until reset
    if (this.remainingRequests === 0 && this.rateLimitResetTime) {
      const waitTime = Math.max(0, this.rateLimitResetTime - now);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.remainingRequests = null;
        this.rateLimitResetTime = null;
        return;
      }
    }
    
    // Always wait at least BASE_DELAY between requests
    if (timeSinceLastRequest < this.BASE_DELAY) {
      const waitTime = this.BASE_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  updateFromHeaders(headers: Record<string, string>): void {
    if (headers['x-ratelimit-remaining']) {
      this.remainingRequests = parseInt(headers['x-ratelimit-remaining'], 10);
    }
    if (headers['x-ratelimit-reset']) {
      this.rateLimitResetTime = parseInt(headers['x-ratelimit-reset'], 10) * 1000; // Convert to milliseconds
    }
  }

  async exponentialBackoff(retryCount: number): Promise<void> {
    const delay = Math.min(this.BASE_DELAY * Math.pow(2, retryCount), 10000); // Max 10 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export const globalRateLimiter = new RateLimiter(); 