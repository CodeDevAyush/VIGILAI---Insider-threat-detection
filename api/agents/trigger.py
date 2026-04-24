from .detection import detection_agent

def trigger_agent(log):
    file_size = log.get("file_size") or 0
    event_type = log.get("event_type", "")
    
    # decide if worth processing
    if file_size > 50 or "file" in event_type.lower():
        print(f"[Trigger] Log passed guard: {event_type} | {file_size}b. Passing to Detection.")
        return detection_agent(log)
        
    print("[Trigger] Ignored log - normal activity.")
    return {"status": "normal"}
