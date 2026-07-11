# YAGNI: Lightweight Multi-Stage Docker Build for Stateless Express Backend
# Using Alpine Linux for minimum attack surface and container size.

# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace configurations to install dependencies globally
COPY package*.json ./

# Copy source code for backend and shared internal packages
COPY packages ./packages
COPY apps/server ./apps/server

# Install dependencies (utilizes npm workspaces)
RUN npm install

# Build the backend server
RUN npm run build --workspace=apps/server

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Run as non-root user for extreme security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy over the entire built monorepo context
COPY --from=builder --chown=appuser:appgroup /app /app

# Expose backend port
EXPOSE 4000

# Strict Environment Variables
ENV NODE_ENV=production
ENV PORT=4000

# Start command mapped directly to the workspace
CMD ["npm", "start", "--workspace=apps/server"]
