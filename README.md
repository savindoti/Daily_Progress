# Daily Support Dashboard

This workspace now contains a complete React + Django support dashboard.

## Apps

- `frontend/`: React dashboard built with Vite
- `backend/`: Django API with SQLite storage

## What it does

- Captures new support records with the required fields
- Starts a timer when a support is created
- Lets users toggle support status between pending, ongoing, and resolved
- Stops the timer when status changes to resolved
- Shows daily task rows, yesterday's tasks, and summary cards
- Exports Excel reports for all dates or a selected date with serial numbers

## Run locally

Backend:

```powershell
cd D:\Daily_Dashboard\backend
& 'C:\Program Files\ArcGIS\Pro\bin\Python\envs\arcgispro-py3\python.exe' manage.py migrate
& 'C:\Program Files\ArcGIS\Pro\bin\Python\envs\arcgispro-py3\python.exe' manage.py runserver
```

Frontend:

```powershell
cd D:\Daily_Dashboard\frontend
npm.cmd install
npm.cmd run dev
```
