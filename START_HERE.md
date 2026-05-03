# 🚀 EmPay - Start Backend & Frontend

## Quick Start Commands

### Terminal 1: Start Backend (FastAPI)

```powershell
# Navigate to backend directory
cd "EmPay--Smart-HR-Management-System\EmPay--Smart-HR-Management-System"

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Run backend server
python main.py
```

**✅ Backend will start at: http://localhost:5000**

---

### Terminal 2: Start Frontend (React + Vite)

```powershell
# Navigate to frontend directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

**✅ Frontend will start at: http://localhost:5173**

---

## 🌐 Access Application

### Open Browser
**http://localhost:5173**

### Demo Credentials (Click buttons on login page)

| Role | Email | Password |
|------|-------|----------|
| 🔐 Admin | admin@empay.com | admin123 |
| 👤 Employee | emp@empay.com | emp123 |
| 📋 HR | hr@empay.com | hr123 |
| 💰 Payroll | payroll@empay.com | payroll123 |

---

## 📊 Available Dashboards

After logging in, you'll be automatically redirected to your role's dashboard:

1. **Admin Dashboard** - System overview & management
   - View all employees
   - Monitor attendance
   - Track leaves
   - View payroll

2. **Employee Dashboard** - Personal workspace
   - My attendance
   - My leaves
   - My salary info
   - AI insights

3. **HR Dashboard** - Leave & attendance management
   - Approve/reject leave requests
   - View headcount
   - Monitor attendance
   - Manage queries

4. **Payroll Dashboard** - Salary processing
   - Run payroll
   - View payruns
   - Generate payslips
   - Track payments

5. **AI Insights** - Smart recommendations (accessible from any role)
   - AI-powered insights
   - Attendance alerts
   - Performance trends

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend App | http://localhost:5173 | Main application |
| Backend API | http://localhost:5000 | REST API |
| API Docs | http://localhost:5000/docs | Swagger UI documentation |
| Health Check | http://localhost:5000/health | Backend status |

---

## ⚡ Quick Login Flow

1. Open **http://localhost:5173** in browser
2. On login page, click one of the demo role buttons
3. Credentials auto-fill
4. Click "Sign In"
5. Automatically redirected to your dashboard

---

## 🛠️ If Something Doesn't Work

### Backend Won't Start
```bash
# Check Python version
python --version

# Verify dependencies installed
pip list | grep -i fastapi

# Try reinstalling
pip install -r requirements.txt --force-reinstall
```

### Frontend Won't Start
```bash
# Check Node version
node --version

# Clear npm cache and reinstall
npm cache clean --force
rm -r node_modules
npm install

# Try with different port
npm run dev -- --port 3000
```

### Port Already in Use

#### On Windows PowerShell:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3000
```

#### On Mac/Linux:
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

---

## 📝 Test User Credentials (if needed)

You can also manually enter these credentials:

```
Email: admin@empay.com
Password: admin123

Email: emp@empay.com
Password: emp123

Email: hr@empay.com
Password: hr123

Email: payroll@empay.com
Password: payroll123
```

---

## ✅ Startup Checklist

- [ ] Backend started on http://localhost:5000
- [ ] Frontend started on http://localhost:5173
- [ ] Can access login page
- [ ] Can click demo credential buttons
- [ ] Credentials auto-fill correctly
- [ ] Can login successfully
- [ ] Dashboard loads with data
- [ ] Can navigate between pages
- [ ] Charts and tables display correctly

---

## 🎯 What's Included

✅ **5 Complete Dashboards**
- Admin Dashboard
- Employee Dashboard
- HR Dashboard
- Payroll Dashboard
- AI Insights Dashboard

✅ **Full Backend Integration**
- Real API endpoints
- JWT authentication
- Database persistence
- CORS configured

✅ **Features**
- Employee management
- Attendance tracking
- Leave requests & approvals
- Payroll processing
- AI-powered insights
- Charts & analytics

---

## 📚 Documentation

For more details, see:
- [QUICK_START.md](./QUICK_START.md) - 3-minute setup
- [SETUP_AND_RUN.md](./SETUP_AND_RUN.md) - Comprehensive guide
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details

---

## 🆘 Support

If you encounter issues:

1. **Check the logs** in both terminal windows
2. **Verify all services are running**:
   - Backend on 5000
   - Frontend on 5173
3. **Try the demo buttons** on login page
4. **Clear browser cache** (Ctrl+Shift+Delete)
5. **Restart both services**

---

**Happy using EmPay! 🎉**

Questions? Check the documentation files in the project root.
