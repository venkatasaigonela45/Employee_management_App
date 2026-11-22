# Employee Management App

A full-stack employee management system with role-based access, employee CRUD, a dashboard, and filterable reports that can be exported to Excel and PDF.

- **Backend:** Spring Boot (Java 17), Spring Security + JWT, Spring Data JPA, MySQL
- **Frontend:** Angular 19 + Angular Material
- **Database:** MySQL 8 (via Docker Compose)

## Features

- **Authentication**: JWT login with access tokens (1 hour) and refresh tokens (7 days)
- **Role-based access control**: three roles with different permissions (see [Roles](#roles-and-demo-accounts))
- **Employee management**: create, view, edit, and soft-delete employees, with search and pagination
- **Employment types**: Full-time, Contract, and Intern, each with its own date rules
- **Validation**: unique employee codes and emails, contract/end-date checks, and required reasons for inactive employees
- **Dashboard**: summary cards for total, active, on-leave, and inactive employees
- **Reports**: filter by status, department, and hire-date range, with summary stats
- **Export**: download filtered reports as **Excel (.xlsx)** or **PDF**
- **Idle timeout**: automatic logout after 30 minutes of inactivity, with a warning one minute before
- **Seed data**: sample users and 12 sample employees are created automatically on first run

## Project Structure

```
Employee-Management-App/
├── backend/               # Spring Boot REST API
│   ├── src/main/java/com/assessment/employee/
│   │   ├── config/        # Seed data (DataInitializer)
│   │   ├── controller/    # Auth, Employee, Report endpoints
│   │   ├── dto/           # Request/response objects
│   │   ├── entity/        # Employee, User, enums
│   │   ├── exception/     # Global error handling
│   │   ├── repository/    # JPA repositories
│   │   ├── security/      # JWT, filters, security config
│   │   └── service/       # Business logic, report generation
│   ├── src/main/resources/application.properties
│   └── pom.xml
├── frontend/              # Angular single-page app
│   └── src/app/
│       ├── core/          # Auth, employee, and report services/guards
│       ├── features/      # login, dashboard, employees, reports
│       ├── layout/        # App shell
│       └── shared/        # Shared components
└── docker-compose.yml     # MySQL database
```

## Prerequisites

| Tool | Version |
|------|---------|
| Java (JDK) | 17 or later |
| Node.js | 18.19+ / 20 / 22 |
| npm | Comes with Node.js |
| Docker + Docker Compose | For the MySQL database |

You do not need to install Maven separately; the backend includes the Maven Wrapper (`mvnw`).

## Getting Started

### 1. Start the database

From the project root:

```bash
docker compose up -d
```

This starts MySQL 8 in a container named `emp-mysql`, exposed on **host port 3307**, with the `employee_db` database, user `empuser`, and password `emppass`. Data is stored in a Docker volume (`emp_mysql_data`) so it persists between restarts.

### 2. Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd spring-boot:run`.

The API starts at **http://localhost:8080**. Tables are created automatically (`spring.jpa.hibernate.ddl-auto=update`) and the seed data is inserted on first run.

### 3. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

Open **http://localhost:4200** and sign in with one of the demo accounts below.

## Roles and Demo Accounts

The following accounts are created automatically at startup:

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| `admin` | `admin123` | `ROLE_ADMIN` | Full access: view, create, edit, and delete employees; view and export reports |
| `user` | `user123` | `ROLE_USER` | Read-only: view all employees and reports, export reports |
| `ava.patel` | `ava123` | `ROLE_EMPLOYEE` | Self-service: can only view their own profile (linked to EMP001); no access to reports |

> **Note:** These are demo credentials. Change or remove them before deploying anywhere real.

## API Overview

All endpoints except login and refresh require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Log in and receive access + refresh tokens |
| POST | `/api/auth/refresh` | Exchange a refresh token for new tokens |
| POST | `/api/auth/logout` | Log out |

### Employees

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/employees?search=&page=&size=` | Any authenticated user | List employees (employees see only their own) |
| GET | `/api/employees/{id}` | Any authenticated user | Get one employee |
| POST | `/api/employees` | Admin | Create an employee |
| PUT | `/api/employees/{id}` | Admin | Update an employee |
| DELETE | `/api/employees/{id}` | Admin | Soft-delete an employee |

### Reports

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/reports/employees` | Admin, User | Paginated report |
| GET | `/api/reports/employees/summary` | Authenticated | Summary statistics |
| GET | `/api/reports/departments` | Authenticated | List of departments |
| GET | `/api/reports/employees/export/excel` | Admin, User | Download report as `.xlsx` |
| GET | `/api/reports/employees/export/pdf` | Admin, User | Download report as PDF |

Report endpoints accept the optional filters `status`, `department`, `fromDate`, and `toDate` (dates in `yyyy-MM-dd` format).

## Configuration

Backend settings live in `backend/src/main/resources/application.properties`:

| Property | Default | Description |
|----------|---------|-------------|
| `server.port` | `8080` | API port |
| `spring.datasource.url` | `jdbc:mysql://localhost:3307/employee_db...` | Database connection |
| `spring.datasource.username` / `password` | `empuser` / `emppass` | Database credentials |
| `app.jwt.secret` | *(placeholder)* | **Change this in production** |
| `app.jwt.expiration-ms` | `3600000` | Access token lifetime (1 hour) |
| `app.jwt.refresh-expiration-ms` | `604800000` | Refresh token lifetime (7 days) |

The frontend calls the API at `http://localhost:8080` (hardcoded in the services under `frontend/src/app/core/`), and the backend allows CORS from `http://localhost:4200`. If you change either port or host, update both places.

## Running Tests

**Backend** (uses an in-memory H2 database, so MySQL is not required):

```bash
cd backend
./mvnw test
```

**Frontend:**

```bash
cd frontend
npm test
```
