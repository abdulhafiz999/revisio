# REVISIO 🚀
### AI-Assisted Exam Preparation & Study Support System

REVISIO is an advanced, AI-powered learning and exam preparation system. It helps students and educators create study materials, generate active-recall quizzes, analyze learning progress, and manage study resources with generative AI.

---

## 🗺️ Project Overview

REVISIO is structured as a monorepo consisting of two main sub-projects:
1. **Frontend (`/client`)**: A highly responsive, interactive Single Page Application (SPA) built using React, Vite, Tailwind CSS, and shadcn/ui.
2. **Backend (`/server`)**: A robust REST API built with Node.js, Express, and TypeScript, utilizing Supabase (PostgreSQL) for storage/database and the Google Gemini API for core AI operations.

---

## ⚡ Key Features

- 📝 **AI Study Note Generator**: Automatically parse learning documents (PDFs) or raw text to generate formatted study notes with summarized concepts.
- 🧠 **Active Recall Quizzes**: Instantly compile custom quizzes (multiple-choice, true/false, fill-in-the-blank) from your notes and documents using generative AI.
- 📊 **Progress & Analytics**: Visual charts showing quiz scores, study trends, attempt histories, and performance breakdown by topic.
- 📂 **Resource & PDF Parsing**: Easy document upload with server-side PDF parsing using `pdf-parse` and file storage integrated with Cloudinary/Supabase.
- 🔗 **Collaborative Sharing**: Instantly share generated notes and study decks via unique links.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework**: React 18 & Vite (fast building and hot reloading)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & CSS variables (with animations via `tailwindcss-animate`)
- **Component Library**: shadcn/ui (Radix Primitives)
- **State Management & Fetching**: React Query (TanStack Query) & Axios
- **Charts/Visuals**: Recharts (for analytics dashboard)
- **Routing**: React Router DOM (v6)

### Backend (`/server`)
- **Runtime & Language**: Node.js, TypeScript, and `tsx` (for fast development execution)
- **Web Framework**: Express.js
- **Database & Auth**: Supabase (PostgreSQL database client & Supabase Auth)
- **AI Services**: Google Gemini API (Primary model: `gemini-2.5-flash`), with OpenAI API configured as a fallback
- **File Upload & Storage**: Multer & Cloudinary
- **Parser**: `pdf-parse` (extract text from uploaded PDFs)
- **Security & Utilities**: Helmet, CORS, Express Rate Limit, and Zod (schema/input validation)
- **Testing**: Vitest

---

## 📁 Repository Structure

```text
revisio/
├── client/                 # Frontend SPA React Application
│   ├── src/
│   │   ├── components/     # Reusable UI elements (shadcn/ui & custom)
│   │   ├── context/        # React context (Auth, Theme, etc.)
│   │   ├── data/           # Mock data or static constants
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions (api client, tailwind merge)
│   │   ├── pages/          # Page views (Dashboard, Practice, Analytics, etc.)
│   │   ├── services/       # Frontend service layers (API calls)
│   │   └── App.tsx         # Root component with routing
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Backend Node.js / Express API
│   ├── src/
│   │   ├── config/         # Server configuration (DB, CORS, environment validation)
│   │   ├── controllers/    # Route handler controllers (handling HTTP requests)
│   │   ├── db/             # Database migrations and seed scripts
│   │   ├── middleware/     # Custom Express middlewares (Auth, rate limiters)
│   │   ├── models/         # TypeScript definitions and database schemas
│   │   ├── routes/         # Express API endpoints
│   │   ├── services/       # Core business logic & AI provider clients (Gemini, OpenAI)
│   │   └── utils/          # Helper utilities (PDF parsing, file handling)
│   ├── package.json
│   └── tsconfig.json
├── docs/                   # Additional documentation & system chapters
└── README.md               # Main repository documentation (this file)
```

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (Version 18+ recommended)
- `npm` (packaged with Node.js) or `bun`
- A [Supabase](https://supabase.com/) account and project
- A [Google Gemini API Key](https://aistudio.google.com/apikey)
- A [Cloudinary](https://cloudinary.com/) account (for storing uploaded media assets)

---

### 🔧 Configuration

#### 1. Backend Configuration
Navigate to the `/server` directory, copy the example environment file, and fill in your credentials:
```bash
cd server
cp .env.example .env
```
Open `.env` and fill in the following parameters:
- `PORT`: Port on which the backend server will run (default: `3000`).
- `FRONTEND_URL`: URL of your frontend application (default: `http://localhost:5173`).
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Found in your Supabase Project Settings > API.
- `SUPABASE_SERVICE_KEY`: Keep secret; used for bypass security checks on administrative tasks.
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, & `CLOUDINARY_API_SECRET`: Found in your Cloudinary Dashboard under Account Details.

#### 2. Frontend Configuration
Navigate to the `/client` directory and set up the environment variables:
```bash
cd ../client
cp .env.example .env
```
Open `.env` and configure:
- `VITE_API_BASE_URL`: The URL where the backend is hosted (default: `http://localhost:3000`).

---

### 💻 Installation & Local Development

You will need two terminal tabs/windows to run both the frontend and backend simultaneously.

#### Tab 1: Start the Backend API
```bash
cd server
npm install
npm run dev
```
The backend server starts on `http://localhost:3000`. You can test its health by checking `http://localhost:3000/health`.

#### Tab 2: Start the Frontend Client
```bash
cd client
npm install
npm run dev
```
The React development server runs on `http://localhost:5173` (or the first available port).

---

## 🧪 Running Tests

Both frontend and backend are configured to run unit and integration tests using **Vitest**.

### Backend Tests
```bash
cd server
npm run test
```

### Frontend Tests
```bash
cd client
npm run test
```

---

## 📦 Building for Production

### Build the Backend
```bash
cd server
npm run build
npm start
```
This builds the TypeScript code to Javascript in the `/dist` directory and boots up the production Node.js process.

### Build the Frontend
```bash
cd client
npm run build
```
This compiles assets into a highly optimized, static bundle in the `/dist` folder, ready to be served by static hosts like Vercel or Netlify.

---

## 🛡️ License

This project is licensed under the MIT License.


