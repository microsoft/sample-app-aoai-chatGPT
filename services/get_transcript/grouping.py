import os
import re
from pydub import AudioSegment
import global_var

def millisec(timeStr):
  spl = timeStr.split(":")
  s = (int)((int(spl[0]) * 60 * 60 + int(spl[1]) * 60 + float(spl[2]) )* 1000)
  return s

def grouping_segments():
  for i in range(len(global_var.output_diarization_file_paths)):
    output_diarization_file_path = global_var.output_diarization_file_paths[i]
    processing_file_name = global_var.processing_file_names[i]

    dzs = open(output_diarization_file_path).read().splitlines()
    groups = []
    g = []
    lastend = 0

    for d in dzs:
      if g and (g[0].split()[-1] != d.split()[-1]):      #same speaker
        groups.append(g)
        g = []

      g.append(d)

      end = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=d)[1]
      end = millisec(end)
      if (lastend > end):       #segment engulfed by a previous segment
        groups.append(g)
        g = []
      else:
        lastend = end
    if g:
      groups.append(g)
      print(*groups, sep='\n')

    global_var.dic[processing_file_name] = groups


def save_audio_parts():
  for i, audio_prep_file_path in enumerate(global_var.audio_prep_file_paths):

    processing_file_name = global_var.processing_file_names[i]
    audio = AudioSegment.from_wav(audio_prep_file_path)
    gidx = -1
    groups = global_var.dic[processing_file_name]
    for g in groups:
      start = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=g[0])[0]
      end = re.findall('[0-9]+:[0-9]+:[0-9]+\.[0-9]+', string=g[-1])[1]
      start = millisec(start) #- spacermilli
      end = millisec(end)  #- spacermilli
      gidx += 1
      audio[start:end].export(os.path.join(global_var.tmp_path, processing_file_name, str(gidx) + '.wav'), format='wav')
      print(f"group {gidx}: {start}--{end}")