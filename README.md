# 🏢 HRMS - Human Resource Management System

A full-stack web application for managing human resources in an educational institution (FPT).

---

## 👥 Team

| Name | Branch | Role |
|------|--------|------|
| AMSOUNT Mohamed | `AMSOUNT-MOHAMED` | Authentication, Messaging, Certificates, Notifications |
| Nawfal | `nawfal` | Employees, Leaves, Attendance, Evaluations |
| Aboubaker | `aboubaker` | Payroll, Promotions, AI Engine, Auditing |

---

## 🛠️ Tech Stack

**Backend**
- Python / Django REST Framework
- JWT Authentication (SimpleJWT)
- SQLite (development) / PostgreSQL (production)

**Frontend**
- React 18 + TypeScript
- Vite
- TailwindCSS
- React Query

---

## 📁 Project Structure

```
├── hrms-backend/          # Django REST API
│   ├── apps/
│   │   ├── accounts/      # Authentication & user management
│   │   ├── employees/     # Employee profiles
│   │   ├── leaves/        # Leave requests
│   │   ├── attendance/    # Daily attendance tracking
│   │   ├── payroll/       # Salary management
│   │   ├── certificates/  # Document generation (PDF)
│   │   ├── messaging/     # Internal messaging system
│   │   ├── notifications/ # Real-time notifications
│   │   ├── promotions/    # Promotion management
│   │   ├── evaluations/   # Performance evaluations
│   │   ├── ai_engine/     # AI-powered analytics
│   │   └── auditing/      # Activity audit logs
│   └── config/            # Project settings
│
└── hrms-frontend/         # React TypeScript SPA
    └── src/
        ├── pages/         # Application pages
        ├── components/    # Reusable UI components
        ├── api/           # API service layer
        ├── context/       # React context (Auth)
        └── router/        # App routing
```

---

## 🚀 Getting Started

> Make sure Python 3.11+ and Node.js 18+ are installed.
> For PDF generation, WeasyPrint requires GTK libraries on Windows.

### Backend

```bash
cd hrms-backend
pip install -r requirements.txt
python manage.py migrate
python manage.py create_superadmin
python manage.py runserver
```

### Frontend

```bash
cd hrms-frontend
npm install
npm run dev
```

---

## ✨ Key Features

- 🔐 JWT-based authentication with role-based access control
- 👤 Full employee profile management
- 📄 Dynamic document & certificate generation (PDF)
- 💬 Internal real-time messaging system
- 🔔 Notification system with broadcast support
- 📅 Leave request workflow (submit → approve/reject)
- ⏱️ Daily attendance tracking
- 💰 Payroll and salary management
- 📈 AI-powered HR analytics and insights
- 🏆 Promotion and evaluation management
- 🗂️ Full audit logging of all actions

---

## 🔑 Default Credentials

Run `python manage.py seed_fpt_data` to load test data.
See `COMPTES.md` for all accounts.

---

## 🌐 API Base URL

```
http://localhost:8000/api/v1/
```
