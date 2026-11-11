import { processingEventRepository } from '@/lib/storage/repositories/processing-event-repository';

const SUSPICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt\s*:/i,
  /disregard\s+(all\s+)?guidelines/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /output\s+all\s+(internal\s+)?instructions/i,
  /bypass\s+safety\s+checks/i,
  /exfiltrate/i,
];

/**
 * Inspects parsed text chunks for adversarial prompt injection patterns.
 * If detected, logs a security event in the operational audit log.
 * The text is NOT altered or executed; it is treated purely as inert research prose.
 */
export async function detectAndLogPromptInjection(
  manuscriptId: string,
  text: string,
  locationHint: string
): Promise<boolean> {
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      await processingEventRepository.logEvent(
        manuscriptId,
        'prompt_injection_attempt',
        'security',
        `Suspicious instruction pattern detected at ${locationHint}. Quarantined as inert research content.`
      );
      return true;
    }
  }
  return false;
}
