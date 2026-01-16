import { RepairResult } from '../types';

/**
 * Validates XML string using the browser's DOMParser.
 */
export const validateXML = (xml: string): { isValid: boolean; errors: string[] } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const errorNode = doc.querySelector("parsererror");

  if (errorNode) {
    return { isValid: false, errors: [errorNode.textContent || "Unknown XML parsing error"] };
  }
  return { isValid: true, errors: [] };
};

/**
 * Heuristic repair function.
 * Runs client-side regex operations to fix common XLIFF issues.
 */
export const heuristicRepair = (rawContent: string): RepairResult => {
  let content = rawContent;
  let wasModified = false;
  const original = rawContent;

  // 1. Remove Illegal Control Characters (Low ASCII, except Tab, LF, CR)
  // XLIFF is XML, and XML 1.0 discourages most control characters.
  const illegalCharRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;
  if (illegalCharRegex.test(content)) {
    content = content.replace(illegalCharRegex, "");
  }

  // 2. Fix Unescaped Ampersands
  // Looks for '&' that is NOT followed by a valid entity structure (e.g., amp;, #123;, #xAF;)
  const unescapedAmpRegex = /&(?!(?:amp|lt|gt|apos|quot|#\d+|#x[a-f\d]+);)/gi;
  if (unescapedAmpRegex.test(content)) {
    content = content.replace(unescapedAmpRegex, "&amp;");
  }

  // 3. Fix Unescaped < inside attribute values is tricky with Regex, 
  // but we can try to catch obvious standalone brackets in text content 
  // if they aren't part of a tag.
  // This is a naive check: < followed by space often indicates meant-to-be-text
  const unescapedLtRegex = /<(\s)/g;
  if (unescapedLtRegex.test(content)) {
    content = content.replace(unescapedLtRegex, "&lt;$1");
  }

  // 4. Try to fix broken closing tags caused by truncation (simple case)
  // If the file ends abruptly, we can't easily guess, but if a tag is malformed like </trans-unit
  const malformedClosingRegex = /<\/([a-zA-Z0-9-_]+)$/;
  if (malformedClosingRegex.test(content)) {
    content = content.replace(malformedClosingRegex, "</$1>");
  }

  // Check modification status
  wasModified = content !== original;

  // Validate
  const validation = validateXML(content);

  return {
    fixedContent: content,
    isValid: validation.isValid,
    errors: validation.errors,
    wasModified
  };
};
