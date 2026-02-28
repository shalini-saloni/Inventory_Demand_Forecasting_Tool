# Invenza - Start All Services Script
# This script will start MongoDB, Backend, and Frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Invenza - Inventory Demand Forecasting" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "[1/3] Checking MongoDB..." -ForegroundColor Yellow
$mongod_check = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongod_check) {
    Write-Host "✓ MongoDB is already running" -ForegroundColor Green
} else {
    Write-Host "ℹ MongoDB is not running." -ForegroundColor Yellow
    Write-Host "Start MongoDB manually or use: mongod" -ForegroundColor Yellow
    Write-Host ""
}

# Start Backend
Write-Host "[2/3] Starting Backend Server..." -ForegroundColor Yellow
Push-Location backend
Start-Process powershell -ArgumentList "npm start" -NoNewWindow
Pop-Location
Write-Host "✓ Backend starting on http://localhost:5000" -ForegroundColor Green
Write-Host ""

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[3/3] Starting Frontend Server..." -ForegroundColor Yellow
Push-Location frontend
Start-Process powershell -ArgumentList "npm run dev" -NoNewWindow
Pop-Location
Write-Host "✓ Frontend starting on http://localhost:5173" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All servers starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Make sure MongoDB is running before proceeding!" -ForegroundColor Yellow
Write-Host "To start MongoDB: mongod" -ForegroundColor Yellow
