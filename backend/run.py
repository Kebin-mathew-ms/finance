import uvicorn

if __name__ == "__main__":
    # Start the server on port 8000 with auto-reload for local development
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
