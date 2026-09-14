# 📚 Library Management System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Railway%20Cloud-00C7B7?style=for-the-badge&logo=railway&logoColor=white)](https://web-production-e483c.up.railway.app)
[![Backend](https://img.shields.io/badge/Backend-Java%2021-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://web-production-e483c.up.railway.app)
[![Database](https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://web-production-e483c.up.railway.app)
[![Frontend](https://img.shields.io/badge/Frontend-HTML5%2FCSS3%2FJS-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://web-production-e483c.up.railway.app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

A modern, full-stack Library Management System featuring Google OAuth 2.0 & Role-Based Access Control (Admin / User), stack copy inventory management (multiple copies per title), automated member approval, and borrowing/return request lifecycles.

---

## 🌐 Live Web Application

The application is deployed and running live on Railway Cloud:

* **🚀 Main Website / Portal**: **[https://web-production-e483c.up.railway.app](https://web-production-e483c.up.railway.app)**
* **🔐 Login Page**: **[https://web-production-e483c.up.railway.app/login.html](https://web-production-e483c.up.railway.app/login.html)**
* **🛠️ Admin Dashboard**: **[https://web-production-e483c.up.railway.app/dashboard.html](https://web-production-e483c.up.railway.app/dashboard.html)**
* **👤 User / Student Dashboard**: **[https://web-production-e483c.up.railway.app/user-dashboard.html](https://web-production-e483c.up.railway.app/user-dashboard.html)**


---

## 🌟 Key Features

- **Google OAuth 2.0 & JWT Authentication**: Seamless Google Sign-In via Google Identity Services (GIS) and secure token-based sessions.
- **Strict Role-Based Access Control (RBAC)**:
  - **Administrator**: Add/delete books with custom stack copies, manage members, approve/reject borrowing requests, approve/reject return requests, and review membership applications.
  - **User / Member**: Browse catalogue, view real-time copy availability badges, submit issue/borrow requests, submit return requests, and apply for library membership.
- **📚 Multiple Stack Copies Inventory**:
  - Full tracking of `total_copies` and `available_copies` per book title (default 10 copies).
  - Real-time stock decrementing on borrowing and incrementing on returns.
  - Automatic out-of-stock badges and lockouts when copies reach 0.
- **🔄 Complete Issue & Return Workflow**:
  - Users request to borrow or return books.
  - Admins review and approve/reject requests with instant inventory updates.
- **👥 Member Self-Registration & Approval**:
  - Users can submit a membership request with their desired Member ID and Name.
  - Admins review pending requests in the Admin Dashboard to approve or reject them.
- **⚡ Full-Stack Single-Port Capability**:
  - Pure Java backend (`Server.java`) serves both static assets and REST API routes directly on port `8080`.
  - Node.js proxy (`server.js`) available on port `3000`.
- **☁️ Cloud-Ready Database Layer**:
  - Compatible with MySQL 8.0 & 9.4.
  - Supports `DATABASE_URL`, `MYSQL_URL`, and `LIBRARY_DB_URL` with automatic table migrations and schema integrity checks.

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
- **Primary Access URL (Desktop)**: [http://localhost:8080](http://localhost:8080)
- **Secondary Proxy URL (Desktop)**: [http://localhost:3000](http://localhost:3000)

### 📱 Accessing from Mobile Phone (Chrome / Safari)
To open and test the application on your phone's browser:
1. **Connect both devices**: Ensure your phone and PC are connected to the **same Wi-Fi network**.
2. **Find your Wi-Fi IPv4 address**: The server prints this automatically upon starting (e.g. `10.128.107.212` or `192.168.x.x`). You can also run `ipconfig` in PowerShell to check.
3. **Open Chrome on your phone**: Type `http://<YOUR-PC-IP>:8080` or `http://<YOUR-PC-IP>:3000` (e.g. `http://10.128.107.212:8080`).
   > ⚠️ **Important**: Do not use `localhost` or `127.0.0.1` on your phone! On a phone, `localhost` points to the phone itself, not your PC.
4. **Windows Firewall**: If the page does not load on your phone, allow Java / Node.js in Windows Defender Firewall or temporarily add an inbound rule for ports `8080` and `3000`.

---

## 🔑 Google OAuth 2.0 Configuration

To enable Google Sign-In:
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Edit your OAuth 2.0 Web Client ID.
3. Under **Authorized JavaScript origins**, add:
   ```text
   https://web-production-e483c.up.railway.app
   http://localhost:8080
   http://localhost:3000
   ```
4. Under **Authorized redirect URIs**, add:
   ```text
   https://web-production-e483c.up.railway.app
   http://localhost:8080
   http://localhost:3000
   ```
5. Click **Save** (changes propagate within 2-5 minutes).

---

## ☁️ Production Deployment

### Option 1: Railway Cloud (Recommended)
1. Go to [railway.app](https://railway.app) and create a **New Project**.
2. Click **Provision MySQL**.
3. Click **New** -> **GitHub Repo** and connect this repository: `Library-Management-System-Web`.
4. Under **Variables** in your web service, configure:
   - `PORT`: `8080`
   - `DATABASE_URL`: `${{MySQL.MYSQL_URL}}` *(Automatically linked by Railway)*
   - `GOOGLE_CLIENT_ID`: Your Google Client ID
   - `ADMIN_EMAIL`: Your admin email
   - `ADMIN_PASSWORD`: Your admin password
5. Under **Settings -> Networking**, click **Generate Domain**.

### Option 2: Docker Compose (VPS / Ubuntu / AWS EC2)
```bash
git clone https://github.com/sovan6296410989-eng/Library-Management-System-Web.git
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
| `PORT` / `BACKEND_PORT` | Port for the application 
| `LIBRARY_DB_URL` | JDBC database connection string 
| `DATABASE_URL` / `MYSQL_URL` | Cloud MySQL connection URL | Auto-converted to JDBC format |
| `LIBRARY_DB_USER` | MySQL username 
| `LIBRARY_DB_PASSWORD` | MySQL password 
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Web Client ID | Default embedded |
| `ADMIN_EMAIL` | Admin bootstrap email
| `ADMIN_PASSWORD` | Admin bootstrap password 

---

## 📜 License
This project is open-source under the [MIT License](LICENSE).
