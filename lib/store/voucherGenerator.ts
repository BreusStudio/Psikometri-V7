import { Voucher, Student, Teacher } from '../types';

export function generateVoucherAccounts(
  voucher: Voucher,
  students: Student[],
  teachers: Teacher[]
): {
  updatedVoucher: Voucher;
  updatedStudents: Student[];
  updatedTeachers: Teacher[];
} {
  const defaultTests = ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas'];
  const activeTests = voucher.testTypes && voucher.testTypes.length > 0 ? voucher.testTypes : defaultTests;
  const count = voucher.testCount || 1;
  const newStudents = [...students];
  const newTeachers = [...teachers];

  if (!voucher.generatedAccounts || voucher.generatedAccounts.length === 0 || voucher.generatedAccounts.length !== count) {
    const accounts: { username: string; password: string; redeemed: boolean; redeemedBy?: string; classGroup?: string }[] = [];
    const generateRandomPass = () => Math.random().toString(36).substring(2, 8).toUpperCase();

    if (count === 1) {
      const studentUser = `SISWA_${voucher.code.toUpperCase()}`;
      const studentPass = generateRandomPass();
      accounts.push({
        username: studentUser,
        password: studentPass,
        redeemed: false
      });

      const stIdx = newStudents.findIndex(s => s.id === studentUser);
      const studentData: Student = {
        id: studentUser,
        name: `Peserta Voucher ${voucher.code.toUpperCase()}`,
        classGroup: "Voucher Personal",
        angkatan: new Date().getFullYear(),
        password: studentPass,
        iqScore: null,
        eqScore: null,
        riasecScores: null,
        dimensionScores: null,
        lockedOut: false,
        lockReason: null,
        testStarted: false,
        testCompleted: false,
        testStartedAt: null,
        testCompletedAt: null,
        currentQuestionIndex: 0,
        answers: {},
        cheatWarnings: 0,
        aiAnalysis: null,
        completedTests: [],
        allowedTests: activeTests
      };

      if (stIdx >= 0) {
        newStudents[stIdx] = { ...newStudents[stIdx], password: studentPass, allowedTests: activeTests };
      } else {
        newStudents.push(studentData);
      }
    } else {
      voucher.adminUsername = `ADMIN_${voucher.code.toUpperCase()}`;
      voucher.adminPassword = generateRandomPass();

      const tcIdx = newTeachers.findIndex(t => t.id === voucher.adminUsername);
      const teacherData: Teacher = {
        id: voucher.adminUsername,
        name: `Koordinator BK ${voucher.code.toUpperCase()}`,
        role: "Counselor",
        password: voucher.adminPassword,
        managed_class: `Voucher ${voucher.code.toUpperCase()}`
      };

      if (tcIdx >= 0) {
        newTeachers[tcIdx] = { ...newTeachers[tcIdx], password: voucher.adminPassword };
      } else {
        newTeachers.push(teacherData);
      }

      for (let i = 1; i <= count; i++) {
        const studentUser = `${voucher.code.toUpperCase()}_${String(i).padStart(2, '0')}`;
        const studentPass = generateRandomPass();
        accounts.push({
          username: studentUser,
          password: studentPass,
          redeemed: false
        });

        const stIdx = newStudents.findIndex(s => s.id === studentUser);
        const studentData: Student = {
          id: studentUser,
          name: `Siswa ${voucher.code.toUpperCase()} #${i}`,
          classGroup: `Voucher ${voucher.code.toUpperCase()}`,
          angkatan: new Date().getFullYear(),
          password: studentPass,
          iqScore: null,
          eqScore: null,
          riasecScores: null,
          dimensionScores: null,
          lockedOut: false,
          lockReason: null,
          testStarted: false,
          testCompleted: false,
          testStartedAt: null,
          testCompletedAt: null,
          currentQuestionIndex: 0,
          answers: {},
          cheatWarnings: 0,
          aiAnalysis: null,
          completedTests: [],
          allowedTests: activeTests
        };

        if (stIdx >= 0) {
          newStudents[stIdx] = { ...newStudents[stIdx], password: studentPass, allowedTests: activeTests };
        } else {
          newStudents.push(studentData);
        }
      }
    }
    voucher.generatedAccounts = accounts;
    voucher.testTypes = activeTests;
    voucher.testCount = count;
  } else {
    voucher.testTypes = activeTests;
    voucher.testCount = count;
    if (voucher.generatedAccounts) {
      voucher.generatedAccounts.forEach(acc => {
        const stIdx = newStudents.findIndex(s => s.id === acc.username);
        if (stIdx >= 0) {
          newStudents[stIdx].allowedTests = activeTests;
        }
      });
    }
  }

  // Auto-Repair: Ensure ALL students matching this voucher get allowedTests updated
  const vCodeUpper = voucher.code.toUpperCase();
  newStudents.forEach((student, idx) => {
    const sIdUpper = (student.id || '').toUpperCase();
    const sGroupUpper = (student.classGroup || '').toUpperCase();
    const isMatched = 
      sIdUpper === `SISWA_${vCodeUpper}` ||
      sIdUpper.startsWith(`${vCodeUpper}_`) ||
      sGroupUpper.includes(vCodeUpper) ||
      (voucher.generatedAccounts && voucher.generatedAccounts.some(acc => acc.username.toUpperCase() === sIdUpper));

    if (isMatched) {
      newStudents[idx] = {
        ...newStudents[idx],
        allowedTests: activeTests
      };
    }
  });

  return {
    updatedVoucher: voucher,
    updatedStudents: newStudents,
    updatedTeachers: newTeachers
  };
}
