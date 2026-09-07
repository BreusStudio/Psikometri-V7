import { PsychometricStore } from './store/PsychometricStore';

// Re-export types for backward compatibility and clean modular imports
export * from './types';

// Re-export static datasets and helper presets for external components
export { PRESET_QUESTIONS, INITIAL_STUDENTS, INITIAL_TEACHERS } from './presetQuestions';

export {
  PRESET_MAJORS,
  PRESET_DIMENSIONS,
  PRESET_TEST_TYPES,
  PRESET_PACKAGES,
  DEFAULT_AI_PROMPT_TEMPLATE,
  DEFAULT_AI_SYSTEM_INSTRUCTION,
  getRotatingToken
} from './mock/presets';

export { PsychometricStore };

// Global Single Instance Export
export const mockDatabase = new PsychometricStore();
