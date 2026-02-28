# 🚀 Quick Start Guide - Invenza

## Get Started in 3 Minutes

### Prerequisites
- MongoDB must be running (see MongoDB Setup below)
- Node.js and npm installed

---

## 📋 Quick Steps

### Step 1: Install MongoDB (One-Time Setup)

**Windows:**
1. Download from: https://www.mongodb.com/try/download/community
2. Run the MSI installer and follow the prompts
3. Choose "Install MongoDB as a Service"
4. MongoDB will auto-start on Windows boot

**Verify MongoDB is running:**
```bash
mongod --version
```

### Step 2: Start Backend Server

**Option A - Using npm start:**
```bash
cd backend
npm start
```

**Option B - Double-click START_BACKEND.bat (Windows)**

**Expected Output:**
```
MongoDB Connected: 127.0.0.1
Server is running in development on port: 5000
Invenza Production API is running!
```

### Step 3: Start Frontend Server

**Open a NEW terminal/PowerShell window:**
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v7.3.1  ready in 123 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Step 4: Open in Browser

Go to: **http://localhost:5173**

---

## ✅ Test Login/Signup

### Create Account
1. Click "Sign Up"
2. Fill in details:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Password: `password123`
3. Click "Sign Up"
4. You should be redirected to Dashboard ✓

### Login
1. Go to `/login` or click Logout then Login
2. Email: `john@example.com`
3. Password: `password123`
4. Click "Login"
5. You should see the Dashboard ✓

---

## 🔧 Troubleshooting

### Backend won't start
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
→ **MongoDB not running!** Start MongoDB first.

### Port 5000 already in use
```
Error: EADDRINUSE: address already in use :::5000
```
→ Kill the process using port 5000:
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Can't login/signup from frontend
→ Check:
1. Backend server is running (`npm start` in backend/)
2. Frontend trying to reach `http://localhost:5000`
3. Check browser Console (F12) for errors

### MongoDB won't start after installation
→ Run MongoDB service manually:
```bash
# Windows - Start MongoDB service
net start "MongoDB"

# Or use mongod command
mongod
```

---

## 📂 What's Running

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React UI |
| Backend | http://localhost:5000 | Node.js API |
| MongoDB | localhost:27017 | Database |

---

## 💾 Database

All user data is stored in MongoDB:
- Database: `invenza_forecasting`
- Collection: `users`

When you sign up, a new user document is created with:
- Encrypted password (bcrypt)
- JWT token issued
- Token stored in browser localStorage

---

## 🎯 What Works Now

✅ Create new user accounts (Signup)  
✅ Login with email/password  
✅ JWT authentication  
✅ Protected dashboard routes  
✅ Logout functionality  
✅ Session persistence  

---

## 📚 For More Details

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for comprehensive setup information.

---

## 🆘 Still Having Issues?

1. Check terminal output for error messages
2. Make sure MongoDB is running: `mongod`
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try in a private/incognito window
5. Check that backend is running on port 5000
6. Check that frontend is running on port 5173

**Still stuck?** Check the logs:
- Backend logs: Terminal where `npm start` runs
- Frontend logs: Browser DevTools (F12) → Console
- MongoDB logs: Terminal where `mongod` runs

---

**Happy forecasting! 📊**
