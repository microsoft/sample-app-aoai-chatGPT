async def call_azure_openai(messages: List[Dict[str, str]], task: str, jurisdiction: str) -> str:
    """Call Azure OpenAI to generate responses."""
    
    if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_KEY:
        logger.warning("Azure OpenAI not configured")
        return "AI service is not configured. Please check your Azure OpenAI settings."
    
    # Get deployment name from environment or use default
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_ID", "gpt-4o")
    
    try:
        # Prepare system message
        system_message = {
            "role": "system",
            "content": f"""You are Joogni, an expert {jurisdiction} family law AI assistant. 
            Current task: {task}
            Provide clear, practical legal guidance. Be professional but approachable."""
        }
        
        # Build messages for API
        api_messages = [system_message]
        api_messages.extend(messages)
        
        # Clean endpoint and build URL
        endpoint = AZURE_OPENAI_ENDPOINT.rstrip('/')
        api_url = f"{endpoint}/openai/deployments/{deployment}/chat/completions?api-version=2024-08-01-preview"
        
        logger.info(f"Calling Azure OpenAI at: {api_url} with deployment: {deployment}")
        
        # Call Azure OpenAI
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                api_url,
                headers={
                    "api-key": AZURE_OPENAI_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "messages": api_messages,
                    "temperature": 0.7,
                    "max_tokens": 2000,
                    "top_p": 0.95,
                    "frequency_penalty": 0,
                    "presence_penalty": 0
                }
            )
            
            logger.info(f"OpenAI response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return f"AI service error (status {response.status_code}). Please try again."
    
    except Exception as e:
        logger.exception(f"Error calling Azure OpenAI: {e}")
        return "An error occurred while processing your request. Please try again."
