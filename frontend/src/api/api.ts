import { UserInfo, ConversationRequest, Conversation, ChatMessage, CosmosDBStatus } from "./models";
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
}

export const fetchHistoryList = async (): Promise<Conversation[]> => {
    try {
        const response = await fetch("/history/list", {
            method: "GET",
        })

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
        console.log(typeof(error))
        console.error(error)
        return []
    }
}

export const historyGenerate = async (options: ConversationRequest, abortSignal: AbortSignal, convId?: string): Promise<Response> => {
    try {
        let body;
        if(convId){
            body = JSON.stringify({
                conversation_id: convId,
                messages: options.messages
            })
        }else{
            body = JSON.stringify({
                messages: options.messages
            })
        }
        const response = await fetch("/history/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: body,
            signal: abortSignal
        });
        return response;
    } catch (error) {
        console.log(error)
        return new Response
    }
}

export const historyUpdate = async (messages: ChatMessage[], convId: string): Promise<any> => {
    const response = await fetch("/history/update", {
        method: "POST",
        body: JSON.stringify({
            conversation_id: convId,
            messages: messages
        }),
        headers: {
            "Content-Type": "application/json"
        },
    });
}

export const historyDelete = async (convId: string) : Promise<any> => {
    const response = await fetch("/history/delete", {
        method: "DELETE",
        body: JSON.stringify({
            conversation_id: convId,
        }),
        headers: {
            "Content-Type": "application/json"
        },
    });
}

export const historyDeleteAll = async () : Promise<any> => {
    const response = await fetch("/history/delete_all", {
        method: "DELETE",
        body: JSON.stringify({}),
        headers: {
            "Content-Type": "application/json"
        },
    });
}

export const historyClear = async (convId: string) : Promise<any> => {
    const response = await fetch("/history/clear", {
        method: "POST",
        body: JSON.stringify({
            conversation_id: convId,
        }),
        headers: {
            "Content-Type": "application/json"
        },
    });
}

export const historyRename = async (convId: string, title: string) : Promise<any> => {
    const response = await fetch("/history/rename", {
        method: "POST",
        body: JSON.stringify({
            conversation_id: convId,
            title: title
        }),
        headers: {
            "Content-Type": "application/json"
        },
    });
}

export const historyEnsure = async (): Promise<CosmosDBStatus> => {
    const response = await fetch("/history/ensure", {
        method: "GET",
    })
    if(!response.ok){
        let respJson = await response.json();
        return {
            'cosmosDB': false,
            'status': respJson?.error
        }
    }else{
        let respJson = await response.json();
        return {
            'cosmosDB': true,
            'status': respJson?.message
        }
    }
}

