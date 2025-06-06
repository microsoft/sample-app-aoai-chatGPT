from azure.search.documents import SearchClient
from openai import AzureOpenAI

token_provider = get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")
openai_client = AzureOpenAI(
     api_version="2024-06-01",
     azure_endpoint=AZURE_OPENAI_ACCOUNT,
     azure_ad_token_provider=token_provider
 )

deployment_name = "gpt-4o"

search_client = SearchClient(
     endpoint=AZURE_SEARCH_SERVICE,
     index_name=index_name,
     credential=credential
 )

GROUNDED_PROMPT="""
You are an AI assistant that helps users learn from the information found in the source material.
Answer the query using only the sources provided below.
Use bullets if the answer has multiple points.
If the answer is longer than 3 sentences, provide a summary.
Answer ONLY with the facts listed in the list of sources below. Cite your source when you answer the question
If there isn't enough information below, say you don't know.
Do not generate answers that don't use the sources below.
Query: {query}
Sources:\n{sources}
"""

# Focused query on cloud formations and bodies of water
query="Are there any cloud formations specific to oceans and large bodies of water?"
vector_query = VectorizableTextQuery(text=query, k_nearest_neighbors=50, fields="text_vector")

search_results = search_client.search(
    search_text=query,
    vector_queries= [vector_query],
    select=["title", "chunk", "locations"],
    top=5,
)

sources_formatted = "=================\n".join([f'TITLE: {document["title"]}, CONTENT: {document["chunk"]}, LOCATIONS: {document["locations"]}' for document in search_results])

response = openai_client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": GROUNDED_PROMPT.format(query=query, sources=sources_formatted)
        }
    ],
    model=deployment_name
)

print(response.choices[0].message.content)