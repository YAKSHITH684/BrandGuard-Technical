# Coding Standards and Style Guide

## 1. Python Standards (Backend)

BrandGuard's backend is written in **Python 3.12+**. All Python code must adhere to modern conventions:

### 1.1 Formatting and Linting
- **PEP 8 Compliance**: Follow PEP 8 guidelines for naming and layout.
- **Line Length**: Soft limit of 100 characters.
- **Imports**: Group imports into three blocks separated by single blank lines:
  1. Standard library imports (e.g. `import os`, `import re`).
  2. Third-party package imports (e.g. `from fastapi import APIRouter`, `from pydantic import BaseModel`).
  3. Local application imports (e.g. `from app.models import Draft`, `from app.config import settings`).

### 1.2 Type Hinting and Validation
- All service and router functions must have explicit type annotations for parameters and return values:
  ```python
  def calculate_readability(text: str) -> dict[str, float]:
      ...
  ```
- Use **Pydantic v2** models for all API request inputs, response schemas, and configuration models.
- Avoid raw untyped dictionaries when passing domain data between services.

### 1.3 Error Handling
- Never catch generic `Exception` without re-raising or logging the specific traceback.
- In FastAPI route handlers, raise `HTTPException` with appropriate status codes (`400`, `401`, `403`, `404`, `422`) and clear error descriptions:
  ```python
  if not draft:
      raise HTTPException(status_code=404, detail="Draft not found")
  ```

---

## 2. JavaScript / React Standards (Frontend)

BrandGuard's frontend is built with **Next.js 14** and **Tailwind CSS**:

### 2.1 React Component Design
- Write clean functional components using React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- Keep components modular: extract presentation cards and modals into dedicated component directories under `src/components/`.
- Ensure components render properly in both Light and Dark themes.

### 2.2 Styling with Tailwind CSS
- Use Tailwind utility classes for styling. Avoid inline `style={{ ... }}` objects.
- Use semantic color classes that respond to dark mode (e.g., `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`).
- Ensure all interactive elements have visible focus rings (`focus:ring-2 focus:ring-indigo-500`) for accessibility.

### 2.3 API Integration
- Centralize all backend API calls in `src/services/api.js`.
- Always handle HTTP failure states gracefully in the UI using toast notifications or inline alert banners.

---

## 3. Database and SQLAlchemy Conventions

- Use SQLAlchemy 2.0 style queries:
  ```python
  # Preferred SQLAlchemy 2.0 syntax:
  stmt = select(Draft).where(Draft.id == draft_id)
  result = db.execute(stmt).scalar_one_or_none()
  ```
- Never interpolate user-supplied strings directly into SQL queries.
- Ensure all database migrations maintain compatibility with both PostgreSQL and SQLite dialects.
