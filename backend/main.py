from fastapi import FastAPI

from api import recording

app = FastAPI()

app.include_router(recording.router)


@app.get("/test")
def test():
    return {"message": "Hello from FastAPI!"}
