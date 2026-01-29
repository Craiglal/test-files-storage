<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="90" alt="Logo" />
  <br/>
  <b>File Storage</b>
</p>

Cloud-ready file storage service with a NestJS API, React client, Google OAuth, JWT auth, Postgres, and S3-compatible object storage.

## Stack
- Backend: NestJS 11, TypeORM, PostgreSQL, JWT, Google OAuth
- Frontend: React 19 (Vite), Sass, Zustand, React Toastify
- Storage: S3-compatible (AWS S3 by default)
- Infrastructure: Docker, docker-compose, nginx

## Quick start (Docker)
```bash
cp .env.example .env    # create env file (see variables below)
docker-compose up --build
```
Services start on http://localhost
OpenAPI documentation on http://localhost/api/docs

## Local development (without Docker)
Backend
```bash
npm install
npm run start:dev
```
Frontend
```bash
cd client
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Environment
Configure these variables (use SSM/Secrets Manager in AWS):

Backend
- PORT (default 3000)
- POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
- JWT_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
- S3_REGION, S3_BUCKET, S3_ENDPOINT (optional for non-AWS), S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY

Frontend
- VITE_API_BASE_URL (e.g., https://your-domain/api)

## Build artifacts
Backend
```bash
npm run build
node dist/main.js
```
Frontend
```bash
cd client
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```