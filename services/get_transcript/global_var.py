import os
import openai

base_folder = 'videos'
video_file_names = ["Dave Good Shepherd.mp4"]
audio_file_name = ""
access_token = "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"

OPENAI_TYPE = 'azure'
OPENAI_API_KEY = "2438e2e77a104a57831fc1fb48e6c478"
OPENAI_API_BASE = "https://propel-openai-test-001.openai.azure.com/"
OPENAI_API_VERSION = "2023-03-15-preview"

os.environ['OPENAI_API_KEY'] = str(OPENAI_API_KEY)
os.environ['OPENAI_API_BASE'] = str(OPENAI_API_BASE)
os.environ['OPENAI_API_VERSION'] = str(OPENAI_API_VERSION)
os.environ['OPENAI_API_TYPE'] = str(OPENAI_TYPE)

OPENAI_DEPLOYMENT_NAME="gpt-35-turbo-deployment"
OPENAI_MODEL_NAME="gpt-35-turbo"
OPENAI_EMBEDDING_DEPLOYMENT_NAME = "text-embedding-ada-002"
OPENAI_EMBEDDING_MODEL_NAME = "text-embedding-ada-002"

openai.api_type = os.getenv('OPENAI_API_TYPE')
openai.api_base = os.getenv('OPENAI_API_BASE')
openai.api_version = os.getenv('OPENAI_API_VERSION')
openai.api_key = os.getenv('OPENAI_API_KEY')

root_path = '.'
base_path = os.path.join(root_path, base_folder)
tmp_path = os.path.join(base_path, 'temp')
output_transcript_path = os.path.join(base_path, 'transcripts')

processing_file_names = []
output_transcript_names = []

audio_prep_file_paths = []
spacermilli = 2000

output_diarization_file_paths = []
dic = {}

file_txt_paths = []
