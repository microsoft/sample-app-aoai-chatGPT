import os
import re
import global_var

#ValueError: Expected collection name that
# (1) contains 3-63 characters,
# (2) starts and ends with an alphanumeric character,
# (3) otherwise contains only alphanumeric characters, underscores or hyphens (-),
# (4) contains no two consecutive periods (..)
# (5) is not a valid IPv4 address
# sample_text = "Experian - Protecting Vulnerable customers (2023-06-27 10:04 GMT+10)"
dt_regex = r"\(\d{4}-\d{2}-\d{2} \d{2}:\d{2} GMT(\+|-)\d{,2}\)"
def standarlize_file_name(file_name, index = None):
  if not file_name:
    raise Exception("File name is empty.")

  file_name = file_name.strip()
  # replace datetime string
  file_name = re.sub(dt_regex, "", file_name)

  # Remove start/end white spaces
  special_characters = ['!','#','$','%', '&','@','[',']',' ',']','_', ')', '(', ',']
  for i in special_characters:
    file_name = file_name.replace(i,'')
  # Trim len
  if len(file_name) > 30:
    file_name = file_name[0:30]

  suffix = "__" + str(index) if index != None else "__0"
  return f"{file_name}{ suffix }"

# return file name and file path
def get_file_info(file_path):
  return os.path.splitext(file_path)

# Prepare paths
def prepare_paths(video_file_name):
  if not video_file_name:
    raise Exception("Please provide specific video or audio!")

  processing_file_name = get_file_info(video_file_name)[0] if video_file_name else get_file_info(video_file_name)[0]
  processing_file_name = standarlize_file_name(processing_file_name)
  global_var.processing_file_names.append(processing_file_name)
  output_transcript_name = standarlize_file_name(processing_file_name)
  global_var.output_transcript_names.append(output_transcript_name)
