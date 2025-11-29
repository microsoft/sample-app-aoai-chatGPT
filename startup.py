import os
import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def install_requirements():
    print("--- Installing dependencies from requirements.txt ---", flush=True)
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def run_gunicorn():
    print("--- Starting Gunicorn Server ---", flush=True)
    gunicorn_path = os.path.join(os.path.dirname(sys.executable), "gunicorn")
    
    if not os.path.exists(gunicorn_path):
        gunicorn_path = "gunicorn"
    cmd = [
        gunicorn_path,
        "-w", "2",
        "-k", "uvicorn.workers.UvicornWorker",
        "app:app"
    ]
    
    os.execvp(cmd[0], cmd)

if __name__ == "__main__":
    try:
        # 1. Install critical packages first if missing
        try:
            import uvicorn
            import gunicorn
        except ImportError:
            print("Critical libraries missing. Installing...", flush=True)
            install("uvicorn")
            install("gunicorn")
        
        # 2. Install everything else
        if os.path.exists("requirements.txt"):
            install_requirements()
        
        # 3. Launch the App
        run_gunicorn()
        
    except Exception as e:
        print(f"Startup failed: {e}", flush=True)
        sys.exit(1)
