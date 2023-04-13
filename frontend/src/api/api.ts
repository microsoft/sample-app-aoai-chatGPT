import { ChatMessage, ConversationRequest, FeedbackRequest } from "./models";

export async function conversationApi(options: ConversationRequest): Promise<ChatMessage> {
    const response = await fetch("/conversation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: options.messages
        })
    });

    const parsedResponse: ChatMessage = await response.json();
    if (response.status > 299 || !response.ok) {
        alert("Unknown error");
        throw Error("Unknown error");
    }

    return parsedResponse;
}

export async function feedbackApi(request: FeedbackRequest): Promise<void> {
    const response = await fetch("/feedback", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message_id: request.message_id,
            rating: request.feedback
        })
    });
    console.log("Feedback response: ", response.status, response.ok);

    if (response.status > 299 || !response.ok) {
        alert("Unknown error");
        throw Error("Unknown error");
    }
}
