from pymongo import MongoClient
import os
from .response import response_agent

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["Vigil-Ai"]

WHITELIST_PATHS = ["appdata/local/packages", "whatsapp", "ebwebview", "cache", "temp", "tmp"]
WHITELIST_EXTS = [".ldb", ".log", ".tmp", ".node", "ldb"]

def verification_agent(log):
    file_path = log.get("path", "")
    file_ext = log.get("file_extension", "")
    
    if not file_path:
        file_path = ""
    if not file_ext:
        file_ext = ""
        
    file_path_lw = file_path.lower()
    file_ext_lw = file_ext.lower()
    
    # 1. Whitelist checking (Noisy systems)
    for wp in WHITELIST_PATHS:
        if wp in file_path_lw:
            print(f"[Verification] Path '{wp}' whitelisted. False positive filtered.")
            db.logs.update_one({"_id": log["_id"]}, {"$set": {"status": "normal"}})
            return {"status": "normal"}
            
    target_ext = f".{file_ext_lw}" if file_ext_lw and not file_ext_lw.startswith(".") else file_ext_lw
    if target_ext in WHITELIST_EXTS or file_ext_lw in WHITELIST_EXTS:
        print(f"[Verification] Extension '{target_ext}' whitelisted. Filtered.")
        db.logs.update_one({"_id": log["_id"]}, {"$set": {"status": "normal"}})
        return {"status": "normal"}

    # Pass verification! ML flagged it and it's not whitelisted.
    print(f"[Verification] Valid threat verified: {file_path}")
    return response_agent(log)
