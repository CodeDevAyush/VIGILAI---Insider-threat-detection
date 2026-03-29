# main.py
# FastAPI server exposing endpoints to trigger the pipeline and query results.

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from pipeline import run_pipeline

app = FastAPI(title="Insider Threat AI API", version="1.0.0")


class PipelineRequest(BaseModel):
    log_source: str = "data/logs.csv"
    model_path: str = "models/isolation_forest.pkl"


class PipelineResponse(BaseModel):
    total_records: int
    anomalies_detected: int
    confirmed_threats: int
    status: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/run", response_model=PipelineResponse)
def run(req: PipelineRequest):
    try:
        result = run_pipeline(log_source=req.log_source, model_path=req.model_path)
        return PipelineResponse(
            total_records=result["total"],
            anomalies_detected=result["anomalies"],
            confirmed_threats=result["confirmed"],
            status="success",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
