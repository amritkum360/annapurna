# Annapurna Backend API

Node.js + Express backend service for the Annapurna Food Rescue platform.

## Setup & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy `.env.example` to `.env` if not present:
   ```bash
   cp .env.example .env
   ```

3. **Development mode (with auto-reload using Node 24 native watch):**
   ```bash
   npm run dev
   ```

4. **Production start:**
   ```bash
   npm start
   ```

## Endpoints

- `GET /` — API welcome message
- `GET /api/health` — Health check endpoint
