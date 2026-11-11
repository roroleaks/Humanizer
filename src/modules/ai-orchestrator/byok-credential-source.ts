import { AIProviderName } from '@/contracts/ai-provider';
import { CredentialSource } from './credential-source';

/**
 * Phase 9 Contract Stub: Bring-Your-Own-Key (BYOK) Credential Source.
 * 
 * In Phase 9, this class will resolve encrypted user-provided API credentials
 * from authenticated session contexts or an encrypted user key vault.
 * 
 * NOTE: This is a declaration stub only. It is not wired into the runtime in Phase 3.
 */
export interface ByokKeyVault {
  getDecryptedKey(userId: string, providerName: AIProviderName): Promise<string | null>;
}

export class ByokCredentialSourceStub implements CredentialSource {
  constructor(private readonly _userId?: string, private readonly _vault?: ByokKeyVault) {}

  getKey(_providerName: AIProviderName): string | null {
    // Stub implementation for Phase 9
    return null;
  }
}
