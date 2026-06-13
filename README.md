# <img src="https://raw.githubusercontent.com/microsoft/fluentui-system-icons/master/assets/Gift/SVG/ic_fluid_gift_24_filled.svg" width="32" height="32" align="center" /> Appolo — Premium Glassmorphic E-commerce Storefront

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

Appolo is a state-of-the-art e-commerce application featuring a premium **dark glassmorphism design system** on the frontend and a highly secured, rate-limited **Python Flask REST API** on the backend. 

---

## 🚀 Tech Stack

<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr style="background-color: #1a1a1a;">
      <th style="border: 1px solid #333; padding: 12px; text-align: left;">Layer</th>
      <th style="border: 1px solid #333; padding: 12px; text-align: left;">Technologies & Version</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #333; padding: 12px; font-weight: bold;">🖥️ Frontend</td>
      <td style="border: 1px solid #333; padding: 12px;">React 19, TypeScript, Tailwind CSS 4, Vite 8</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 12px; font-weight: bold;">⚙️ Backend</td>
      <td style="border: 1px solid #333; padding: 12px;">Flask 3.1, SQLAlchemy ORM, Flask-Limiter, Marshmallow (Validation)</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 12px; font-weight: bold;">🗄️ Database</td>
      <td style="border: 1px solid #333; padding: 12px;">PostgreSQL, Alembic (Migrations)</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 12px; font-weight: bold;">🐳 Infrastructure</td>
      <td style="border: 1px solid #333; padding: 12px;">Docker, Docker Compose</td>
    </tr>
  </tbody>
</table>

---

## 📂 Project Architecture

```text
├── app/                  # Python Flask API Core Logic
│   ├── config/           # Environment configuration classes
│   ├── exceptions/       # Global HTTP exception handlers
│   ├── middleware/       # JWT and authorization middlewares
│   ├── models/           # SQLAlchemy database schema models
│   ├── repository/       # Database query abstraction layers
│   ├── routes/           # REST endpoints with rate-limiting & Blueprints
│   ├── services/         # Core business logic processing
│   ├── utils/            # Shared utilities (JWT, connection helper, limiter)
│   └── validators/       # Marshmallow input/output validation schemas
├── frontend/             # React + Vite Client Application
│   ├── src/              # React components, pages, context, and glassmorphic styles
│   ├── Dockerfile        # Development Docker configuration for frontend
│   └── vite.config.ts    # Configures API proxy mappings dynamically
├── uploads/              # Bind-mounted directory storing product images
├── Dockerfile            # Production Docker setup for Flask API
├── docker-compose.yml    # Runs frontend and backend services together
├── .env.dev              # Local development configuration
└── main.py               # Flask application entrypoint
```

---

## ⚙️ Environment Configuration (`.env.dev`)

The backend configuration is managed through the `.env.dev` file. Key settings:

| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| **`HOST`** | Network binding address for the Flask server | `0.0.0.0` |
| **`PORT`** | Listening port for the API server | `5000` |
| **`DEBUG`** | Toggle Flask debug mode (reloading & verbose logs) | `True` |
| **`DATABASE_URI`** | PostgreSQL connection URI | `postgresql://abhishek:admin%40123@localhost:5432/website_db` |
| **`JWT_SECRET`** | Key used to sign authorization JWT tokens | `"mySecreatKey"` |

---

## 🛠️ Native Development Setup

### 1. Prerequisites
- **Python**: 3.10+
- **Node.js**: 20+
- **PostgreSQL**: Installed and running locally

---

### 2. Automated Setup & Run (Recommended)

We provide clean scripts to automate the setup process and launch the servers on both Linux/macOS and Windows:

#### **Linux / macOS**

##### **A. One-Time Setup**
```bash
chmod +x setup.sh
./setup.sh
```

##### **B. Launch Servers**
```bash
chmod +x run.sh
./run.sh
```
> [!TIP]
> Press `Ctrl+C` in the running terminal to stop both servers gracefully.

---

#### **Windows**

##### **A. One-Time Setup**
Double-click `setup.bat` or run it from your command prompt:
```cmd
setup.bat
```

##### **B. Launch Servers**
Double-click `run.bat` or run it from your command prompt:
```cmd
run.bat
```
*(This starts the backend and frontend dev servers concurrently in separate command prompt windows)*


---

### 3. Step-by-Step Manual Launch Guide

If you prefer to configure the components manually, follow these steps in your terminal:

#### **Step 1: Migrate Database**
Verify that PostgreSQL is running locally, the database `website_db` exists, and the credentials in `.env.dev` are correct.
Then, execute the following from the project root:
```bash
# Initialize and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Run migrations to setup database tables
python -m alembic upgrade head
```

#### **Step 2: Run Seed Script**
Run the seeding script to populate initial roles, permissions, categories, subcategories, and the default admin:
```bash
python seed_script.py
```
> [!NOTE]
> Product seeding is skipped by default to keep the catalog clean for your development needs.

#### **Step 3: Run Backend**
Start the Flask development server:
```bash
python main.py
```
*The API will run at `http://localhost:5000`.*

#### **Step 4: Run Frontend**
Open a **new terminal tab/window**, navigate to the `frontend/` directory, and start Vite:
```bash
cd frontend
npm install
npm run dev
```
*The storefront will run at `http://localhost:5173`.*

---

## 🐳 Docker Compose Deployment

If you want to run the stack using Docker Compose:

```bash
docker compose up --build
```

> [!WARNING]
> If you encounter a socket permission error, run the command with `sudo`:
> ```bash
> sudo docker compose up --build
> ```

---

## 📂 System Mechanics & Features

### 👤 Default Administrator Credentials
Use these credentials to log in with full administrative privileges:
* **Email**: `admin@gmail.com`
* **Password**: `admin@123`

### 🔗 Host PC Database Connection
Inside `docker-compose.yml`, services are configured with `network_mode: "host"`. On Linux, this allows Docker containers to share the host network namespace directly, facilitating seamless connection to a local PostgreSQL instance on `localhost:5432`.

### 🛡️ API Rate Limiter
All API endpoints are protected using **Flask-Limiter** configured to **3 requests per second per IP**. Exceeding this limit will trigger an HTTP `429 Too Many Requests` status response.
