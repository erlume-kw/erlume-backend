# API audience (deprecated)

Previously this repo tagged OpenAPI paths with `x-usedBy` (`backoffice` / `frontend`) and served filtered Swagger UIs. That split has been **removed**: use the **full** spec at `/api-docs.json` and Swagger at `/api-docs` only.

Clients (web apps, scripts) should rely on the same contract and enforce any access rules in their own layers if needed.
