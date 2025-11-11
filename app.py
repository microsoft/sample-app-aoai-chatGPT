import os
import logging
from quart import Quart, request, jsonify
from quart_cors import cors
from openai import AzureOpenAI

# ───────── Setup Logging ─────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ───────── App Factory ─────────
def create_app():
    app = Quart(__name__)
    app = cors(app, allow_origin="*")

    client = AzureOpenAI(
        api_key=os.getenv("AZURE_OPENAI_KEY"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
    )

    # ───────── Health Check ─────────
    @app.get("/healthz")
    async def healthz():
        return jsonify({"status": "ok"}), 200

    # ───────── Frontend Config ─────────
    @app.get("/frontend_settings")
    async def frontend_settings():
        return jsonify({
            "auth_enabled": False,
            "openai_model": "gpt-4o-mini",
            "max_file_size_mb": 25
        }), 200

    # ───────── Chat Completion ─────────
    @app.post("/conversation")
    async def conversation():
        try:
            data = await request.get_json()
            messages = data.get("messages", [])

            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )

            reply = completion.choices[0].message.content
            return jsonify({"reply": reply}), 200
        except Exception as e:
            logger.error(f"Error in /conversation: {e}")
            return jsonify({"error": str(e)}), 500

    # ───────── File Summarization ─────────
    @app.post("/summarize_file")
    async def summarize_file():
        try:
            data = await request.get_json()
            file_url = data.get("url")

            if not file_url:
                return jsonify({"error": "Missing 'url'"}), 400

            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a document summarizer."},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Summarize this document."},
                            {"type": "file", "file": {"url": file_url}}
                        ]
                    }
                ]
            )

            summary = completion.choices[0].message.content
            return jsonify({"summary": summary}), 200
        except Exception as e:
            logger.error(f"Error in /summarize_file: {e}")
            return jsonify({"error": str(e)}), 500

    # ───────── Dummy Auth Routes ─────────
    @app.get("/auth/login")
    async def fake_login():
        return jsonify({"message": "Login not required in demo mode."}), 200

    @app.get("/auth/logout")
    async def fake_logout():
        return jsonify({"message": "Logged out (demo mode)."}), 200

    return app


# ───────── Create App Instance ─────────
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
