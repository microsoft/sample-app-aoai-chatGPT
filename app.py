import os
import uuid
import logging
import requests 
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from dotenv import load_dotenv

from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files & Templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- SYSTEM PROMPT ---
JOOGNI_SYSTEM_PROMPT = """You are Joogni, an expert legal AI assistant for Gill Law Group, a California family law firm.

Your capabilities:
- Answer questions about California Family Code, divorce, custody, support, property division, and family law procedures
- Analyze legal documents when provided (pleadings, declarations, financial disclosures, agreements)
- Analyze email correspondence to understand case history, communications with opposing counsel, and client interactions
- Review calendar events to identify upcoming hearings, deadlines, and important dates
- Draft legal documents, motions, discovery requests, correspondence, and client communications
- Summarize case information and identify key issues
- Create chronologies from email threads and documents
- Explain legal concepts in plain language for clients or in technical terms for attorneys

Guidelines:
- Be conversational and helpful for general questions
- When asked to draft something, produce professional, court-ready language
- Always note that you are an AI assistant and your output should be reviewed by an attorney
- If you analyze uploaded documents or emails, reference specific content from them
- For California-specific questions, cite relevant Family Code sections when applicable
- When analyzing emails, pay attention to dates, senders, recipients, and key discussion points
- When reviewing calendar events, highlight upcoming deadlines and hearing dates
- Format your responses clearly with appropriate structure for readability

Current context: You are assisting attorneys and staff at a family law firm. Respond appropriately based on whether the question seems like a quick query or a request for formal document drafting."""

class SasRequest(BaseModel):
    filename: str

JOBS = {}

# --- HELPER: GRAPH AUTH ---
def get_graph_headers(req: Request):
    auth_header = req.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return {
            "Authorization": auth_header,
            "Content-Type": "application/json"
        }

    token = req.headers.get("X-MS-TOKEN-AAD-ACCESS-TOKEN")
    
    if not token:
        token = os.getenv("TEST_GRAPH_TOKEN")
        
    if not token:
        logger.warning("No Auth Token found.")
        return None
        
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

# --- ROUTES ---

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Render login page"""
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Main app - check if authenticated"""
    # Check for auth header from Azure Easy Auth
    auth_header = request.headers.get("X-MS-TOKEN-AAD-ACCESS-TOKEN")
    principal_header = request.headers.get("X-MS-CLIENT-PRINCIPAL")
    
    # If no auth headers, user might not be logged in
    # Azure Easy Auth should handle redirects, but we can show login page as fallback
    if not auth_header and not principal_header:
        # Check if we're in development mode
        if os.getenv("TEST_GRAPH_TOKEN"):
            return templates.TemplateResponse("index.html", {"request": request})
        # In production without auth, could redirect to login
        # But Azure Easy Auth should handle this automatically
    
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/health")
async def health():
    return {"status": "Online", "message": "Joogni Backend is Running"}

@app.post("/api/copilot")
async def start_copilot_job(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        job_id = str(uuid.uuid4())
        background_tasks.add_task(lazy_copilot_task, job_id, data)
        return {"job_id": job_id}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/check_status/{job_id}")
async def check_job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    return {"status": job["status"], "result": job["result"]}

@app.post("/api/get-upload-url")
async def get_upload_url(req: SasRequest):
    try:
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container = os.getenv("AZURE_STORAGE_CONTAINER")
        
        if not connect_str or not container:
            return JSONResponse(status_code=500, content={"error": "Storage Config Missing"})

        blob_service_client = BlobServiceClient.from_connection_string(connect_str)
        blob_name = f"{uuid.uuid4()}-{req.filename}"
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=container,
            blob_name=blob_name,
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(create=True, write=True),
            expiry=datetime.now(timezone.utc) + timedelta(minutes=15)
        )
        url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container}/{blob_name}?{sas_token}"
        return {"upload_url": url, "blob_name": blob_name}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/search-outlook")
async def search_outlook(request: Request):
    try:
        headers = get_graph_headers(request)
        if not headers:
             return JSONResponse(status_code=401, content={"error": "Not authenticated. Please Refresh."})

        data = await request.json()
        query = data.get("query", "")
        
        url = "https://graph.microsoft.com/v1.0/me/messages"
        
        if query:
            # Mode A: Active Search
            params = {
                "$top": 25,
                "$select": "id,subject,from,toRecipients,receivedDateTime,bodyPreview,hasAttachments",
                "$search": f'"{query}"'
            }
        else:
            # Mode B: Recent Items
            params = {
                "$top": 25,
                "$select": "id,subject,from,toRecipients,receivedDateTime,bodyPreview,hasAttachments",
                "$orderby": "receivedDateTime desc"
            }
            
        resp = requests.get(url, headers=headers, params=params)
        
        if resp.status_code != 200:
            return JSONResponse(status_code=resp.status_code, content={"error": f"Graph Error: {resp.text}"})
            
        return resp.json()
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/get-email-content/{message_id}")
async def get_email_content(message_id: str, request: Request):
    """Fetch full email content including body"""
    try:
        headers = get_graph_headers(request)
        if not headers:
             return JSONResponse(status_code=401, content={"error": "Not authenticated"})

        url = f"https://graph.microsoft.com/v1.0/me/messages/{message_id}"
        params = {
            "$select": "id,subject,from,toRecipients,ccRecipients,receivedDateTime,body,hasAttachments"
        }
        resp = requests.get(url, headers=headers, params=params)
        
        if resp.status_code != 200:
            return JSONResponse(status_code=resp.status_code, content={"error": f"Graph Error: {resp.text}"})
            
        return resp.json()
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/search-outlook/{message_id}/attachments")
async def get_outlook_attachments(message_id: str, request: Request):
    try:
        headers = get_graph_headers(request)
        if not headers:
             return JSONResponse(status_code=401, content={"error": "Not authenticated"})

        url = f"https://graph.microsoft.com/v1.0/me/messages/{message_id}/attachments"
        resp = requests.get(url, headers=headers)
        
        if resp.status_code != 200:
            return JSONResponse(status_code=resp.status_code, content={"error": f"Graph Error: {resp.text}"})
            
        return resp.json()
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/search-calendar")
async def search_calendar(request: Request):
    """Search calendar events or get upcoming events"""
    try:
        headers = get_graph_headers(request)
        if not headers:
             return JSONResponse(status_code=401, content={"error": "Not authenticated. Please Refresh."})

        data = await request.json()
        query = data.get("query", "")
        
        # Get events from now to 90 days in the future
        now = datetime.now(timezone.utc)
        end_date = now + timedelta(days=90)
        
        url = "https://graph.microsoft.com/v1.0/me/calendarView"
        params = {
            "startDateTime": now.isoformat(),
            "endDateTime": end_date.isoformat(),
            "$top": 50,
            "$select": "id,subject,start,end,location,bodyPreview,isAllDay,organizer,attendees",
            "$orderby": "start/dateTime"
        }
        
        # If there's a search query, we'll filter results client-side
        # (Graph calendarView doesn't support $search)
        
        resp = requests.get(url, headers=headers, params=params)
        
        if resp.status_code != 200:
            return JSONResponse(status_code=resp.status_code, content={"error": f"Graph Error: {resp.text}"})
        
        result = resp.json()
        
        # If query provided, filter results
        if query:
            query_lower = query.lower()
            filtered = [
                event for event in result.get("value", [])
                if query_lower in (event.get("subject") or "").lower() 
                or query_lower in (event.get("bodyPreview") or "").lower()
                or query_lower in (event.get("location", {}).get("displayName") or "").lower()
            ]
            result["value"] = filtered
            
        return result
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/search-onedrive")
async def search_onedrive(request: Request):
    try:
        headers = get_graph_headers(request)
        if not headers:
             return JSONResponse(status_code=401, content={"error": "Not authenticated."})

        data = await request.json()
        query = data.get("query", "")
        
        if query:
            url = f"https://graph.microsoft.com/v1.0/me/drive/root/search(q='{query}')"
            params = { "$top": 20, "$select": "id,name,size,createdDateTime,webUrl,@microsoft.graph.downloadUrl" }
            resp = requests.get(url, headers=headers, params=params)
        else:
            url = "https://graph.microsoft.com/v1.0/me/drive/recent"
            params = { "$top": 20 }
            resp = requests.get(url, headers=headers, params=params)

        if resp.status_code != 200:
            return JSONResponse(status_code=resp.status_code, content={"error": f"Graph Error: {resp.text}"})
            
        return resp.json()
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/download-graph-file")
async def download_graph_file(request: Request):
    try:
        data = await request.json()
        download_url = data.get("download_url")
        file_name = data.get("file_name", "unknown_file")
        
        headers = get_graph_headers(request)
        if not headers:
             return JSONResponse(status_code=401, content={"error": "Not authenticated"})
        
        graph_resp = requests.get(download_url, headers=headers)
        if graph_resp.status_code != 200:
            return JSONResponse(status_code=400, content={"error": f"Download Error: {graph_resp.text}"})
            
        file_content = graph_resp.content

        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container = os.getenv("AZURE_STORAGE_CONTAINER")
        
        blob_service = BlobServiceClient.from_connection_string(connect_str)
        new_blob_name = f"graph-{uuid.uuid4()}-{file_name}"
        
        blob_client = blob_service.get_blob_client(container=container, blob=new_blob_name)
        blob_client.upload_blob(file_content, overwrite=True)
        
        return {
            "blob_name": new_blob_name,
            "original_filename": file_name,
            "source": "microsoft_graph"
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

def lazy_copilot_task(job_id: str, data: dict):
    JOBS[job_id] = {"status": "Pending", "result": ""}
    try:
        try:
            from openai import AzureOpenAI
            from azure.core.credentials import AzureKeyCredential
        except ImportError as e:
            raise ImportError(f"Base Library Failed: {e}")

        blobs = data.get("blobs", [])
        emails = data.get("emails", [])
        calendar_events = data.get("calendar_events", [])
        file_context = ""
        email_context = ""
        calendar_context = ""
        
        # Process uploaded files/documents
        if blobs:
            try:
                from azure.ai.documentintelligence import DocumentIntelligenceClient
                from azure.storage.blob import BlobServiceClient
                
                storage_conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
                storage_cont = os.getenv("AZURE_STORAGE_CONTAINER")
                doc_endpoint = os.getenv("DOC_INTEL_ENDPOINT")
                doc_key = os.getenv("DOC_INTEL_KEY")
                
                if storage_conn and doc_endpoint:
                    blob_service = BlobServiceClient.from_connection_string(storage_conn)
                    container_client = blob_service.get_container_client(storage_cont)
                    doc_client = DocumentIntelligenceClient(endpoint=doc_endpoint, credential=AzureKeyCredential(doc_key))
                    
                    for blob_info in blobs:
                        b_name = blob_info.get("blob_name")
                        f_name = blob_info.get("original_filename")
                        try:
                            blob_client = container_client.get_blob_client(b_name)
                            file_data = blob_client.download_blob().readall()
                            
                            poller = doc_client.begin_analyze_document("prebuilt-layout", body=file_data)
                            result = poller.result()
                            text = result.content or "(No Text)"
                            file_context += f"\n--- DOCUMENT: {f_name} ---\n{text}\n"
                        except Exception:
                            pass 
            except Exception:
                pass 

        # Process emails
        if emails:
            email_context = "\n--- EMAIL CORRESPONDENCE ---\n"
            for email in emails:
                date = email.get("date", "Unknown date")
                subject = email.get("subject", "No subject")
                sender = email.get("from", "Unknown sender")
                to = email.get("to", "Unknown recipient")
                body = email.get("body", "")
                
                email_context += f"\n[EMAIL - {date}]\n"
                email_context += f"From: {sender}\n"
                email_context += f"To: {to}\n"
                email_context += f"Subject: {subject}\n"
                email_context += f"Body:\n{body}\n"
                email_context += "---\n"

        # Process calendar events
        if calendar_events:
            calendar_context = "\n--- CALENDAR EVENTS ---\n"
            for event in calendar_events:
                subject = event.get("subject", "No title")
                start = event.get("start", "Unknown")
                end = event.get("end", "Unknown")
                location = event.get("location", "")
                body = event.get("body", "")
                
                # Format dates nicely
                try:
                    start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    start_str = start_dt.strftime("%A, %B %d, %Y at %I:%M %p")
                except:
                    start_str = start
                
                try:
                    end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
                    end_str = end_dt.strftime("%I:%M %p")
                except:
                    end_str = end
                
                calendar_context += f"\n[EVENT: {subject}]\n"
                calendar_context += f"When: {start_str} - {end_str}\n"
                if location:
                    calendar_context += f"Location: {location}\n"
                if body:
                    calendar_context += f"Details: {body}\n"
                calendar_context += "---\n"

        total_context = file_context + email_context + calendar_context
        
        if len(total_context) > 500000:
            JOBS[job_id]["status"] = "Failed"
            JOBS[job_id]["result"] = "⚠️ **Limit Exceeded:** Too much content. Try selecting fewer items."
            return

        key = os.getenv("AZURE_OPENAI_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        client = AzureOpenAI(api_key=key, azure_endpoint=endpoint, api_version="2024-02-01")
        
        user_msg = data.get("messages", [])[-1].get("content", "")
        
        # Build the final prompt with context
        if total_context:
            final_prompt = f"The user has provided the following content for analysis:\n{total_context}\n\nUser Query: {user_msg}"
        else:
            final_prompt = user_msg
        
        completion = client.chat.completions.create(
            model="model-router",
            messages=[
                {"role": "system", "content": JOOGNI_SYSTEM_PROMPT},
                {"role": "user", "content": final_prompt}
            ]
        )
        
        JOBS[job_id]["status"] = "Complete"
        JOBS[job_id]["result"] = completion.choices[0].message.content

    except Exception as e:
        JOBS[job_id]["status"] = "Failed"
        JOBS[job_id]["result"] = f"Error: {str(e)}"
