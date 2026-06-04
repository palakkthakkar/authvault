# AuthVault

![Java 26](https://img.shields.io/badge/Java-26-blue?logo=java)
![Spring Boot Snapshot](https://img.shields.io/badge/Spring%20Boot-4.1.0--SNAPSHOT-brightgreen?logo=springboot)
![React 19](https://img.shields.io/badge/React-19.2.6-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-runtime-blue?logo=postgresql)
![JWT](https://img.shields.io/badge/JWT-enabled-yellowgreen)

## Project Overview

AuthVault is a full-stack authentication prototype that demonstrates production-grade security patterns in a compact codebase. It solves the common problem of combining credential-based login, email OTP verification, and Google OAuth sign-in with stateless JWT authorization, while keeping the backend and frontend clearly separated.

Users can:

- register with email/password and verify signup with a 6-digit OTP delivered by email
- login with email/password and receive a signed JWT
- sign in with Google via ID token verification
- access protected user endpoints with Bearer token authentication

Real-world use cases:

- SaaS authentication gateway for internal admin dashboards
- identity bootstrapping for new user onboarding (email verification + OTP)
- hybrid login flows combining traditional credentials with social login
- developer proof-of-concept for secure auth service architecture

The architecture is interesting because it combines Spring Boot security primitives, a custom JWT filter, PostgreSQL-backed OTP state, and a React/Vite frontend running separately with client-side auth token handling.

## Key Highlights

- Stateless JWT authentication with custom request validation filter
- Email-based OTP verification flow with 5-minute expiry and SMTP email delivery
- Google sign-in integration using `oauth2.googleapis.com/tokeninfo` validation
- BCrypt password hashing for credential-based user signup and login
- PostgreSQL persistence through Spring Data JPA
- React 19 + Vite frontend that stores JWT in `localStorage` and calls protected API routes
- Custom `.env` loading via Spring `EnvironmentPostProcessor`
- Security configuration enforcing `/auth/**` as public and protecting `/users` routes
- Minimal but complete backend API surface with registration, login, OTP, social login, and protected resource access

## Architecture

AuthVault is split into two layers:

1. Backend API service (`src/main/java/com/palak/authvault`)
   - `AuthController` handles registration, login, OTP send/verify, and Google token login
   - `UserController` exposes protected user CRUD endpoints
   - `AuthService` centralizes auth workflows, OTP creation, and JWT issuance
   - `JwtService` signs and validates HS256 JWTs with a one-hour expiration
   - `JwtAuthenticationFilter` inspects `Authorization: Bearer` headers and populates Spring Security context
   - `SecurityConfig` enables CORS for the React app, disables CSRF, and enforces stateless sessions
   - `.env` support is provided by `DotenvEnvironmentPostProcessor` and `spring.config.import=optional:dotenv:` in `application.properties`

2. Frontend single-page app (`auth-ui/src`)
   - React app uses Axios to call backend endpoints
   - `GoogleOAuthProvider` and `@react-oauth/google` support Google login
   - App state includes authentication token storage, OTP flows, and protected user fetches

### Why these decisions

- Spring Security + custom JWT filter: enables a real Bearer auth model rather than session cookies.
- BCrypt password encoding: aligns with secure storage best practices for user credentials.
- Google ID token verification on the backend: avoids trusting client-side Google assertions.
- OTP persistence in PostgreSQL: makes email verification stateful, traceable, and expirable.
- React + Vite: keeps the UI lightweight and developer-friendly while supporting modern auth UX.

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Frontend | React | 19.2.6 |
| Frontend | Vite | 8.0.12 |
| Frontend | Axios | 1.16.1 |
| Frontend | @react-oauth/google | 0.13.5 |
| Backend | Spring Boot | 4.1.0-SNAPSHOT |
| Backend | Spring Security | included in Spring Boot |
| Backend | Spring Data JPA | included in Spring Boot |
| Backend | Spring Validation | included in Spring Boot |
| Backend | Spring Mail | included in Spring Boot |
| Backend | JJWT | 0.12.5 |
| Backend | Jackson Databind | included |
| Database | PostgreSQL | runtime driver only |
| Authentication | JWT HS256 | custom `JwtService` |
| Authentication | OAuth | Google ID token validation |
| Authentication | OTP | 6-digit code, 5-minute expiry |
| DevOps | Maven Wrapper | `./mvnw`, `./mvnw.cmd` |
| Build Tools | Maven | backend build |
| Build Tools | npm / Vite | frontend dev & build |
| Infrastructure | dotenv | custom `EnvironmentPostProcessor` + optional import |

## API Documentation

### Authentication Endpoints

#### `POST /auth/register`
- Request:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- Response:
  ```json
  {
    "message": "User registered successfully"
  }
  ```
- Description: registers a new user, hashes the password with BCrypt, and stores the record in PostgreSQL.

#### `POST /auth/login`
- Request:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- Response:
  ```json
  {
    "token": "<JWT_TOKEN>"
  }
  ```
- Description: authenticates credentials and returns a JWT valid for 1 hour.

#### `POST /auth/send-otp`
- Request:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- Response:
  ```json
  {
    "message": "OTP sent to email"
  }
  ```
- Description: verifies credentials, generates a 6-digit OTP, stores it with a 5-minute expiry, and sends it via SMTP email.

#### `POST /auth/verify-otp`
- Request:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- Response:
  ```json
  {
    "token": "<JWT_TOKEN>"
  }
  ```
- Description: validates the OTP, deletes the OTP record, and returns a JWT.

#### `POST /auth/google`
- Request:
  ```json
  {
    "idToken": "<GOOGLE_ID_TOKEN>"
  }
  ```
- Response:
  ```json
  {
    "token": "<JWT_TOKEN>"
  }
  ```
- Description: validates Google ID token with Google's tokeninfo endpoint, enforces `aud` matches `GOOGLE_CLIENT_ID`, and signs a local JWT.

### Protected User Endpoints

> All endpoints under `/users` require `Authorization: Bearer <JWT_TOKEN>`.

#### `GET /users`
- Response:
  ```json
  [
    {"id": 1, "email": "user@example.com"}
  ]
  ```
- Description: returns a lightweight user list via `UserResponseDto`.

#### `POST /users`
- Request:
  ```json
  {
    "email": "newuser@example.com",
    "password": "password"
  }
  ```
- Response:
  ```json
  {
    "id": 2,
    "email": "newuser@example.com",
    "password": "password"
  }
  ```
- Description: saves a new user record. Note: this endpoint bypasses the auth registration workflow and does not apply password hashing.

#### `DELETE /users/{id}`
- Response:
  ```text
  User deleted successfully
  ```
- Description: deletes a user by ID.

### Authentication Requirements

- JWT Authentication: implemented through `JwtAuthenticationFilter` inspecting `Authorization: Bearer` headers.
- OAuth Login: backend validates Google ID tokens by calling `https://oauth2.googleapis.com/tokeninfo?id_token=`.
- OTP Verification: generated in `OtpService`, persisted in `OtpVerification`, and expires after 5 minutes.
- Password Security: passwords are hashed with `BCryptPasswordEncoder` in `AuthService.register`.
- Role-Based Access: not implemented; all authenticated users have access to `/users` endpoints.
- API Protection: `/auth/**` is public, all other routes are protected and require valid JWTs.
- Secrets Management: configuration values are loaded from `.env` and Spring environment properties.

## Deployment Guide

### Local Setup

1. Backend
   ```bash
   cp .env.example .env
   # Edit .env with database, JWT secret, and Google client ID
   ./mvnw spring-boot:run
   ```

2. Frontend
   ```bash
   cd auth-ui
   npm install
   npm run dev
   ```

3. Open your browser at `http://localhost:5173` and ensure the backend is reachable at `http://localhost:8080`.

### Environment Variables

Backend uses:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `SPRING_MAIL_USERNAME` (optional for OTP email)
- `SPRING_MAIL_PASSWORD` (optional for OTP email)

Frontend uses:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_API_URL` (optional, defaults to `http://localhost:8080`)

### Docker Setup

This repository does not include a `Dockerfile` or `docker-compose.yml`. The canonical deployment path is currently based on Maven and Vite builds.

### Production Deployment

1. Build backend artifact:
   ```bash
   ./mvnw -DskipTests package
   java -jar target/authvault-0.0.1-SNAPSHOT.jar
   ```

2. Build frontend assets:
   ```bash
   cd auth-ui
   npm ci
   npm run build
   ```

3. Host the generated frontend output on any static server, and point API requests to the backend URL.

## Project Layout

- `src/main/java/com/palak/authvault/config` — security and custom environment loading
- `src/main/java/com/palak/authvault/controller` — auth and protected user endpoints
- `src/main/java/com/palak/authvault/service` — auth workflows, JWTs, OTP generation, Google verification
- `src/main/java/com/palak/authvault/repository` — JPA repository interfaces
- `src/main/java/com/palak/authvault/entity` — `User` and `OtpVerification` storage models
- `auth-ui/src` — React login/signup/OTP client

## Why This Project Stands Out

- Demonstrates a complete stateless JWT auth pipeline, not just token issuance
- Implements dual auth modes: traditional password login and Google social login
- Includes an OTP email verification flow integrated with backend state
- Uses Spring Boot security best practices, including BCrypt and custom filters
- Supports frontend/backend separation with React + Vite and explicit CORS rules
- Shows real-world secret handling with `.env` loading and Spring property wiring

## Notes for Reviewers

- The JWT validation path is active and enforced for protected endpoints.
- Email OTP handling is stateful and expires after 5 minutes.
- The repo uses modern Java and Spring Boot versions, plus React 19.
- The current user CRUD endpoint should be audited for password hashing if used in production.
