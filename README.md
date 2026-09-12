# 📚 Library Management System

A full-stack Library Management System with Google OAuth 2.0 & Role-Based Access Control (Admin / User), real-time book availability tracking, and automated member borrowing requests.

---

## 🌟 Features

- **Google OAuth 2.0 & Email/Password Authentication**: Seamless Google Sign-In via Google Identity Services (GIS).
- **Strict Role Separation**:
  - **Administrator**: Add/delete books, register members, approve/reject borrowing requests.
  - **User / Member**: Browse catalogue, view live availability, submit borrow requests, return books.
- **Full-Stack Single-Port Capability**: Java backend serves both static assets and API routes directly on port `8080`, with an optional Node.js proxy server on port `3000`.
- **Cloud-Ready Database Layer**: Supports standard MySQL and cloud connection strings (`DATABASE_URL`, `MYSQL_URL`, `LIBRARY_DB_URL`) with automatic connection retry logic.
- **Production-Ready**: Configured for Docker, Docker Compose, Railway, and Render.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Java JDK 21+**
- **Node.js 18+**
- **MySQL Server** (running locally on port `3306`)

### 1. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your database credentials in `.env` match your MySQL setup:
```env
LIBRARY_DB_URL=jdbc:mysql://localhost:3306/library_db
LIBRARY_DB_USER=root
LIBRARY_DB_PASSWORD=your_mysql_password
```

### 2. Run the Application
Run everything with a single command:
```bash
npm run dev
```
*(Or `node start-all.js`)*

The system will compile the Java backend and launch the servers:
- **Primary Access URL**: [http://localhost:8080](http://localhost:8080)
- **Secondary Proxy URL**: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Google OAuth 2.0 Configuration

To enable Google Sign-In locally:
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Edit your OAuth 2.0 Web Client ID.
3. Under **Authorized JavaScript origins**, add:
   ```text
   http://localhost:8080
   http://localhost:3000
   http://localhost
   ```
4. Under **Authorized redirect URIs**, add:
   ```text
   http://localhost:8080
   http://localhost:3000
   ```
5. Click **Save** (allow 2-3 minutes to propagate).

---

## ☁️ Production Deployment

### Option 1: Railway (Recommended — 3 Minutes)
1. Go to [railway.app](https://railway.app) and create a **New Project**.
2. Click **Provision MySQL**.
3. Click **New** -> **GitHub Repo** and connect this repository.
4. Under **Variables** in your web service, set:
   - `PORT`: `8080`
   - `DATABASE_URL`: `${{MySQL.MYSQL_URL}}` *(Automatically linked by Railway)*
   - `GOOGLE_CLIENT_ID`: Your Google Client ID
   - `ADMIN_EMAIL`: Your admin email
   - `ADMIN_PASSWORD`: Your admin password
5. Under **Settings -> Networking**, click **Generate Domain** (e.g. `https://library-app.up.railway.app`).
6. Add your Railway domain to **Authorized JavaScript origins** in Google Cloud Console.

### Option 2: Docker Compose (VPS / Ubuntu / AWS EC2)
```bash
git clone <your-repo-url>
cd LibraryManagementSystem
docker-compose up -d --build
```
Access at `http://your-server-ip:3000` or `http://your-server-ip:8080`.

### Option 3: Single Docker Container
```bash
docker build -t library-system .
docker run -p 8080:8080 -e DATABASE_URL="mysql://user:pass@host:3306/db" library-system
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` / `BACKEND_PORT` | Port for the application | `8080` (Java) / `3000` (Node) |
| `LIBRARY_DB_URL` | JDBC database connection string | `jdbc:mysql://localhost:3306/library_db` |
| `DATABASE_URL` / `MYSQL_URL` | Cloud MySQL connection URL | Auto-converted to JDBC format |
| `LIBRARY_DB_USER` | MySQL username | `root` |
| `LIBRARY_DB_PASSWORD` | MySQL password | `721127` |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Web Client ID | Default embedded |
| `ADMIN_EMAIL` | Admin account bootstrap email | `sovan6296410989@gmail.com` |
| `ADMIN_PASSWORD` | Admin account bootstrap password | `admin123` |

---

## 📜 License
MIT
