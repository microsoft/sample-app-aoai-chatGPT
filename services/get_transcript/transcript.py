import os
import re
import json
import torch
import whisper
import global_var
from grouping import millisec

device1 = torch.device("cpu")
model = whisper.load_model('large', device1)

def run_whisper():
  for processing_file_name in global_var.processing_file_names:
    groups = global_var.dic[processing_file_name]

    for i, _ in enumerate(groups):
      audiof = os.path.join(global_var.tmp_path, processing_file_name, str(i) + '.wav')
      result = model.transcribe(audio=audiof, language='en', word_timestamps=True)#, initial_prompt=result.get('text', ""))
      with open(os.path.join(global_var.tmp_path, processing_file_name, str(i)+'.json'), "w") as outfile:
        json.dump(result, outfile, indent=4)


speakers = {'SPEAKER_00': 'Customer', 'SPEAKER_01': 'Call Center' }

def timeStr(t):
  return '{0:02d}:{1:02d}:{2:06.2f}'.format(round(t // 3600),
                                                round(t % 3600 // 60),
                                                t % 60)
def generate_txt_files():
  for i, processing_file_name in enumerate(global_var.processing_file_names):
    output_transcript_name = global_var.output_transcript_names[i]

    txt = list("")
    gidx = -1
    groups = global_var.dic[processing_file_name]
    for g in groups:
      shift = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=g[0])[0]
      shift = millisec(shift) - global_var.spacermilli
      shift=max(shift, 0)

      gidx += 1

      captions = json.load(open(os.path.join(global_var.tmp_path, processing_file_name, str(gidx) + '.json')))['segments']

      if captions:
        speaker = g[0].split()[-1]
        if speaker in speakers:
          speaker = speakers[speaker]

        for c in captions:
          start = shift + c['start'] * 1000.0
          start = start / 1000.0
          end = (shift + c['end'] * 1000.0) / 1000.0
          txt.append(f'[{timeStr(start)} --> {timeStr(end)}] [{speaker}] {c["text"]}\n')

    file_name_txt = f"{output_transcript_name}.txt";
    file_txt_path = os.path.join(global_var.output_transcript_path, file_name_txt)
    global_var.file_txt_paths.append(file_txt_path)
    with open(file_txt_path, "w", encoding='utf-8') as file:
      s = "".join(txt)
      file.write(s)
      # print(f"captions saved to {file_txt_path}:")
      # print(s+'\n')
