# EmPay - Smart HR Management System
## Complete Setup & Run Guide

### Project Structure
```
EmPay/
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   └── auth/dashboard/
│   │   │       ├── AdminDashboard.jsx      # 1. Admin Dashboard
│   │   │       ├── EmployeeDashboard.jsx   # 2. Employee Dashboard
│   │   │       ├── HRDashboard.jsx         # 3. HR Dashboard
│   │   │       ├── PayrollDashboard.jsx    # 4. Payroll Dashboard
│   │   │       └── AIInsightsDashboard.jsx # 5. AI Insights Dashboard
│   │   └── pages/
│   │       └── Dashboard.jsx               # Main dashboard router
│   └── vite.config.js                      # Backend proxy configured
└── EmPay--Smart-HR-Management-System/
    └── server/                             # Backend (FastAPI)
        ├── main.py                         # FastAPI app
        ├── requirements.txt                # Python dependencies
        └── routers/
            ├── __init__.py                 # Authentication routes
            ├── employees.py                # Employee management
            ├── attendance.py               # Attendance tracking
            ├── leave.py                    # Leave management
            ├── payroll.py                  # Payroll processing
            └── ai.py                       # AI insights
```

---

## Prerequisites

### Required Software
- **Node.js** (v16 or higher) - for frontend
- **Python** (v3.8 or higher) - for backend
- **pip** - Python package manager

### Check Installation
```bash
# Check Node.js
node --version
npm --version

# Check Python
python --version
# or
python3 --version
```

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd EmPay--Smart-HR-Management-System/EmPay--Smart-HR-Management-System
```

### 2. Create Python Virtual Environment
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
# Create .env file in server directory
# Copy from .env.example if available
```

### 5. Initialize Database
```bash
python init_db.py
```

### 6. Run Backend Server
```bash
python main.py
# Backend will start at http://localhost:5000
```

### Backend API Endpoints
- **Authentication**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **Employees**: `/api/employees`, `/api/employees/{id}`
- **Attendance**: `/api/attendance/logs`, `/api/attendance/mark`
- **Leave**: `/api/leave/list`, `/api/leave/apply`, `/api/leave/approve/{id}`
- **Payroll**: `/api/payroll/payruns`, `/api/payroll/payrun`, `/api/payroll/payslips`
- **AI**: `/api/ai/suggest`, `/api/ai/health`

---

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd client
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
The `.env` file is already configured:
```
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Run Development Server
```bash
npm run dev
# Frontend will start at http://localhost:5173
```

### 5. Build for Production
```bash
npm run build
npm run preview
```

---

## Complete System Run Instructions

### Terminal 1: Start Backend
```bash
cd EmPay--Smart-HR-Management-System/EmPay--Smart-HR-Management-System
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
# Wait for: "Uvicorn running on http://0.0.0.0:5000"
```

### Terminal 2: Start Frontend
```bash
cd client
npm run dev
# Wait for: "Local: http://localhost:5173"
```

### Terminal 3 (Optional): Start PDF Service
```bash
cd EmPay--Smart-HR-Management-System/EmPay--Smart-HR-Management-System/pdf-service
python main.py
# Will run on http://127.0.0.1:8001
```

---

## 5 Dashboards Overview

### 1. **Admin Dashboard** (`/dashboard/admin`)
**For**: System administrators
**Features**:
- Total employees count
- Real-time attendance tracking
- Leave distribution analysis
- Monthly payroll overview
- Attendance charts
- Leave request management

### 2. **Employee Dashboard** (`/dashboard/employee`)
**For**: Regular employees
**Features**:
- Personal attendance history
- Leave requests and balance
- Salary/payslip information
- Company-wide metrics overview
- AI insights and recommendations

### 3. **HR Dashboard** (`/dashboard/hr`)
**For**: HR professionals
**Features**:
- Headcount management
- Attendance monitoring
- Leave request approval
- Employee directory access
- HR query tracking
- Leave approval table with action buttons

### 4. **Payroll Dashboard** (`/dashboard/payroll`)
**For**: Payroll officers
**Features**:
- Payrun status and history
- Total payout calculations
- Payslip generation and viewing
- Monthly/quarterly payroll reports
- Payroll execution controls

### 5. **AI Insights Dashboard** (`/dashboard/ai`)
**For**: All roles
**Features**:
- AI-powered recommendations
- Attendance pattern alerts
- Payroll optimization suggestions
- Leave balance analysis
- Performance trend insights
- Priority-based insights (High/Medium/Low)

---

## Authentication & Roles

### Available Roles
- **Admin**: Full system access
- **HR**: Employee and leave management
- **Payroll Officer**: Payroll management
- **Employee**: Personal dashboard only

### Login Flow
1. Navigate to `http://localhost:5173`
2. Enter credentials
3. Auto-redirected to role-specific dashboard
4. Session stored in localStorage

### API Authentication
- JWT token-based authentication
- Token stored in localStorage
- Automatically included in all API requests via Authorization header

---

## Database Models

### Core Entities
- **User**: Authentication and basic info
- **Employee**: Employee details and department
- **Attendance**: Daily check-in/check-out records
- **Leave**: Leave requests and balances
- **Payrun**: Monthly/periodic payroll cycles
- **Payslip**: Individual employee payslips
- **LeaveBalance**: Employee leave balance tracking

---

## API Data Flow

```
Frontend (React)
    ↓
API Module (api.js)
    ↓
Vite Proxy (localhost:5000)
    ↓
Backend (FastAPI)
    ↓
Database (SQLite/PostgreSQL)
```

### Request/Response Cycle
1. Frontend calls `api.*()` functions
2. Vite dev server proxies to backend
3. Backend processes request with authentication
4. Returns JSON response
5. Frontend updates state and re-renders

---

## Testing the Dashboards

### Test Admin Dashboard
1. Login as Admin
2. Verify: Employee count, attendance, leaves, payroll visible
3. Charts should display attendance and leave data
4. Recent leave requests table populated

### Test Employee Dashboard
1. Login as Employee
2. Verify: Personal stats, attendance history, leaves
3. Company overview stats visible
4. AI insights showing

### Test HR Dashboard
1. Login as HR
2. Verify: Headcount, attendance, pending leaves
3. Leave approval table with action buttons
4. Can approve/reject leave requests

### Test Payroll Dashboard
1. Login as Payroll Officer
2. Click "Run Payroll" button
3. Verify: Payrun created with status
4. Payslips generated for employees
5. Charts show payroll data

### Test AI Insights Dashboard
1. Access from any role's dashboard
2. Verify: 4+ insights displaying
3. Click "Refresh Insights" to reload
4. Priority indicators showing (High/Medium/Low)

---

## Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution**:
- Ensure backend is running on port 5000
- Check `VITE_API_BASE_URL` in frontend `.env`
- Verify firewall allows localhost connections

### Issue: "API returns 401 Unauthorized"
**Solution**:
- Token might be expired
- Clear localStorage and login again
- Check backend JWT configuration

### Issue: "Port 5000/5173 already in use"
**Solution**:
```bash
# Find process using port (macOS/Linux)
lsof -i :5000
lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different ports in .env
```

### Issue: "Database migrations failed"
**Solution**:
```bash
# Reset database
rm database.db  # or PostgreSQL equivalent
python init_db.py
```

---

## Performance Tips

1. **Frontend Optimization**
   - Code splitting enabled in Vite
   - Lazy load dashboard components
   - Use React.memo for chart components

2. **Backend Optimization**
   - Database indexing on frequently queried fields
   - Pagination for large datasets
   - Caching for AI suggestions

3. **Network Optimization**
   - Batch API requests where possible
   - Debounce search inputs
   - Use HTTP compression

---

## Troubleshooting

### Enable Debug Mode
```javascript
// In api.js
const DEBUG = true;
if (DEBUG) console.log('API Call:', path, options);
```

### Check API Responses
Open browser DevTools → Network tab:
1. Monitor all API calls
2. Check response status codes
3. Verify JSON structure matches expectations

### Backend Logging
```python
# In FastAPI routers
import logging
logger = logging.getLogger(__name__)
logger.debug("Debug message")
```

---

## Next Steps

1. ✅ Install dependencies (both frontend & backend)
2. ✅ Start backend server
3. ✅ Start frontend development server
4. ✅ Create test user accounts
5. ✅ Test each dashboard functionality
6. ✅ Verify API data flow
7. ✅ Deploy to production

---

## Support & Documentation

### API Documentation
- FastAPI Swagger UI: `http://localhost:5000/docs`
- OpenAPI Schema: `http://localhost:5000/openapi.json`

### Frontend Documentation
- React Components: See `src/components/`
- API Utilities: See `src/lib/api.js`
- Routing: See `src/App.jsx`

### Database Schema
- See backend `models/` directory
- SQL migrations in `server/config/database.py`

---

**Happy using EmPay! 🚀**
