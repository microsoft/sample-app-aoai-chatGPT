import os
import moviepy.editor as mp
import ffmpeg
from pydub import AudioSegment
import global_var

def video_to_audio_converter(video_path, vtoa_output_path, temp_input_file_path):
  clip = mp.VideoFileClip(video_path)
  clip.audio.write_audiofile(vtoa_output_path)
  ffmpeg.input(vtoa_output_path).output(temp_input_file_path, acodec="pcm_s16le", ar=16000, ac=1, vn=None).overwrite_output().run()

### Convert video to audio file if we want to use video instead
audio_file_names = []
audio_file_paths = []
temp_input_file_paths = []
def convert_videos_to_audios():
  for i, processing_file_name in enumerate(global_var.processing_file_names):
    video_file_name = global_var.video_file_names[i]
    vtoa_output_file_name = processing_file_name + '.wav'
    vtoa_output_path = os.path.join(global_var.base_path, vtoa_output_file_name)
    temp_input_file_name = 'input__' + vtoa_output_file_name
    temp_input_file_path = os.path.join(global_var.tmp_path, processing_file_name, temp_input_file_name)
    temp_input_file_paths.append(temp_input_file_path)
    print(processing_file_name)
    print(video_file_name)
    print(vtoa_output_file_name)
    print(vtoa_output_path)
    print(temp_input_file_name)
    print(temp_input_file_path)

    if video_file_name:
      video_file_path = os.path.join(global_var.base_path, video_file_name)
      video_to_audio_converter(video_file_path, vtoa_output_path, temp_input_file_path)
      audio_file_names.append(vtoa_output_file_name)
      audio_file_paths.append(vtoa_output_path)
    # else:
      # audio_file_path = os.path.join(base_path, audio_file_name)
      # !ffmpeg -i {repr(audio_file_path)} -vn -acodec pcm_s16le -ar 16000 -ac 1 -y {repr(temp_input_file_path)}

def prepending_spacer():
  for i, temp_input_file_path in enumerate(temp_input_file_paths):
    processing_file_name = global_var.processing_file_names[i]

    spacer = AudioSegment.silent(duration=global_var.spacermilli)

    audio = AudioSegment.from_wav(temp_input_file_path)

    audio = spacer.append(audio, crossfade=0)

    audio_prep_file_name = f"{processing_file_name}__prep.wav"
    audio_prep_file_path = os.path.join(global_var.tmp_path, processing_file_name, audio_prep_file_name)
    global_var.audio_prep_file_paths.append(audio_prep_file_path)
    audio.export(audio_prep_file_path, format='wav')