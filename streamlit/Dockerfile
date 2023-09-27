FROM mcr.microsoft.com/devcontainers/python:3.11
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
EXPOSE 80
ENTRYPOINT ["streamlit", "run"]
CMD ["chat.py"]