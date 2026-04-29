import os
import json
import logging
import uuid
from quart import Blueprint, Quart, jsonify, make_response, request, send_from_directory, render_template

from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.agents.models import ListSortOrder

bp = Blueprint("routes", __name__, static_folder="static", template_folder="static")

# === НАСТРОЙКИ ===
PROJECT_ENDPOINT = os.environ.get("AZURE_AI_PROJECT_ENDPOINT", "https://openai-chatbot-vita.services.ai.azure.com/api/projects/proj-vita")
AGENT_ID = os.environ.get("AZURE_AI_AGENT_ID", "asst_zhzf0EzHkcRbD96uqbwQCbCH")  # ID агента из вашего примера

def create_app():
    app = Quart(__name__)
    app.register_blueprint(bp)
    return app

@bp.route("/")
async def index():
    return await render_template("index.html")

@bp.route("/favicon.ico")
async def favicon():
    return await bp.send_static_file("favicon.ico")

@bp.route("/assets/<path:path>")
async def assets(path):
    return await send_from_directory("static/assets", path)

async def call_agent(user_message: str, conversation_history: list = None, thread_id: str = None) -> tuple[str, str]:
    """
    Вызывает агента через Azure AI Agents API.
    Возвращает (ответ_агента, thread_id)
    """
    try:
        # Подключаемся к проекту
        project_client = AIProjectClient(
            endpoint=PROJECT_ENDPOINT,
            credential=DefaultAzureCredential(),
        )
        
        # Создаем новый thread или используем существующий
        if not thread_id:
            thread = project_client.agents.threads.create()
            thread_id = thread.id
            logging.info(f"Created new thread, ID: {thread_id}")
        else:
            # Проверяем, существует ли thread
            try:
                thread = project_client.agents.threads.get(thread_id=thread_id)
            except Exception as e:
                logging.warning(f"Thread {thread_id} not found, creating new one: {e}")
                thread = project_client.agents.threads.create()
                thread_id = thread.id
        
        # Добавляем историю разговора, если она есть
        if conversation_history:
            # Добавляем предыдущие сообщения в thread
            for msg in conversation_history[-10:]:  # Последние 10 сообщений для контекста
                if msg.get("role") == "user":
                    project_client.agents.messages.create(
                        thread_id=thread_id,
                        role="user",
                        content=msg.get("content", "")
                    )
                elif msg.get("role") == "assistant":
                    # Добавляем ответы ассистента как ассистентские сообщения
                    project_client.agents.messages.create(
                        thread_id=thread_id,
                        role="assistant",
                        content=msg.get("content", "")
                    )
        
        # Добавляем текущее сообщение пользователя
        project_client.agents.messages.create(
            thread_id=thread_id,
            role="user",
            content=user_message
        )
        
        # Запускаем выполнение агента
        run = project_client.agents.runs.create_and_process(
            thread_id=thread_id,
            agent_id=AGENT_ID
        )
        
        # Проверяем статус выполнения
        if run.status == "failed":
            error_msg = f"Run failed: {run.last_error}"
            logging.error(error_msg)
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
        
        if not assistant_response:
            return "Извините, не удалось получить ответ от агента", thread_id
        
        return assistant_response, thread_id
        
    except Exception as e:
        logging.exception(f"Error calling agent: {e}")
        return f"Извините, произошла ошибка: {str(e)}", thread_id

@bp.route("/conversation", methods=["POST"])
async def conversation():
    if not request.is_json:
        return jsonify({"error": "request must be json"}), 415
    
    data = await request.get_json()
    messages = data.get("messages", [])
    
    if not messages:
        return jsonify({"error": "No messages provided"}), 400
    
    user_message = messages[-1].get("content", "")
    conversation_history = messages[:-1] if len(messages) > 1 else None
    
    # Получаем thread_id из запроса (если есть)
    thread_id = data.get("thread_id")
    
    # Вызываем агента
    response_text, new_thread_id = await call_agent(user_message, conversation_history, thread_id)
    
    response_data = {
        "id": str(uuid.uuid4()),
        "model": AGENT_ID,
        "thread_id": new_thread_id,  # Возвращаем ID треда для сохранения контекста
        "choices": [{
            "message": {
                "role": "assistant",
                "content": response_text
            },
            "finish_reason": "stop"
        }],
        "usage": None
    }
    
    return jsonify(response_data)

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=50505, debug=True)
