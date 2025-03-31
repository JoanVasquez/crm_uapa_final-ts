# Lint Codebase & Run Unit Tests (TypeScript Express App)

This repository hosts a Node.js/TypeScript Express application that demonstrates:

- Linting with ESLint
- Unit testing with Jest
- Database operations using TypeORM
- AWS Cognito for authentication
- AWS SSM for configuration
- AWS KMS for password encryption
- AWS Redis/ElastiCache for caching
- GitHub Actions CI for linting and testing
- Docker Compose for local development

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running Locally](#running-locally)
6. [Docker Compose Setup](#docker-compose-setup)
7. [Project Scripts](#project-scripts)
8. [Testing](#testing)
9. [Linting](#linting)
10. [CI/CD with GitHub Actions](#cicd-with-github-actions)
11. [Folder Structure](#folder-structure)
12. [Contributing](#contributing)
13. [License](#license)

---

## Project Overview

This application is built with:

- **Node.js** and **TypeScript** for the server logic.
- **Express** as the web framework.
- **TypeORM** for database operations (MySQL/PostgreSQL/SQLite).
- **AWS** services:
  - **Cognito** for user authentication and registration.
  - **SSM** (Systems Manager) to store configuration securely.
  - **KMS** to encrypt/decrypt sensitive data.
  - **SES** to send emails (if needed).
  - **S3** to store files (bills, logs).
  - **Redis**/ElastiCache for caching.
- **Jest** for unit tests.
- **ESLint** for code linting.
- **Prettier** for code formatting.
- **Docker** + **docker-compose** to containerize and run services locally.

### Key Features

1. **Authentication & Authorization**
   Integrates with AWS Cognito for user registration, login, token refresh, and password resets.

2. **Database Management**
   Uses TypeORM to connect to a relational database. Can run in-memory SQLite for tests.

3. **Caching**
   Redis (or ElastiCache in production) is used to cache frequently accessed data and reduce database load.

4. **Error Handling**
   A centralized error-handler middleware ensures consistent, structured JSON responses for errors.

5. **CI/CD**
   GitHub Actions pipeline runs lint checks and unit tests on every push and pull request to `master` or `develop`.

---

## Prerequisites

1. **Node.js** (version 18+ recommended)
2. **npm** or **yarn** (npm comes bundled with Node)
3. **Docker** (if you plan to run locally with Docker)
4. **AWS CLI** (optional, if you plan to interact with AWS from your local machine)
5. **Git** for version control

Make sure you have AWS credentials set up if testing AWS functionality locally:

```bash
aws configure
```
