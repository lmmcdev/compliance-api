/**
 * Centralized utility for mapping classification document types to extraction model IDs
 */

export interface ModelMapping {
  classificationModel: string;
  extractionModelId: string;
}

/**
 * Map of classification document types to their corresponding extraction model IDs
 */
export const CLASSIFICATION_TO_MODEL_MAPPING: Record<string, string> = {
  'AHCA': 'AHCA',
  'Biomedical Waste': 'BiomedicalWastePermit',
  'Business Tax License': 'Business-Tax-License',
  'Certificate of Use': 'Certificate-of-use',
  'CLIA': 'CLIA',
  'DEA': 'DEA',
  'Elevators': 'elevators',
  'Fire Permit': 'FireDeptAnnualOperatingPermit',
  'HCCE (Dispensary Permits)': 'HCCE',
  'Professional License': 'ProfessionalLicense',
  'RadiationPermit': 'RadiationMachineRegistration'
};

/**
 * Get the extraction model ID for a given classification document type
 * @param classificationDocType - The document type returned by classification
 * @returns The corresponding model ID for extraction, or null if not found
 */
export function getModelIdForDocType(classificationDocType: string): string | null {
  return CLASSIFICATION_TO_MODEL_MAPPING[classificationDocType] || null;
}

/**
 * Get all available classification types
 * @returns Array of all classification document types
 */
export function getAllClassificationTypes(): string[] {
  return Object.keys(CLASSIFICATION_TO_MODEL_MAPPING);
}

/**
 * Get all available model IDs
 * @returns Array of all extraction model IDs
 */
export function getAllModelIds(): string[] {
  return Object.values(CLASSIFICATION_TO_MODEL_MAPPING);
}

/**
 * Check if a classification document type has a corresponding model ID
 * @param classificationDocType - The document type to check
 * @returns True if mapping exists, false otherwise
 */
export function hasModelMapping(classificationDocType: string): boolean {
  return classificationDocType in CLASSIFICATION_TO_MODEL_MAPPING;
}

/**
 * Get the reverse mapping - find classification type by model ID
 * @param modelId - The model ID to find classification type for
 * @returns The corresponding classification document type, or null if not found
 */
export function getDocTypeForModelId(modelId: string): string | null {
  const entry = Object.entries(CLASSIFICATION_TO_MODEL_MAPPING).find(
    ([, value]) => value === modelId
  );
  return entry ? entry[0] : null;
}