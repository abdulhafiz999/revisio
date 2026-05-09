// Mock data for the AI-Assisted Exam Preparation System

export interface Course {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
}

export interface Topic {
  id: string;
  name: string;
  courseId: string;
}

export interface Question {
  id: string;
  courseId: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  commonMistakes: string[];
  hints: string[];
  year?: number;
}

export interface StudentProgress {
  totalAttempted: number;
  correctAnswers: number;
  wrongAnswers: number;
  streakDays: number;
  weakTopics: { topicId: string; score: number }[];
  strongTopics: { topicId: string; score: number }[];
  recentActivity: {
    date: string;
    questionsAttempted: number;
    correctAnswers: number;
  }[];
}

export interface AttemptHistory {
  questionId: string;
  attemptedAt: string;
  studentAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
}

export const courses: Course[] = [
  { id: 'cs101', name: 'Introduction to Computer Science', code: 'CS101', icon: '💻', color: 'primary' },
  { id: 'math201', name: 'Calculus II', code: 'MATH201', icon: '📐', color: 'accent' },
  { id: 'phys101', name: 'Physics I', code: 'PHYS101', icon: '⚛️', color: 'success' },
  { id: 'chem101', name: 'General Chemistry', code: 'CHEM101', icon: '🧪', color: 'warning' },
];

export const topics: Topic[] = [
  // CS101 Topics
  { id: 'cs-algo', name: 'Algorithms', courseId: 'cs101' },
  { id: 'cs-data', name: 'Data Structures', courseId: 'cs101' },
  { id: 'cs-oop', name: 'Object-Oriented Programming', courseId: 'cs101' },
  { id: 'cs-web', name: 'Web Development Basics', courseId: 'cs101' },
  
  // MATH201 Topics
  { id: 'math-int', name: 'Integration Techniques', courseId: 'math201' },
  { id: 'math-seq', name: 'Sequences and Series', courseId: 'math201' },
  { id: 'math-diff', name: 'Differential Equations', courseId: 'math201' },
  
  // PHYS101 Topics
  { id: 'phys-mech', name: 'Mechanics', courseId: 'phys101' },
  { id: 'phys-thermo', name: 'Thermodynamics', courseId: 'phys101' },
  { id: 'phys-waves', name: 'Waves and Optics', courseId: 'phys101' },
  
  // CHEM101 Topics
  { id: 'chem-atom', name: 'Atomic Structure', courseId: 'chem101' },
  { id: 'chem-bond', name: 'Chemical Bonding', courseId: 'chem101' },
  { id: 'chem-react', name: 'Chemical Reactions', courseId: 'chem101' },
];

export const questions: Question[] = [
  // CS101 Questions
  {
    id: 'q1',
    courseId: 'cs101',
    topicId: 'cs-algo',
    difficulty: 'medium',
    type: 'multiple-choice',
    question: 'What is the time complexity of binary search on a sorted array of n elements?',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    correctAnswer: 'O(log n)',
    explanation: 'Binary search works by repeatedly dividing the search interval in half. At each step, we eliminate half of the remaining elements. If we start with n elements, after one comparison we have n/2, then n/4, then n/8, and so on. The number of steps required is log₂(n), giving us O(log n) time complexity.',
    commonMistakes: [
      'Confusing with linear search which is O(n)',
      'Forgetting that the array must be sorted for binary search',
      'Mixing up best case O(1) with average/worst case'
    ],
    hints: [
      'Think about how many elements are eliminated with each comparison',
      'Consider: if you double the array size, how many more comparisons do you need?'
    ],
    year: 2023
  },
  {
    id: 'q2',
    courseId: 'cs101',
    topicId: 'cs-data',
    difficulty: 'easy',
    type: 'multiple-choice',
    question: 'Which data structure follows the LIFO (Last In, First Out) principle?',
    options: ['Queue', 'Stack', 'Array', 'Linked List'],
    correctAnswer: 'Stack',
    explanation: 'A Stack follows the LIFO principle - the last element added is the first one to be removed. Think of it like a stack of plates: you add plates on top and remove from the top. Operations like push() add to the top, and pop() removes from the top.',
    commonMistakes: [
      'Confusing Stack (LIFO) with Queue (FIFO)',
      'Thinking arrays are inherently LIFO or FIFO - they can be used either way'
    ],
    hints: [
      'Think about stacking books - which one do you pick up first?',
      'LIFO = Last In, First Out'
    ],
    year: 2022
  },
  {
    id: 'q3',
    courseId: 'cs101',
    topicId: 'cs-oop',
    difficulty: 'medium',
    type: 'multiple-choice',
    question: 'What is encapsulation in Object-Oriented Programming?',
    options: [
      'Inheriting properties from a parent class',
      'Bundling data and methods that operate on that data within a single unit',
      'Allowing one interface to be used for different data types',
      'Creating multiple instances of a class'
    ],
    correctAnswer: 'Bundling data and methods that operate on that data within a single unit',
    explanation: 'Encapsulation is one of the four fundamental OOP concepts. It refers to bundling data (attributes) and the methods that operate on that data within a single unit (class), and restricting direct access to some of the object\'s components. This helps protect the internal state of an object and provides a controlled interface.',
    commonMistakes: [
      'Confusing encapsulation with inheritance',
      'Thinking encapsulation is only about hiding data',
      'Mixing up encapsulation with polymorphism'
    ],
    hints: [
      'Think of a capsule that contains medicine - everything is bundled together',
      'Consider how a TV remote hides its internal circuitry but exposes buttons'
    ],
    year: 2023
  },
  {
    id: 'q4',
    courseId: 'cs101',
    topicId: 'cs-algo',
    difficulty: 'hard',
    type: 'multiple-choice',
    question: 'Which sorting algorithm has the best average-case time complexity?',
    options: ['Bubble Sort - O(n²)', 'Quick Sort - O(n log n)', 'Selection Sort - O(n²)', 'Insertion Sort - O(n²)'],
    correctAnswer: 'Quick Sort - O(n log n)',
    explanation: 'Quick Sort has an average-case time complexity of O(n log n), which is better than the O(n²) algorithms listed. It uses a divide-and-conquer strategy, picking a pivot and partitioning the array. While its worst case is O(n²), with good pivot selection, it performs excellently on average and is often faster in practice than other O(n log n) algorithms like Merge Sort.',
    commonMistakes: [
      'Not distinguishing between average and worst case complexity',
      'Assuming simpler algorithms are faster',
      'Forgetting that Quick Sort worst case is O(n²)'
    ],
    hints: [
      'Compare the Big O notations - which grows slower as n increases?',
      'O(n log n) < O(n²) for large n'
    ],
    year: 2022
  },
  // MATH201 Questions
  {
    id: 'q5',
    courseId: 'math201',
    topicId: 'math-int',
    difficulty: 'medium',
    type: 'multiple-choice',
    question: 'What is the integral of sin(x) dx?',
    options: ['cos(x) + C', '-cos(x) + C', 'sin(x) + C', '-sin(x) + C'],
    correctAnswer: '-cos(x) + C',
    explanation: 'The integral of sin(x) is -cos(x) + C. This can be verified by differentiating: d/dx[-cos(x)] = sin(x). Remember that integration is the reverse of differentiation, and the derivative of cos(x) is -sin(x), so the integral of sin(x) must be -cos(x).',
    commonMistakes: [
      'Forgetting the negative sign',
      'Confusing the derivative with the integral',
      'Forgetting the constant of integration C'
    ],
    hints: [
      'Differentiate your answer - you should get sin(x)',
      'Recall: d/dx[cos(x)] = -sin(x)'
    ],
    year: 2023
  },
  {
    id: 'q6',
    courseId: 'math201',
    topicId: 'math-seq',
    difficulty: 'hard',
    type: 'multiple-choice',
    question: 'What is the sum of the infinite geometric series: 1 + 1/2 + 1/4 + 1/8 + ...?',
    options: ['1', '2', '∞ (infinite)', '1.5'],
    correctAnswer: '2',
    explanation: 'This is a geometric series with first term a = 1 and common ratio r = 1/2. For a convergent geometric series where |r| < 1, the sum is a/(1-r). Here: S = 1/(1-1/2) = 1/(1/2) = 2. Intuitively, as you keep adding smaller and smaller fractions, you approach but never exceed 2.',
    commonMistakes: [
      'Thinking infinite series must have infinite sums',
      'Forgetting the formula for geometric series sum',
      'Using the wrong formula when |r| ≥ 1'
    ],
    hints: [
      'Use the formula: S = a/(1-r) for geometric series',
      'First identify a (first term) and r (common ratio)'
    ],
    year: 2022
  },
  // PHYS101 Questions
  {
    id: 'q7',
    courseId: 'phys101',
    topicId: 'phys-mech',
    difficulty: 'easy',
    type: 'multiple-choice',
    question: 'According to Newton\'s Second Law, what is the relationship between force, mass, and acceleration?',
    options: ['F = m/a', 'F = ma', 'F = m + a', 'a = Fm'],
    correctAnswer: 'F = ma',
    explanation: 'Newton\'s Second Law states that Force equals mass times acceleration (F = ma). This means the force acting on an object is directly proportional to its acceleration and its mass. Double the mass with the same force, and acceleration halves. Double the force with the same mass, and acceleration doubles.',
    commonMistakes: [
      'Confusing the formula arrangement',
      'Forgetting that F, m, and a must be in consistent units',
      'Not realizing this applies to net force, not individual forces'
    ],
    hints: [
      'Think about pushing a shopping cart - more force = more acceleration',
      'Units: Force (N) = mass (kg) × acceleration (m/s²)'
    ],
    year: 2023
  },
  {
    id: 'q8',
    courseId: 'phys101',
    topicId: 'phys-thermo',
    difficulty: 'medium',
    type: 'multiple-choice',
    question: 'What is the First Law of Thermodynamics essentially stating?',
    options: [
      'Heat always flows from hot to cold',
      'Energy cannot be created or destroyed, only transformed',
      'Entropy always increases in an isolated system',
      'Absolute zero is unattainable'
    ],
    correctAnswer: 'Energy cannot be created or destroyed, only transformed',
    explanation: 'The First Law of Thermodynamics is the law of conservation of energy applied to thermodynamic systems. It states that energy cannot be created or destroyed, only converted from one form to another. The total energy of an isolated system remains constant. Mathematically: ΔU = Q - W (change in internal energy equals heat added minus work done).',
    commonMistakes: [
      'Confusing with the Second Law (entropy)',
      'Confusing with the Third Law (absolute zero)',
      'Forgetting that the First Law is about conservation'
    ],
    hints: [
      'Think "conservation" - what is being conserved?',
      'This is the energy conservation law for thermal systems'
    ],
    year: 2022
  },
  // CHEM101 Questions
  {
    id: 'q9',
    courseId: 'chem101',
    topicId: 'chem-atom',
    difficulty: 'easy',
    type: 'multiple-choice',
    question: 'How many protons does a carbon atom have?',
    options: ['4', '6', '8', '12'],
    correctAnswer: '6',
    explanation: 'Carbon has an atomic number of 6, which means it has 6 protons in its nucleus. The atomic number defines the element - all carbon atoms have exactly 6 protons. The mass number (12 for the most common isotope) is the sum of protons and neutrons.',
    commonMistakes: [
      'Confusing atomic number with mass number',
      'Not knowing that atomic number = number of protons',
      'Mixing up protons with electrons or neutrons'
    ],
    hints: [
      'Look at carbon on the periodic table - what\'s its atomic number?',
      'Atomic number = number of protons'
    ],
    year: 2023
  },
  {
    id: 'q10',
    courseId: 'chem101',
    topicId: 'chem-bond',
    difficulty: 'medium',
    type: 'multiple-choice',
    question: 'What type of bond forms when electrons are shared between atoms?',
    options: ['Ionic bond', 'Covalent bond', 'Hydrogen bond', 'Metallic bond'],
    correctAnswer: 'Covalent bond',
    explanation: 'A covalent bond forms when two atoms share one or more pairs of electrons. This typically occurs between nonmetal atoms with similar electronegativities. Unlike ionic bonds (electron transfer) or metallic bonds (electron sea), covalent bonds involve direct sharing to achieve stable electron configurations.',
    commonMistakes: [
      'Confusing with ionic bonds (electron transfer, not sharing)',
      'Thinking hydrogen bonds are covalent (they\'re intermolecular attractions)',
      'Not distinguishing between polar and nonpolar covalent bonds'
    ],
    hints: [
      'Think "sharing" - covalent means "with shared power"',
      'Ionic = transfer, Covalent = sharing'
    ],
    year: 2023
  }
];

export const studentProgress: StudentProgress = {
  totalAttempted: 45,
  correctAnswers: 32,
  wrongAnswers: 13,
  streakDays: 5,
  weakTopics: [
    { topicId: 'math-seq', score: 40 },
    { topicId: 'cs-algo', score: 55 },
    { topicId: 'phys-thermo', score: 50 }
  ],
  strongTopics: [
    { topicId: 'cs-data', score: 90 },
    { topicId: 'chem-atom', score: 85 },
    { topicId: 'phys-mech', score: 80 }
  ],
  recentActivity: [
    { date: '2024-01-20', questionsAttempted: 8, correctAnswers: 6 },
    { date: '2024-01-19', questionsAttempted: 5, correctAnswers: 4 },
    { date: '2024-01-18', questionsAttempted: 10, correctAnswers: 7 },
    { date: '2024-01-17', questionsAttempted: 6, correctAnswers: 5 },
    { date: '2024-01-16', questionsAttempted: 7, correctAnswers: 5 },
    { date: '2024-01-15', questionsAttempted: 4, correctAnswers: 3 },
    { date: '2024-01-14', questionsAttempted: 5, correctAnswers: 2 }
  ]
};

export const attemptHistory: AttemptHistory[] = [
  { questionId: 'q1', attemptedAt: '2024-01-20T10:30:00Z', studentAnswer: 'O(log n)', isCorrect: true, timeSpent: 45 },
  { questionId: 'q2', attemptedAt: '2024-01-20T10:32:00Z', studentAnswer: 'Stack', isCorrect: true, timeSpent: 20 },
  { questionId: 'q5', attemptedAt: '2024-01-20T10:35:00Z', studentAnswer: 'cos(x) + C', isCorrect: false, timeSpent: 60 },
  { questionId: 'q7', attemptedAt: '2024-01-19T14:20:00Z', studentAnswer: 'F = ma', isCorrect: true, timeSpent: 15 },
  { questionId: 'q9', attemptedAt: '2024-01-19T14:22:00Z', studentAnswer: '6', isCorrect: true, timeSpent: 10 },
];

// Helper functions
export const getTopicById = (topicId: string): Topic | undefined => {
  return topics.find(t => t.id === topicId);
};

export const getCourseById = (courseId: string): Course | undefined => {
  return courses.find(c => c.id === courseId);
};

export const getQuestionsByTopic = (topicId: string): Question[] => {
  return questions.filter(q => q.topicId === topicId);
};

export const getQuestionsByCourse = (courseId: string): Question[] => {
  return questions.filter(q => q.courseId === courseId);
};

export const getTopicsByCourse = (courseId: string): Topic[] => {
  return topics.filter(t => t.courseId === courseId);
};
