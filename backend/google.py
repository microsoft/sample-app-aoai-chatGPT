import json
import logging
import httpx
import re
from bs4 import BeautifulSoup, UnicodeDammit
from urllib.request import urlopen, Request
from datetime import datetime
import os
import sys
import concurrent.futures

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

global public_query_prefix
public_query_prefix = "@"


def extract_prefix (message):
    pattern = re.escape(public_query_prefix) + r'\w*'
    match = re.match(pattern, message)
    return match.group(0) if match else None

def extract_time_info(message):
    if message.startswith(public_query_prefix):
        match = re.match(rf'{re.escape(public_query_prefix)}([dwmy]\d+)', message)
        if match:
            return match.group(1)
    return None

async def generate_google_query_parameters_with_ai_model(query):
    from app import prepare_model_args, init_openai_client
    prompt= f"""
    You are an assistant that receives a prompt as an input. Because you don't have the knowledge, from the input you identify the optimal Google query you need in order to answer the prompt. 
    You generate a json object containing the parameters that you should use for Google custom search. 
    You should include the following parameters in the json (you detect the values based on the input):
    - q: The search query
    - num: The number of results to return (default is 5, maximum is 10)
    - dateRestrict: The date range for the search results (optional). For example: w3, d1, y1
    In addition, add a new key called "prompt" to the json object, which should contain a user prompt I can send to a GPT model so that the model can answer my query.
    Today's date is {datetime.now().strftime("%B %d, %Y")}
    
    input:
    {query}
    """
    request_body = {
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    try:
        model_args= prepare_model_args(request_body, {})
        model_args["stream"] = False
        model_args["extra_body"] = None
        azure_openai_client = await init_openai_client()
        raw_response = await azure_openai_client.chat.completions.with_raw_response.create(**model_args)
        parsed_response = raw_response.parse()
        # convert to json object 
        json_string = re.sub(r'\n','',re.sub(r'```', '', re.sub(r'```json\n', '', parsed_response.choices[0].message.content)))
        # string to json object
        return json.loads(json_string)
    except Exception as e:
        return None


async def preprocess_page_content_with_ai_model(content, query):
    from app import prepare_model_args, init_openai_client

    prompt= f"""
    Provide me with the information I requested, specified in Input. Use only the Sources to provide an response.
    If the Sources is not enough to provide the requested information, please respond with an empty string.
    Today's date is {datetime.now().strftime("%B %d, %Y")}.

    Example Input:
    What's the weather in San Francisco today?

    Example Response:
    It's 70 degrees and sunny in San Francisco today. 

    Input:
    {query}

    Sources:
    {content}
    """
    request_body = {
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    try:
        model_args= prepare_model_args(request_body, {})
        model_args["stream"] = False
        model_args["extra_body"] = None
        model_args["temperature"] = 0
        model_args["model"] = os.environ.get("GOOGLE_AZURE_OPENAI_MODEL_FOR_PREPROCESSING")
        azure_openai_client = await init_openai_client()
        raw_response = await azure_openai_client.chat.completions.with_raw_response.create(**model_args)
        parsed_response = raw_response.parse()
        return parsed_response.choices[0].message.content
    except Exception as e:
        logging.exception("Exception in preprocess_page_content_with_ai_model")
        return None
        
def download_page(url):
    try:
        req=Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urlopen(req, timeout=20).read()
        soup = BeautifulSoup(UnicodeDammit.detwingle(html), features="html.parser")
        
        # get text
        text = soup.get_text(strip=True)

        # break into lines and remove leading and trailing space on each
        return text[:1000000]
        #return text
    
    except Exception as e:
        logging.exception("An error occurred while fetching the page")
        return None
    

def fetch_google_results(query_parameters):
    google_api_key = os.environ.get("GOOGLE_API_KEY")
    google_cx = os.environ.get("GOOGLE_CX")
    if not google_api_key or not google_cx:
        raise ValueError("GOOGLE_API_KEY and GOOGLE_CX are required")
    headers = {
        "Content-Type": "application/json"
    }
    query_parameters["key"] = google_api_key
    query_parameters["cx"] = google_cx
    query_parameters["fields"] = "items(title,link,snippet)"
    #query_parameters["lr"] = "lang_en"
    response = httpx.get("https://www.googleapis.com/customsearch/v1", headers=headers, params=query_parameters)
    response.raise_for_status()

    return response.json()

async def google_query(request_body):
    query = request_body.removeprefix(public_query_prefix).strip()
    google_query_parameters = await generate_google_query_parameters_with_ai_model(query)
    if google_query_parameters:
        optimized_prompt = google_query_parameters.get("prompt")
        google_query_parameters["prompt"] = None
        google_results = fetch_google_results(google_query_parameters)
        sources=[]
        if google_results.get("items"):
            with concurrent.futures.ThreadPoolExecutor() as executor:
                features = {executor.submit(download_page, item["link"]): item for item in google_results["items"]}

                for future in concurrent.futures.as_completed(features):
                    item= features[future]
                    try:
                        web_page_content = future.result()
                        prompt = {"url": item["link"]}
                        if web_page_content:
                            prompt["content"] = await preprocess_page_content_with_ai_model(web_page_content, optimized_prompt)
                            prompt["content"] = web_page_content
                        else:
                            prompt["content"] = item["snippet"]
                        sources.append(prompt)
                    except Exception as e:
                        logging.exception("An error occurred while processing the page")
                        continue

       
        #    # for item in google_results["items"]:
        #    #     prompt = {
        #    #         "url": item["link"]
        #    #     }
        #    #     web_page_content =  download_page(item["link"])                      
        #    #     if web_page_content:
        #    #         prompt["content"] = await preprocess_page_content_with_ai_model(web_page_content,optimized_prompt)
        #    #     else:
        #    #         prompt["content"] = item["snippet"]    
        #    #     sources.append(prompt)
        return sources, optimized_prompt 
    else:
        return None