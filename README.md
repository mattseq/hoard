# Hoard

A simple, self-hostable file hosting and sharing platform with public and private file support, RESTful API, and a web dashboard.

## Tech Stack

- Backend: Express.js
- Frontend: React (with Typescript)
- Database: SQLite
- Reverse Proxy: Caddy
- Containerized Deployment: Docker

## Features

- Public and private file uploads
- RESTful API for file management
- Web dashboard (React frontend)
- Multi-user support with configured admin account
- User authentication (session-based)
- File metadata in SQLite database
- Dockerized deployment (Caddy, backend, frontend)

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js

### 1. Clone the repository

```
git clone https://github.com/mattseq/hoard.git
cd hoard
```

### 2. Configure environment variables

Modify the `.env` file to configure these environment variables:

- SESSION_SECRET_KEY: session key
- USERNAME: admin username
- PASSWORD: admin password
- STORAGE_LOCATION: location for file storage and database

### 3. Build static frontend files

Navigate to the ./frontend/ folder and build static files into ./frontend/dist for Caddy to serve.

```
cd frontend
npm install
npm run build
```

### 4. Build and run with Docker Compose

```
docker-compose up --build
```

- Caddy serves the frontend on port 80
- Backend API runs at port 5000 and is proxied to port 80 by Caddy

### 5. Access the web dashboard

Open your browser to `http://localhost` (or your IP)

## API Endpoints

- `POST /api/login` — Log in (JSON: `{ username, password }`)
- `POST /api/signup` — Sign up (JSON: `{ username, password }`)
- `GET /api/auth` — Check authentication status
- `POST /api/upload` — Upload a file (multipart/form-data)
- `GET /files/public` — List public files (JSON)
- `GET /files/private` — List private files (auth required)
- `GET /files/public/:file` — Download/view public file
- `GET /files/private/:file` — Download/view private file (auth required)
- `DELETE /files/public/:fileId` - Delete public file by ID
- `DELETE /files/private/:fileId` - Delete private file by ID (auth required)

## Security Notes

- Use strong secrets in production
- For HTTPS, set `cookie: { secure: true }` in session config

# License

MIT
