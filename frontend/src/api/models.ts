export interface ChatRequest {
    messages: ChatMessage[];
    stream?: boolean;
}

export interface ChatResponse {
    choices: Array<{
        messages: ChatMessage[];
    }>;
}

export interface ChatMessage {
    role: string;
    content: string;
    citations?: Citation[];
}

export interface Citation {
    content: string;
    title?: string;
    url?: string;
}