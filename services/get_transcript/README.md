
1. run `conda env config vars set PYTORCH_ENABLE_MPS_FALLBACK=1`
2. copy mp4 video file to `services/get_transcript/videos/`
3. run `python process_videos.py video1.mp4 video2.mp4`