from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from AI_logic import get_ai_response

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Later restrict this to your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ask")
async def ask(request: Request):
    data = await request.json()
    query = data.get("query", "")
    response = get_ai_response(query)
    return {"response": response}
