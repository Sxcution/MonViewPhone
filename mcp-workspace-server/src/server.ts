import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getProjectTree } from './tools/getProjectTree.js';
import { listWorkspaceFiles } from './tools/listWorkspaceFiles.js';
import { readFile } from './tools/readFile.js';
import { searchText } from './tools/searchText.js';
import { getGitStatus } from './tools/getGitStatus.js';
import { getGitDiff } from './tools/getGitDiff.js';
import { runWorkspaceCommand } from './tools/runWorkspaceCommand.js';
import { COMMAND_ALLOWLIST } from './utils/commandAllowlist.js';
import { logger } from './utils/logger.js';

export const mcpServer = new Server(
  {
    name: 'workspace-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools list
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_project_tree',
        description: 'Get project folder structure as a visual tree to understand project architecture quickly.',
        inputSchema: {
          type: 'object',
          properties: {
            maxDepth: {
              type: 'integer',
              description: 'Maximum folder depth to traverse (default: 3).',
            },
            includeHidden: {
              type: 'boolean',
              description: 'Whether to include hidden files (default: false).',
            },
          },
        },
      },
      {
        name: 'list_workspace_files',
        description: 'List files in a directory recursively or non-recursively with metadata like size and modification date.',
        inputSchema: {
          type: 'object',
          properties: {
            dir: {
              type: 'string',
              description: 'Target directory relative to workspace root (default: ".").',
            },
            recursive: {
              type: 'boolean',
              description: 'Whether to list files recursively (default: true).',
            },
            extensions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter files by extensions, e.g. [".ts", ".js"].',
            },
            maxFiles: {
              type: 'integer',
              description: 'Maximum files to return to prevent overloading context.',
            },
          },
        },
      },
      {
        name: 'read_file',
        description: 'Read the contents of a text file inside the workspace safely. Supports line range.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path of the file relative to workspace root.',
            },
            startLine: {
              type: 'integer',
              description: 'Start line to read (1-indexed).',
            },
            endLine: {
              type: 'integer',
              description: 'End line to read (inclusive, 1-indexed).',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_text',
        description: 'Search for a query string in workspace files. Skips denylisted paths and binaries.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search term to find.',
            },
            includeExtensions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter files by extensions, e.g. [".ts", ".md"].',
            },
            maxResults: {
              type: 'integer',
              description: 'Maximum matches to return (default: 50).',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_git_status',
        description: 'Get the current git status of the workspace (current branch, modified/untracked files).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_git_diff',
        description: 'Get the git diff of the entire workspace or a specific file.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to diff relative to workspace root (optional).',
            },
            staged: {
              type: 'boolean',
              description: 'Whether to show staged diff changes (default: false).',
            },
            maxBytes: {
              type: 'integer',
              description: 'Maximum bytes of diff output to return (default: 100000).',
            },
          },
        },
      },
      {
        name: 'run_workspace_command',
        description: 'Run predefined validation and testing commands in the workspace root securely.',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              enum: Object.keys(COMMAND_ALLOWLIST),
              description: 'The command key to execute.',
            },
          },
          required: ['command'],
        },
      },
    ],
  };
});

// Register tool handlers
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.info(`MCP tool call requested: ${name}`, args);

  try {
    switch (name) {
      case 'get_project_tree': {
        const result = await getProjectTree(args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
      case 'list_workspace_files': {
        const result = await listWorkspaceFiles(args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
      case 'read_file': {
        const result = await readFile(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
      case 'search_text': {
        const result = await searchText(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
      case 'get_git_status': {
        const result = await getGitStatus();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
      case 'get_git_diff': {
        const result = await getGitDiff(args || {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
      case 'run_workspace_command': {
        const result = await runWorkspaceCommand(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (err: any) {
    logger.error(`Error executing tool ${name}`, err);
    return {
      isError: true,
      content: [{ type: 'text', text: `Error: ${err.message}` }],
    };
  }
});
