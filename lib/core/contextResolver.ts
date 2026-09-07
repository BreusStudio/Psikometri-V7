import { ClientContextType, ContextTerminology, CONTEXT_TERMINOLOGIES } from '../metadata/contextTerminology';
import { Student } from '../types';

/**
 * Resolves the client context (SD, SMP, SMA, SMK, Personal, Corporate)
 * from a Student object, ID string, or voucher code.
 */
export function resolveClientContext(
  studentOrIdOrCode?: Student | string | null
): ContextTerminology {
  if (!studentOrIdOrCode) {
    return CONTEXT_TERMINOLOGIES.school_sma;
  }

  let textToInspect = '';
  if (typeof studentOrIdOrCode === 'string') {
    textToInspect = studentOrIdOrCode.toLowerCase();
  } else {
    const s = studentOrIdOrCode;
    textToInspect = [
      s.id || '',
      s.school_origin || s.schoolOrigin || '',
      s.classGroup || s.class_name || '',
      s.major || '',
      s.name || ''
    ].join(' ').toLowerCase();
  }

  // 1. Check for Corporate / Rekrutmen / Perusahaan
  if (
    textToInspect.includes('corp') ||
    textToInspect.includes('pt ') ||
    textToInspect.includes('cv ') ||
    textToInspect.includes('bumn') ||
    textToInspect.includes('perusahaan') ||
    textToInspect.includes('rekrutmen') ||
    textToInspect.includes('recruitment') ||
    textToInspect.includes('karyawan') ||
    textToInspect.includes('pegawai')
  ) {
    return CONTEXT_TERMINOLOGIES.corporate;
  }

  // 2. Check for Personal / Mandiri / Umum
  if (
    textToInspect.includes('personal') ||
    textToInspect.includes('mandiri') ||
    textToInspect.includes('voucher personal') ||
    textToInspect.includes('vchr-pers') ||
    textToInspect.includes('siswamandiri') ||
    textToInspect.includes('smp-003') ||
    textToInspect.includes('umum')
  ) {
    return CONTEXT_TERMINOLOGIES.personal;
  }

  // 3. Check for School SD
  if (
    textToInspect.includes('sd-') ||
    textToInspect.includes('sd_') ||
    textToInspect.includes('sekolah dasar') ||
    textToInspect.includes('sdn ') ||
    textToInspect.includes('sds ') ||
    textToInspect.includes('mi ')
  ) {
    return CONTEXT_TERMINOLOGIES.school_sd;
  }

  // 4. Check for School SMP / MTs
  if (
    textToInspect.includes('smp-') ||
    textToInspect.includes('smp_') ||
    textToInspect.includes('smpn ') ||
    textToInspect.includes('smps ') ||
    textToInspect.includes('mts ') ||
    textToInspect.includes('menengah pertama')
  ) {
    return CONTEXT_TERMINOLOGIES.school_smp;
  }

  // 5. Check for School SMK / Vokasi
  if (
    textToInspect.includes('smk-') ||
    textToInspect.includes('smk_') ||
    textToInspect.includes('smkn ') ||
    textToInspect.includes('smks ') ||
    textToInspect.includes('vokasi') ||
    textToInspect.includes('kejuruan')
  ) {
    return CONTEXT_TERMINOLOGIES.school_smk;
  }

  // 6. Check for School SMA / MA
  if (
    textToInspect.includes('sma-') ||
    textToInspect.includes('sma_') ||
    textToInspect.includes('sman ') ||
    textToInspect.includes('smas ') ||
    textToInspect.includes('ma ') ||
    textToInspect.includes('kartika')
  ) {
    return CONTEXT_TERMINOLOGIES.school_sma;
  }

  // Default to SMA
  return CONTEXT_TERMINOLOGIES.school_sma;
}

/**
 * Helper to check if a context represents a School student
 */
export function isSchoolContext(contextType: ClientContextType): boolean {
  return contextType.startsWith('school_');
}
