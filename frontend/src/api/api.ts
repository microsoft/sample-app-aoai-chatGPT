import { UserInfo, ConversationRequest } from "./models";
import axiosInstance from "./axios";
import { AxiosResponse } from "axios";

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

// Create function to post upload mulitple files to /upload
export async function uploadFiles(files: File[], abortSignal: AbortSignal): Promise<AxiosResponse> {
    const formData = new FormData();
    files.forEach((file, index) => {
        formData.append(`files`, file);
    });

    // call post request using axios inside the service
    const response = await axiosInstance.post("/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        },
        signal: abortSignal
    });

    return response;
}