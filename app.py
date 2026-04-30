import os
import json
import logging
import uuid
import sys
from quart import Blueprint, Quart, jsonify, make_response, request, send_from_directory, render_template

from azure.identity import DefaultAzureCredential, ManagedIdentityCredential
from azure.ai.projects import AIProjectClient
from azure.ai.agents.models import ListSortOrder

# === НАСТРОЙКА ЛОГИРОВАНИЯ ===
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),  # Вывод в stdout для Azure
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

bp = Blueprint("routes", __name__, static_folder="static", template_folder="static")

# === НАСТРОЙКИ ===
PROJECT_ENDPOINT = os.environ.get("AZURE_AI_PROJECT_ENDPOINT", "https://openai-chatbot-vita.services.ai.azure.com/api/projects/proj-vita")
AGENT_ID = os.environ.get("AZURE_AI_AGENT_ID", "asst_zhzf0EzHkcRbD96uqbwQCbCH")

def create_app():
    app = Quart(__name__)
    app.register_blueprint(bp)
    return app

@bp.route("/")
async def index():
    logger.info("Root endpoint accessed")
    return await render_template("index.html")

@bp.route("/health", methods=["GET"])
async def health_check():
    """Health check для Azure"""
    logger.info("Health check endpoint accessed")
    return jsonify({
        "status": "healthy",
        "timestamp": str(uuid.uuid4()),
        "port": os.environ.get("PORT", "80"),
        "agent_configured": bool(AGENT_ID)
    }), 200

@bp.route("/favicon.ico")
async def favicon():
    return await bp.send_static_file("favicon.ico")

@bp.route("/assets/<path:path>")
async def assets(path):
    return await send_from_directory("static/assets", path)

@bp.route("/test-agent", methods=["GET"])
async def test_agent():
    """Тестовый эндпоинт для проверки агента"""
    logger.info("Test agent endpoint called")
    
    try:
        # Проверка подключения к агенту
        credential = None
        
        # Пробуем Managed Identity сначала (для Azure)
        try:
            credential = ManagedIdentityCredential()
            logger.info("Using Managed Identity for authentication")
        except Exception as e:
            logger.warning(f"Managed Identity not available: {e}")
            credential = DefaultAzureCredential()
            logger.info("Using DefaultAzureCredential")
        
        project_client = AIProjectClient(
            endpoint=PROJECT_ENDPOINT,
            credential=credential,
        )
        
        # Получаем информацию об агенте
        agent = project_client.agents.get_agent(AGENT_ID)
        
        return jsonify({
            "status": "success",
            "agent_id": agent.id,
            "agent_name": getattr(agent, "name", "N/A"),
            "agent_model": getattr(agent, "model", "N/A"),
            "agent_description": getattr(agent, "description", "N/A"),
            "tools": [tool.type for tool in agent.tools] if agent.tools else [],
            "message": "Агент успешно подключен и готов к работе"
        })
    except Exception as e:
        logger.error(f"Agent test failed: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "error": str(e),
            "message": "Не удалось подключиться к агенту"
        }), 500

async def call_agent(user_message: str, conversation_history: list = None, thread_id: str = None) -> tuple[str, str]:
    """
    Вызывает агента через Azure AI Agents API.
    Возвращает (ответ_агента, thread_id)
    """
    try:
        logger.info("=== ВЫЗОВ АГЕНТА ===")
        logger.info(f"Agent ID: {AGENT_ID}")
        logger.info(f"User message: {user_message[:100]}...")
        
        # Проверяем наличие необходимых переменных
        if not PROJECT_ENDPOINT:
            logger.error("PROJECT_ENDPOINT is not set!")
            return "Ошибка конфигурации: endpoint не задан", None
            
        if not AGENT_ID:
            logger.error("AGENT_ID is not set!")
            return "Ошибка конфигурации: agent ID не задан", None
        
        # Подключаемся к проекту
        logger.info(f"Connecting to Azure AI Project: {PROJECT_ENDPOINT}")
        
        # Пробуем разные способы аутентификации
        credential = None
        try:
            credential = ManagedIdentityCredential()
            logger.info("Using Managed Identity for authentication")
        except Exception as e:
            logger.warning(f"Managed Identity not available: {e}")
            credential = DefaultAzureCredential()
            logger.info("Using DefaultAzureCredential")
        
        project_client = AIProjectClient(
            endpoint=PROJECT_ENDPOINT,
            credential=credential,
        )
        
        # Проверяем существование агента
        try:
            agent = project_client.agents.get_agent(AGENT_ID)
            logger.info(f"✅ Agent found: {agent.id}")
        except Exception as e:
            logger.error(f"❌ Agent not found: {e}")
            return f"Агент с ID {AGENT_ID} не найден", None
        
        # Создаем новый thread или используем существующий
        if not thread_id:
            thread = project_client.agents.threads.create()
            thread_id = thread.id
            logger.info(f"✅ Created new thread: {thread_id}")
        else:
            try:
                thread = project_client.agents.threads.get(thread_id=thread_id)
                logger.info(f"📌 Using existing thread: {thread_id}")
            except Exception as e:
                logger.warning(f"Thread {thread_id} not found, creating new one: {e}")
                thread = project_client.agents.threads.create()
                thread_id = thread.id
                logger.info(f"✅ Created new thread: {thread_id}")
        
        # Добавляем историю разговора, если она есть
        if conversation_history:
            logger.info(f"Adding {len(conversation_history)} history messages")
            # Добавляем предыдущие сообщения в thread (только последние 10 для контекста)
            for msg in conversation_history[-10:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if content:
                    project_client.agents.messages.create(
                        thread_id=thread_id,
                        role=role,
                        content=content
                    )
                    logger.debug(f"Added history message - role: {role}, content: {content[:50]}...")
        
        # Добавляем текущее сообщение пользователя
        message = project_client.agents.messages.create(
            thread_id=thread_id,
            role="user",
            content=user_message
        )
        logger.info(f"💬 User message added to thread, ID: {message.id}")
        
        # Запускаем выполнение агента
        logger.info(f"🤖 Running agent {AGENT_ID}...")
        run = project_client.agents.runs.create_and_process(
            thread_id=thread_id,
            agent_id=AGENT_ID
        )
        
        logger.info(f"📊 Run status: {run.status}")
        
        # Проверяем статус выполнения
        if run.status == "failed":
            error_msg = f"Run failed: {run.last_error}"
            logger.error(error_msg)
            return f"Извините, произошла ошибка: {error_msg}", thread_id
        
        # Получаем ответ агента
        messages = project_client.agents.messages.list(
            thread_id=thread_id, 
            order=ListSortOrder.ASCENDING
        )
        
        # Ищем последнее сообщение от ассистента
        assistant_response = None
        for message in messages:
            if message.role == "assistant" and message.text_messages:
                assistant_response = message.text_messages[-1].text.value
                logger.info(f"🤖 Assistant response found: {assistant_response[:100]}...")
        
        if not assistant_response:
            logger.warning("No assistant response found")
            return "Извините, не удалось получить ответ от агента", thread_id
        
        logger.info("=== ВЫЗОВ АГЕНТА ЗАВЕРШЕН УСПЕШНО ===\n")
        return assistant_response, thread_id
        
    except Exception as e:
        logger.exception(f"❌ КРИТИЧЕСКАЯ ОШИБКА ПРИ ВЫЗОВЕ АГЕНТА: {e}")
        return f"Извините, произошла техническая ошибка: {str(e)}", thread_id

@bp.route("/conversation", methods=["POST"])
async def conversation():
    logger.info("Conversation endpoint called")
    
    if not request.is_json:
        logger.warning("Request is not JSON")
        return jsonify({"error": "request must be json"}), 415
    
    data = await request.get_json()
    messages = data.get("messages", [])
    
    if not messages:
        logger.warning("No messages provided")
        return jsonify({"error": "No messages provided"}), 400
    
    user_message = messages[-1].get("content", "")
    conversation_history = messages[:-1] if len(messages) > 1 else None
    
    # Получаем thread_id из запроса (если есть)
    thread_id = data.get("thread_id")
    
    logger.info(f"Processing message: {user_message[:100]}...")
    logger.info(f"Thread ID: {thread_id}")
    
    # Вызываем агента
    response_text, new_thread_id = await call_agent(user_message, conversation_history, thread_id)
    
    response_data = {
        "id": str(uuid.uuid4()),
        "model": AGENT_ID,
        "thread_id": new_thread_id,  # Возвращаем ID треда для сохранения контекста
        "agent_info": {
            "agent_id": AGENT_ID,
            "used_agent": True,
            "timestamp": str(uuid.uuid4())
        },
        "choices": [{
            "message": {
                "role": "assistant",
                "content": response_text
            },
            "finish_reason": "stop"
        }],
        "usage": None
    }
    
    logger.info(f"Response sent successfully. Thread ID: {new_thread_id}")
    return jsonify(response_data)

app = create_app()

if __name__ == "__main__":
    # Используем порт из окружения или 80 по умолчанию для Azure
    port = int(os.environ.get("PORT", 80))
    debug_mode = os.environ.get("DEBUG", "False").lower() == "true"
    
    logger.info("=" * 60)
    logger.info("ЗАПУСК ПРИЛОЖЕНИЯ")
    logger.info(f"Port: {port}")
    logger.info(f"Debug mode: {debug_mode}")
    logger.info(f"Project Endpoint: {PROJECT_ENDPOINT}")
    logger.info(f"Agent ID: {AGENT_ID}")
    logger.info("=" * 60)
    
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
