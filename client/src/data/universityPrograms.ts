/** Common university programs / majors — used for Revi personalization */
export const UNIVERSITY_PROGRAMS = [
  'Computer Science',
  'Medicine',
  'Nursing',
  'Law',
  'Physics',
  'Chemistry',
  'Biology',
  'Mathematics',
  'Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'History',
  'Psychology',
  'Economics',
  'Business Administration',
  'Accounting',
  'Education',
  'Political Science',
  'Sociology',
  'English Literature',
  'Philosophy',
  'Architecture',
  'Pharmacy',
  'Dentistry',
  'Veterinary Medicine',
  'Environmental Science',
  'Communications',
  'Fine Arts',
  'Other',
] as const;

export type UniversityProgram = (typeof UNIVERSITY_PROGRAMS)[number];

export const CUSTOM_PROGRAM_VALUE = 'Other';
