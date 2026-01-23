# Tech Stack

## Frontend

The frontend is built with a modern React stack, focusing on performance and code maintainability.

- **Framework**: [React](https://react.dev/) (v18.2.0)
- **Build Tool**: [Vite](https://vitejs.dev/) (v5.0.0) - Fast and lightweight build tool.
- **Styling**: 
  - [Tailwind CSS](https://tailwindcss.com/) (v3.4.1) - Utility-first CSS framework.
  - [PostCSS](https://postcss.org/) & [Autoprefixer](https://github.com/postcss/autoprefixer)
- **Routing**: [React Router DOM](https://reactrouter.com/) (v6.14.1)
- **HTTP Client**: [Axios](https://axios-http.com/) (v1.4.0)
- **Data Visualization**: [Recharts](https://recharts.org/) (v2.5.0)
- **Icons**: [Lucide React](https://lucide.dev/) (v0.292.0)
- **Utilities**:
  - `papaparse` (CSV parsing)
  - `html2canvas` (Screenshot generation)
  - `country-state-city` (Location data)

## Backend

The backend is a robust RESTful API built with Python, emphasizing speed and type safety.

- **Web Framework**: [FastAPI](https://fastapi.tiangolo.com/) (v0.104.1)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/) (v0.24.0)
- **Database**:
  - **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) (v2.0.23)
  - **Migrations**: [Alembic](https://alembic.sqlalchemy.org/) (v1.12.1)
  - **Driver**: `pymysql` (v1.1.0) - Connecting to MySQL.
- **Data Validation**: 
  - [Pydantic](https://docs.pydantic.dev/) (v2.5.0) - Data validation and settings management.
  - `email-validator`
- **Security & Authentication**:
  - `python-jose` (JWT token handling)
  - `passlib[bcrypt]` (Password hashing)
- **Performance & Safety**:
  - `slowapi` (Rate limiting)
- **Utilities**:
  - `python-dotenv` (Environment variable management)
  - `python-multipart` (Form data parsing)
