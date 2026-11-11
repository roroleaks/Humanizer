/**
 * Validation Engine Contracts
 * 
 * Defines rule evaluators, validation pipeline contracts, and comparison parameters.
 */

import { ValidationReport, ValidationCategory, Discrepancy } from './scientific-integrity';
import { ParsedDocument } from './document-section';
import { RefinementResult } from './refinement';

/**
 * Configuration options for the scientific validation pipeline.
 */
export interface ValidationOptions {
  strictDosagePreservation: boolean;
  strictCitationVerification: boolean;
  allowMinorFormattingAdjustments: boolean;
  maxToleratedDiscrepancies: number;
}

/**
 * Result of executing an individual validation check rule.
 */
export interface RuleEvaluationResult {
  category: ValidationCategory;
  passed: boolean;
  discrepancies: Discrepancy[];
  detail: string;
}

/**
 * Interface implemented by specific category integrity validators.
 */
export interface IntegrityRuleValidator {
  readonly category: ValidationCategory;
  evaluate(
    original: ParsedDocument,
    revised: RefinementResult
  ): Promise<RuleEvaluationResult>;
}

/**
 * Main validation engine service contract.
 */
export interface ValidationEngineService {
  validateManuscript(
    original: ParsedDocument,
    revised: RefinementResult,
    options?: ValidationOptions
  ): Promise<ValidationReport>;
}
