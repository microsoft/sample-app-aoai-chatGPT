import copy
import json
import os
from pathlib import Path
import subprocess
import tqdm
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()  

FORM_RECOGNIZER_KEY = os.getenv("FORM_RECOGNIZER_KEY")

with open("./config.json", "r") as f:
    config = json.loads(f.read())

# this is an example, 
# it address how to handle subfolders 
# it also provide option wether to use form recognizer
run_config_by_data_path_3_small_512_512 = {
    "aks": "aks_embed_003_small_512_512_index",
    "azure-docs": {
        "index": "azure_embed_003_small_512_512_index",
        "subfolder": "azure-docs",
    },
    "test_loranorm": {
        "index": "test_loranorm_embed_003_small_512_512_index",
        "form-rec-use-layout": False,
    },
    
}

# change path and embedding models
Path("logs").mkdir(exist_ok=True)
for key, cfg in tqdm.tqdm(run_config_by_data_path_3_small_512_512.items()):
    folder = os.path.join("/index_data", key)
    
    if isinstance(cfg, str):
        index = cfg
        form_rec_use_layout = True
    else:
        index = cfg["index"]
        form_rec_use_layout = cfg.get("form-rec-use-layout", True)
        if "subfolder" in cfg:
            folder = os.path.join(folder, cfg["subfolder"])


    config_key = copy.deepcopy(config[0])
    config_key["data_path"] = os.path.abspath(folder)
    config_key["index_name"] = index

    print(config_key["data_path"])
    with open(f"./config.{key}.json", "w") as f:
        f.write(json.dumps([config_key]))
    
    command = [
        "python",
        "data_preparation.py",
        "--config",
        f"config.{key}.json",
        "--embedding-model-endpoint",
        '"EMBEDDING_MODEL_ENDPOINT"',
        "--form-rec-resource",
        "test-tprompt",
        "--form-rec-key",
        FORM_RECOGNIZER_KEY,
    ] + (["--form-rec-use-layout"] if form_rec_use_layout else []) + [
        "--njobs=8",
    ]
    str_command = " ".join(command)
    with open(f"logs/stdout.{key}.txt", "w") as f_stdout, open(f"logs/stderr.{key}.txt", "w") as f_stderr:
        subprocess.run(str_command, stdout=f_stdout, stderr=f_stderr)
