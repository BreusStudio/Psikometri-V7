import { Student, Question, Dimension, TestSettings } from '../core/types';
import { calculateStudentScores } from '../store/scoreCalculator';
import { PsychometricStore } from '../store/PsychometricStore';

const DUMMY_FIRST_NAMES = [
  'Budi', 'Siti', 'Ahmad', 'Deni', 'Fitri', 'Rian', 'Mega', 'Bayu', 'Indah', 'Eko',
  'Dewi', 'Rizky', 'Nabila', 'Fauzi', 'Dhani', 'Anisa', 'Fajar', 'Maya', 'Aditya', 'Putri'
];

const DUMMY_LAST_NAMES = [
  'Santoso', 'Aminah', 'Hidayat', 'Pratama', 'Handayani', 'Ardiansyah', 'Utami', 'Setiawan',
  'Permata', 'Prasetyo', 'Lestari', 'Wahyudi', 'Kusuma', 'Saputra', 'Ramadhan', 'Wijaya'
];

const DUMMY_ARCHETYPES = [
  { name: 'Analytical / Tech', iqWeight: 0.8, eqWeight: 0.6, hollandFocus: ['I', 'R'] },
  { name: 'Creative / Artistic', iqWeight: 0.6, eqWeight: 0.7, hollandFocus: ['A', 'S'] },
  { name: 'Social / Service', iqWeight: 0.6, eqWeight: 0.9, hollandFocus: ['S', 'E'] },
  { name: 'Leader / Business', iqWeight: 0.7, eqWeight: 0.8, hollandFocus: ['E', 'C'] },
  { name: 'Organized / Systematic', iqWeight: 0.7, eqWeight: 0.6, hollandFocus: ['C', 'R'] },
];

export function generateDummyCompletedStudents(
  options: {
    count?: number;
    classGroup?: string;
    store: PsychometricStore;
  }
): Student[] {
  const count = options.count || 5;
  const questions: Question[] = options.store.getQuestions();
  const dimensions: Dimension[] = options.store.getDimensions();
  const settings: TestSettings = options.store.getTestSettings();
  const registeredClasses = options.store.getRegisteredClasses();

  const dummyStudents: Student[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const firstName = DUMMY_FIRST_NAMES[Math.floor(Math.random() * DUMMY_FIRST_NAMES.length)];
    const lastName = DUMMY_LAST_NAMES[Math.floor(Math.random() * DUMMY_LAST_NAMES.length)];
    const name = `${firstName} ${lastName} (Dummy)`;

    const idNum = Math.floor(1000 + Math.random() * 9000);
    const id = `DUMMY-${Date.now().toString(36).toUpperCase()}-${idNum}`;

    let selectedClass = options.classGroup;
    if (!selectedClass) {
      if (registeredClasses.length > 0) {
        selectedClass = registeredClasses[i % registeredClasses.length];
      } else {
        selectedClass = 'XII RPL 1';
      }
    }

    const archetype = DUMMY_ARCHETYPES[i % DUMMY_ARCHETYPES.length];

    // Build random answers based on current questions
    const answers: Record<string, string> = {};

    questions.forEach(q => {
      if (!q.choices || q.choices.length === 0) return;

      if (q.testType === 'Holland') {
        // Try to pick choices matching archetype holland focus
        const matchingChoices = q.choices.filter(c => c.hollandType && archetype.hollandFocus.includes(c.hollandType));
        if (matchingChoices.length > 0 && Math.random() < 0.7) {
          const picked = matchingChoices[Math.floor(Math.random() * matchingChoices.length)];
          answers[q.id] = picked.id;
          return;
        }
      } else if (q.testType === 'IQ') {
        // High IQ weight archetype gets higher score choices more often
        const sorted = [...q.choices].sort((a, b) => b.scoreValue - a.scoreValue);
        if (Math.random() < archetype.iqWeight) {
          answers[q.id] = sorted[0].id;
          return;
        }
      } else if (q.testType === 'EQ') {
        const sorted = [...q.choices].sort((a, b) => b.scoreValue - a.scoreValue);
        if (Math.random() < archetype.eqWeight) {
          answers[q.id] = sorted[0].id;
          return;
        }
      }

      // Random choice fallback
      const randomChoice = q.choices[Math.floor(Math.random() * q.choices.length)];
      answers[q.id] = randomChoice.id;
    });

    const startTime = new Date(now.getTime() - (45 + Math.floor(Math.random() * 30)) * 60000);
    const endTime = new Date(startTime.getTime() + (25 + Math.floor(Math.random() * 15)) * 60000);

    const dummyStudent: Student = {
      id,
      name,
      classGroup: selectedClass,
      angkatan: now.getFullYear(),
      educationLevel: 'SMK',
      password: 'dummy123',
      iqScore: null,
      eqScore: null,
      riasecScores: null,
      dimensionScores: null,
      lockedOut: false,
      lockReason: null,
      testStarted: true,
      testCompleted: true,
      testStartedAt: startTime.toISOString(),
      testCompletedAt: endTime.toISOString(),
      currentQuestionIndex: Object.keys(answers).length,
      answers,
      cheatWarnings: 0,
      aiAnalysis: null,
      completedTests: ['IQ', 'EQ', 'Holland'],
      isDummy: true
    };

    // Dynamically calculate actual scores based on active question bank
    calculateStudentScores(dummyStudent, questions, dimensions, settings);

    // Generate AI Summary overview
    const topHollandKeys = dummyStudent.riasecScores
      ? Object.entries(dummyStudent.riasecScores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k]) => k)
          .join('')
      : 'RIA';

    dummyStudent.aiAnalysis = {
      summary: `Siswa menunjukkan profil kecenderungan dominan pada tipe ${topHollandKeys} (${archetype.name}). Memiliki skor IQ terukur ${dummyStudent.iqScore || 105} dan EQ ${dummyStudent.eqScore || 85}.`,
      recommendations: [
        `Sangat direkomendasikan untuk pengembangan jalur karir yang selaras dengan tipe ${topHollandKeys}.`,
        `Perlu mempertahankan konsistensi motivasi belajar dan regulasi diri saat menghadapi ujian.`,
      ],
      generatedAt: endTime.toISOString()
    };

    dummyStudents.push(dummyStudent);
  }

  return dummyStudents;
}
