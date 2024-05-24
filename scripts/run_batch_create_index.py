import copy
import json
import os
import subprocess
import tqdm
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()  

FORM_RECOGNIZER_KEY = os.getenv("FORM_RECOGNIZER_KEY")

with open("./config.json", "r") as f:
    config = json.loads(f.read())

run_config_by_data_path_3_small_512_512 = {
    "aks": "aks_embed_003_small_512_512_index",
    "azure-docs": {
        "index": "azure_embed_003_small_512_512_index",
        "subfolder": "azure-docs",
    },
    "Mercedes": "mercedes_embed_003_small_512_512_index",
    "merge_contact": {
        "index": "merge_contact_embed_003_small_512_512_index",
        "form-rec-use-layout": False,
    },
    "nyc": "nyc_embed_003_small_512_512_index",
    "Premera": "premera_embed_003_small_512_512_index",
    "product-info": {
        "index": "product_info_embed_003_small_512_512_index",
        "subfolder": "product-info",
    },
    "test_loranorm": {
        "index": "test_loranorm_embed_003_small_512_512_index",
        "form-rec-use-layout": False,
    },
    "tprompt": {
        "index": "tprompt_embed_003_small_512_512_index",
        "subfolder": "source",
    },
    "yw": "yw_embed_003_small_512_512_index",
    
}

for key, cfg in tqdm.tqdm(run_config_by_data_path_3_small_512_512.items()):
    folder = os.path.join("../../data/gptassertdata/index_data", key)
    
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
        '"https://wed-aiq-aoai-eus.openai.azure.com/openai/deployments/text-embedding-3-small/embeddings?api-version=2024-02-15-preview"',
        "--form-rec-resource",
        "test-tprompt",
        "--form-rec-key",
        FORM_RECOGNIZER_KEY,
    ] + (["--form-rec-use-layout"] if form_rec_use_layout else []) + [
        "--njobs=8",
    ]
    str_command = " ".join(command)
    proc = subprocess.run(str_command, capture_output=True)
    if proc.returncode != 0:
        print("Error running", command)
        print(proc.stderr)
        print(proc.stdout)






