# ObservaAI Architecture Diagram

```text
+---------------------+
|   React + Vite      |
|      (Vercel)       |
+----------+----------+
           |
           v
+---------------------+
| Django REST API     |
|     (Railway)       |
+----------+----------+
           |
           +------------------+
           |                  |
           v                  v
+----------------+   +------------------+
| PostgreSQL     |   | Gemini AI API    |
|   (Railway)    |   | (Code Review &   |
|                |   | Incident Analysis)|
+----------------+   +------------------+

           |
           v

+---------------------+
| ObservaAI Features  |
+---------------------+
| Code Review         |
| Incident Analysis   |
| Splunk Queries      |
| Runbooks            |
| PDF Export          |
| History             |
| Favorites           |
+---------------------+
```
