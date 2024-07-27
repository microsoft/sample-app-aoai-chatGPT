prompts = {
    "identify_searches": 
        "The Original System Prompt that follows is your primary objective, but for this chat, you just need to provide a list of a few searches you might need me to perform in order to respond to the current user message, while documenting reference links to any claims you make, as specified in the Original System Prompt. Only use reference links you have validated in Background Data provided as part of the system prompt. If you can answer with full confidence without any searches, then reply with simply 'No searches required.'. Otherwise, send a comma delimited array of searches with one or several searches you would like me to perform for you to give you all the background data and links you need to respond. Do nothing else but provide the array of search strings or the 'No searches required.' message.\n\nOriginal System Prompt:\n\n",

    "identify_additional_searches":
        "The Original System Prompt that follows is your primary objective, but for this chat, you just need to provide a list of a few additional searches you need me to perform in order to fully research and document your response to the user message. If you can answer with full confidence without any searches, then reply with simply 'No searches required.'. Otherwise, send a comma delimited array with one or several new searches you would like me to perform for you to give you all the background data and links you need. Do nothing else but provide the array of search strings or the 'No searches required.' message. Existing gathered background data that you determined was insufficient so far to answer follows.\n\nExisting Background Data:\n\n",

    "get_urls_to_browse": 
        "You are tasked with helping content developers resolve customer feedback on their content on learn.microsoft.com. Right now, you've searched and identified the following list of potential URLs for further research. Return nothing except an array of strings, with each string being a URL we should browse to research further, so we can fully answer and document sources if necessary. Here is the summary of the possible sites we can browse:\n\n",

    "get_article_summaries": 
        "EMPTY_FOR_NOW",

    "is_background_info_sufficient": 
        "You are tasked with helping content developers resolve customer feedback on their content on learn.microsoft.com. Right now, you've summarized the content of the URLs you've identified for further research. Review the summaries below and determine if you have enough background information to fully address the feedback on the URL provided by the user and document current sources. If you need more information, reply with 'More information needed.' If you have enough information, reply with 'Sufficient information.'\n\n",

    "background_info_preamble": 
        "Use the following background references to thoroughly document your answer for the customer as described in the Primary System Message at the end.\n\nBackground References:\n\n",

    "search_error_preamble": 
        "NOTE: An error occurred while searching for background information. Please inform the user that you were unable to search to validate results, but do your best to answer regardless.\n\nPrimary System Message:\n\n"
}