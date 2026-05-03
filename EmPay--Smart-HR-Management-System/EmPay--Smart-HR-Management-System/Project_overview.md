# Project Overview: EmPay (Smart HR Management System)

This document serves as a high-level guide for GitHub Copilot / AI assistants to understand the EmPay project architecture, stack, and business logic.

## 1. Project Identity & Vision
EmPay is a Smart HR Management System designed for a 24-hour hackathon. It streamlines attendance, leave management, and payroll processing, featuring AI-driven insights and professional PDF generation.

## 2. Tech Stack
- **Frontend**: React 18+ (Vite), Tailwind CSS, shadcn/ui, Recharts, React Query.
- **Backend (Main)**: Node.js + Express (REST API).
- **Database**: MongoDB Atlas (Mongoose ORM).
- **AI Integration**: Groq API (Model: `llama3-8b-8192`) for leave reasons, payroll narratives, and dashboard insights.
- **PDF Service**: Python FastAPI + ReportLab (isolated microservice for payslip generation).
- **State Management**: Zustand (Client-side global state).

## 3. Monorepo Structure
- `/client`: React frontend.
  - `/src/api`: Axios wrappers (e.g., `aiapi.js` for Groq calls).
  - `/src/hooks`: React Query hooks for data fetching (`useAttendance`, `useLeave`, etc.).
  - `/src/store`: Zustand stores (`authStore.js`).
- `/server`: Node.js Express backend.
  - `/models`: Mongoose schemas (User, Employee, Attendance, Leave, Payrun, Payslip).
  - `/controllers`: Business logic (Note: `ai.controller.js` proxies Groq).
  - `/utils/payrollEngine.js`: The **Source of Truth** for all financial calculations.
- `/pdf-service`: Python microservice for PDF generation.

## 4. Key Business Logic & Rules
### A. Payroll Engine (CRITICAL)
All payroll calculations MUST be performed server-side in `payrollEngine.js`. 
- **Gross Salary**: `(CTC / totalDays) * paidDays`
- **Paid Days**: `presentDays + approvedLeaveDays`
- **Components**: Basic (50%), HRA (20%), Special Allowance (30%).
- **Deductions**: 
  - PF (12% of Basic if opted).
  - Professional Tax: Maharashtra slabs (Rs. 0, Rs. 175, or Rs. 200).

### B. AI Integration (Groq)
The system uses Groq (Llama 3) via the server-side proxy `POST /api/ai/suggest`.
- **Use Cases**: 
  1. Professional leave reason suggestions.
  2. Narrative summaries of monthly payroll data.
  3. HR dashboard "Insight Cards" based on attendance trends.

### C. Security & Roles
- **Roles**: Admin, HR, Payroll Officer, Employee.
- **Auth**: JWT-based. The role is embedded in the JWT payload to avoid redundant DB lookups.
- **Route Guards**: Client-side (`ProtectedRoute.jsx`) and server-side (`role.middleware.js`).

## 5. Port Reference
- **React**: `:3000`
- **Node/Express**: `:5000`
- **Python PDF Service**: `:8001`

## 6. Development Guidelines
- **Idempotency**: Attendance marking and Payruns must be idempotent (upsert based on employee ID and date/month).
- **API Communication**: The client never calls Groq directly. All AI requests go through the Node.js backend to keep the `GROQ_API_KEY` secure.
