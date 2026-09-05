# CryptoTrace Forensics: Quick Launch Script (PowerShell)
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  CryptoTrace Forensics Platform - Dev Environment" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Check Python
$pythonPath = "C:\Users\tp229\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $pythonPath)) {
    $pythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source
}

if (-not $pythonPath) {
    Write-Host "[ERROR] Python 3.11+ is required but was not found." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Using Python: $pythonPath" -ForegroundColor Green

# 2. Check Node.js
$nodeDir = "C:\Program Files\nodejs"
if (Test-Path $nodeDir) {
    $env:PATH = "$nodeDir;" + $env:PATH
}
Write-Host "[OK] Node.js environment configured in PATH" -ForegroundColor Green

# 3. Seed Database
Write-Host "[INFO] Verifying / Seeding local database..." -ForegroundColor Yellow
$env:PYTHONPATH = "server;worker"
& $pythonPath "server/app/core/seed.py"
Write-Host "[OK] Database seeded successfully." -ForegroundColor Green

# 4. Prompt Launch Mode
Write-Host ""
Write-Host "Select execution mode:" -ForegroundColor White
Write-Host "  [1] Start Backend API Gateway (Port 8000)" -ForegroundColor Cyan
Write-Host "  [2] Start Frontend Workstation (Port 3000)" -ForegroundColor Cyan
Write-Host "  [3] Run Automated Verification Test Suite (PyTest)" -ForegroundColor Cyan
Write-Host "  [4] Launch Docker Stack (Postgres, Neo4j, Redis)" -ForegroundColor Cyan
Write-Host "  [5] Exit" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter option [1-5]"

switch ($choice) {
    "1" {
        Write-Host "[INFO] Starting FastAPI Backend on http://localhost:8000/docs ..." -ForegroundColor Cyan
        Set-Location "server"
        & $pythonPath -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    }
    "2" {
        Write-Host "[INFO] Starting Next.js Workstation on http://localhost:3000 ..." -ForegroundColor Cyan
        Set-Location "client"
        & "$nodeDir\npm.cmd" run dev
    }
    "3" {
        Write-Host "[INFO] Running PyTest test suite..." -ForegroundColor Cyan
        & $pythonPath -m pytest server/tests -v -W ignore::DeprecationWarning
    }
    "4" {
        Write-Host "[INFO] Launching Docker Compose stack..." -ForegroundColor Cyan
        docker compose up -d postgres neo4j redis
    }
    default {
        Write-Host "Exiting." -ForegroundColor Gray
    }
}
