import { ChatRequest, ChatResponse } from './models';

export async function getChatResponse(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch chat response');
    }

    return await response.json();
}