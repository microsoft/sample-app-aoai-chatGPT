export type AskResponse = {
    answer: string;
    citations: Citation[];
    error?: string;
};

export type Citation = {
    content: string;
    id: string;
    title: string | null;
    filepath: string | null;
    url: string | null;
    metadata: string | null;
    chunk_id: string | null;
    reindex_id: string | null;
}

export type ToolMessageContent = {
    citations: Citation[];
    intent: string;
}

export type ChatMessage = {
    id: string;
    role: string;
    content: string;
    end_turn?: boolean;
    date: string;
};

export type Conversation = {
    id: string;
    title: string;
    messages: ChatMessage[];
    date: string;
}

export enum ChatCompletionType {
    ChatCompletion = "chat.completion",
    ChatCompletionChunk = "chat.completion.chunk"
}

export type ChatResponseChoice = {
    messages: ChatMessage[];
}

export type ChatResponse = {
    id: string;
    model: string;
    created: number;
    object: ChatCompletionType;
    choices: ChatResponseChoice[];
    history_metadata: {
        conversation_id: string;
        title: string;
        date: string;
    }
    error?: any;
}

export type ConversationRequest = {
    messages: ChatMessage[];
};

export type UserInfo = {
    access_token: string;
    expires_on: string;
    id_token: string;
    provider_name: string;
    user_claims: any[];
    user_id: string;
};

export enum CosmosDBStatus {
    NotConfigured = "CosmosDB is not configured",
    NotWorking = "CosmosDB is not working",
    Working = "CosmosDB is configured and working",
}

export type CosmosDBHealth = {
    cosmosDB: boolean,
    status: string
}

export enum ChatHistoryLoadingState {
    Loading = "loading",
    Success = "success",
    Fail = "fail",
    NotStarted = "notStarted"
}

export type ErrorMessage = {
    title: string,
    subtitle: string
}