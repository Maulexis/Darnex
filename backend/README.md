# 🚂 Railway Simulation Backend

This project powers a real-time railway simulation system.  
It provides APIs and WebSocket streams to track train positions live.  

---

## 📦 Prerequisites

Before running the project, install the following:

- **Node.js** → [Download](https://nodejs.org/)  
- **PostgreSQL** → [Download](https://www.postgresql.org/download/)  
- **Redis** → [Download](https://redis.io/download)  

### Mac (using Homebrew)
```bash
brew install node
brew install postgresql
brew install redis
```

### Windows (Manual Install)
- Node.js → [Node.js Installer](https://nodejs.org/)  
- PostgreSQL → [PostgreSQL Installer](https://www.postgresql.org/download/windows/)  
- Redis → [Redis for Windows](https://github.com/microsoftarchive/redis/releases)  

---

## ⚙️ Project Setup

### 1. Clone the Repository
```bash
git clone [repository URL]
cd [your-project-folder]
```

### 2. Update Database Credentials
Edit `src/services/db.js`:
```javascript
const pool = new Pool({
  user: 'your_username',    // PostgreSQL username (e.g., 'postgres')
  host: 'localhost',
  database: 'railway_sim_db',
  password: 'your_password', // PostgreSQL password
  port: 5432,
});
```

### 3. Set Up the Database
Start PostgreSQL & Redis, then run:
```bash
# Enter PostgreSQL shell
psql -d postgres

# Inside psql
CREATE DATABASE railway_sim_db;
CREATE ROLE postgres WITH LOGIN PASSWORD 'your_password';
ALTER DATABASE railway_sim_db OWNER TO postgres;
\q

# Load schema & seed data
psql -U postgres -d railway_sim_db -a -f src/db/migrations/20250915_initial_schema.sql
psql -U postgres -d railway_sim_db -a -f src/db/seed/seed_data.sql
```

### 4. Install Node.js Dependencies
```bash
npm install
```

### 5. Start the Backend
```bash
npm start
```
👉 Server will be running at: **http://localhost:3000**

---

## 🔴 Real-Time Updates

The backend broadcasts **live train positions** via WebSockets.  

### Client Setup
Create a file `client.js`:
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('✅ Connected to backend server!');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('🚂 Train update received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket Error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from the server.');
};
```

Install WebSocket client:
```bash
npm install ws
```

Run the client:
```bash
node client.js
```

---
## 📡 API Endpoints

### 1. Get Station Snapshot
```
GET /api/v1/sections/:station_code/snapshot
Example: http://localhost:3000/api/v1/sections/JP/snapshot
```

### 2. Get Train Details
```
GET /api/v1/trains/:train_no
Example: http://localhost:3000/api/v1/trains/12986
```

---

## 🔔 WebSocket Simulation

- **URL**: `ws://localhost:3000`  
- **Event**: `trainUpdate`  
- **Payload**: JSON object with latest train position  

---

## ✅ Verification
1. Start backend (`npm start`)  
2. Start client (`node client.js`)  
3. You should see live train updates in the terminal  
