# Aster

Aster is an AI-powered CSV ingestion engine. It is designed to automatically detect dataset structures, normalize data, and map arbitrary spreadsheet columns into a validated CRM-ready format.

The project uses a monorepo architecture:
- **`apps/web`**: Next.js frontend handling the user interface and file upload logic.
- **`apps/server`**: Node.js/Express stateless backend responsible for dataset parsing, schema intelligence, and validation.

## Prerequisites

- Node.js (v18+)
- npm

## Setup

Install all dependencies from the root directory (this handles both the web and server workspaces):

```bash
npm install
```

## Running Locally

The repository uses npm workspaces. You can run the frontend and backend independently or concurrently.

To start both the frontend and backend simultaneously:
```bash
npm run dev
```

### Running Independently

To start only the frontend (Next.js):
```bash
npm run dev:web
```

To start only the backend (Express):
```bash
npm run dev:server
```

The web application will be available at `http://localhost:3000` and the backend API will run on `http://localhost:4000`.

## Environment Variables

The backend requires a `.env` file in `apps/server/`. It uses a native zero-dependency loader.

```env
# apps/server/.env
GROQ_API_KEY=your_api_key_here
```

## Deployment

### Backend (Render)

A multi-stage `Dockerfile` is provided in the root directory for deploying the stateless Express backend.

```bash
docker build -t aster-backend .
docker run -p 4000:4000 -e GROQ_API_KEY="your_api_key_here" aster-backend
```

### Frontend (Vercel)

The Next.js frontend (`apps/web`) can be deployed directly to Vercel. 
Configure the proxy environment variable or modify `next.config.mjs` rewrites in production to point `/api/` traffic to the deployed backend URL.

## Assignment Submission Details

- **Hosted application URL:** https://aster-eta.vercel.app
- **GitHub repository URL:** https://github.com/shiv669/Aster
- **Position you are applying for:** Software Developer Intern
