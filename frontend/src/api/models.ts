export type AskResponse = {
    answer: string;
    citations: Citation[];
    error?: string;
    message_id?: string;
    feedback?: Feedback;
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
    feedback?: Feedback;
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

export type FrontendSettings = {
    auth_enabled?: string | null;
    feedback_enabled?: string | null;
}

export enum Feedback {
    Neutral = "neutral",
    Positive = "positive",
    Negative = "negative",
    MissingCitation = "missing_citation",
    WrongCitation = "wrong_citation",
    OutOfScope = "out_of_scope",
    InaccurateOrIrrelevant = "inaccurate_or_irrelevant",
    OtherUnhelpful = "other_unhelpful",
    HateSpeech = "hate_speech",
    Violent = "violent",
    Sexual = "sexual",
    Manipulative = "manipulative",
    OtherHarmful = "other_harmlful"
}