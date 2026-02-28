# Invenza - Complete Setup Guide

## Overview
This guide will help you set up MongoDB, the backend server, and the frontend to make login/signup work properly.

## Prerequisites
- Node.js & npm (already installed)
- MongoDB (needs to be installed)

---

## Step 1: Install MongoDB Community Edition

### Option A: Manual Installation (Recommended for Windows)

1. **Download MongoDB Community Edition:**
   - Go to https://www.mongodb.com/try/download/community
   - Select **Windows** as the OS
   - Download the MSI installer (latest stable version)
   - Run the installer and follow the prompts
   - Choose "Install MongoDB as a Service" for auto-start

2. **Verify Installation:**
   ```powershell
   mongod --version
   ```

3. **Start MongoDB Service:**
   - If installed as a service, it will auto-start
   - Or manually start via Services app: `services.msc` → Find "MongoDB Server" → Start

### Option B: Using MongoDB Atlas (Cloud - No Local Installation)

If you prefer not to install MongoDB locally:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account and cluster
3. Update `.env` file in `backend/` folder:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/invenza_forecasting
   ```
4. Use your Atlas connection string

### Option C: Using Docker (If Docker is installed)

```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## Step 2: Verify MongoDB is Running

```powershell
mongo  # or mongosh for newer versions
```

If successfully connected, you'll see the MongoDB shell. Type `exit` to quit.

---

## Step 3: Start the Backend Server

```powershell
cd backend
npm start
# or: node server.js
```

You should see:
```
MongoDB Connected: 127.0.0.1
Server is running in development on port: 5000
Invenza Production API is running!
```

---

## Step 4: Start the Frontend Server

Open a **new terminal** window:

```powershell
cd frontend
npm run dev
```

The frontend will open at: http://localhost:5173

---

## Step 5: Test Login/Signup

1. Open http://localhost:5173
2. Click "Sign Up" to create a new account
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
3. Click "Login" to test with the new credentials

---

## Common Issues and Solutions

### MongoDB Connection Refused
**Error:** `connect ECONNREFUSED 127.0.0.1:27017`
- **Solution:** Make sure MongoDB service is running
  ```powershell
  net start MongoDB  # For Windows service
  ```

### Port 5000 Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`
- **Solution:** Kill the process using port 5000
  ```powershell
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

### Frontend Can't Connect to Backend
**Error:** `404 Bad Gateway` or network errors when logging in
- **Solution:** 
  - Ensure backend is running on port 5000
  - Check CORS is enabled in `backend/app.js`
  - Verify `frontend/src/api/axios.js` has correct baseURL: `http://localhost:5000`

### MongoDB Database Already Exists Error
- **Solution:** This is normal the first time. The collection `users` will be created automatically.

---

## Project Structure

```
Inventory_Demand_Forecasting_Tool/
├── backend/                    # Node.js/Express API
│   ├── config/db.js           # MongoDB connection
│   ├── models/User.js         # User schema
│   ├── routes/authRoutes.js   # Auth endpoints (/api/auth/login, /api/auth/signup)
│   ├── services/authService.js # Business logic
│   └── server.js              # Start here
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── pages/Login.jsx     # Login page
│   │   ├── pages/Signup.jsx    # Signup page
│   │   ├── context/AuthContext.jsx # Auth state management
│   │   └── api/axios.js        # API client config
│   └── package.json
└── app.py                       # Python forecasting engine (runs separately)
```

---

## API Endpoints

### Authentication Routes
- **POST** `/api/auth/signup` - Create new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- **POST** `/api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

Both endpoints return:
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "jwt_token_here",
  "role": "manager"
}
```

---

## Troubleshooting Checklist

- [ ] MongoDB is installed and running
- [ ] Backend dependencies installed (`npm install` in backend/)
- [ ] Backend server running on port 5000
- [ ] Frontend dependencies installed (should already be done)
- [ ] Frontend running on port 5173
- [ ] `.env` file exists in backend/ with correct MONGODB_URI
- [ ] No firewall blocking ports 5000 and 5173

---

## Need Help?

Check the logs:
- **Backend Logs:** Check terminal where backend is running
- **Frontend Logs:** Open developer console (F12) → Console tab
- **MongoDB Logs:** Check MongoDB service logs or terminal output
