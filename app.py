import os
import uuid
import logging
import requests 
import json
import base64
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
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

# --- AGENTIC SYSTEM PROMPTS ---

AGENTIC_PLANNER_PROMPT = """You are a search planner for a legal AI assistant at a family law firm. 
Analyze the user's query and determine what data sources need to be searched.

You have access to:
1. Box.com - Document storage (pleadings, declarations, discovery, contracts, evidence)
2. Outlook - Email correspondence (client communications, opposing counsel, court notices)
3. Calendar - Upcoming hearings, deadlines, meetings

For case-specific queries (mentioning client names, case numbers, specific matters), you should search relevant sources.
For general legal questions (e.g., "What is the community property rule?"), no searches are needed.

Respond with JSON only:
{
  "is_case_specific": true/false,
  "search_box": true/false,
  "box_query": "search terms for Box" or null,
  "search_emails": true/false,
  "email_query": "search terms for Outlook" or null,
  "search_calendar": true/false,
  "calendar_query": "search terms for Calendar" or null,
  "reasoning": "brief explanation of search strategy"
}

Be smart about search terms - extract client names, case topics, document types mentioned."""

AGENTIC_RESPONSE_PROMPT = """You are Joogni, an expert legal AI assistant for Gill Law Group, a California family law firm.

You have been provided with:
1. The user's question
2. Search results from various sources (Box files, emails, calendar events)
3. The jurisdiction context

CRITICAL INSTRUCTIONS:
- Synthesize information from all provided sources
- ALWAYS cite your sources using [Source: X] format
- For emails, cite as [Email: subject, date]
- For documents, cite as [Document: filename]
- For calendar events, cite as [Calendar: event name, date]
- If information conflicts between sources, note the discrepancy
- If you cannot find relevant information, say so clearly
- Provide actionable, specific answers based on the evidence

JURISDICTION: {jurisdiction}

When drafting documents or providing legal analysis, apply {jurisdiction} law unless otherwise specified."""

# --- HELPER: GET USER IDENTITY ---
def get_user_email(request: Request) -> str:
    """Extract user email from Azure Easy Auth headers"""
    email = request.headers.get("X-MS-CLIENT-PRINCIPAL-NAME")
    if email:
        return email.lower()
    
    principal = request.headers.get("X-MS-CLIENT-PRINCIPAL")
    if principal:
        try:
            decoded = json.loads(base64.b64decode(principal))
            claims = {c["typ"]: c["val"] for c in decoded.get("claims", [])}
            email = claims.get("preferred_username") or claims.get("email") or claims.get("name")
            if email:
                return email.lower()
        except:
            pass
    
    return os.getenv("TEST_USER_EMAIL", "unknown@user.com").lower()

def get_user_info(request: Request) -> dict:
    """Get full user info from Azure Easy Auth"""
    user_info = {
        "email": None,
        "name": None,
        "authenticated": False
    }
    
    # Check for principal name (email)
    email = request.headers.get("X-MS-CLIENT-PRINCIPAL-NAME")
    if email:
        user_info["email"] = email
        user_info["authenticated"] = True
    
    # Try to get more details from the principal
    principal = request.headers.get("X-MS-CLIENT-PRINCIPAL")
    if principal:
        try:
            decoded = json.loads(base64.b64decode(principal))
            claims = {c["typ"]: c["val"] for c in decoded.get("claims", [])}
            
            user_info["email"] = claims.get("preferred_username") or claims.get("email") or claims.get("name") or user_info["email"]
            user_info["name"] = claims.get("name") or claims.get("given_name", "")
            if claims.get("family_name"):
                user_info["name"] = f"{claims.get('given_name', '')} {claims.get('family_name', '')}".strip()
            user_info["authenticated"] = True
        except:
            pass
    
    # Fallback for testing
    if not user_info["authenticated"]:
        test_email = os.getenv("TEST_USER_EMAIL")
        if test_email:
            user_info["email"] = test_email
            user_info["name"] = test_email.split("@")[0].replace(".", " ").title()
            user_info["authenticated"] = True
    
    return user_info

@app.get("/api/user-info")
async def api_user_info(request: Request):
    """Get current user information"""
    return get_user_info(request)

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

# --- BOX HELPER FUNCTIONS ---

def get_box_token_storage_key(user_email: str) -> str:
    """Generate blob name for user's Box token"""
    safe_email = user_email.replace('@', '_at_').replace('.', '_')
    return f"box-token-{safe_email}.json"

def get_box_tokens(user_email: str) -> dict:
    """Retrieve Box tokens for a user from blob storage"""
    try:
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if not connect_str:
            return None
        
        blob_service = BlobServiceClient.from_connection_string(connect_str)
        container_name = "box-tokens"
        
        try:
            container_client = blob_service.get_container_client(container_name)
            if not container_client.exists():
                container_client.create_container()
        except:
            pass
        
        blob_name = get_box_token_storage_key(user_email)
        blob_client = blob_service.get_blob_client(container=container_name, blob=blob_name)
        
        try:
            data = blob_client.download_blob().readall()
            return json.loads(data)
        except:
            return None
    except Exception as e:
        logger.error(f"Error getting Box tokens: {e}")
        return None

def save_box_tokens(user_email: str, tokens: dict):
    """Save Box tokens for a user to blob storage"""
    try:
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if not connect_str:
            return False
        
        blob_service = BlobServiceClient.from_connection_string(connect_str)
        container_name = "box-tokens"
        
        try:
            container_client = blob_service.get_container_client(container_name)
            if not container_client.exists():
                container_client.create_container()
        except:
            pass
        
        blob_name = get_box_token_storage_key(user_email)
        blob_client = blob_service.get_blob_client(container=container_name, blob=blob_name)
        
        tokens["saved_at"] = datetime.now(timezone.utc).isoformat()
        blob_client.upload_blob(json.dumps(tokens), overwrite=True)
        return True
    except Exception as e:
        logger.error(f"Error saving Box tokens: {e}")
        return False

def refresh_box_token(user_email: str, refresh_token: str) -> dict:
    """Refresh Box access token using refresh token"""
    try:
        client_id = os.getenv("BOX_CLIENT_ID")
        client_secret = os.getenv("BOX_CLIENT_SECRET")
        
        response = requests.post(
            "https://api.box.com/oauth2/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": client_id,
                "client_secret": client_secret
            }
        )
        
        if response.status_code == 200:
            tokens = response.json()
            save_box_tokens(user_email, tokens)
            return tokens
        else:
            logger.error(f"Box token refresh failed: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error refreshing Box token: {e}")
        return None

def get_valid_box_token(user_email: str) -> str:
    """Get a valid Box access token, refreshing if necessary"""
    tokens = get_box_tokens(user_email)
    if not tokens:
        return None
    
    # Check if token might be expired (Box tokens expire after 60 minutes)
    saved_at = tokens.get("saved_at")
    if saved_at:
        try:
            saved_time = datetime.fromisoformat(saved_at.replace('Z', '+00:00'))
            if datetime.now(timezone.utc) - saved_time > timedelta(minutes=55):
                # Token likely expired, refresh it
                new_tokens = refresh_box_token(user_email, tokens.get("refresh_token"))
                if new_tokens:
                    return new_tokens.get("access_token")
                return None
        except:
            pass
    
    return tokens.get("access_token")

# --- BOX ENDPOINTS ---

@app.get("/api/box/auth")
async def box_auth(request: Request):
    """Start Box OAuth flow"""
    client_id = os.getenv("BOX_CLIENT_ID")
    if not client_id:
        return JSONResponse(status_code=500, content={"error": "Box not configured"})
    
    user_email = get_user_email(request)
    
    # Store user email in state for callback
    state = base64.b64encode(user_email.encode()).decode()
    
    redirect_uri = "https://advocateintel.ai/api/box/callback"
    
    auth_url = "https://account.box.com/api/oauth2/authorize?" + urlencode({
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state
    })
    
    return {"auth_url": auth_url}

@app.get("/api/box/callback")
async def box_callback(request: Request, code: str = None, state: str = None, error: str = None):
    """Handle Box OAuth callback"""
    if error:
        return HTMLResponse(content=f"""
            <html><body>
            <h2>Box Authorization Failed</h2>
            <p>Error: {error}</p>
            <script>window.close();</script>
            </body></html>
        """)
    
    if not code:
        return HTMLResponse(content="""
            <html><body>
            <h2>Box Authorization Failed</h2>
            <p>No authorization code received.</p>
            <script>window.close();</script>
            </body></html>
        """)
    
    try:
        # Decode user email from state
        user_email = base64.b64decode(state).decode() if state else "unknown@user.com"
        
        client_id = os.getenv("BOX_CLIENT_ID")
        client_secret = os.getenv("BOX_CLIENT_SECRET")
        redirect_uri = "https://advocateintel.ai/api/box/callback"
        
        # Exchange code for tokens
        response = requests.post(
            "https://api.box.com/oauth2/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri
            }
        )
        
        if response.status_code != 200:
            logger.error(f"Box token exchange failed: {response.text}")
            return HTMLResponse(content=f"""
                <html><body>
                <h2>Box Authorization Failed</h2>
                <p>Could not exchange code for token.</p>
                <script>window.close();</script>
                </body></html>
            """)
        
        tokens = response.json()
        save_box_tokens(user_email, tokens)
        
        return HTMLResponse(content="""
            <html><body>
            <h2>Box Connected Successfully!</h2>
            <p>You can close this window.</p>
            <script>
                if (window.opener) {
                    window.opener.postMessage({type: 'box-auth-success'}, '*');
                }
                setTimeout(function() { window.close(); }, 1500);
            </script>
            </body></html>
        """)
        
    except Exception as e:
        logger.error(f"Box callback error: {e}")
        return HTMLResponse(content=f"""
            <html><body>
            <h2>Box Authorization Failed</h2>
            <p>Error: {str(e)}</p>
            <script>window.close();</script>
            </body></html>
        """)

@app.get("/api/box/status")
async def box_status(request: Request):
    """Check if user has valid Box connection"""
    user_email = get_user_email(request)
    token = get_valid_box_token(user_email)
    
    if token:
        # Verify token by getting user info
        try:
            response = requests.get(
                "https://api.box.com/2.0/users/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code == 200:
                user_info = response.json()
                return {
                    "connected": True,
                    "box_user": user_info.get("name"),
                    "box_email": user_info.get("login")
                }
        except:
            pass
    
    return {"connected": False}

@app.post("/api/box/search")
async def box_search(request: Request):
    """Search Box files"""
    user_email = get_user_email(request)
    token = get_valid_box_token(user_email)
    
    if not token:
        return JSONResponse(status_code=401, content={"error": "Box not connected", "need_auth": True})
    
    try:
        data = await request.json()
        query = data.get("query", "")
        folder_id = data.get("folder_id", "0")  # 0 = root folder
        
        headers = {"Authorization": f"Bearer {token}"}
        
        if query:
            # Search across all files
            response = requests.get(
                "https://api.box.com/2.0/search",
                headers=headers,
                params={
                    "query": query,
                    "type": "file",
                    "limit": 25,
                    "fields": "id,name,size,created_at,modified_at,parent,extension"
                }
            )
        else:
            # Browse folder contents
            response = requests.get(
                f"https://api.box.com/2.0/folders/{folder_id}/items",
                headers=headers,
                params={
                    "limit": 50,
                    "fields": "id,name,size,created_at,modified_at,type,extension"
                }
            )
        
        if response.status_code == 401:
            # Token expired, try refresh
            tokens = get_box_tokens(user_email)
            if tokens and tokens.get("refresh_token"):
                new_tokens = refresh_box_token(user_email, tokens["refresh_token"])
                if new_tokens:
                    return await box_search(request)
            return JSONResponse(status_code=401, content={"error": "Box session expired", "need_auth": True})
        
        if response.status_code != 200:
            return JSONResponse(status_code=response.status_code, content={"error": f"Box API error: {response.text}"})
        
        result = response.json()
        
        # Normalize response format
        items = result.get("entries", [])
        return {"value": items}
        
    except Exception as e:
        logger.error(f"Box search error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/box/download")
async def box_download(request: Request):
    """Download file from Box to Azure blob storage"""
    user_email = get_user_email(request)
    token = get_valid_box_token(user_email)
    
    if not token:
        return JSONResponse(status_code=401, content={"error": "Box not connected", "need_auth": True})
    
    try:
        data = await request.json()
        file_id = data.get("file_id")
        file_name = data.get("file_name", "unknown_file")
        
        if not file_id:
            return JSONResponse(status_code=400, content={"error": "file_id required"})
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Download file from Box
        response = requests.get(
            f"https://api.box.com/2.0/files/{file_id}/content",
            headers=headers,
            allow_redirects=True
        )
        
        if response.status_code != 200:
            return JSONResponse(status_code=response.status_code, content={"error": f"Box download error: {response.text}"})
        
        file_content = response.content
        
        # Upload to Azure blob storage
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container = os.getenv("AZURE_STORAGE_CONTAINER")
        
        blob_service = BlobServiceClient.from_connection_string(connect_str)
        new_blob_name = f"box-{uuid.uuid4()}-{file_name}"
        
        blob_client = blob_service.get_blob_client(container=container, blob=new_blob_name)
        blob_client.upload_blob(file_content, overwrite=True)
        
        return {
            "blob_name": new_blob_name,
            "original_filename": file_name,
            "source": "box"
        }
        
    except Exception as e:
        logger.error(f"Box download error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/box/disconnect")
async def box_disconnect(request: Request):
    """Disconnect Box account"""
    user_email = get_user_email(request)
    
    try:
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if connect_str:
            blob_service = BlobServiceClient.from_connection_string(connect_str)
            blob_name = get_box_token_storage_key(user_email)
            blob_client = blob_service.get_blob_client(container="box-tokens", blob=blob_name)
            try:
                blob_client.delete_blob()
            except:
                pass
        return {"success": True}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- AGENTIC SEARCH SYSTEM ---

def search_box_internal(token: str, query: str, limit: int = 10) -> list:
    """Internal Box search - finds client folder first, then files within it"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 1: Search for folders matching the query (client/case name)
        folder_response = requests.get(
            "https://api.box.com/2.0/search",
            headers=headers,
            params={
                "query": query,
                "type": "folder",
                "limit": 5,
                "fields": "id,name,parent"
            }
        )
        
        found_files = []
        client_folder_id = None
        client_folder_name = None
        
        if folder_response.status_code == 200:
            folders = folder_response.json().get("entries", [])
            logger.info(f"Box folder search for '{query}' found {len(folders)} folders")
            
            # Find the best matching folder
            for folder in folders:
                folder_name = folder.get("name", "").lower()
                if query.lower() in folder_name:
                    client_folder_id = folder.get("id")
                    client_folder_name = folder.get("name")
                    logger.info(f"Found client folder: {client_folder_name} (ID: {client_folder_id})")
                    break
        
        # Step 2: If we found a client folder, get ALL files from it (recursively)
        if client_folder_id:
            # Get items from the client folder
            folder_items = requests.get(
                f"https://api.box.com/2.0/folders/{client_folder_id}/items",
                headers=headers,
                params={
                    "limit": 100,
                    "fields": "id,name,size,created_at,modified_at,type,extension,parent"
                }
            )
            
            if folder_items.status_code == 200:
                items = folder_items.json().get("entries", [])
                
                # Collect files and recurse into subfolders
                subfolders = []
                for item in items:
                    if item.get("type") == "file":
                        item["client_folder"] = client_folder_name
                        found_files.append(item)
                    elif item.get("type") == "folder":
                        subfolders.append(item)
                
                # Search one level of subfolders
                for subfolder in subfolders[:10]:  # Limit subfolder depth
                    subfolder_items = requests.get(
                        f"https://api.box.com/2.0/folders/{subfolder['id']}/items",
                        headers=headers,
                        params={
                            "limit": 50,
                            "fields": "id,name,size,created_at,modified_at,type,extension,parent"
                        }
                    )
                    if subfolder_items.status_code == 200:
                        for item in subfolder_items.json().get("entries", []):
                            if item.get("type") == "file":
                                item["client_folder"] = client_folder_name
                                item["subfolder"] = subfolder.get("name")
                                found_files.append(item)
                
                logger.info(f"Found {len(found_files)} files in client folder '{client_folder_name}'")
        
        # Step 3: Also do a direct file search as backup
        file_response = requests.get(
            "https://api.box.com/2.0/search",
            headers=headers,
            params={
                "query": query,
                "type": "file",
                "limit": limit,
                "fields": "id,name,size,created_at,modified_at,parent,extension"
            }
        )
        
        if file_response.status_code == 200:
            direct_files = file_response.json().get("entries", [])
            # Add files not already in found_files
            existing_ids = {f["id"] for f in found_files}
            for f in direct_files:
                if f["id"] not in existing_ids:
                    found_files.append(f)
        
        logger.info(f"Box search total: {len(found_files)} files for query '{query}'")
        return found_files[:limit]
        
    except Exception as e:
        logger.error(f"Box internal search error: {e}")
        return []

def download_box_file_internal(token: str, file_id: str, file_name: str = "unknown") -> bytes:
    """Download file content from Box with detailed logging"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        logger.info(f"Downloading Box file: {file_name} (ID: {file_id})")
        
        response = requests.get(
            f"https://api.box.com/2.0/files/{file_id}/content",
            headers=headers,
            allow_redirects=True,
            timeout=60
        )
        
        if response.status_code == 200:
            content_length = len(response.content)
            logger.info(f"Successfully downloaded {file_name}: {content_length} bytes")
            return response.content
        else:
            logger.error(f"Box download failed for {file_name}: HTTP {response.status_code} - {response.text[:500]}")
            return None
            
    except requests.exceptions.Timeout:
        logger.error(f"Box download timeout for {file_name}")
        return None
    except Exception as e:
        logger.error(f"Box download error for {file_name}: {e}")
        return None

def search_outlook_internal(graph_token: str, query: str, limit: int = 10) -> list:
    """Internal Outlook search - returns list of emails"""
    try:
        headers = {
            "Authorization": f"Bearer {graph_token}",
            "Content-Type": "application/json"
        }
        
        if query:
            url = f"https://graph.microsoft.com/v1.0/me/messages?$search=\"{query}\""
        else:
            url = "https://graph.microsoft.com/v1.0/me/messages"
        
        params = {
            "$top": limit,
            "$select": "id,subject,bodyPreview,body,from,toRecipients,receivedDateTime,hasAttachments"
        }
        
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            return response.json().get("value", [])
        return []
    except Exception as e:
        logger.error(f"Outlook internal search error: {e}")
        return []

def search_calendar_internal(graph_token: str, query: str, limit: int = 10) -> list:
    """Internal Calendar search - returns list of events"""
    try:
        headers = {
            "Authorization": f"Bearer {graph_token}",
            "Content-Type": "application/json"
        }
        
        # Get events from now to 60 days ahead
        start_time = datetime.now(timezone.utc).isoformat()
        end_time = (datetime.now(timezone.utc) + timedelta(days=60)).isoformat()
        
        url = f"https://graph.microsoft.com/v1.0/me/calendarView"
        params = {
            "startDateTime": start_time,
            "endDateTime": end_time,
            "$top": 50,
            "$select": "id,subject,start,end,location,bodyPreview,isAllDay"
        }
        
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            events = response.json().get("value", [])
            # Filter by query if provided
            if query:
                query_lower = query.lower()
                events = [e for e in events if query_lower in (e.get("subject") or "").lower() 
                         or query_lower in (e.get("bodyPreview") or "").lower()]
            return events[:limit]
        return []
    except Exception as e:
        logger.error(f"Calendar internal search error: {e}")
        return []

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extract text from file using Document Intelligence with detailed logging"""
    try:
        from azure.ai.documentintelligence import DocumentIntelligenceClient
        from azure.core.credentials import AzureKeyCredential
        
        doc_endpoint = os.getenv("DOC_INTEL_ENDPOINT")
        doc_key = os.getenv("DOC_INTEL_KEY")
        
        if not doc_endpoint or not doc_key:
            logger.error(f"Document Intelligence not configured for {filename}")
            return f"[Could not extract text from {filename} - Document Intelligence not configured]"
        
        # Check file size
        file_size = len(file_content)
        logger.info(f"Extracting text from {filename} ({file_size} bytes)")
        
        if file_size == 0:
            logger.error(f"Empty file content for {filename}")
            return f"[File {filename} is empty]"
        
        if file_size > 50 * 1024 * 1024:  # 50MB limit
            logger.error(f"File {filename} too large: {file_size} bytes")
            return f"[File {filename} is too large for processing]"
        
        # Only process supported file types
        supported_ext = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.xlsx', '.xls', '.pptx', '.ppt']
        ext = os.path.splitext(filename)[1].lower()
        
        if ext not in supported_ext:
            logger.warning(f"Unsupported file type {ext} for {filename}")
            return f"[File type {ext} not supported for text extraction]"
        
        logger.info(f"Calling Document Intelligence for {filename}")
        doc_client = DocumentIntelligenceClient(endpoint=doc_endpoint, credential=AzureKeyCredential(doc_key))
        
        poller = doc_client.begin_analyze_document(
            "prebuilt-layout", 
            body=file_content,
            content_type="application/octet-stream"
        )
        result = poller.result()
        
        extracted_text = result.content or ""
        logger.info(f"Extracted {len(extracted_text)} chars from {filename}")
        
        if not extracted_text:
            return f"[No text content found in {filename}]"
        
        return extracted_text
        
    except Exception as e:
        logger.error(f"Text extraction error for {filename}: {type(e).__name__}: {e}")
        return f"[Error extracting text from {filename}: {str(e)}]"

@app.post("/api/agentic")
async def agentic_search(request: Request, background_tasks: BackgroundTasks):
    """Agentic search endpoint - AI automatically searches relevant sources"""
    try:
        data = await request.json()
        job_id = str(uuid.uuid4())
        
        user_email = get_user_email(request)
        graph_token = request.headers.get("X-MS-TOKEN-AAD-ACCESS-TOKEN") or os.getenv("TEST_GRAPH_TOKEN")
        box_token = get_valid_box_token(user_email)
        
        # Add tokens and user info to data
        data["graph_token"] = graph_token
        data["box_token"] = box_token
        data["user_email"] = user_email
        
        background_tasks.add_task(agentic_task, job_id, data)
        return {"job_id": job_id}
        
    except Exception as e:
        logger.error(f"Agentic endpoint error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

def agentic_task(job_id: str, data: dict):
    """Background task for agentic search and response"""
    JOBS[job_id] = {"status": "Planning", "result": "", "sources_searched": []}
    
    try:
        from openai import AzureOpenAI
        
        key = os.getenv("AZURE_OPENAI_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        client = AzureOpenAI(api_key=key, azure_endpoint=endpoint, api_version="2024-02-01")
        
        user_query = data.get("query", "")
        jurisdiction = data.get("jurisdiction", "California")
        graph_token = data.get("graph_token")
        box_token = data.get("box_token")
        
        # Also include any manually attached content
        manual_blobs = data.get("blobs", [])
        manual_emails = data.get("emails", [])
        manual_calendar = data.get("calendar_events", [])
        
        # Step 1: Plan what to search
        JOBS[job_id]["status"] = "Planning search strategy..."
        
        plan_response = client.chat.completions.create(
            model="model-router",
            messages=[
                {"role": "system", "content": AGENTIC_PLANNER_PROMPT},
                {"role": "user", "content": f"User query: {user_query}"}
            ],
            response_format={"type": "json_object"}
        )
        
        plan_text = plan_response.choices[0].message.content
        try:
            plan = json.loads(plan_text)
        except:
            plan = {"is_case_specific": False}
        
        logger.info(f"Search plan: {plan}")
        
        # Collect all context
        collected_emails = list(manual_emails)
        collected_calendar = list(manual_calendar)
        collected_documents = []
        sources_searched = []
        
        # Step 2: Execute searches based on plan
        if plan.get("is_case_specific", False):
            
            # Search Box
            if plan.get("search_box") and box_token:
                JOBS[job_id]["status"] = "Searching Box files..."
                box_query = plan.get("box_query", "")
                if box_query:
                    sources_searched.append(f"Box: '{box_query}'")
                    box_results = search_box_internal(box_token, box_query, limit=10)
                    
                    if box_results:
                        logger.info(f"Box found {len(box_results)} files for '{box_query}'")
                        JOBS[job_id]["status"] = f"Found {len(box_results)} Box files, reading..."
                    else:
                        logger.warning(f"No Box files found for '{box_query}'")
                    
                    # Download and extract text from top results
                    files_processed = 0
                    for file_info in box_results[:5]:  # Limit to 5 files for performance
                        file_id = file_info.get("id")
                        file_name = file_info.get("name", "unknown")
                        client_folder = file_info.get("client_folder", "")
                        subfolder = file_info.get("subfolder", "")
                        
                        JOBS[job_id]["status"] = f"Reading {file_name}..."
                        file_content = download_box_file_internal(box_token, file_id, file_name)
                        
                        if file_content:
                            text = extract_text_from_file(file_content, file_name)
                            location = client_folder
                            if subfolder:
                                location = f"{client_folder}/{subfolder}"
                            
                            collected_documents.append({
                                "name": file_name,
                                "source": f"Box ({location})" if location else "Box",
                                "text": text[:50000]  # Limit per doc
                            })
                            files_processed += 1
                        else:
                            logger.warning(f"Failed to download {file_name} from Box")
                    
                    logger.info(f"Successfully processed {files_processed} Box files")
            elif plan.get("search_box") and not box_token:
                logger.warning("Box search requested but no Box token available")
                sources_searched.append("Box: (not connected)")
            
            # Search Outlook
            if plan.get("search_emails") and graph_token:
                JOBS[job_id]["status"] = "Searching emails..."
                email_query = plan.get("email_query", "")
                if email_query:
                    sources_searched.append(f"Outlook: '{email_query}'")
                    email_results = search_outlook_internal(graph_token, email_query, limit=10)
                    
                    for email in email_results:
                        body_content = ""
                        if email.get("body"):
                            if email["body"].get("contentType") == "html":
                                # Strip HTML tags
                                import re
                                body_content = re.sub(r'<[^>]+>', '', email["body"].get("content", ""))
                            else:
                                body_content = email["body"].get("content", "")
                        
                        collected_emails.append({
                            "subject": email.get("subject", "No subject"),
                            "from": email.get("from", {}).get("emailAddress", {}).get("address", "Unknown"),
                            "date": email.get("receivedDateTime", ""),
                            "body": body_content[:10000]  # Limit per email
                        })
            
            # Search Calendar
            if plan.get("search_calendar") and graph_token:
                JOBS[job_id]["status"] = "Checking calendar..."
                calendar_query = plan.get("calendar_query", "")
                sources_searched.append(f"Calendar: '{calendar_query}'" if calendar_query else "Calendar: upcoming events")
                calendar_results = search_calendar_internal(graph_token, calendar_query, limit=10)
                
                for event in calendar_results:
                    collected_calendar.append({
                        "subject": event.get("subject", "No title"),
                        "start": event.get("start", {}).get("dateTime", ""),
                        "end": event.get("end", {}).get("dateTime", ""),
                        "location": event.get("location", {}).get("displayName", ""),
                        "body": event.get("bodyPreview", "")
                    })
        
        JOBS[job_id]["sources_searched"] = sources_searched
        
        # Step 3: Process manually attached blobs
        if manual_blobs:
            JOBS[job_id]["status"] = "Processing uploaded documents..."
            try:
                from azure.ai.documentintelligence import DocumentIntelligenceClient
                from azure.storage.blob import BlobServiceClient
                from azure.core.credentials import AzureKeyCredential
                
                storage_conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
                storage_cont = os.getenv("AZURE_STORAGE_CONTAINER")
                doc_endpoint = os.getenv("DOC_INTEL_ENDPOINT")
                doc_key = os.getenv("DOC_INTEL_KEY")
                
                if storage_conn and doc_endpoint:
                    blob_service = BlobServiceClient.from_connection_string(storage_conn)
                    container_client = blob_service.get_container_client(storage_cont)
                    doc_client = DocumentIntelligenceClient(endpoint=doc_endpoint, credential=AzureKeyCredential(doc_key))
                    
                    for blob_info in manual_blobs:
                        b_name = blob_info.get("blob_name")
                        f_name = blob_info.get("original_filename")
                        try:
                            blob_client = container_client.get_blob_client(b_name)
                            file_data = blob_client.download_blob().readall()
                            
                            poller = doc_client.begin_analyze_document("prebuilt-layout", body=file_data)
                            result = poller.result()
                            text = result.content or "(No Text)"
                            collected_documents.append({
                                "name": f_name,
                                "source": "Uploaded",
                                "text": text[:50000]
                            })
                        except Exception as e:
                            logger.error(f"Error processing blob {f_name}: {e}")
            except Exception as e:
                logger.error(f"Error processing manual blobs: {e}")
        
        # Step 4: Build context for final response
        JOBS[job_id]["status"] = "Analyzing and preparing response..."
        
        context_parts = []
        
        if collected_documents:
            context_parts.append("=== DOCUMENTS ===")
            for doc in collected_documents:
                context_parts.append(f"\n--- Document: {doc['name']} (Source: {doc['source']}) ---")
                context_parts.append(doc['text'])
        
        if collected_emails:
            context_parts.append("\n=== EMAILS ===")
            for email in collected_emails:
                context_parts.append(f"\n--- Email: {email['subject']} ({email['date']}) ---")
                context_parts.append(f"From: {email['from']}")
                context_parts.append(f"Body: {email['body']}")
        
        if collected_calendar:
            context_parts.append("\n=== CALENDAR EVENTS ===")
            for event in collected_calendar:
                start_str = event['start']
                try:
                    start_dt = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
                    start_str = start_dt.strftime("%B %d, %Y at %I:%M %p")
                except:
                    pass
                context_parts.append(f"\n--- Event: {event['subject']} ({start_str}) ---")
                if event['location']:
                    context_parts.append(f"Location: {event['location']}")
                if event['body']:
                    context_parts.append(f"Details: {event['body']}")
        
        full_context = "\n".join(context_parts)
        
        # Limit total context
        if len(full_context) > 100000:
            full_context = full_context[:100000] + "\n\n[Content truncated due to length...]"
        
        # Step 5: Generate final response
        system_prompt = AGENTIC_RESPONSE_PROMPT.format(jurisdiction=jurisdiction)
        
        if full_context:
            user_message = f"""Based on the following information gathered from the firm's systems:

{full_context}

---

User's Question: {user_query}

Please provide a comprehensive response, citing specific sources where applicable."""
        else:
            user_message = user_query
        
        final_response = client.chat.completions.create(
            model="model-router",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
        )
        
        result_text = final_response.choices[0].message.content
        
        # Add sources footer if searches were performed
        if sources_searched or collected_documents or collected_emails or collected_calendar:
            footer_parts = []
            
            if collected_documents:
                doc_names = [d["name"] for d in collected_documents[:5]]
                footer_parts.append(f"📄 **{len(collected_documents)} documents**: {', '.join(doc_names)}")
            
            if collected_emails:
                footer_parts.append(f"📧 **{len(collected_emails)} emails** reviewed")
            
            if collected_calendar:
                footer_parts.append(f"📅 **{len(collected_calendar)} calendar events** found")
            
            if sources_searched:
                footer_parts.append(f"🔍 **Searched:** {', '.join(sources_searched)}")
            
            result_text += "\n\n---\n" + "\n".join(footer_parts)
        
        JOBS[job_id]["status"] = "Complete"
        JOBS[job_id]["result"] = result_text
        
    except Exception as e:
        logger.error(f"Agentic task error: {e}")
        JOBS[job_id]["status"] = "Failed"
        JOBS[job_id]["result"] = f"Error: {str(e)}"

# --- AGREEMENT ENDPOINTS ---

@app.get("/api/check-agreement")
async def check_agreement(request: Request):
    """Check if user has accepted the agreement"""
    try:
        user_email = get_user_email(request)
        
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if not connect_str:
            return JSONResponse(status_code=500, content={"error": "Storage not configured"})
        
        blob_service = BlobServiceClient.from_connection_string(connect_str)
        container_name = "user-agreements"
        
        try:
            container_client = blob_service.get_container_client(container_name)
            if not container_client.exists():
                container_client.create_container()
        except Exception as e:
            logger.error(f"Container error: {e}")
        
        blob_name = f"{user_email.replace('@', '_at_').replace('.', '_')}.json"
        blob_client = blob_service.get_blob_client(container=container_name, blob=blob_name)
        
        try:
            blob_client.get_blob_properties()
            return {"accepted": True, "user": user_email}
        except:
            return {"accepted": False, "user": user_email}
            
    except Exception as e:
        logger.error(f"Check agreement error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/accept-agreement")
async def accept_agreement(request: Request):
    """Record user's acceptance of the agreement"""
    try:
        user_email = get_user_email(request)
        
        connect_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if not connect_str:
            return JSONResponse(status_code=500, content={"error": "Storage not configured"})
        
        blob_service = BlobServiceClient.from_connection_string(connect_str)
        container_name = "user-agreements"
        
        try:
            container_client = blob_service.get_container_client(container_name)
            if not container_client.exists():
                container_client.create_container()
        except:
            pass
        
        agreement_data = {
            "user_email": user_email,
            "accepted_at": datetime.now(timezone.utc).isoformat(),
            "version": "1.0",
            "ip_address": request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        }
        
        blob_name = f"{user_email.replace('@', '_at_').replace('.', '_')}.json"
        blob_client = blob_service.get_blob_client(container=container_name, blob=blob_name)
        blob_client.upload_blob(json.dumps(agreement_data), overwrite=True)
        
        logger.info(f"Agreement accepted by {user_email}")
        return {"success": True, "user": user_email}
        
    except Exception as e:
        logger.error(f"Accept agreement error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- ROUTES ---

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Render login page"""
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Main app - requires authentication"""
    user_info = get_user_info(request)
    
    # Check if user is authenticated
    if not user_info["authenticated"]:
        # In production, redirect to login
        # For local testing with TEST_USER_EMAIL, allow access
        if not os.getenv("TEST_USER_EMAIL"):
            return RedirectResponse(url="/login")
    
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
            params = {
                "$top": 25,
                "$select": "id,subject,from,toRecipients,receivedDateTime,bodyPreview,hasAttachments",
                "$search": f'"{query}"'
            }
        else:
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
        
        resp = requests.get(url, headers=headers, params=params)
        
        if resp.status_code != 200:
            return JSONResponse(status_code=resp.status_code, content={"error": f"Graph Error: {resp.text}"})
        
        result = resp.json()
        
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

        if calendar_events:
            calendar_context = "\n--- CALENDAR EVENTS ---\n"
            for event in calendar_events:
                subject = event.get("subject", "No title")
                start = event.get("start", "Unknown")
                end = event.get("end", "Unknown")
                location = event.get("location", "")
                body = event.get("body", "")
                
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
