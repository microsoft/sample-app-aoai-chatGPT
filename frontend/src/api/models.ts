export type AskResponse = {
    answer: string;
    thoughts: string | null;
    data_points: string[];
    top_docs: DocumentResult[];
    error?: string;
};

export type MessageContent = {
    content_type: string;
    parts: string[];
    top_docs: DocumentResult[];
    intent: string | null;
};

export type DocumentResult = {
    content: string;
    id: string;
    title: string | null;
    filepath: string | null;
    url: string | null;
    metadata: string | null;
}

export type ChatMessage = {
    message_id: string;
    parent_message_id: string | null;
    role: string;
    content: MessageContent;
};

export type ConversationRequest = {
    messages: ChatMessage[];
};
