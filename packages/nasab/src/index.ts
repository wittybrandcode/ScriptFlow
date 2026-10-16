// ═══════════════════════════════════════════════════
// NASAB v1.0.0 — Public API Surface
// ═══════════════════════════════════════════════════

// Core Types & Enums
export type { Person, Relation, InferredRelation, ValidationResult, ValidationMode } from './core/types';
export { RelationType, Gender } from './core/enums';
export { NasabError, ErrorCode } from './core/errors';
export { normalizeType } from './core/normalizer';
export { getInverseRelation } from './core/InverseMap';
export { isMarriage, isSibling, isParentChild, isHorizontalRelation } from './core/classifiers';
export { GraphAdapter } from './core/GraphAdapter';

// Kinship Engines
export { FiqhAdapter } from './kinship/FiqhAdapter';
export { KinshipEngine } from './kinship/KinshipEngine';
export { InferenceEngine } from './kinship/InferenceEngine';
export { LazyInferenceEngine } from './kinship/LazyInferenceEngine';
export type { ShortestPathResult, GraphPathContext } from './kinship/LazyInferenceEngine';
export { KinshipValidator } from './kinship/KinshipValidator';
export { LineageEngine } from './kinship/LineageEngine';
export { KunyaEngine } from './kinship/KunyaEngine';
export type { KunyaWarning, KunyaMatchResult } from './kinship/KunyaEngine';
export { GraphEngine } from './kinship/GraphEngine';
export { FosterEngine } from './kinship/FosterEngine';
export type { FosterRecord, FosterRelation } from './kinship/FosterEngine';

// Inheritance Engine (Legacy)
export { InheritanceEngine } from './mawarith/InheritanceEngine';
export type { HeirShare, InheritanceResult } from './mawarith/types';

// Export Adapters
export * from './adapters';
export type { ReactFlowNode, ReactFlowEdge, ReactFlowGraph } from './adapters/ReactFlowAdapter';

export { BaseEngine } from './engine/BaseEngine';
export { ExplanationEngine } from './engine/ExplanationEngine';
export { WasiyyaEngine } from './engine/WasiyyaEngine';
export type { WasiyyaResult } from './engine/WasiyyaEngine';
export { EstateEngine } from './engine/EstateEngine';
export type { EstateInput, EstateResult, DeductionStep } from './engine/EstateEngine';
export type { CalculationResult } from './engine/BaseEngine';
export type { FinalReport, HeirReport } from './engine/ExplanationEngine';
export type { Heir, HeirType } from './types/Kinship';
export type { Madhab } from './types/FiqhAST';
export type { ValidationOptions } from './core/types';

// Plugins
export * from './plugins';

// i18n
export { Translator, translator } from './i18n/Translator';
export { ArabicDictionary } from './i18n/ar';
export { EnglishDictionary } from './i18n/en';
export { FrenchDictionary } from './i18n/fr';
export type { KinshipDictionary } from './i18n/types';

// RELATION_CATEGORIES — single source of truth
export { RELATION_CATEGORIES } from './core/constants';
