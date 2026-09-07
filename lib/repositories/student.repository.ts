import { BaseRepository } from './base.repository';
import { Student } from '../types';

export class StudentRepository extends BaseRepository<Student> {
  getAll(): Student[] {
    return this.store.getStudents();
  }

  getById(id: string): Student | undefined {
    return this.store.getStudents().find(s => s.id === id);
  }

  add(studentData: Partial<Student>, skipSave = false): boolean | string {
    if (!studentData.id || !studentData.name) {
      return 'NIS / ID dan Nama Siswa wajib diisi.';
    }
    const existing = this.getById(studentData.id);
    if (existing) {
      return this.update(studentData.id, studentData);
    }

    const testTypesList = this.store.getTestTypes();
    const mapToId = (val: string) => {
      const found = testTypesList.find(t => t.id === val || t.name === val);
      return found ? found.id : val;
    };
    const mapToName = (val: string) => {
      const found = testTypesList.find(t => t.id === val || t.name === val);
      return found ? found.name : val;
    };

    const allowedArr = Array.isArray(studentData.testType)
      ? studentData.testType
      : (typeof studentData.testType === 'string' && studentData.testType.trim() !== ''
         ? studentData.testType.split(',').map(s => s.trim())
         : ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']);

    const allowedTestsVal = allowedArr.map(mapToId);
    const testTypeVal = allowedArr.map(mapToName).join(', ');

    const newStudent: Student = {
      id: studentData.id,
      name: studentData.name,
      classGroup: studentData.classGroup || studentData.class_name || 'X-1',
      angkatan: typeof studentData.cohort === 'number' ? studentData.cohort : (typeof studentData.angkatan === 'number' ? studentData.angkatan : new Date().getFullYear()),
      class_name: studentData.class_name || studentData.classGroup || 'X-1',
      major: studentData.major || 'Umum',
      cohort: studentData.cohort || studentData.angkatan || new Date().getFullYear(),
      gender: studentData.gender || 'L',
      status: studentData.status || 'BELUM_TES',
      password: studentData.password || '123456',
      testType: testTypeVal,
      allowedTests: studentData.allowedTests ? studentData.allowedTests.map(mapToId) : allowedTestsVal,
      school_origin: studentData.school_origin || studentData.schoolOrigin || '',
      email: studentData.email || '',
      answers: studentData.answers || {},
      scores: studentData.scores || {},
      completedAt: studentData.completedAt || null,
      examStartedAt: studentData.examStartedAt || null,
      examDurationSeconds: studentData.examDurationSeconds || 0,
      violatingCount: studentData.violatingCount || 0,
      cheatLogs: studentData.cheatLogs || [],
      iqScore: studentData.iqScore ?? null,
      eqScore: studentData.eqScore ?? null,
      riasecScores: studentData.riasecScores ?? null,
      dimensionScores: studentData.dimensionScores ?? null,
      lockedOut: studentData.lockedOut ?? false,
      lockReason: studentData.lockReason ?? null,
      testStarted: studentData.testStarted ?? false,
      testCompleted: studentData.testCompleted ?? false,
      testStartedAt: studentData.testStartedAt ?? null,
      testCompletedAt: studentData.testCompletedAt ?? null,
      currentQuestionIndex: studentData.currentQuestionIndex ?? 0,
      cheatWarnings: studentData.cheatWarnings ?? 0,
      aiAnalysis: studentData.aiAnalysis ?? null
    };

    this.store.saveStudent(newStudent, skipSave);
    return true;
  }

  update(id: string, updates: Partial<Student>): boolean | string {
    const existing = this.getById(id);
    if (!existing) {
      return `Siswa dengan ID ${id} tidak ditemukan.`;
    }

    const testTypesList = this.store.getTestTypes();
    const mapToId = (val: string) => {
      const found = testTypesList.find(t => t.id === val || t.name === val);
      return found ? found.id : val;
    };
    const mapToName = (val: string) => {
      const found = testTypesList.find(t => t.id === val || t.name === val);
      return found ? found.name : val;
    };

    // Process testType if it's passed as an array or string
    let testTypeStr = existing.testType;
    let allowedTestsArr = existing.allowedTests;

    if (updates.testType !== undefined) {
      if (Array.isArray(updates.testType)) {
        const allowedArr = updates.testType;
        allowedTestsArr = allowedArr.map(mapToId);
        testTypeStr = allowedArr.map(mapToName).join(', ');
      } else if (typeof updates.testType === 'string') {
        const allowedArr = updates.testType.split(',').map(s => s.trim());
        allowedTestsArr = allowedArr.map(mapToId);
        testTypeStr = allowedArr.map(mapToName).join(', ');
      }
    }

    if (updates.allowedTests !== undefined) {
      allowedTestsArr = updates.allowedTests.map(mapToId);
    }

    const updatedStudent: Student = {
      ...existing,
      ...updates,
      testType: testTypeStr,
      allowedTests: allowedTestsArr,
      id // preserve original ID
    };

    this.store.saveStudent(updatedStudent);
    return true;
  }

  delete(id: string): boolean {
    this.store.deleteStudent(id);
    return true;
  }

  importStudents(students: Partial<Student>[]): { successCount: number; errors: string[] } {
    let successCount = 0;
    const errors: string[] = [];

    students.forEach((s, idx) => {
      const res = this.add(s, true);
      if (typeof res === 'string') {
        errors.push(`Baris ${idx + 1}: ${res}`);
      } else if (res) {
        successCount++;
      }
    });

    if (successCount > 0) {
      this.store.saveToStorage({ full: true });
    }

    return { successCount, errors };
  }
}
