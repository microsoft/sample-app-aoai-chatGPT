import { UserInfo, ConversationRequest, Conversation, ChatMessage } from "./models";
import { chatHistorySampleData } from "../constants/chatHistory";

export async function conversationApi(options: ConversationRequest, abortSignal: AbortSignal): Promise<Response> {
    const response = await fetch("/conversation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: options.messages
        }),
        signal: abortSignal
    });

    return response;
}

export async function getUserInfo(): Promise<UserInfo[]> {
    const response = await fetch('/.auth/me');
    if (!response.ok) {
        console.log("No identity provider found. Access to chat will be blocked.")
        return [];
    }

    const payload = await response.json();
    return payload;
}

// export const fetchChatHistoryInit = async (): Promise<Conversation[] | null> => {
export const fetchChatHistoryInit = (): Conversation[] | null => {
    // Make initial API call here

    // return null;
    return chatHistorySampleData;

    // const response = await fetch('api_endpoint');
    // const data = await response.json();
    // return data;
}

// export const fetchHistoryList = async (): Promise<any> => {
export const fetchHistoryList = async (): Promise<Conversation[]> => {
    try {
        const response = await fetch("/history/list", {
            method: "POST",
            body: null,
            headers: {
                "Content-Type": "application/json"
            },
        });
        const payload = await response.json();
        const conversations: Conversation[] = await Promise.all(payload.map(async (conv: any) => {
            const conversation: Conversation = {
                id: conv.id,
                title: conv.title,
                date: conv.createdAt,
                messages: await fetchMessagesList(conv.id)
            };
            return conversation;
        }));
        console.log("final conversations: ", conversations)
        return conversations;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export const fetchMessagesList = async (convId: string): Promise<ChatMessage[]> => {
    try {
        const response = await fetch("/history/read", {
            method: "POST",
            body: JSON.stringify({
                conversation_id: convId
            }),
            headers: {
                "Content-Type": "application/json"
            },
        });
        const payload = await response.json();
        let messages: ChatMessage[] = [];
        if(payload?.messages){
            payload.messages.forEach((msg: any) => {
                const message: ChatMessage = {
                    id: msg.id,
                    role: msg.role,
                    date: msg.createdAt,
                    content: msg.content,
                }
                messages.push(message)
            });
            return messages;
        }else{
            return [];
        }
    } catch (error) {
        console.log(error)
        return []
    }
}

export const historyGenerate = async (messages: ChatMessage[], abortSignal: AbortSignal, convId?: string): Promise<any> => {
    try {
        let body;
        if(convId){
            body = JSON.stringify({
                conversation_id: convId,
                messages: messages
            })
        }else{
            body = JSON.stringify({
                messages: messages
            })
        }
        console.log("body", body)
        const response = await fetch("/history/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: body,
            signal: abortSignal
        });
        console.log("response: ", response)
        const payload = await response.json();
        console.log("payload: ", payload)
        // let messages: ChatMessage[] = [];
        // if(payload?.messages){
        //     payload.messages.forEach((msg: any) => {
        //         const message: ChatMessage = {
        //             id: msg.id,
        //             role: msg.role,
        //             date: msg.createdAt,
        //             content: msg.content,
        //         }
        //         messages.push(message)
        //     });
        //     return messages;
        // }else{
        //     return [];
        // }
    } catch (error) {
        console.log(error)
        return []
    }
}

