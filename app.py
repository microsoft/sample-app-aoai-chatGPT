"""
Joogni - California Family Law AI Assistant
Main Application with Dashboard, Chat, Calculators, and M365 Integration
Now with Function Calling for Emails, Calendar, and OneDrive
"""

import os
import json
import base64
import re
import httpx
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from openai import AzureOpenAI

app = FastAPI(title="Joogni", description="California Family Law AI Assistant")

# Mount static files only if directory exists
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.isdir(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
elif os.path.isdir("/home/site/wwwroot/static"):
    app.mount("/static", StaticFiles(directory="/home/site/wwwroot/static"), name="static")

# Templates - find the correct directory
templates_dir = "templates"
if os.path.isdir("/home/site/wwwroot/templates"):
    templates_dir = "/home/site/wwwroot/templates"
elif os.path.isdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")):
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
templates = Jinja2Templates(directory=templates_dir)

# System prompt for Joogni
JOOGNI_SYSTEM_PROMPT = """You are Joogni, a California family law AI assistant designed for attorneys at Gill Law Group. 

Your expertise includes:
- California Family Code
- Child custody and visitation (FC §3000-3465)
- Child support guidelines (FC §4050-4076)
- Spousal support (FC §4300-4360)
- Property division (FC §760-2660)
- Domestic violence restraining orders
- Dissolution procedures and timelines

You have access to the user's Microsoft 365 account and can:
- Search and read their Outlook emails
- Check their calendar for meetings and hearings
- Search their OneDrive files

When a user asks about emails, meetings, calendar events, or files, USE THE AVAILABLE TOOLS to search and retrieve that information. Don't say you can't access their data - you CAN access it through the tools provided.

When answering legal questions:
1. Cite specific Family Code sections when applicable
2. Reference relevant case law when appropriate
3. Provide practical, actionable guidance
4. Note any recent changes in law or procedure
5. Flag issues that may require judicial discretion

For document analysis:
- Identify key dates, parties, and issues
- Flag potential problems or inconsistencies
- Suggest follow-up actions

For email/calendar context:
- Summarize case status based on communications
- Identify upcoming deadlines
- Note any urgent matters

Always maintain attorney-client privilege awareness and remind users not to share client-identifying information outside secure channels.

Format responses with clear structure when appropriate. Be thorough but concise."""


# Define tools for function calling
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_emails",
            "description": "Search the user's Outlook emails. Use this when the user asks about emails, messages, correspondence, or communications from specific people or about specific topics.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query - can be a person's name, email address, subject, or keywords"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of emails to return (default 10)",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_email_content",
            "description": "Get the full content of a specific email by its ID. Use this after search_emails to read the full body of an email.",
            "parameters": {
                "type": "object",
                "properties": {
                    "message_id": {
                        "type": "string",
                        "description": "The ID of the email message to retrieve"
                    }
                },
                "required": ["message_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_calendar",
            "description": "Search the user's calendar for meetings, appointments, hearings, or events. Use this when the user asks about their schedule, meetings, hearings, or calendar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Optional search term to filter events by subject or location. Leave empty to get all upcoming events.",
                        "default": ""
                    },
                    "days_ahead": {
                        "type": "integer",
                        "description": "Number of days ahead to search (default 7 for a week)",
                        "default": 7
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": "Search the user's OneDrive files. Use this when the user asks about documents, files, or wants to find specific files.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query - filename, content keywords, or file type"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_todays_events",
            "description": "Get all of today's calendar events. Use this when the user asks 'do I have meetings today', 'what's on my calendar today', or similar.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]


def get_user_info(request: Request) -> dict:
    """Extract user info from Azure Easy Auth headers."""
    principal = request.headers.get("X-MS-CLIENT-PRINCIPAL")
    if principal:
        try:
            decoded = base64.b64decode(principal)
            return json.loads(decoded)
        except:
            pass
    return None


def is_authenticated(request: Request) -> bool:
    """Check if user is authenticated via Azure Easy Auth."""
    principal = request.headers.get("X-MS-CLIENT-PRINCIPAL")
    id_token = request.headers.get("X-MS-TOKEN-AAD-ID-TOKEN")
    return bool(principal or id_token)


def get_graph_token(request: Request) -> str:
    """Get Microsoft Graph access token from Easy Auth."""
    token = request.headers.get("X-MS-TOKEN-AAD-ACCESS-TOKEN")
    if not token:
        return None
    return token


# ============== Tool Execution Functions ==============

async def execute_search_emails(token: str, query: str, limit: int = 10) -> dict:
    """Execute email search via Microsoft Graph."""
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://graph.microsoft.com/v1.0/me/messages?$search=\"{query}\"&$top={limit}&$select=id,subject,from,receivedDateTime,bodyPreview,hasAttachments"
            
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"},
                timeout=30.0
            )
            
            if response.status_code != 200:
                return {"error": f"Failed to search emails: {response.status_code}"}
            
            data = response.json()
            emails = []
            for msg in data.get("value", []):
                emails.append({
                    "id": msg.get("id"),
                    "subject": msg.get("subject", "(No subject)"),
                    "from": msg.get("from", {}).get("emailAddress", {}).get("name", "Unknown"),
                    "from_email": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
                    "date": msg.get("receivedDateTime", ""),
                    "preview": msg.get("bodyPreview", "")[:200],
                    "hasAttachments": msg.get("hasAttachments", False)
                })
            
            return {"emails": emails, "count": len(emails)}
            
    except Exception as e:
        return {"error": str(e)}


async def execute_get_email_content(token: str, message_id: str) -> dict:
    """Get full email content."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://graph.microsoft.com/v1.0/me/messages/{message_id}?$select=id,subject,from,toRecipients,receivedDateTime,body",
                headers={"Authorization": f"Bearer {token}"},
                timeout=30.0
            )
            
            if response.status_code != 200:
                return {"error": f"Failed to get email: {response.status_code}"}
            
            msg = response.json()
            
            # Extract text from HTML body
            body_content = msg.get("body", {}).get("content", "")
            text_body = re.sub(r'<[^>]+>', ' ', body_content)
            text_body = re.sub(r'\s+', ' ', text_body).strip()
            
            return {
                "subject": msg.get("subject", "(No subject)"),
                "from": msg.get("from", {}).get("emailAddress", {}).get("name", "Unknown"),
                "from_email": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
                "date": msg.get("receivedDateTime", ""),
                "body": text_body[:3000]
            }
            
    except Exception as e:
        return {"error": str(e)}


async def execute_search_calendar(token: str, query: str = "", days_ahead: int = 7) -> dict:
    """Search calendar events."""
    try:
        start = datetime.utcnow()
        end = start + timedelta(days=days_ahead)
        
        async with httpx.AsyncClient() as client:
            url = f"https://graph.microsoft.com/v1.0/me/calendarView?startDateTime={start.isoformat()}Z&endDateTime={end.isoformat()}Z&$select=id,subject,start,end,location,organizer,isAllDay&$orderby=start/dateTime&$top=50"
            
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"},
                timeout=30.0
            )
            
            if response.status_code != 200:
                return {"error": f"Failed to search calendar: {response.status_code}"}
            
            data = response.json()
            events = []
            
            for event in data.get("value", []):
                if query:
                    query_lower = query.lower()
                    subject = event.get("subject", "").lower()
                    location = str(event.get("location", {}).get("displayName", "")).lower()
                    if query_lower not in subject and query_lower not in location:
                        continue
                
                events.append({
                    "id": event.get("id"),
                    "subject": event.get("subject", "(No title)"),
                    "start": event.get("start", {}).get("dateTime", ""),
                    "end": event.get("end", {}).get("dateTime", ""),
                    "location": event.get("location", {}).get("displayName", ""),
                    "isAllDay": event.get("isAllDay", False),
                    "organizer": event.get("organizer", {}).get("emailAddress", {}).get("name", "")
                })
            
            return {"events": events, "count": len(events), "days_searched": days_ahead}
            
    except Exception as e:
        return {"error": str(e)}


async def execute_get_todays_events(token: str) -> dict:
    """Get today's calendar events."""
    try:
        now = datetime.utcnow()
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        
        async with httpx.AsyncClient() as client:
            url = f"https://graph.microsoft.com/v1.0/me/calendarView?startDateTime={start.isoformat()}Z&endDateTime={end.isoformat()}Z&$select=id,subject,start,end,location,organizer,isAllDay&$orderby=start/dateTime"
            
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"},
                timeout=30.0
            )
            
            if response.status_code != 200:
                return {"error": f"Failed to get calendar: {response.status_code}"}
            
            data = response.json()
            events = []
            
            for event in data.get("value", []):
                events.append({
                    "subject": event.get("subject", "(No title)"),
                    "start": event.get("start", {}).get("dateTime", ""),
                    "end": event.get("end", {}).get("dateTime", ""),
                    "location": event.get("location", {}).get("displayName", ""),
                    "isAllDay": event.get("isAllDay", False)
                })
            
            if not events:
                return {"message": "No meetings or events scheduled for today.", "events": [], "count": 0}
            
            return {"events": events, "count": len(events), "date": start.strftime("%A, %B %d, %Y")}
            
    except Exception as e:
        return {"error": str(e)}


async def execute_search_files(token: str, query: str) -> dict:
    """Search OneDrive files."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://graph.microsoft.com/v1.0/me/drive/root/search(q='{query}')?$select=id,name,webUrl,createdDateTime,size,file,folder&$top=20",
                headers={"Authorization": f"Bearer {token}"},
                timeout=30.0
            )
            
            if response.status_code != 200:
                return {"error": f"Failed to search files: {response.status_code}"}
            
            data = response.json()
            files = []
            
            for item in data.get("value", []):
                files.append({
                    "id": item.get("id"),
                    "name": item.get("name"),
                    "url": item.get("webUrl"),
                    "created": item.get("createdDateTime"),
                    "size": item.get("size", 0),
                    "isFolder": "folder" in item
                })
            
            return {"files": files, "count": len(files)}
            
    except Exception as e:
        return {"error": str(e)}


async def execute_tool(tool_name: str, arguments: dict, token: str) -> str:
    """Execute a tool and return the result as a string."""
    try:
        if tool_name == "search_emails":
            result = await execute_search_emails(
                token,
                arguments.get("query", ""),
                arguments.get("limit", 10)
            )
        elif tool_name == "get_email_content":
            result = await execute_get_email_content(
                token,
                arguments.get("message_id", "")
            )
        elif tool_name == "search_calendar":
            result = await execute_search_calendar(
                token,
                arguments.get("query", ""),
                arguments.get("days_ahead", 7)
            )
        elif tool_name == "get_todays_events":
            result = await execute_get_todays_events(token)
        elif tool_name == "search_files":
            result = await execute_search_files(
                token,
                arguments.get("query", "")
            )
        else:
            result = {"error": f"Unknown tool: {tool_name}"}
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": str(e)})


# ============== Page Routes ==============

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Root route - show login or redirect to dashboard."""
    if is_authenticated(request):
        return templates.TemplateResponse("dashboard.html", {"request": request})
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Login page."""
    if is_authenticated(request):
        return HTMLResponse(
            content='<script>window.location.href="/dashboard";</script>',
            status_code=200
        )
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Dashboard - main hub after login."""
    if not is_authenticated(request):
        return HTMLResponse(
            content='<script>window.location.href="/.auth/login/aad?post_login_redirect_uri=/dashboard";</script>',
            status_code=200
        )
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    """Chat interface with Joogni AI."""
    if not is_authenticated(request):
        return HTMLResponse(
            content='<script>window.location.href="/.auth/login/aad?post_login_redirect_uri=/chat";</script>',
            status_code=200
        )
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/calculators", response_class=HTMLResponse)
async def calculators_page(request: Request):
    """Family law calculators."""
    if not is_authenticated(request):
        return HTMLResponse(
            content='<script>window.location.href="/.auth/login/aad?post_login_redirect_uri=/calculators";</script>',
            status_code=200
        )
    return templates.TemplateResponse("calculators.html", {"request": request})


# ============== API Routes ==============

# In-memory storage for agreements (use database in production)
user_agreements = {}

@app.get("/api/user")
async def get_user(request: Request):
    """Get current user info."""
    user_info = get_user_info(request)
    if user_info:
        return JSONResponse(user_info)
    return JSONResponse({"authenticated": False})


@app.get("/api/user-info")
async def get_user_info_api(request: Request):
    """Get user info for display."""
    user_info = get_user_info(request)
    if user_info:
        return JSONResponse({
            "name": user_info.get("name", "User"),
            "email": user_info.get("email", ""),
            "authenticated": True
        })
    return JSONResponse({
        "name": "Guest",
        "email": "",
        "authenticated": False
    })


@app.get("/api/check-agreement")
async def check_agreement(request: Request):
    """Check if user has accepted the agreement."""
    user_info = get_user_info(request)
    user_id = user_info.get("email", "anonymous") if user_info else "anonymous"
    
    accepted = user_agreements.get(user_id, False)
    return JSONResponse({"accepted": accepted})


@app.post("/api/accept-agreement")
async def accept_agreement(request: Request):
    """Record user's acceptance of the agreement."""
    user_info = get_user_info(request)
    user_id = user_info.get("email", "anonymous") if user_info else "anonymous"
    
    user_agreements[user_id] = True
    return JSONResponse({"success": True, "message": "Agreement accepted"})


@app.get("/api/box/status")
async def box_status(request: Request):
    """Check Box integration status (placeholder)."""
    return JSONResponse({
        "connected": False,
        "message": "Box integration not configured"
    })


@app.post("/api/conversation")
@app.post("/api/agentic")
async def conversation(request: Request):
    """Handle chat conversation with Azure OpenAI - with function calling for M365."""
    import sys
    print("=== CONVERSATION ENDPOINT HIT ===", file=sys.stderr)
    try:
        data = await request.json()
        messages = data.get("messages", [])
        context = data.get("context", "")
        print(f"Messages received: {len(messages)}", file=sys.stderr)
        
        # Get Azure OpenAI credentials
        key = os.getenv("AZURE_OPENAI_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "model-router")
        
        print(f"Endpoint: {endpoint}", file=sys.stderr)
        print(f"Deployment: {deployment}", file=sys.stderr)
        print(f"Key present: {bool(key)}", file=sys.stderr)
        
        if not key or not endpoint:
            raise HTTPException(status_code=500, detail="Azure OpenAI not configured")
        
        # Get Graph token for M365 access
        graph_token = get_graph_token(request)
        
        print("Creating AzureOpenAI client...", file=sys.stderr)
        client = AzureOpenAI(
            api_key=key,
            azure_endpoint=endpoint,
            api_version="2024-10-21"
        )
        print("Client created, making request...", file=sys.stderr)
        
        # Build messages with system prompt
        chat_messages = [{"role": "system", "content": JOOGNI_SYSTEM_PROMPT}]
        
        # Add context if provided
        if context:
            chat_messages.append({
                "role": "user", 
                "content": f"Context from uploaded documents/emails:\n{context}"
            })
            chat_messages.append({
                "role": "assistant",
                "content": "I've reviewed the provided context. How can I help you with this information?"
            })
        
        # Add conversation messages
        for msg in messages:
            chat_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        # First call - may request tool use
        response = client.chat.completions.create(
            model=deployment,
            messages=chat_messages,
            tools=TOOLS if graph_token else None,
            tool_choice="auto" if graph_token else None,
            temperature=0.7,
            max_tokens=2000
        )
        
        response_message = response.choices[0].message
        
        # Check if the model wants to use tools
        if response_message.tool_calls and graph_token:
            # Add the assistant's response to messages
            chat_messages.append({
                "role": "assistant",
                "content": response_message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in response_message.tool_calls
                ]
            })
            
            # Execute each tool call
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                # Execute the tool
                tool_result = await execute_tool(function_name, function_args, graph_token)
                
                # Add tool result to messages
                chat_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result
                })
            
            # Get final response after tool execution
            final_response = client.chat.completions.create(
                model=deployment,
                messages=chat_messages,
                temperature=0.7,
                max_tokens=2000
            )
            
            return JSONResponse({
                "response": final_response.choices[0].message.content,
                "tools_used": [tc.function.name for tc in response_message.tool_calls],
                "usage": {
                    "prompt_tokens": final_response.usage.prompt_tokens,
                    "completion_tokens": final_response.usage.completion_tokens
                }
            })
        
        # No tool calls - return direct response
        return JSONResponse({
            "response": response_message.content,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/check_status/{request_id}")
async def check_status(request_id: str):
    """Check status of a request - returns completed since we process synchronously."""
    return JSONResponse({
        "status": "completed",
        "request_id": request_id
    })


@app.post("/api/documents/analyze")
async def analyze_document(request: Request, file: UploadFile = File(...)):
    """Analyze uploaded document using Azure Document Intelligence."""
    try:
        from azure.ai.documentintelligence import DocumentIntelligenceClient
        from azure.core.credentials import AzureKeyCredential
        
        doc_endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
        doc_key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")
        
        if not doc_endpoint or not doc_key:
            raise HTTPException(status_code=500, detail="Document Intelligence not configured")
        
        client = DocumentIntelligenceClient(
            endpoint=doc_endpoint,
            credential=AzureKeyCredential(doc_key)
        )
        
        content = await file.read()
        
        poller = client.begin_analyze_document(
            "prebuilt-layout",
            body=content,
            content_type=file.content_type
        )
        result = poller.result()
        
        text_content = ""
        for page in result.pages:
            for line in page.lines:
                text_content += line.content + "\n"
        
        return JSONResponse({
            "filename": file.filename,
            "content": text_content,
            "pages": len(result.pages)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== Direct Microsoft Graph API Routes (for manual panel) ==============

@app.get("/api/outlook/search")
async def search_emails_direct(request: Request, q: str = "", top: int = 20):
    """Search Outlook emails (direct API for M365 panel)."""
    try:
        token = get_graph_token(request)
        if not token:
            raise HTTPException(status_code=401, detail="No access token available")
        
        async with httpx.AsyncClient() as client:
            if q:
                url = f"https://graph.microsoft.com/v1.0/me/messages?$search=\"{q}\"&$top={top}&$select=id,subject,from,receivedDateTime,bodyPreview,hasAttachments"
            else:
                url = f"https://graph.microsoft.com/v1.0/me/messages?$top={top}&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,hasAttachments"
            
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return JSONResponse(response.json())
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/outlook/message/{message_id}")
async def get_email_direct(request: Request, message_id: str):
    """Get full email content (direct API for M365 panel)."""
    try:
        token = get_graph_token(request)
        if not token:
            raise HTTPException(status_code=401, detail="No access token available")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://graph.microsoft.com/v1.0/me/messages/{message_id}?$select=id,subject,from,toRecipients,receivedDateTime,body,hasAttachments",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return JSONResponse(response.json())
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/calendar/search")
async def search_calendar_direct(request: Request, q: str = "", days: int = 30):
    """Search calendar events (direct API for M365 panel)."""
    try:
        token = get_graph_token(request)
        if not token:
            raise HTTPException(status_code=401, detail="No access token available")
        
        start = datetime.utcnow()
        end = start + timedelta(days=days)
        
        async with httpx.AsyncClient() as client:
            url = f"https://graph.microsoft.com/v1.0/me/calendarView?startDateTime={start.isoformat()}Z&endDateTime={end.isoformat()}Z&$select=id,subject,start,end,location,organizer&$orderby=start/dateTime"
            
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            data = response.json()
            
            if q:
                q_lower = q.lower()
                data["value"] = [
                    event for event in data.get("value", [])
                    if q_lower in event.get("subject", "").lower()
                    or q_lower in str(event.get("location", {}).get("displayName", "")).lower()
                ]
            
            return JSONResponse(data)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/onedrive/search")
async def search_onedrive_direct(request: Request, q: str):
    """Search OneDrive files (direct API for M365 panel)."""
    try:
        token = get_graph_token(request)
        if not token:
            raise HTTPException(status_code=401, detail="No access token available")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://graph.microsoft.com/v1.0/me/drive/root/search(q='{q}')?$select=id,name,webUrl,createdDateTime,size,file",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            return JSONResponse(response.json())
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/test")
async def test_endpoint():
    """Test endpoint to verify API is working."""
    import sys
    print("=== TEST ENDPOINT HIT ===", file=sys.stderr)
    key = os.getenv("AZURE_OPENAI_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    return {
        "status": "ok",
        "key_present": bool(key),
        "endpoint": endpoint,
        "deployment": deployment
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
