import os
import torch
import torch
from pyannote.audio import Pipeline

import global_var

# this ensures that the current MacOS version is at least 12.3+
print(torch.backends.mps.is_available())
# this ensures that the current current PyTorch installation was built with MPS activated.
print(torch.backends.mps.is_built())

pipeline = Pipeline.from_pretrained('pyannote/speaker-diarization', use_auth_token=(global_var.access_token) or True)
device = torch.device("mps")
pipeline.to(device)

def generate_diarizations():
  for i, audio_prep_file_path in enumerate(global_var.audio_prep_file_paths):
    print('start generate_diarizations', audio_prep_file_path)
    processing_file_name = global_var.processing_file_names[i]

    input_file = {'uri': 'blabla', 'audio': audio_prep_file_path}
    dz = pipeline(input_file)
    output_diarization_file_name = f"{processing_file_name}__diarization.txt"
    output_diarization_file_path = os.path.join(global_var.tmp_path, processing_file_name, output_diarization_file_name)
    global_var.output_diarization_file_paths.append(output_diarization_file_path)
    print('Output diarization file to ' + output_diarization_file_path)
    with open(output_diarization_file_path, "w") as text_file:
        text_file.write(str(dz))