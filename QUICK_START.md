# EmPay - Quick Start Guide

## 🚀 Start in 3 Minutes

### Terminal 1: Backend
```bash
cd EmPay--Smart-HR-Management-System/EmPay--Smart-HR-Management-System
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
# ✅ Backend running at http://localhost:5000
```

### Terminal 2: Frontend
```bash
cd client
npm install
npm run dev
# ✅ Frontend running at http://localhost:5173
```

---

## 📊 Access Dashboards

### URLs
- **Admin**: http://localhost:5173 → Login as Admin → `/dashboard/admin`
- **Employee**: http://localhost:5173 → Login as Employee → `/dashboard/employee`
- **HR**: http://localhost:5173 → Login as HR → `/dashboard/hr`
- **Payroll**: http://localhost:5173 → Login as Payroll Officer → `/dashboard/payroll`
- **AI Insights**: http://localhost:5173 → Any role → `/dashboard/ai`

### Test Credentials (Configure in Backend)
```
Email: admin@empay.com
Password: admin123

Email: emp@empay.com
Password: emp123
```

---

## ✨ What You Get

✅ **5 Complete Dashboards**
- Admin Dashboard - Full system view
- Employee Dashboard - Personal workspace
- HR Dashboard - Leave & attendance management
- Payroll Dashboard - Salary & payroll processing
- AI Insights Dashboard - Smart recommendations

✅ **Backend Connected**
- Real-time API integration
- JWT authentication
- Database persistence
- CORS configured

✅ **Features Included**
- Employee management
- Attendance tracking
- Leave requests & approvals
- Payroll processing
- AI-powered insights

---

## 🔗 API Integration

All 5 dashboards connect to these backend endpoints:
- `/api/employees` - Employee data
- `/api/attendance/logs` - Attendance records
- `/api/leave/list` - Leave requests
- `/api/payroll/payruns` - Payroll data
- `/api/ai/suggest` - AI insights

---

## 📚 Full Documentation
See [SETUP_AND_RUN.md](./SETUP_AND_RUN.md) for detailed setup instructions.

---

**That's it! You now have a fully functional HR management system! 🎉**
