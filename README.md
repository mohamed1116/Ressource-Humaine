# Ressource-Humaine
# 🎓 HRMS — Faculté Polydisciplinaire de Taroudant

> A comprehensive **Human Resource Management System** built for the Faculté Polydisciplinaire de Taroudant, featuring a Django REST Framework backend, a React + Vite frontend, and a lightweight AI engine for smart HR analytics.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [AI Engine](#ai-engine)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

HRMS is a full-stack web application designed to digitize and streamline human resource operations at the Faculté Polydisciplinaire de Taroudant. It covers the full employee lifecycle — from onboarding and attendance tracking to payroll, performance evaluation, and AI-powered management recommendations.

---

## Features

### 👥 Employee Management
- Manage professors and administrative staff profiles
- Role-based access control
- Department and position tracking

### 🗓️ Leave Management
- Employee leave request submission
- Multi-level approval / rejection workflow
- Leave balance tracking per employee

### 🕐 Attendance & Absence Tracking
- Daily attendance recording
- Absence history and reporting
- Late arrival detection

### 💰 Salaries & Pay Slips
- Salary configuration per employee
- Automated pay slip generation
- Salary history archive

### 📊 Performance Evaluation
- Periodic performance review cycles
- Scoring and feedback system
- Historical evaluation records

### 🔔 Notification System
- In-app notifications for approvals, rejections, and alerts
- Department-level management alerts

### 🤖 AI Engine
- **Leave trend analysis** — identifies patterns in leave requests across departments
- **Recurring late arrival detection** — flags employees with repeated tardiness
- **Automatic recommendation generation** — provides actionable insights for management
- **Department-level alerts** — proactively surfaces HR risks

### 🖥️ Dashboard & Reports
- Executive dashboard with key HR statistics
- Dedicated pages per module (employees, leaves, attendance, salaries, performance)
- Exportable reports

---

## Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Backend    | Python, Django, Django REST Framework |
| Auth       | JWT (JSON Web Tokens)               |
| Frontend   | React, Vite, JavaScript/TypeScript  |
| AI Engine  | Python (analytics & ML layer)       |
| Database   | PostgreSQL (recommended) / SQLite   |

---

## Project Structure

```
hrms/
├── backend/                  # Django REST Framework API
│   ├── employees/            # Employee management app
│   ├── leaves/               # Leave requests & workflow
│   ├── attendance/           # Attendance & absence tracking
│   ├── salaries/             # Payroll & pay slips
│   ├── performance/          # Performance evaluations
│   ├── notifications/        # Notification system
│   ├── ai_engine/            # AI analytics & recommendations
│   ├── config/               # Django settings & URL config
│   └── manage.py
│
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── pages/            # Employees, Leaves, Attendance, Salaries, Performance
│   │   ├── components/       # Shared UI components
│   │   ├── services/         # API service layer
│   │   └── main.jsx
│   └── vite.config.js
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for development)
- Git

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/hrms-fpt.git
cd hrms-fpt/backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Apply migrations
python manage.py migrate

# 5. Create a superuser
python manage.py createsuperuser

# 6. Run the development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

---

### Frontend Setup

```bash
cd hrms-fpt/frontend

# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173/`.

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=hrms_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60       # minutes
JWT_REFRESH_TOKEN_LIFETIME=7       # days
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## API Overview

All endpoints are prefixed with `/api/` and require a valid JWT token (except `/api/auth/`).

| Resource        | Endpoint                  | Methods              |
|-----------------|---------------------------|----------------------|
| Authentication  | `/api/auth/`              | POST (login/refresh) |
| Employees       | `/api/employees/`         | GET, POST, PUT, DELETE |
| Leaves          | `/api/leaves/`            | GET, POST, PATCH     |
| Attendance      | `/api/attendance/`        | GET, POST            |
| Salaries        | `/api/salaries/`          | GET, POST            |
| Pay Slips       | `/api/payslips/`          | GET                  |
| Performance     | `/api/performance/`       | GET, POST, PUT       |
| Notifications   | `/api/notifications/`     | GET, PATCH           |
| AI Insights     | `/api/ai/insights/`       | GET                  |

> Full API documentation available via Django REST Framework's browsable API at `/api/` when `DEBUG=True`.

---

## AI Engine

The AI module (`backend/ai_engine/`) runs analytical jobs on top of existing HR data:

- **Leave Trend Analysis** — detects seasonal or department-specific leave spikes
- **Late Arrival Detection** — flags employees with a recurring pattern of tardiness
- **Recommendation Engine** — generates plain-language management recommendations
- **Department Alerts** — triggers alerts when KPIs exceed configurable thresholds

AI jobs can be run on demand via API or scheduled with a task queue (e.g., Celery + Redis).

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style and include relevant tests.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for the Faculté Polydisciplinaire de Taroudant
</p>