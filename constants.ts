export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_EXTENSIONS = ['.xlf', '.xliff', '.xml'];

export const FIX_STEPS = {
  ENCODING: 'Checking encoding...',
  ILLEGAL_CHARS: 'Stripping illegal control characters...',
  ENTITIES: 'Fixing unescaped entities (&, <, >)...',
  TAGS: 'Attempting to balance tags...',
  VALIDATION: 'Validating XML structure...',
};
