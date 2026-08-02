# AI-Powered Smart Personal Finance Management System

This is a production-quality, secure, and optimized smart personal finance management system. It integrates transaction accounts, budgets, savings goals, due reminders, receipt scans, voice-command expense entry, global filters, ML predictions, AI optimizations, and PDF reports generation.

## Project Architecture

```
                      +-------------------+
                      |   React 19 web    |
                      |   (Vite Client)   |
                      +---------+---------+
                                |
                                | REST API Requests
                                v
                      +---------+---------+
                      |   FastAPI Gateway |
                      |    (API Router)   |
                      +---------+---------+
                                |
        +-----------------------+-----------------------+
        |                       |                       |
        v                       v                       v
+-------+-------+       +-------+-------+       +-------+-------+
|  SQLAlchemy   |       |  Machine      |       |  Polymorphic  |
|  ORMs & MySQL |       |  Learning     |       |  Storage      |
+---------------+       +---------------+       +---------------+
```

---

## Installation & Setup

Follow these commands to deploy the backend and frontend on your local system:

### 1. Database Configuration
Ensure MySQL database server is active and create a database named `finance`:
```sql
CREATE DATABASE finance;
```

### 2. Backend Services
Navigate to the `backend/` folder:
```bash
cd backend
```

Create a virtual environment:
```bash
python -m venv venv
```

Activate the virtual environment:
- Windows:
  ```bash
  venv\Scripts\activate
  ```
- Unix/macOS:
  ```bash
  source venv/bin/activate
  ```

Install dependencies:
```bash
pip install -r requirements.txt
```

Verify tables structure and configurations by running uvicorn server:
```bash
uvicorn app.main:app --reload
```

The server runs on `http://localhost:8000`. You can inspect the OpenAPI spec docs at `http://localhost:8000/docs`.

### 3. Frontend Client
Navigate to the `frontend/` folder:
```bash
cd ../frontend
```

Install packages:
```bash
npm install
```

Launch Vite development client:
```bash
npm run dev
```

The frontend client launches on `http://localhost:5173`.

---

## Key Modules & Specifications

### 1. Machine Learning Forecasting
The system features an integrated regression pipeline [expense_trainer.py](file:///c:/Users/Lenovo/Documents/aaropro/finance/backend/app/ai/trainers/expense_trainer.py):
- Fits `LinearRegression`, `RandomForestRegressor`, or `XGBoostRegressor` on user category expense weights.
- Trained model weights are serialized using `joblib` under `backend/app/ai/models/`.
- Fallbacks: If historical records are fewer than 5 rows, the predictor falls back to a weighted moving average.

### 2. Anomaly & Outlier Scans
- Uses `IsolationForest` to analyze transaction amounts, category, month, and day-of-week variables.
- Outlier warnings are categorized by severity levels (HIGH, MEDIUM, LOW) and logged directly to the `anomalies` table.

### 3. Financial Health Gauge
- Evaluates cash status daily, yielding a rating (0-100) and mapping it to status indicators (*Critical*, *Poor*, *Good*, *Excellent*).

### 4. Automatic Scheduler
- Uses `APScheduler` [scheduler.py](file:///c:/Users/Lenovo/Documents/aaropro/finance/backend/app/scheduler/scheduler.py) to manage background tasks:
  - Daily: updates health score indices, scans for anomaly outliers, audits subscription charges.
  - Weekly: retrains ML prediction models.

### 5. Centralized Logging
Logs are structured under `backend/logs/` with rotating log files:
- `application.log`: Logs general request cycles and system startups.
- `errors.log`: Logs warning states and exception tracebacks.
- `scheduler.log`: Logs background schedulers tasks.
