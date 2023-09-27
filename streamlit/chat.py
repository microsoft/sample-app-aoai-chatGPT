import openai
import streamlit as st
import os

from chat_utils import *

st.title("Start chatting")
st.caption("This chatbot is configured to answer your questions")

if "messages" not in st.session_state:
    st.session_state.messages = []

for msg in st.session_state.messages:
    st.chat_message(msg["role"]).write(msg["content"])

# Chat Flow
if prompt := st.chat_input():
    st.session_state.messages.append({"role": "user", "content": prompt})
    st.chat_message("user").write(prompt)

    if should_use_data():    
        response = stream_with_data(st.session_state.messages)
    else:
        response = stream_without_data(st.session_state.messages)


    responseText = ""
    
    with st.chat_message("assistant"):
        responseElement = st.empty()
        for line in response:
            responseText += line
            responseElement.markdown(responseText)
        responseElement.markdown(responseText)

    msg = {"role": "assistant", "content": responseText}
    st.session_state.messages.append(msg)

