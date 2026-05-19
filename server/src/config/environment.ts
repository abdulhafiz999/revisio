import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define the schema for environment variables
const envSchema = z.object({
  // Supabase configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required'),
  
  // AI service configuration
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  OPENAI_API_KEY: z.string().optional().default(''),
  
  // Server configuration
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Frontend configuration - supports comma-separated URLs for multiple origins
  FRONTEND_URL: z.string().refine(
    (val) => val.split(',').map(u => u.trim()).every(u => {
      try { new URL(u); return true; } catch { return false; }
    }),
    { message: 'FRONTEND_URL must be a valid URL or comma-separated list of valid URLs' }
  ),
});

// Type for validated environment variables
export type Environment = z.infer<typeof envSchema>;

/**
 * Validates and returns environment variables
 * Fails fast with descriptive error messages if required variables are missing
 */
export function validateEnvironment(): Environment {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars: string[] = [];
      const invalidVars: string[] = [];
      
      error.errors.forEach((err) => {
        const varName = err.path.join('.');
        if (err.code === 'invalid_type' && err.received === 'undefined') {
          missingVars.push(varName);
        } else {
          invalidVars.push(`${varName}: ${err.message}`);
        }
      });
      
      let errorMessage = '\n❌ Environment Configuration Error:\n\n';
      
      if (missingVars.length > 0) {
        errorMessage += '  Missing required environment variables:\n';
        missingVars.forEach(varName => {
          errorMessage += `    - ${varName}\n`;
        });
      }
      
      if (invalidVars.length > 0) {
        errorMessage += '\n  Invalid environment variables:\n';
        invalidVars.forEach(msg => {
          errorMessage += `    - ${msg}\n`;
        });
      }
      
      errorMessage += '\n  Please check your .env file and ensure all required variables are set.\n';
      errorMessage += '  See .env.example for reference.\n';
      
      console.error(errorMessage);
      process.exit(1);
    }
    
    throw error;
  }
}

// Export validated environment
export const env = validateEnvironment();
