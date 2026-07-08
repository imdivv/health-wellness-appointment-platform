# Health & Wellness Appointment Scheduling Platform (Backend)

An enterprise-grade, cloud-native backend built with Node.js and Express.js, configured to integrate with Azure cloud resources (Azure SQL Database, Azure Blob Storage, and Azure Communication Services). This codebase is designed using clean MVC architecture and industry-standard security boundaries.

---

## 🚀 Tech Stack Summary

* **Runtime & Framework**: Node.js (ES Modules) & Express.js
* **Database & ORM**: Azure SQL Database (MSSQL) with Sequelize ORM
* **Authentication**: JSON Web Token (JWT) & bcrypt password hashing
* **File Upload**: Multer (In-memory buffer streaming)
* **Cloud Storage**: Azure Blob Storage (Temporary 15-minute SAS download URLs)
* **Notifications**: Azure Communication Services (Email & SMS Reminders)
* **Scheduler**: node-cron (Daily scan task at 8:00 AM)
* **Documentation**: Swagger/OpenAPI UI
* **Security & Headers**: Helmet, CORS, and centralized express-validator filters

---

## 📂 Project Directory Walkthrough

Share this directory layout with teammates so they know where to edit:
```
d:\Health and Wellness Appointment Scheduling Platform/
├── database/
│   └── schema.sql       # SQL DDL Scripts (Share this with Azure SQL Engineer)
├── src/
│   ├── config/          # DB connections and Env schemas loading
│   ├── controllers/     # Controller layers (thin, delegates to services)
│   ├── middleware/      # Auth guards, multer upload filters, error handler
│   ├── models/          # Sequelize schemas (tables definitions and associations)
│   ├── routes/          # API route mappings (contains Swagger JSDocs)
│   ├── services/        # Service layers (SQL transactions and Azure Blob/ACS calls)
│   ├── utils/           # Central response format helper
│   ├── validators/      # express-validator schemas (type and strength checks)
│   ├── swagger/         # Swagger setup bootstrap
│   ├── app.js           # Express app setup
│   └── server.js        # Boot file and Cron scheduler initialization
├── postman_collection.json # Local API tests scripts (Share this with Frontend Engineer)
├── README.md            # Teammates onboarding and integration guide
└── .env.example         # App environment config template
```

---

## 💻 Integration Guide for Frontend Teammates

### 1. API Endpoint Base URL
```
http://localhost:5000/api/v1
```

### 2. Authorization Header format
All protected routes require you to pass the access token in the request headers:
```http
Authorization: Bearer <accessToken>
```

### 3. Centralized JSON Output Format

**Success Payload (e.g. 200 OK / 201 Created):**
```json
{
  "success": true,
  "message": "User login successful",
  "data": {
    "user": { "id": "uuid", "fullName": "Jane", "role": "Patient" },
    "tokens": { "accessToken": "jwt...", "refreshToken": "jwt...", "expiresIn": "1d" }
  }
}
```

**Error Payload (e.g. 400 Bad Request / 401 Unauthorized / 409 Conflict):**
```json
{
  "success": false,
  "message": "Validation failed: Invalid inputs",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

### 4. Primary API Operations Mapped
* **Authentication** (`/auth`): `/register`, `/login`, `/profile` (GET/PUT), `/change-password`.
* **Doctor Profiles** (`/doctors`):
  * `POST /` — Create profile (specialization, qualification, fee, hospital).
  * `GET /?specialization=X` — Search doctors.
  * `POST /:doctorId/availability` — Configure availability slots (e.g., Monday 09:00 - 12:00).
* **Appointments Scheduling** (`/appointments`):
  * `POST /` — Book slot (performs transaction-safe double-booking and availability range checks).
  * `PUT /:id/reschedule` — Reschedule slot.
  * `PUT /:id/cancel` — Cancel slot.
* **Medical Documents** (`/medical-records`):
  * `POST /upload` — Upload PDF/PNG/JPG reports (max 10MB).
  * `GET /:id/download` — Generates a secure, 15-minute temporary SAS download token to fetch file directly from Azure.
* **Admin Dashboard** (`/admin`):
  * `GET /stats` — Retrieve system stats (counts, average fees, dispatch logs).
  * `PUT /users/:id/role` — Promote user roles (e.g., Patient to Doctor).

*Note: For testing, load [postman_collection.json](postman_collection.json) into Postman or open `http://localhost:5000/api-docs` on your browser.*

---

## ☁ Integration Guide for Azure Cloud Engineers

This backend automatically synchronizes Sequelize models with your SQL server on launch, but you can also execute the DDL scripts directly.

### 1. Database Provisioning
Run the SQL DDL commands located in [database/schema.sql](database/schema.sql) on your Azure SQL Database server. Ensure you add a firewall rule to **Allow Azure services to access this server** so your App Service can connect.

### 2. Azure Storage Account Container
Create a container named `medical-records` in your Storage Account. Make sure you set the Container access level to **Private** (or 'Blob' if needed; SAS token validation will secure files in either container mode).

### 3. Azure Communication Services (ACS)
Acquire a Phone Number (Toll-Free or Short Code) in ACS and input it in `communication.service.js` (default: `+18885550199`). Verify your sender domain in ACS Email Client settings to enable email notifications.

### 4. App Service Environment Variables
Add these key-value configurations under **App Service Settings -> Configuration**:
```ini
PORT=80
NODE_ENV=production
JWT_SECRET=YOUR_SECURE_RANDOM_KEY
JWT_EXPIRES_IN=1d

DB_HOST=YOUR_DATABASE_SERVER.database.windows.net
DB_NAME=health_wellness_db
DB_USER=YOUR_DB_ADMIN_LOGIN
DB_PASSWORD=YOUR_DB_ADMIN_PASSWORD
DB_PORT=1433

AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=medical-records

AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://...;accesskey=...
```

---

## 🛠 Team Git Collaboration Workflow

To push this backend codebase to GitHub on a separate branch and review it via Pull Request, follow these steps:

1. **Initialize Git & Checkout Main**:
   ```bash
   git init
   git checkout -b main
   ```
2. **Stage & Commit Baseline**:
   ```bash
   git add .
   git commit -m "chore: initial project configuration and skeleton"
   ```
3. **Create and Switch to Feature Branch**:
   ```bash
   git checkout -b feature/backend-implementation
   ```
4. **Push to Remote GitHub**:
   * Create an empty repository on GitHub named `health-wellness-scheduling-backend`.
   * Add remote and push:
     ```bash
     git remote add origin https://github.com/YOUR_ORGANIZATION/REPO_NAME.git
     git push -u origin feature/backend-implementation
     ```
5. **Open Pull Request**:
   * Open GitHub, click **Compare & pull request** to merge `feature/backend-implementation` into `main`.
   * Assign teammates to review your MVC routes, schemas, and security boundaries.
