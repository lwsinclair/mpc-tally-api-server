import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from "zod";
import { spawn, type ChildProcess } from 'child_process';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;
const MAX_DELAY = 5000;

async function exponentialBackoff(retryCount: number): Promise<void> {
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  await new Promise(resolve => setTimeout(resolve, delay));
}

class McpTestClient {
  private client: Client;
  private serverProcess: ChildProcess;
  private serverPath: string;
  private apiKey: string;
  
  constructor(serverPath: string) {
    this.serverPath = serverPath;
    this.apiKey = process.env.TALLY_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("TALLY_API_KEY is not defined.");
    }
  }

  async start() {
    this.serverProcess = spawn('node', [this.serverPath], {
      env: { ...process.env, TALLY_API_KEY: this.apiKey },
    });

    this.serverProcess.stdout.on('data', (data) => {
      console.log(`Server stdout: ${data}`);
    });

    this.serverProcess.stderr.on('data', (data) => {
      console.error(`Server stderr: ${data}`);
    });

    this.serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    this.serverProcess.on('error', (err) => {
      console.error('Server failed to start:', err);
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async connect() {
    const transport = new StdioClientTransport({ command: 'node', args: [this.serverPath] });
    this.client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      { capabilities: {}}
    );

    await this.client.connect(transport);
  }

  async request<T>(
    method: string,
    params: Record<string, any>,
    schema: z.ZodType<T>,
  ): Promise<T> {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries < MAX_RETRIES) {
      try {
        const response = await this.client.request(
          { method, params },
          schema
        );
        return response;
      }
      catch (error) {
        lastError = error as Error;
        if (String(lastError).includes("429") || String(lastError).includes("rate limit")) {
          retries++;
          if (retries < MAX_RETRIES) {
            await exponentialBackoff(retries);
            continue;
          }
        }
        
        console.error(`Request failed after ${retries} retries:`, lastError);
        throw new Error(`Request failed after ${retries} retries: ${lastError.message}`);
      }
    }
    throw new Error(`Max retries of ${MAX_RETRIES} reached`);
  }

  async listTools(): Promise<any> {
    const schema = z.object({
      tools: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          inputSchema: z.object({
            type: z.string(),
            properties: z.record(z.any()).optional(),
            required: z.array(z.string()).optional(),
          }),
        })
      ),
    });
    return this.request("tools/list", {}, schema);
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    const schema = z.object({
      content: z.array(
        z.object({
          type: z.string(),
          text: z.string().optional(),
        })
      ),
      pageInfo: z.object({
        firstCursor: z.string().optional(),
        lastCursor: z.string().optional(),
        count: z.number().optional(),
      }).optional(),
      isError: z.boolean().optional()
    });
    return this.request("tools/call", { name, arguments: args }, schema);
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
}

describe("MCP Server Tests", () => {
  let mcpClient: McpTestClient;

  beforeEach(async () => {
    const serverPath = "./build/index.js";
    mcpClient = new McpTestClient(serverPath);
    await mcpClient.start();
    await mcpClient.connect();
  });

  afterEach(async () => {
    await mcpClient.close();
  });

  test("should list available tools", async () => {
    const tools = await mcpClient.listTools();
    expect(tools.tools.length).toBeGreaterThan(0);
    expect(tools.tools.some((t: any) => t.name === "get-dao")).toBe(true);
  }, 30000);

  test("should fetch DAO information", async () => {
    const result = await mcpClient.callTool("get-dao", { slug: "uniswap" });
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Uniswap (uniswap)");
  }, 30000);

  test("should handle rate limits gracefully", async () => {
    // Make multiple rapid requests to trigger rate limiting
    const promises = Array(3).fill(null).map(() => 
      mcpClient.callTool("get-dao", { slug: "uniswap" })
    );
    
    const results = await Promise.all(promises);
    results.forEach(result => {
      expect(result.content[0].text).toContain("Uniswap");
    });
  }, 60000);

  test("should fetch address votes", async () => {
    // Using a known address that has votes on Uniswap
    const address = "0xb49f8b8613be240213c1827e2e576044ffec7948";
    const organizationSlug = "uniswap";

    const result = await mcpClient.callTool("get-address-votes", {
      address,
      organizationSlug
    });

    // Verify the response structure
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    
    // Each content item should be a text type with vote details
    result.content.forEach((item: any) => {
      expect(item.type).toBe("text");
      expect(item.text).toBeDefined();
      
      // Vote details should include all available fields
      const text = item.text;
      expect(text).toContain("Vote Details:");
      expect(text).toContain("ID:");
      expect(text).toContain("Type:");
      expect(text).toContain("Amount:");
      expect(text).toContain("Voter Address:");
      expect(text).toContain("Proposal ID:");

      // Verify pagination info
      expect(result.pageInfo).toBeDefined();
    });
  }, 30000);
}); 