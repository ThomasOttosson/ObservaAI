# ObservaAI

AI-powered security, observability, incident response, and code review platform.

ObservaAI helps developers, SREs, DevOps engineers, and security teams analyze source code, application logs, production incidents, and system failures using AI.

---

## Features

### AI Code Review

- Review code in any programming language
- Detect bugs and anti-patterns
- Identify security vulnerabilities
- Suggest architecture improvements
- Recommend performance optimizations
- Evaluate production readiness
- Generate improved code examples

### Security & Observability Analysis

- Analyze application logs
- Detect incidents and outages
- Generate root cause analysis
- Create incident timelines
- Identify affected services
- Generate Splunk SPL queries
- Generate runbook recommendations
- Calculate MTTR estimates
- Assess business impact

### User Features

- User registration
- JWT authentication
- Login/logout
- Analysis history
- Favorite analyses
- Search history
- PDF export
- File uploads
- Drag and drop support

---

## Technology Stack

### Frontend

- React
- Vite
- React Markdown
- Recharts
- React Syntax Highlighter

### Backend

- Django
- Django REST Framework
- Simple JWT

### Database

- PostgreSQL

### AI

- Google Gemini 2.5 Flash

### Deployment

- Railway (Backend + Database)
- Vercel (Frontend)

---

## Core Functionality

### Code Review Mode

Users can submit:

- Python
- JavaScript
- TypeScript
- Java
- C#
- Go
- Rust
- PHP
- SQL
- Terraform
- Kubernetes YAML

The AI generates:

### Project Scores

- Architecture
- Security
- Performance
- Production Readiness

### Summary

High-level project review.

### Problems Found

Detected issues and risks.

### Improvements

Recommended improvements.

### Improved Code

Improved code examples with proper markdown formatting.

---

## Security & Observability Mode

Users can submit:

- Application logs
- Infrastructure logs
- Kubernetes logs
- Docker logs
- Security events
- Splunk exports

The AI generates:

### Incident Scores

- Observability
- Security
- Reliability
- Severity

### Root Cause Analysis

- Cause
- Impact
- Severity
- Recommended Fix

### Timeline

Automatically generated incident timeline.

### Affected Services

List of impacted systems and service health.

### Splunk Queries

Generated SPL queries for investigation.

### Runbook Steps

Suggested incident response workflow.

### Business Impact

- Affected users
- Impacted endpoints
- Estimated downtime
- Risk assessment

### MTTR Estimate

- Current MTTR
- Target MTTR
- Improvement recommendations

---

## Architecture

```text
┌───────────────────┐
│ React Frontend    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Django REST API   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ PostgreSQL        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Gemini AI         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Analysis Engine   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Dashboard         │
└───────────────────┘
```

---

## Authentication

Authentication is handled using JWT.

Endpoints:

```text
/api/register/
/api/token/
/api/token/refresh/
/api/me/
```

---

## API Endpoints

### Authentication

```text
POST /api/register/
POST /api/token/
POST /api/token/refresh/
GET  /api/me/
```

### Analysis

```text
POST /api/chat/
GET  /api/history/
GET  /api/stats/
POST /api/favorite/<id>/
DELETE /api/delete/<id>/
```

---

## Database Schema

### Analysis

| Field | Type |
|---------|---------|
| id | Integer |
| prompt | Text |
| response | Text |
| favorite | Boolean |
| architecture_score | Integer |
| security_score | Integer |
| performance_score | Integer |
| production_score | Integer |
| files_count | Integer |
| lines_of_code | Integer |
| response_time | Float |
| created_at | DateTime |
| user | ForeignKey(User) |

---

## Installation

### Backend

Install dependencies:

```bash
pip install -r requirements.txt
```

Run migrations:

```bash
python manage.py migrate
```

Create superuser:

```bash
python manage.py createsuperuser
```

Start server:

```bash
python manage.py runserver
```

---

### Frontend

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build production version:

```bash
npm run build
```

---

## Environment Variables

### Backend

```env
SECRET_KEY=your_secret_key
DATABASE_URL=your_postgres_url
GEMINI_API_KEY=your_gemini_api_key
DEBUG=False
```

### Frontend

```env
VITE_API_URL=https://your-backend-url.com
```

---

## Deployment

### Backend

Railway

Features:

- PostgreSQL
- Automatic Deployments
- Environment Variables
- Persistent Database

### Frontend

Vercel

Features:

- Global CDN
- Automatic Deployments
- HTTPS

---

## Example Incident Analysis

Input:

```text
2026-06-13 12:00:01 ERROR Database connection timeout
2026-06-13 12:00:03 ERROR Login failed
2026-06-13 12:00:05 CRITICAL Authentication unavailable
```

Output:

- Incident severity
- Root cause analysis
- Timeline
- Splunk queries
- Runbook steps
- Business impact
- MTTR estimate

---

## Example Code Review

Input:

```python
def divide(a, b):
    return a / b
```

Output:

- Architecture Score
- Security Score
- Performance Score
- Production Readiness Score
- Suggested Improvements
- Improved Code Example

---

## Future Improvements

- OpenAI support
- Claude support
- Team workspaces
- RBAC permissions
- CI/CD integrations
- GitHub integration
- Jira integration
- Slack integration
- Splunk integration
- Prometheus integration
- Grafana integration
- Real-time alerting

---

## Author

Thomas Ottosson

ObservaAI — AI-powered Security, Observability, and Incident Response Platform.