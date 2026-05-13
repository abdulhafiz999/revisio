# REVISIO Backend API

Backend API server for the REVISIO AI-Assisted Exam Preparation System.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **AI Services**: Google Gemini API (primary), OpenAI API (fallback)

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key
- OpenAI API key

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the example environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
   - Set up your Supabase project credentials
   - Add your AI service API keys
   - Configure frontend URL for CORS

4. Run database migrations (see Database Setup section)

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the PORT specified in .env).

### Available Scripts

- `npm run dev` - Start development server with hot reload (using tsx)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server (requires build first)
- `npm run lint` - Run ESLint on source files
- `npm test` - Run tests with Vitest

### Health Check

Once the server is running, verify it's working:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 123.456
  }
}
```

## Build

Build the TypeScript code for production:
```bash
npm run build
```

## Production

Start the production server:
```bash
npm start
```

## Database Setup

Database migrations and seed data are located in `src/db/`:
- `migrations/` - SQL scripts to create tables and indexes
- `seeds/` - SQL scripts to populate initial data

Run migrations in order using the Supabase SQL editor or CLI.

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Supabase client setup
│   │   ├── environment.ts # Environment validation
│   │   ├── cors.ts      # CORS configuration
│   │   └── security.ts  # Security headers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route definitions
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # TypeScript types and schemas
│   ├── utils/           # Helper functions
│   ├── db/              # Database scripts
│   │   ├── migrations/  # Schema migrations
│   │   └── seeds/       # Seed data
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── tests/               # Test files
├── .env.example         # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## API Documentation

See `docs/API.md` for complete API documentation.

## Security

- All endpoints use HTTPS in production
- CORS is configured to allow only specified origins
- Security headers are set using Helmet
- Rate limiting is applied to prevent abuse
- Input validation and sanitization on all endpoints
- SQL injection prevention through parameterized queries

## License

MIT
