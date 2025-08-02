import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// Initialize the MCP server with a new name and version
const server = new McpServer({
  name: "context7-mcp",
  version: "1.0.0",
});

// A tool to resolve a general library name into a Context7-compatible ID
const resolveLibraryId = server.tool(
  "resolve-library-id",
  "Resolves a general library name into a Context7-compatible ID",
  {
    libraryName: z.string().describe("The name of the library to resolve (e.g., 'React' or 'Next.js')"),
  },
  async (params: { libraryName: string }) => {
    // In a real-world scenario, this would call a Context7 API endpoint
    // to find the most relevant library ID based on the name.
    // For this example, we'll return a static result to show the structure.
    console.log(`Resolving library name: ${params.libraryName}`);
    return {
      content: [
        {
          type: "text",
          text: `/nextjs/nextjs/v14`, // Example format for a Context7-compatible ID
        },
      ],
    };
  }
);

// A tool to fetch up-to-date documentation for a given library ID
const getLibraryDocs = server.tool(
  "get-library-docs",
  "Fetches up-to-date documentation for a library using its Context7-compatible ID",
  {
    context7CompatibleLibraryID: z.string().describe("The unique ID for the library (e.g., '/nextjs/nextjs/v14')"),
    topic: z.string().optional().describe("An optional topic to focus the search on (e.g., 'routing')"),
    tokens: z.number().optional().describe("An optional limit on the number of tokens to return"),
  },
  async (params: { context7CompatibleLibraryID: string, topic?: string, tokens?: number }) => {
    // This function would call another Context7 API endpoint
    // to fetch the actual documentation. The parameters would be
    // passed to the external API to filter the results.
    console.log(`Fetching docs for: ${params.context7CompatibleLibraryID} with topic: ${params.topic || 'none'}`);
    
    const mockDocumentation = `
      // Context7 documentation for ${params.context7CompatibleLibraryID}
      // Topic: ${params.topic || 'General'}
      // Example code for a Next.js App Router page:
      import { NextPage } from 'next';
      const HomePage: NextPage = () => {
        return <h1>Hello Context7!</h1>;
      };
      export default HomePage;
    `;
    
    return {
      content: [
        {
          type: "text",
          text: mockDocumentation,
        },
      ],
    };
  }
);

// The rest of the server setup remains the same, as it's the standard
// boilerplate for the Model Context Protocol SDK.
const app = express();
app.use(express.json());

const transport: StreamableHTTPServerTransport =
  new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // set to undefined for stateless servers
  });

// Setup routes for the server
const setupServer = async () => {
  await server.connect(transport);
};

app.post("/mcp", async (req: Request, res: Response) => {
  console.log("Received MCP request:", req.body);
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get("/mcp", async (req: Request, res: Response) => {
  console.log("Received GET MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

app.delete("/mcp", async (req: Request, res: Response) => {
  console.log("Received DELETE MCP request");
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

// Start the server
const PORT = process.env.PORT || 3000;
setupServer()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MCP Context7 Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to set up the server:", error);
    process.exit(1);
  });
