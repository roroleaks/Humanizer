import { AIProviderName } from '@/contracts/ai-provider';

/**
 * Common abstraction for resolving AI provider credentials.
 * Decouples provider adapters from environment variables, enabling
 * seamless transition to per-user BYOK storage in Phase 9.
 */
export interface CredentialSource {
  getKey(providerName: AIProviderName): string | null;
  getBaseUrl?(providerName: AIProviderName): string | null;
}

/**
 * Standard server-side credential source resolving keys from process.env.
 */
export class EnvVarCredentialSource implements CredentialSource {
  getKey(providerName: AIProviderName): string | null {
    switch (providerName) {
      case 'openai':
        return process.env.SH_AI_OPENAI_API_KEY?.trim() || null;
      case 'gemini':
        return process.env.SH_AI_GEMINI_API_KEY?.trim() || null;
      case 'anthropic':
        return process.env.SH_AI_ANTHROPIC_API_KEY?.trim() || null;
      case 'openai_compatible':
        return process.env.SH_AI_OPENAI_COMPATIBLE_API_KEY?.trim() || null;
      default:
        return null;
    }
  }

  getBaseUrl(providerName: AIProviderName): string | null {
    if (providerName === 'openai_compatible') {
      return process.env.SH_AI_OPENAI_COMPATIBLE_BASE_URL?.trim() || null;
    }
    return null;
  }
}

export const defaultCredentialSource = new EnvVarCredentialSource();
