# Backend

FastAPI backend server.

## Setup

```bash
cd backend
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload
```

Server runs at http://localhost:8000

## API Endpoints

- `GET /test` - Health check
- `POST /recording/take` - Take a recording

## Docs

Interactive API docs available at http://localhost:8000/docs
