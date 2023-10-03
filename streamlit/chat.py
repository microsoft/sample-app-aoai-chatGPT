import openai
import streamlit as st
import os
import uuid

from streamlit_elements import elements, mui, html
from chat_utils import *

def responseWithData(response):
    responseText = ""
    citationsText = ""
    citations = []

    with st.chat_message("assistant"):
        responseElement = st.empty()
        for item in response:
            responseText = item["assistant"]
            if item["error"] != -1:
                responseText = item["error"]
            elif len(item["citations"]) > 0:
                citations = item["citations"]
            responseElement.markdown(responseText)
        if len(citations) > 0:
            print("Length of citations: " + str(len(citations)))
            print(citations)
            cols = st.columns(len(citations))
            with st.expander("Citations"):
                for i, col in enumerate(cols):
                    citationsText = "Citation " + str(i+1)
                    with col:
                        key = uuid.uuid4()
                        columnButton = col.button(citationsText, key=key)
                        if columnButton:
                            show_hide(key, citations[i]["content"])
    msg = {"role": "assistant", "content": responseText, "citations": citations}
    st.session_state.messages.append(msg)

def responseWithoutData():
    responseText = ""
    with st.chat_message("assistant"):
        responseElement = st.empty()
        for line in response:
            responseText += line
            responseElement.markdown(responseText)
        responseElement.markdown(responseText)

    msg = {"role": "assistant", "content": responseText}
    st.session_state.messages.append(msg)

st.title("Start chatting")
st.caption("This chatbot is configured to answer your questions")

if "messages" not in st.session_state:
    st.session_state.messages = []

if "citationPanel" not in st.session_state:
    st.session_state.citationPanel = {"show": False, "citation": "", "key": ""}

def show_hide(key, citation):
    if key == st.session_state.citationPanel["key"]:
        st.session_state.citationPanel["show"] = not st.session_state.citationPanel["show"]
    else:
        st.session_state.citationPanel["citation"] = citation
        st.session_state.citationPanel["key"] = key
        st.session_state.citationPanel["show"] = True

for msg in st.session_state.messages:
    if msg["role"] == "assistant":
        st.chat_message(msg["role"]).write(msg["content"])
        if len(msg["citations"]) > 0:
            citationsText = ""
            cols = st.columns(len(msg["citations"]))
            with st.expander("Citations"):
                for i, col in enumerate(cols):
                    citationsText = "Citation " + str(i+1)
                    with col:
                        key = uuid.uuid4()
                        columnButton = col.button(citationsText, key=key)
                        if columnButton:
                            show_hide(i, msg["citations"][i]["content"])
                            # st.write("Panel Opened")
    else:
        st.chat_message(msg["role"]).write(msg["content"])

if st.session_state.citationPanel["show"]:
    with st.container():
        st.button("Close", on_click=show_hide, args=(st.session_state.citationPanel["key"], ""))
        st.write(st.session_state.citationPanel["citation"])
    pass

# Chat Flow
with st.container():
    if prompt := st.chat_input():
        st.session_state.messages.append({"role": "user", "content": prompt})
        st.chat_message("user").write(prompt)

        if should_use_data():
            # msgReq = {=}
            msg = [{"role": item["role"], "content": item["content"]} for item in st.session_state.messages]
            print("Messages TEST")
            print(msg)
            print("---------------------------------")
            # print("Messages")
            # print(st.session_state.messages)
            response = stream_with_data(msg)
            responseWithData(response)

        else:
            response = stream_without_data(st.session_state.messages)
            responseWithoutData()