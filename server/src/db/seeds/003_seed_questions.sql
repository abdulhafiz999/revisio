-- Seed data for questions table
-- Description: Populates at least 50 questions across all courses

-- CS101 Questions (Algorithms)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'medium', 'multiple-choice', 
'What is the time complexity of binary search on a sorted array of n elements?',
'["O(n)", "O(log n)", "O(n²)", "O(1)"]',
'O(log n)',
'Binary search works by repeatedly dividing the search interval in half. At each step, we eliminate half of the remaining elements. If we start with n elements, after one comparison we have n/2, then n/4, then n/8, and so on. The number of steps required is log₂(n), giving us O(log n) time complexity.',
'{"Confusing with linear search which is O(n)", "Forgetting that the array must be sorted for binary search", "Mixing up best case O(1) with average/worst case"}',
'{"Think about how many elements are eliminated with each comparison", "Consider: if you double the array size, how many more comparisons do you need?"}',
2023, NOW()),

('q0000001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'hard', 'multiple-choice',
'Which sorting algorithm has the best average-case time complexity?',
'["Bubble Sort - O(n²)", "Quick Sort - O(n log n)", "Selection Sort - O(n²)", "Insertion Sort - O(n²)"]',
'Quick Sort - O(n log n)',
'Quick Sort has an average-case time complexity of O(n log n), which is better than the O(n²) algorithms listed. It uses a divide-and-conquer strategy, picking a pivot and partitioning the array. While its worst case is O(n²), with good pivot selection, it performs excellently on average and is often faster in practice than other O(n log n) algorithms like Merge Sort.',
'{"Not distinguishing between average and worst case complexity", "Assuming simpler algorithms are faster", "Forgetting that Quick Sort worst case is O(n²)"}',
'{"Compare the Big O notations - which grows slower as n increases?", "O(n log n) < O(n²) for large n"}',
2022, NOW()),

('q0000001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'easy', 'multiple-choice',
'What is the time complexity of accessing an element in an array by index?',
'["O(1)", "O(n)", "O(log n)", "O(n²)"]',
'O(1)',
'Array access by index is O(1) constant time because arrays store elements in contiguous memory locations. The address of any element can be calculated directly using: base_address + (index × element_size). No iteration or searching is required.',
'{"Confusing with searching for a value in an array", "Thinking you need to traverse the array"}',
'{"Direct access means you can jump straight to any position", "Think about how you access arr[5] - it is instant"}',
2023, NOW());

-- CS101 Questions (Data Structures)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000002-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'easy', 'multiple-choice',
'Which data structure follows the LIFO (Last In, First Out) principle?',
'["Queue", "Stack", "Array", "Linked List"]',
'Stack',
'A Stack follows the LIFO principle - the last element added is the first one to be removed. Think of it like a stack of plates: you add plates on top and remove from the top. Operations like push() add to the top, and pop() removes from the top.',
'{"Confusing Stack (LIFO) with Queue (FIFO)", "Thinking arrays are inherently LIFO or FIFO - they can be used either way"}',
'{"Think about stacking books - which one do you pick up first?", "LIFO = Last In, First Out"}',
2022, NOW()),

('q0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'medium', 'multiple-choice',
'What is the time complexity of inserting an element at the beginning of a linked list?',
'["O(1)", "O(n)", "O(log n)", "O(n²)"]',
'O(1)',
'Inserting at the beginning of a linked list is O(1) because you only need to: 1) Create a new node, 2) Set its next pointer to the current head, 3) Update the head pointer. No traversal is needed.',
'{"Confusing with inserting at the end which requires traversal", "Thinking you need to shift elements like in an array"}',
'{"You only touch the head pointer", "No need to traverse the list"}',
2023, NOW()),

('q0000002-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'hard', 'multiple-choice',
'What is the space complexity of a recursive function that makes n recursive calls with constant space per call?',
'["O(1)", "O(log n)", "O(n)", "O(n²)"]',
'O(n)',
'Each recursive call adds a new frame to the call stack. If there are n recursive calls, and each uses constant space, the total space complexity is O(n) due to the call stack. This is why deep recursion can cause stack overflow errors.',
'{"Forgetting about the call stack space", "Confusing with iterative solutions", "Only counting explicit variables"}',
'{"Think about the call stack growing with each recursive call", "Each call needs its own stack frame"}',
2022, NOW());

-- CS101 Questions (OOP)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000003-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'medium', 'multiple-choice',
'What is encapsulation in Object-Oriented Programming?',
'["Inheriting properties from a parent class", "Bundling data and methods that operate on that data within a single unit", "Allowing one interface to be used for different data types", "Creating multiple instances of a class"]',
'Bundling data and methods that operate on that data within a single unit',
'Encapsulation is one of the four fundamental OOP concepts. It refers to bundling data (attributes) and the methods that operate on that data within a single unit (class), and restricting direct access to some of the object''s components. This helps protect the internal state of an object and provides a controlled interface.',
'{"Confusing encapsulation with inheritance", "Thinking encapsulation is only about hiding data", "Mixing up encapsulation with polymorphism"}',
'{"Think of a capsule that contains medicine - everything is bundled together", "Consider how a TV remote hides its internal circuitry but exposes buttons"}',
2023, NOW()),

('q0000003-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'easy', 'multiple-choice',
'What is inheritance in OOP?',
'["A mechanism to create new classes from existing classes", "Hiding implementation details", "Multiple objects sharing the same interface", "Creating instances of a class"]',
'A mechanism to create new classes from existing classes',
'Inheritance allows a class (child/derived class) to inherit properties and methods from another class (parent/base class). This promotes code reuse and establishes a hierarchical relationship between classes.',
'{"Confusing with composition", "Thinking inheritance is the same as instantiation"}',
'{"Think parent-child relationship", "Child class gets features from parent class"}',
2023, NOW()),

('q0000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'hard', 'multiple-choice',
'What is polymorphism in OOP?',
'["Using the same interface for different data types", "Creating multiple instances of a class", "Hiding data from external access", "Inheriting from multiple parent classes"]',
'Using the same interface for different data types',
'Polymorphism allows objects of different classes to be treated through the same interface. It enables a single function or method to work with different types. There are two types: compile-time (method overloading) and runtime (method overriding).',
'{"Confusing with inheritance", "Thinking it only means method overriding", "Not understanding the interface concept"}',
'{"Poly = many, morph = forms", "Same method name, different behaviors"}',
2022, NOW());

-- CS101 Questions (Web Development)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000004-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', 'easy', 'multiple-choice',
'What does HTML stand for?',
'["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"]',
'Hyper Text Markup Language',
'HTML stands for Hyper Text Markup Language. It is the standard markup language for creating web pages and web applications. HTML describes the structure of a web page semantically.',
'{"Confusing with HTTP", "Mixing up the words"}',
'{"Think about marking up text with hyperlinks", "It is about structure, not programming"}',
2023, NOW()),

('q0000004-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', 'medium', 'multiple-choice',
'What is the purpose of CSS?',
'["To structure web content", "To style and layout web pages", "To add interactivity to web pages", "To manage databases"]',
'To style and layout web pages',
'CSS (Cascading Style Sheets) is used to style and layout web pages. It controls colors, fonts, spacing, positioning, and responsive design. CSS separates presentation from content (HTML).',
'{"Confusing CSS with JavaScript for interactivity", "Thinking CSS can structure content"}',
'{"CSS = styling and appearance", "Think colors, fonts, layouts"}',
2023, NOW()),

('q0000004-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', 'medium', 'multiple-choice',
'What is the DOM in web development?',
'["Document Object Model - a programming interface for HTML documents", "Data Object Management system", "Direct Output Method", "Database Operation Module"]',
'Document Object Model - a programming interface for HTML documents',
'The DOM (Document Object Model) is a programming interface that represents HTML/XML documents as a tree structure. It allows programs to dynamically access and update document content, structure, and style. JavaScript uses the DOM to manipulate web pages.',
'{"Confusing with the actual HTML file", "Thinking it is a database"}',
'{"Think of it as a tree of objects representing the page", "JavaScript uses DOM to change pages dynamically"}',
2022, NOW());

-- MATH201 Questions (Integration)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000005-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'medium', 'multiple-choice',
'What is the integral of sin(x) dx?',
'["cos(x) + C", "-cos(x) + C", "sin(x) + C", "-sin(x) + C"]',
'-cos(x) + C',
'The integral of sin(x) is -cos(x) + C. This can be verified by differentiating: d/dx[-cos(x)] = sin(x). Remember that integration is the reverse of differentiation, and the derivative of cos(x) is -sin(x), so the integral of sin(x) must be -cos(x).',
'{"Forgetting the negative sign", "Confusing the derivative with the integral", "Forgetting the constant of integration C"}',
'{"Differentiate your answer - you should get sin(x)", "Recall: d/dx[cos(x)] = -sin(x)"}',
2023, NOW()),

('q0000005-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'easy', 'multiple-choice',
'What is the integral of x dx?',
'["x² + C", "x²/2 + C", "2x + C", "x/2 + C"]',
'x²/2 + C',
'Using the power rule for integration: ∫x^n dx = x^(n+1)/(n+1) + C. For x (which is x^1), we get x^2/2 + C. Verify: d/dx[x²/2] = 2x/2 = x.',
'{"Forgetting to divide by the new exponent", "Confusing with the derivative power rule"}',
'{"Power rule: increase exponent by 1, then divide", "Check by differentiating your answer"}',
2023, NOW()),

('q0000005-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'hard', 'multiple-choice',
'What integration technique is best for ∫x·e^x dx?',
'["Substitution", "Integration by parts", "Partial fractions", "Direct integration"]',
'Integration by parts',
'Integration by parts is the best technique for ∫x·e^x dx. Using the formula ∫u dv = uv - ∫v du, let u = x and dv = e^x dx. Then du = dx and v = e^x. Result: x·e^x - ∫e^x dx = x·e^x - e^x + C = e^x(x-1) + C.',
'{"Trying substitution which does not work here", "Forgetting the formula for integration by parts"}',
'{"Product of two different types of functions suggests parts", "Remember: ∫u dv = uv - ∫v du"}',
2022, NOW());

-- MATH201 Questions (Sequences and Series)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000006-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'hard', 'multiple-choice',
'What is the sum of the infinite geometric series: 1 + 1/2 + 1/4 + 1/8 + ...?',
'["1", "2", "∞ (infinite)", "1.5"]',
'2',
'This is a geometric series with first term a = 1 and common ratio r = 1/2. For a convergent geometric series where |r| < 1, the sum is a/(1-r). Here: S = 1/(1-1/2) = 1/(1/2) = 2. Intuitively, as you keep adding smaller and smaller fractions, you approach but never exceed 2.',
'{"Thinking infinite series must have infinite sums", "Forgetting the formula for geometric series sum", "Using the wrong formula when |r| ≥ 1"}',
'{"Use the formula: S = a/(1-r) for geometric series", "First identify a (first term) and r (common ratio)"}',
2022, NOW()),

('q0000006-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'medium', 'multiple-choice',
'What is the nth term of an arithmetic sequence with first term a and common difference d?',
'["a + nd", "a + (n-1)d", "a + d^n", "nd"]',
'a + (n-1)d',
'In an arithmetic sequence, each term increases by a constant difference d. The nth term formula is: a_n = a + (n-1)d. We use (n-1) because the first term (n=1) is just a, the second term (n=2) is a+d, and so on.',
'{"Using n instead of (n-1)", "Confusing with geometric sequences"}',
'{"First term has zero differences added", "Count how many times you add d to reach the nth term"}',
2023, NOW()),

('q0000006-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'easy', 'multiple-choice',
'What is a sequence?',
'["An ordered list of numbers", "A sum of numbers", "A function", "A set of numbers"]',
'An ordered list of numbers',
'A sequence is an ordered list of numbers following a specific pattern or rule. Each number in the sequence is called a term. The order matters - {1,2,3} is different from {3,2,1}.',
'{"Confusing sequence with series (which is a sum)", "Thinking order does not matter"}',
'{"Think of a sequence as a list in order", "Series = sum, Sequence = list"}',
2023, NOW());

-- MATH201 Questions (Differential Equations)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000007-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'medium', 'multiple-choice',
'What is a differential equation?',
'["An equation involving derivatives", "An equation with differences", "An equation with integrals only", "An algebraic equation"]',
'An equation involving derivatives',
'A differential equation is an equation that relates a function with its derivatives. It describes how a quantity changes with respect to another. For example: dy/dx = 2x is a simple differential equation.',
'{"Confusing with difference equations", "Thinking it only involves integrals"}',
'{"Differential = involving derivatives", "It shows rates of change"}',
2023, NOW()),

('q0000007-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'hard', 'multiple-choice',
'What is the order of the differential equation: d²y/dx² + 3dy/dx + 2y = 0?',
'["First order", "Second order", "Third order", "Zero order"]',
'Second order',
'The order of a differential equation is determined by the highest derivative present. Here, d²y/dx² is the second derivative, making this a second-order differential equation.',
'{"Counting the number of terms instead of highest derivative", "Confusing order with degree"}',
'{"Look for the highest derivative", "d²y/dx² means second derivative"}',
2022, NOW()),

('q0000007-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'easy', 'multiple-choice',
'What is the solution to dy/dx = 0?',
'["y = C (constant)", "y = x", "y = 0", "No solution"]',
'y = C (constant)',
'If dy/dx = 0, it means the derivative is zero, so y does not change with x. Therefore, y must be a constant. The general solution is y = C, where C is any constant.',
'{"Thinking y must be zero", "Forgetting the constant of integration"}',
'{"Zero derivative means no change", "Constant functions have zero derivative"}',
2023, NOW());

-- PHYS101 Questions (Mechanics)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000008-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'easy', 'multiple-choice',
'According to Newton''s Second Law, what is the relationship between force, mass, and acceleration?',
'["F = m/a", "F = ma", "F = m + a", "a = Fm"]',
'F = ma',
'Newton''s Second Law states that Force equals mass times acceleration (F = ma). This means the force acting on an object is directly proportional to its acceleration and its mass. Double the mass with the same force, and acceleration halves. Double the force with the same mass, and acceleration doubles.',
'{"Confusing the formula arrangement", "Forgetting that F, m, and a must be in consistent units", "Not realizing this applies to net force, not individual forces"}',
'{"Think about pushing a shopping cart - more force = more acceleration", "Units: Force (N) = mass (kg) × acceleration (m/s²)"}',
2023, NOW()),

('q0000008-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'medium', 'multiple-choice',
'What is Newton''s First Law of Motion?',
'["F = ma", "An object at rest stays at rest unless acted upon by a force", "For every action there is an equal and opposite reaction", "Energy is conserved"]',
'An object at rest stays at rest unless acted upon by a force',
'Newton''s First Law (Law of Inertia) states that an object at rest stays at rest, and an object in motion stays in motion with constant velocity, unless acted upon by a net external force. This describes inertia - the tendency of objects to resist changes in their state of motion.',
'{"Confusing with the Second Law (F=ma)", "Confusing with the Third Law (action-reaction)"}',
'{"Think about inertia and resistance to change", "Objects want to keep doing what they are doing"}',
2023, NOW()),

('q0000008-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'hard', 'multiple-choice',
'What is the kinetic energy of a 2 kg object moving at 3 m/s?',
'["6 J", "9 J", "12 J", "18 J"]',
'9 J',
'Kinetic energy is given by KE = (1/2)mv². For m = 2 kg and v = 3 m/s: KE = (1/2)(2)(3²) = (1/2)(2)(9) = 9 J. The unit is Joules (J).',
'{"Forgetting to square the velocity", "Forgetting the 1/2 factor", "Using wrong units"}',
'{"Formula: KE = (1/2)mv²", "Square the velocity first, then multiply"}',
2022, NOW());

-- PHYS101 Questions (Thermodynamics)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000009-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'medium', 'multiple-choice',
'What is the First Law of Thermodynamics essentially stating?',
'["Heat always flows from hot to cold", "Energy cannot be created or destroyed, only transformed", "Entropy always increases in an isolated system", "Absolute zero is unattainable"]',
'Energy cannot be created or destroyed, only transformed',
'The First Law of Thermodynamics is the law of conservation of energy applied to thermodynamic systems. It states that energy cannot be created or destroyed, only converted from one form to another. The total energy of an isolated system remains constant. Mathematically: ΔU = Q - W (change in internal energy equals heat added minus work done).',
'{"Confusing with the Second Law (entropy)", "Confusing with the Third Law (absolute zero)", "Forgetting that the First Law is about conservation"}',
'{"Think conservation - what is being conserved?", "This is the energy conservation law for thermal systems"}',
2022, NOW()),

('q0000009-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'easy', 'multiple-choice',
'What is temperature a measure of?',
'["Total energy", "Average kinetic energy of particles", "Potential energy", "Work done"]',
'Average kinetic energy of particles',
'Temperature is a measure of the average kinetic energy of the particles in a substance. Higher temperature means particles are moving faster on average. This is why heating something makes its particles move more vigorously.',
'{"Confusing with total energy", "Thinking it measures potential energy"}',
'{"Think about particle motion", "Hot = fast moving particles"}',
2023, NOW()),

('q0000009-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'hard', 'multiple-choice',
'What does the Second Law of Thermodynamics state?',
'["Energy is conserved", "Entropy of an isolated system always increases", "Heat flows from cold to hot", "Work equals force times distance"]',
'Entropy of an isolated system always increases',
'The Second Law of Thermodynamics states that the entropy (disorder) of an isolated system always increases over time. This means natural processes tend to move toward greater disorder. It also implies that heat naturally flows from hot to cold, not the reverse.',
'{"Confusing with the First Law (energy conservation)", "Thinking entropy can decrease in isolated systems"}',
'{"Think about disorder increasing", "Things naturally become more disordered over time"}',
2022, NOW());

-- PHYS101 Questions (Waves and Optics)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000010-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'easy', 'multiple-choice',
'What is the speed of light in vacuum?',
'["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"]',
'3 × 10⁸ m/s',
'The speed of light in vacuum is approximately 3 × 10⁸ m/s (or 300,000 km/s). This is a fundamental constant of nature, denoted by c. Nothing can travel faster than light in vacuum.',
'{"Confusing the exponent", "Mixing up with speed of sound"}',
'{"Remember: c = 3 × 10⁸ m/s", "About 300 million meters per second"}',
2023, NOW()),

('q0000010-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'medium', 'multiple-choice',
'What is the relationship between wavelength (λ), frequency (f), and wave speed (v)?',
'["v = λ/f", "v = λf", "v = λ + f", "v = f/λ"]',
'v = λf',
'The wave equation states that wave speed equals wavelength times frequency: v = λf. This means if you know any two of these quantities, you can calculate the third. For example, light has constant speed c, so higher frequency means shorter wavelength.',
'{"Confusing the formula arrangement", "Forgetting the relationship"}',
'{"Speed = wavelength × frequency", "Think: how many wavelengths pass per second"}',
2023, NOW()),

('q0000010-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'hard', 'multiple-choice',
'What phenomenon explains why a straw appears bent in a glass of water?',
'["Reflection", "Refraction", "Diffraction", "Interference"]',
'Refraction',
'Refraction is the bending of light as it passes from one medium to another (air to water). Light travels at different speeds in different media, causing it to change direction at the boundary. This makes the straw appear bent at the water surface.',
'{"Confusing with reflection (bouncing back)", "Confusing with diffraction (bending around obstacles)"}',
'{"Think about light changing speed in different media", "Refraction = bending when entering new medium"}',
2022, NOW());

-- CHEM101 Questions (Atomic Structure)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000011-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'd1111111-1111-1111-1111-111111111111', 'easy', 'multiple-choice',
'How many protons does a carbon atom have?',
'["4", "6", "8", "12"]',
'6',
'Carbon has an atomic number of 6, which means it has 6 protons in its nucleus. The atomic number defines the element - all carbon atoms have exactly 6 protons. The mass number (12 for the most common isotope) is the sum of protons and neutrons.',
'{"Confusing atomic number with mass number", "Not knowing that atomic number = number of protons", "Mixing up protons with electrons or neutrons"}',
'{"Look at carbon on the periodic table - what is its atomic number?", "Atomic number = number of protons"}',
2023, NOW()),

('q0000011-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'd1111111-1111-1111-1111-111111111111', 'medium', 'multiple-choice',
'What are isotopes?',
'["Atoms with the same number of protons but different numbers of neutrons", "Atoms with the same number of electrons", "Atoms with different numbers of protons", "Atoms with the same mass"]',
'Atoms with the same number of protons but different numbers of neutrons',
'Isotopes are atoms of the same element (same number of protons) but with different numbers of neutrons. For example, Carbon-12 and Carbon-14 are both carbon (6 protons) but have 6 and 8 neutrons respectively.',
'{"Confusing with ions (different electrons)", "Thinking different protons means isotopes"}',
'{"Same element = same protons", "Different mass = different neutrons"}',
2023, NOW()),

('q0000011-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 'd1111111-1111-1111-1111-111111111111', 'hard', 'multiple-choice',
'What is the electron configuration of oxygen (atomic number 8)?',
'["1s² 2s² 2p⁴", "1s² 2s² 2p⁶", "1s² 2s⁴ 2p²", "1s² 2p⁶"]',
'1s² 2s² 2p⁴',
'Oxygen has 8 electrons. Following the Aufbau principle: 2 electrons fill the 1s orbital, 2 fill the 2s orbital, and the remaining 4 go into the 2p orbitals. This gives 1s² 2s² 2p⁴.',
'{"Forgetting the order of orbital filling", "Miscounting electrons", "Confusing with other elements"}',
'{"Fill orbitals in order: 1s, 2s, 2p", "Count: 2 + 2 + 4 = 8 electrons"}',
2022, NOW());

-- CHEM101 Questions (Chemical Bonding)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000012-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222', 'medium', 'multiple-choice',
'What type of bond forms when electrons are shared between atoms?',
'["Ionic bond", "Covalent bond", "Hydrogen bond", "Metallic bond"]',
'Covalent bond',
'A covalent bond forms when two atoms share one or more pairs of electrons. This typically occurs between nonmetal atoms with similar electronegativities. Unlike ionic bonds (electron transfer) or metallic bonds (electron sea), covalent bonds involve direct sharing to achieve stable electron configurations.',
'{"Confusing with ionic bonds (electron transfer, not sharing)", "Thinking hydrogen bonds are covalent (they are intermolecular attractions)", "Not distinguishing between polar and nonpolar covalent bonds"}',
'{"Think sharing - covalent means with shared power", "Ionic = transfer, Covalent = sharing"}',
2023, NOW()),

('q0000012-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222', 'easy', 'multiple-choice',
'What type of bond forms between a metal and a nonmetal?',
'["Covalent bond", "Ionic bond", "Metallic bond", "Hydrogen bond"]',
'Ionic bond',
'Ionic bonds typically form between metals and nonmetals. The metal loses electrons (becomes a cation) and the nonmetal gains electrons (becomes an anion). The opposite charges attract, forming an ionic bond. Example: Na⁺ and Cl⁻ in table salt (NaCl).',
'{"Confusing with covalent bonds", "Thinking all bonds involve sharing"}',
'{"Metal + Nonmetal = Ionic", "Think electron transfer, not sharing"}',
2023, NOW()),

('q0000012-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222', 'hard', 'multiple-choice',
'What is electronegativity?',
'["The ability of an atom to attract electrons in a bond", "The number of electrons in an atom", "The charge of an atom", "The size of an atom"]',
'The ability of an atom to attract electrons in a bond',
'Electronegativity is a measure of an atom''s ability to attract electrons toward itself in a chemical bond. Fluorine is the most electronegative element. Electronegativity differences determine bond polarity: large differences create ionic bonds, small differences create covalent bonds.',
'{"Confusing with electron affinity", "Thinking it is the same as charge"}',
'{"Think attraction power for electrons", "Fluorine is most electronegative"}',
2022, NOW());

-- CHEM101 Questions (Chemical Reactions)
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000013-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333', 'easy', 'multiple-choice',
'What is a chemical reaction?',
'["A physical change in state", "A process that transforms substances into new substances", "Mixing two substances", "Dissolving a solid in water"]',
'A process that transforms substances into new substances',
'A chemical reaction is a process where reactants are transformed into products with different chemical properties. Chemical bonds are broken and new bonds are formed. This is different from physical changes where the substance remains the same.',
'{"Confusing with physical changes", "Thinking mixing is always a reaction"}',
'{"Chemical reaction = new substances formed", "Bonds break and form"}',
2023, NOW()),

('q0000013-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333', 'medium', 'multiple-choice',
'What does the Law of Conservation of Mass state?',
'["Mass is always increasing", "Mass cannot be created or destroyed in a chemical reaction", "Mass equals energy", "Mass is always conserved in nuclear reactions"]',
'Mass cannot be created or destroyed in a chemical reaction',
'The Law of Conservation of Mass states that in a chemical reaction, the total mass of reactants equals the total mass of products. Atoms are rearranged but not created or destroyed. This is why chemical equations must be balanced.',
'{"Confusing with energy conservation", "Forgetting this applies to chemical (not nuclear) reactions"}',
'{"Same atoms before and after", "Total mass stays constant"}',
2023, NOW()),

('q0000013-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333', 'hard', 'multiple-choice',
'What is an exothermic reaction?',
'["A reaction that absorbs heat", "A reaction that releases heat", "A reaction that requires light", "A reaction that produces gas"]',
'A reaction that releases heat',
'An exothermic reaction releases energy in the form of heat to the surroundings. The products have lower energy than the reactants. Examples include combustion, neutralization, and many oxidation reactions. The surroundings get warmer.',
'{"Confusing with endothermic (absorbs heat)", "Thinking all reactions release heat"}',
'{"Exo = exit, heat exits the system", "Products have less energy than reactants"}',
2022, NOW()),

('q0000013-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333', 'medium', 'multiple-choice',
'What is a catalyst?',
'["A substance that is consumed in a reaction", "A substance that speeds up a reaction without being consumed", "A substance that slows down a reaction", "A product of a reaction"]',
'A substance that speeds up a reaction without being consumed',
'A catalyst is a substance that increases the rate of a chemical reaction without being permanently consumed. It lowers the activation energy needed for the reaction. Catalysts are not reactants or products - they are recovered unchanged at the end.',
'{"Thinking catalysts are consumed", "Confusing with reactants"}',
'{"Catalyst speeds up but is not used up", "Lowers activation energy"}',
2023, NOW());

-- Additional questions to reach 50+ total
INSERT INTO questions (id, course_id, topic_id, difficulty, type, question_text, options, correct_answer, explanation, common_mistakes, hints, year, created_at) VALUES
('q0000014-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'easy', 'multiple-choice',
'What is an algorithm?',
'["A programming language", "A step-by-step procedure to solve a problem", "A data structure", "A computer program"]',
'A step-by-step procedure to solve a problem',
'An algorithm is a finite sequence of well-defined instructions to solve a problem or perform a computation. Algorithms are independent of programming languages and can be expressed in pseudocode, flowcharts, or natural language.',
'{"Confusing with programs or code", "Thinking it must be in a specific language"}',
'{"Think recipe or instructions", "Language-independent solution method"}',
2023, NOW()),

('q0000014-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'medium', 'multiple-choice',
'What is the main advantage of a linked list over an array?',
'["Faster access by index", "Dynamic size", "Less memory usage", "Better cache performance"]',
'Dynamic size',
'The main advantage of a linked list is its dynamic size - it can grow or shrink easily without reallocation. Arrays have fixed size (or require expensive resizing). Linked lists excel at insertions and deletions, especially at the beginning.',
'{"Thinking linked lists are faster for all operations", "Forgetting arrays have O(1) index access"}',
'{"Linked lists grow easily", "No need to resize like arrays"}',
2022, NOW());
