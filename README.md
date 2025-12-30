# Hoard

A simple, self-hostable file hosting and sharing platform with public and private file support, RESTful API, and a web dashboard.

## Tech Stack
- Backend: Express.js
- Frontend: React (with Typescript)
- Reverse Proxy: Caddy
- Containerized Deployment: Docker

## Features
- Public and private file uploads
- RESTful API for file management
- Web dashboard (React frontend)
- User authentication (session-based)
- File metadata listing and search
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
Modify the `docker-compose.yml` file to configure these environment variables:
- SESSION_SECRET_KEY
- USERNAME
- PASSWORD

### 3. Configure file storage locations
Modify the `docker-compose.yml` file to configure your file storage locations.
By default:
- Public files: `/mnt/drive/hoard_public`
- Private files: `/mnt/drive/hoard_private`
These are mounted in both the backend and Caddy containers so be sure to modify both instances, replacing `/mnt/drive/` with your desired location.

### 4. Build static frontend files
Navigate to the ./frontend/ folder and build static files into ./frontend/dist for Caddy to serve.
```
cd frontend
npm install
npm run build
```

### 5. Build and run with Docker Compose
```
docker-compose up --build
```
- Caddy serves the frontend on port 80
- Backend API runs at port 5000 and is proxied to port 80 by Caddy

### 4. Access the web dashboard
Open your browser to `http://localhost` (or your IP)

## API Endpoints

- `POST /api/login` — Log in (JSON: `{ username, password }`)
- `GET /api/auth` — Check authentication status
- `POST /api/upload` — Upload a file (multipart/form-data)
- `GET /files/public` — List public files (JSON)
- `GET /files/private` — List private files (auth required)
- `GET /files/public/:file` — Download/view public file
- `GET /files/private/:file` — Download/view private file (auth required)

## File Storage
- Storage location can be configured in `docker-compose.yml`. By default:
    - Public files: `/mnt/drive/hoard_public` (served directly by Caddy)
    - Private files: `/mnt/drive/hoard_private` (served by backend)
- File metadata stored as JSON in the respective storage location

## Security Notes
- Use strong secrets in production
- For HTTPS, set `cookie: { secure: true }` in session config

# License
MIT