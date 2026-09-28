# CURBI - Digital Wallet & Financial Management Platform

> A  financial platform engineered to help users manage expenses, curb impulsive spending, build structured savings habits, and gain practical financial literacy.

---

## Table of Contents
1. [Overview & Problem Statement](#overview--problem-statement)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Directory Structure](#project-directory-structure)
5. [Prerequisites](#prerequisites)
6. [Installation & Setup](#installation--setup)
7. [Running the Application](#running-the-application)
8. [Core Modules & Features](#core-modules--features)
9. [REST API Reference](#rest-api-reference)
10. [Testing & Build](#testing--build)
11. [License](#license)

---

## Overview & Problem Statement

Financial illiteracy and lack of expense control are primary drivers of household financial distress and chronic debt. Most conventional banking applications display raw numerical balances without proactive guidance, budgeting controls, or impulsive spending prevention.

**CURBI** addresses this problem by acting as an active financial co-pilot:
* **Impulsive Spending Prevention:** Enables users to pre-validate potential purchases against category budgets before executing transactions.
* **Category Budgeting:** Monitors expense thresholds in real time and alerts users before limits are breached.
* **Goal-Oriented Savings:** Provides structured tracking for emergency funds and medium/long-term financial goals.
* **Collaborative Household Management:** Includes a dedicated "Houses" module for coordinating shared household budgets and obligations.
* **Integrated Financial Literacy:** Features an educational module with practical micro-guides, financial terminology reference, and interactive financial calculators (50/30/20 rule, micro-expense compound impact, and emergency fund sizing).

---

## Technology Stack

### Frontend
* **Framework:** Angular 22 (Standalone Components, Signals-based reactive state management).
* **Rendering:** Server-Side Rendering (SSR) via `@angular/ssr`.
* **Testing:** Vitest integrated with `@angular/build`.
* **Styling:** Native modular CSS with a responsive design system tailored for modern fintech interfaces.

### Backend
* **Runtime:** Node.js with Express.
* **Language:** TypeScript executed in development mode via `tsx`.
* **Database Access:** MySQL 8.x utilizing `mysql2/promise` with connection pooling and parameterized SQL queries to prevent SQL injection vulnerabilities.
* **Financial Precision:** Currency rounding utilities to ensure exact two-decimal precision and prevent floating-point calculation discrepancies.

---

## Architecture Overview

The system follows a decoupled, layered client-server architecture:

```
[ Angular 22 Client (Browser / SSR) ]
                  │
                  ▼  (HTTP / JSON)
[ Express / TypeScript REST API ]
  ├── Controllers   (Request validation and HTTP routing)
  ├── Services      (Financial business logic and validations)
  └── Repositories  (Data access layer with parameterized SQL)
                  │
                  ▼
[ MySQL Relational Database ]
```

---

## Project Directory Structure

```text
curbi/
├── backend/                             # REST API service (Express, TypeScript, MySQL)
│   ├── config/                          # Database connection pool and configuration
│   ├── controller/                      # HTTP request controllers
│   ├── model/                           # TypeScript interfaces, types, and DTOs
│   ├── repository/                      # SQL query and data persistence layer
│   ├── service/                         # Business rules and domain logic
│   ├── tools/                           # Database migration and verification scripts
│   ├── utils/                           # Monetary precision utilities
│   ├── curbi.sql                        # DDL schema and initial dataset for MySQL
│   ├── process.env                      # Environment variable definitions
│   ├── server.ts                        # Application entry point and route definitions
│   └── package.json                     # Backend dependencies and scripts
│
├── frontend/curbi/                      # Web application (Angular 22)
│   ├── scripts/
│   │   └── start.js                     # Multi-process development runner (API + Web)
│   ├── src/
│   │   ├── app/
│   │   │   ├── component/
│   │   │   │   ├── home/                # Main dashboard, KPI metrics, purchase approval
│   │   │   │   ├── wallet/              # Cards, accounts, transfers, credit requests
│   │   │   │   ├── saves/               # Savings goals and category budgets
│   │   │   │   ├── transactions/        # Transaction ledger and receipt generation
│   │   │   │   ├── learn/               # Financial education, calculators, glossary
│   │   │   │   ├── notifications/       # User notification center
│   │   │   │   ├── profile/             # User profile settings
│   │   │   │   ├── login/ / register/   # Authentication views
│   │   │   │   └── shell/               # Shared top navigation bar
│   │   │   ├── service/                 # API communication, session, and state services
│   │   │   ├── app.routes.ts            # Application routing with authentication guards
│   │   │   └── app.config.ts            # Angular application providers
│   │   └── styles.css                   # Global styles, variables, and reset
│   └── package.json                     # Frontend dependencies and scripts
│
├── package.json                         # Root orchestration scripts
└── README.md                            # Technical documentation
```

---

## Prerequisites

* **Node.js:** Version `>= 20.x`
* **NPM:** Version `>= 10.x`
* **MySQL:** Version 8.x instance running locally or remotely

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/cristanders/curbi.git
cd curbi
```

### 2. Database Provisioning
1. Ensure your MySQL server is running.
2. Import the schema and initial data located in `backend/curbi.sql`:
   ```bash
   mysql -u root -p < backend/curbi.sql
   ```

### 3. Environment Variables
Verify or create the environment configuration in `backend/process.env` (or `backend/.env`):
```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=curbi
```

### 4. Install Dependencies
Install dependencies for both backend and frontend workspaces:
```bash
npm --prefix backend install
npm --prefix frontend/curbi install
```

---

## Running the Application

### Single Command Runner (Recommended)
From the root directory, start both the backend API and frontend development server concurrently:

```bash
npm run dev
# or
npm start
```

The process runner (`frontend/curbi/scripts/start.js`):
* Performs port availability checks.
* Launches the **API** at `http://localhost:4000` (prefixed with `[api]`).
* Launches the **Angular Web App** at `http://localhost:4200` (prefixed with `[web]`).
* Automatically cleans up child processes upon termination (`Ctrl + C`).

### Individual Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` / `npm start` | Runs API (port 4000) and Web Client (port 4200) concurrently |
| `npm run start:api` | Starts only the Express backend API service |
| `npm run start:web` | Starts only the Angular web client (`ng serve`) |
| `npm run build` | Compiles the production build with SSR bundles |
| `npm run test` | Executes the unit test suite via Vitest |

---

## Core Modules & Features

### 1. Financial Dashboard
* Real-time net balance, total savings, monthly expenditure, and cash flow comparison.
* Dynamic asset valuation charts per financial institution.
* **Expenditure Verification Assistant:** Validates whether a prospective purchase conforms to budget limits before executing payments.

### 2. Digital Wallet & Accounts
* Management of bank accounts, debit cards, and credit cards.
* Inter-account balance transfers and credit limit increase requests.
* Utility bill payments (electricity, water, communications, healthcare).

### 3. Savings Goals & Category Budgeting
* Configurable savings targets with target dates and progressive contribution logs.
* Monthly category limits with visual consumption bars and overdraft warnings.

### 4. Financial Education Center
* **Practical Guides:** Micro-readings covering the 50/30/20 budget framework, emergency fund sizing, recurring expense control, credit card optimization, debt payoff strategies, and compound interest.
* **Interactive Calculators:** Small-expense compound cost simulator, 50/30/20 budget generator, and emergency fund roadmap planner.
* **Financial Glossary:** Searchable definitions of core financial concepts without technical jargon.

### 5. Household Groups (Houses)
* Collaborative group spaces for joint budget administration and shared domestic expenses.

---

## REST API Reference

### Authentication & Users
* `POST /api/auth/login` - Authenticate via email/username and password.
* `POST /api/auth/register` - Register a new user account.
* `GET /api/users` - Retrieve users list.
* `PUT /api/users/:id` - Update user profile information.

### Financial Accounts & Transfers
* `GET /api/accounts/user/:idUser` - Retrieve user financial accounts.
* `POST /api/accounts` - Create a new account or card.
* `GET /api/bank-accounts` - Fetch destination bank accounts for transfers.
* `POST /api/transfers` - Execute a fund transfer between accounts.
* `POST /api/credit-requests` - Submit a credit limit expansion request.

### Budgets & Expenditure Attempts
* `GET /api/budgets/user/:idUser` - Retrieve monthly budgets with current spending.
* `POST /api/budgets` - Create or update a category budget limit.
* `DELETE /api/budgets/:idBudget/user/:idUser` - Remove a budget rule.
* `POST /api/expenditures` - Submit a purchase verification attempt (Approved / Blocked).

### Savings Goals
* `GET /api/savings/user/:idUser` - List active savings goals.
* `POST /api/savings` - Create a new savings target.
* `POST /api/savings/:idSaving/contribute` - Record a deposit toward a savings goal.

### Utility Bills & Notifications
* `POST /api/bills/pay` - Process a utility bill payment.
* `GET /api/notifications/user/:idUser` - Fetch user notification feed.
* `POST /api/notifications/user/:idUser/read-all` - Mark notifications as read.

---

## Testing & Build

Execute unit tests across components and services:
```bash
npm --prefix frontend/curbi run test
```

Create a production build:
```bash
npm --prefix frontend/curbi run build
```

---

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for full terms and conditions.
