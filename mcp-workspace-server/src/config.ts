import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environmental variables
dotenv.config();

const configSchema = z.object({
  PORT: z.coerce.number().default(3000),
  MCP_PATH: z.string().default('/mcp'),
  WORKSPACE_ROOT: z.string().transform((val) => {
    // Resolve absolute path and normalize it
    const resolved = path.resolve(val);
    return resolved;
  }),
  MCP_AUTH_TOKEN: z.string().min(1, 'MCP_AUTH_TOKEN is required for security'),
  MAX_FILE_BYTES: z.coerce.number().default(200000),
  MAX_LIST_FILES: z.coerce.number().default(2000),
  MAX_COMMAND_TIMEOUT_MS: z.coerce.number().default(120000),
  NODE_ENV: z.string().default('development'),
});

const getRawConfig = () => {
  return {
    PORT: process.env.PORT,
    MCP_PATH: process.env.MCP_PATH,
    WORKSPACE_ROOT: process.env.WORKSPACE_ROOT,
    MCP_AUTH_TOKEN: process.env.MCP_AUTH_TOKEN,
    MAX_FILE_BYTES: process.env.MAX_FILE_BYTES,
    MAX_LIST_FILES: process.env.MAX_LIST_FILES,
    MAX_COMMAND_TIMEOUT_MS: process.env.MAX_COMMAND_TIMEOUT_MS,
    NODE_ENV: process.env.NODE_ENV,
  };
};

let validatedConfig: z.infer<typeof configSchema>;

try {
  validatedConfig = configSchema.parse(getRawConfig());
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Configuration validation failed:');
    error.errors.forEach((err) => {
      console.error(`- ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error('Unexpected error parsing configuration:', error);
  }
  process.exit(1);
}

export const config = validatedConfig;
