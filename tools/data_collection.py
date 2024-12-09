import os
import sys
import asyncio
import json

from dotenv import load_dotenv

#import the app.py module to gain access to the methods to construct payloads and
#call the API through the sdk

# Add parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import app

#function to enable loading of the .env file into the global variables of the app.py module

def load_env_into_module(module_name, prefix=''):
    load_dotenv()
    module = __import__(module_name)
    for key, value in os.environ.items():
        if key.startswith(prefix):
            setattr(module, key[len(prefix):], value)

load_env_into_module("app")

#some settings required in app.py

app.SHOULD_STREAM = False
app.SHOULD_USE_DATA = app.should_use_data()

#format:
"""
[
  {
    "qa_pairs":[{"question":"...", "answer":"..."}]
  }
]
"""

generated_data_path = r"path/to/qa_input_file.json"

with open(generated_data_path, 'r') as file:
    data = json.load(file)


"""
Process a list of q(and a) pairs outputting to a file as we go.
"""
async def process(data: list, file):
  for qa_pairs_obj in data:
      qa_pairs = qa_pairs_obj["qa_pairs"]
      for qa_pair in qa_pairs:
          question = qa_pair["question"]
          messages = [{"role":"user", "content":question}]

          print("processing question "+question)

          request = {"messages":messages, "id":"1"}

          response = await app.complete_chat_request(request)

          #print(json.dumps(response))

          messages = response["choices"][0]["messages"]

          tool_message = None
          assistant_message = None

          for message in messages:
            if message["role"] == "tool":
              tool_message = message["content"]
            elif message["role"] == "assistant":
              assistant_message = message["content"]
            else:
              raise ValueError("unknown message role")

          #construct data for ai studio evaluation

          user_message = {"role":"user", "content":question}
          assistant_message = {"role":"assistant", "content":assistant_message}

          #prepare citations
          citations = json.loads(tool_message)
          assistant_message["context"] = citations

          #create output
          messages = []
          messages.append(user_message)
          messages.append(assistant_message)

          evaluation_data = {"messages":messages}

          #incrementally write out to the jsonl file
          file.write(json.dumps(evaluation_data)+"\n")
          file.flush()


evaluation_data_file_path = r"path/to/output_file.jsonl"  

with open(evaluation_data_file_path, "w") as file:
  asyncio.run(process(data, file))








