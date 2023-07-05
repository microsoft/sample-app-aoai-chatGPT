# Import everything here
import os
# import subprocess
import locale
import moviepy.editor as mp
from pydub import AudioSegment
#import webvtt
import json
from datetime import timedelta
# used to load an individual file (TextLoader) or multiple files (DirectoryLoader)
from langchain.document_loaders import TextLoader, DirectoryLoader
# used to split the text within documents and chunk the data
from langchain.text_splitter import CharacterTextSplitter
# use embedding from OpenAI (but others available)
from langchain.embeddings import OpenAIEmbeddings
# using Chroma database to store our vector embeddings
from langchain.vectorstores import Chroma
# use this to configure the Chroma database
from chromadb.config import Settings
# we'll use the chain that allows Question and Answering and provides source of where it got the data from. This is useful if you have multiple files. If you don't need the source, you can use RetrievalQA
from langchain.chains import RetrievalQAWithSourcesChain, RetrievalQA
# we'll use the OpenAI Chat model to interact with the embeddings. This is the model that allows us to query in a similar way to ChatGPT
from langchain.chat_models import AzureChatOpenAI
from langchain.llms import AzureOpenAI
from langchain.chains.question_answering import load_qa_chain
from pathlib import Path
import global_var

from prepare_paths import prepare_paths
from converter import convert_videos_to_audios, prepending_spacer
from diarization import generate_diarizations
from grouping import grouping_segments, save_audio_parts
from transcript import run_whisper, generate_txt_files

locale.getpreferredencoding = lambda: "UTF-8"

def main():
  for n in global_var.video_file_names:
    prepare_paths(n)

  # Create some paths used for processing process if it's not exists
  for i, processing_file_name in enumerate(global_var.processing_file_names):
    Path(os.path.join(global_var.tmp_path, processing_file_name)).mkdir(parents=True, exist_ok=True)
    Path(global_var.output_transcript_path).mkdir(parents=True, exist_ok=True)

  convert_videos_to_audios()
  prepending_spacer()
  generate_diarizations()
  grouping_segments()
  save_audio_parts()
  run_whisper()
  generate_txt_files()

main()