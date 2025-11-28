import os
import json
import datetime
import logging
from typing import Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from azure.identity import DefaultAzureCredential
from msgraph.core import GraphClient

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# 1. SETUP STATIC FILES (CSS/JS)
# This allows the app to find 'style.css' and 'script.js' in the 'static' folder
app.mount("/static", StaticFiles(directory="static"), name="static")

# 2. SETUP TEMPLATES
templates = Jinja2Templates(directory="templates")

# Model for incoming chat messages
class ChatRequest(BaseModel):
    message: str
    search_scope: str = "email"  # 'email', 'files', or 'both'
    time_range: str = "7days"    # '24h', '7days', '30days', 'all'

def get_graph_client():
    """
    Authenticates with Azure using the Managed Identity.
    """
    credential = DefaultAzureCredential()
    scopes = ["https://graph.microsoft.com/.default"]
    client = GraphClient(credential=credential, scopes=scopes)
    return client

def calculate_date_filter(time_range: str) -> str:
    now = datetime.datetime.utcnow()
    if time_range == "24h":
        delta = now - datetime.timedelta(hours=24)
    elif time_range == "30days":
        delta = now - datetime.timedelta(days=30)
    elif time_range == "all":
        return None 
    else: # Default 7 days
        delta = now - datetime.timedelta(days=7)
    return delta.strftime("%Y-%m-%dT%H:%M:%SZ")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Serves the main Chat UI."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        user_message = request.message
        scope = request.search_scope
        time_range = request.time_range
        
        client = get_graph_client()
        results = []
        
        # --- 1. SEARCH EMAILS ---
        if scope in ["email", "both"]:
            query_params = {
                "$top": 5,
                "$select": "subject,receivedDateTime,from,webLink,bodyPreview",
                "$count": "true"
            }
            if user_message.strip():
                query_params["$search"] = f'"{user_message}"'
            
            start_date = calculate_date_filter(time_range)
            if start_date:
                query_params["$filter"] = f"receivedDateTime ge {start_date}"

            logger.info(f"Querying Graph Messages: {query_params}")
            
            response = client.get(
                "/me/messages",
                params=query_params,
                headers={"ConsistencyLevel": "eventual"}
            )
            
            if response.status_code == 200:
                data = response.json()
                for email in data.get('value', []):
                    results.append({
                        "type": "Email",
                        "title": email.get('subject', 'No Subject'),
                        "link": email.get('webLink'),
                        "preview": email.get('bodyPreview'),
                        "date": email.get('receivedDateTime'),
                        "sender": email.get('from', {}).get('emailAddress', {}).get('name')
                    })

        # --- 2. SEARCH FILES (OneDrive) ---
        if scope in ["files", "both"] and user_message.strip():
            search_url = f"/me/drive/root/search(q='{user_message}')"
            response = client.get(search_url)
            
            if response.status_code == 200:
                data = response.json()
                for file in data.get('value', [])[:5]:
                    results.append({
                        "type": "File",
                        "title": file.get('name'),
                        "link": file.get('webUrl'),
                        "preview": "OneDrive File",
                        "date": file.get('lastModifiedDateTime'),
                        "sender": "Me"
                    })

        return JSONResponse(content={"response": "Here is what I found:", "data": results})

    except Exception as e:
        logger.error(f"Backend Crash: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
