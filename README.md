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
