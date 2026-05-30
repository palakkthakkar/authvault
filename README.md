# Authvault

Authvault is a Spring Boot authentication service built with Java, Spring Data JPA, Spring Security, PostgreSQL, and JWT token generation.

## Overview

This project implements a simple auth backend with:

- User registration (`/auth/register`)
- User login (`/auth/login`)
- JWT generation for authenticated users
- Basic user CRUD operations under `/users`
- PostgreSQL persistence via Spring Data JPA
- Password hashing with BCrypt

## Project Structure

- `src/main/java/com/palak/authvault/AuthvaultApplication.java`
  - Spring Boot application entry point.

- `src/main/java/com/palak/authvault/entity/User.java`
  - JPA entity representing a user record.

- `src/main/java/com/palak/authvault/repository/UserRepository.java`
  - Spring Data repository for `User`.
  - Includes `findByEmail(String email)`.

- `src/main/java/com/palak/authvault/service/UserService.java`
  - Generic user CRUD operations.
  - Used by `UserController` to create, list, and delete users.

- `src/main/java/com/palak/authvault/service/AuthService.java`
  - Authentication logic for registration and login.
  - Hashes passwords and generates JWTs.

- `src/main/java/com/palak/authvault/service/JwtService.java`
  - Generates JWT tokens using a shared secret.

- `src/main/java/com/palak/authvault/controller/AuthController.java`
  - Exposes auth endpoints: `/auth/register` and `/auth/login`.

- `src/main/java/com/palak/authvault/controller/UserController.java`
  - Exposes user management endpoints: `/users`, `/users/{id}`.

- `src/main/java/com/palak/authvault/config/SecurityConfig.java`
  - Spring Security configuration.
  - Permits `/auth/**` requests.
  - Requires authentication for other requests.
  - Configures `BCryptPasswordEncoder`.

- `src/main/java/com/palak/authvault/dto/RegisterRequest.java`
  - DTO for user registration requests.

- `src/main/java/com/palak/authvault/dto/LoginRequest.java`
  - DTO for user login requests.

- `src/main/resources/application.properties`
  - Database and JPA configuration.

## Dependencies

Key dependencies in `pom.xml`:

- `spring-boot-starter-data-jpa`
- `spring-boot-starter-webmvc`
- `spring-boot-starter-validation`
- `spring-boot-starter-security`
- `postgresql`
- `lombok` (optional, currently not used)

## Supported Endpoints

### Authentication

- `POST /auth/register`
  - Registers a user.
  - Request body:
    ```json
    {
      "email": "pala@gmail.com",
      "password": "secret"
    }
    ```
  - Response: text message.

- `POST /auth/login`
  - Authenticates a user and returns a JWT token.
  - Request body:
    ```json
    {
      "email": "pala@gmail.com",
      "password": "secret"
    }
    ```
  - Response: JWT token string.

### User Management

- `POST /users`
  - Creates a new user directly.
  - Note: This bypasses the auth registration flow and does not hash the password in the current `UserController` path.

- `GET /users`
  - Lists all users.

- `DELETE /users/{id}`
  - Deletes a user by ID.

## Security Behavior

Current security configuration:

- `/auth/**` is allowed without authentication.
- All other endpoints require authentication.
- HTTP Basic auth is enabled for protected endpoints via `httpBasic()`.

### Important note

The current code generates JWT tokens, but it does not yet validate JWTs for incoming requests. As written, protected endpoints are secured with HTTP Basic authentication, not Bearer JWT authentication.

## Setup

### Prerequisites

- Java 26
- Maven
- PostgreSQL

### Database

Update `src/main/resources/application.properties` with your database credentials.

Example:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/authvault
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Create the database manually if needed:

```sql
CREATE DATABASE authvault;
```

### Run the application

From the project root:

```bash
./mvnw spring-boot:run
```

Or build and run:

```bash
./mvnw -DskipTests package
java -jar target/authvault-0.0.1-SNAPSHOT.jar
```

## Testing the API

Register a new user:

```bash
curl -v -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"pala@gmail.com","password":"secret"}'
```

Login and get a token:

```bash
curl -v -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pala@gmail.com","password":"secret"}'
```

## Notes and Recommendations

- `AuthService` is the correct place for registration and login logic.
- `UserService` should remain focused on generic user CRUD.
- `UserController` currently exposes direct user creation, which may bypass registration semantics.
- Consider removing unused Lombok configuration if no Lombok annotations are used.
- Implement JWT request validation if you want Bearer authentication instead of HTTP Basic for protected routes.

## Possible Improvements

- Add JWT validation filter to secure `/users` with bearer tokens.
- Return structured JSON responses instead of plain strings.
- Add exception handling and proper HTTP status codes.
- Add unit and integration tests for auth and user flows.

## File cleanup suggestions

Check for the following after refactoring:

- Remove unused imports and commented-out code.
- Remove `target/` from version control.
- Remove the Lombok dependency if it is not used.
