import { Conversation, fetchChatHistoryInit, fetchHistoryList } from '../api';
import { Action, AppState } from './AppProvider';

// Define the reducer function
export const appStateReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'TOGGLE_CHAT_HISTORY':
            return { ...state, isChatHistoryOpen: !state.isChatHistoryOpen };
        case 'UPDATE_CURRENT_CHAT':
            console.log("item to update: ", action.payload)
            return { ...state, currentChat: action.payload };
        case 'UPDATE_FILTERED_CHAT_HISTORY':
            let isFilter = action.payload ? true : false;
            return { ...state, filteredChatHistory: action.payload, filterHistory: isFilter };
        case 'UPDATE_CHAT_HISTORY':
            if(!state.chatHistory || !state.currentChat){
                return state;
            }
            let conversationIndex = state.chatHistory.findIndex(conv => conv.id === action.payload.id);
            if (conversationIndex !== -1) {
                let updatedChatHistory = [...state.chatHistory];
                updatedChatHistory[conversationIndex] = state.currentChat
                // TODO: make api call to update existing chat history
                return {...state, chatHistory: updatedChatHistory}
            } else {
                // TODO: make api call to add/create new chat history
                return { ...state, chatHistory: [...state.chatHistory, action.payload] };
            }
        case 'UPDATE_CHAT_TITLE':
            if(!state.chatHistory){
                return { ...state, chatHistory: [] };
            }
            let updatedChats = state.chatHistory.map(chat => {
                if (chat.id === action.payload.id) {
                    if(state.currentChat?.id === action.payload.id){
                        state.currentChat.title = action.payload.title;
                    }
                    //TODO: make api call to save new title to DB
                    return { ...chat, title: action.payload.title };
                }
                return chat;
            });
            return { ...state, chatHistory: updatedChats };
        case 'DELETE_CHAT_ENTRY':
            if(!state.chatHistory){
                return { ...state, chatHistory: [] };
            }
            let filteredChat = state.chatHistory.filter(chat => chat.id !== action.payload);
            state.currentChat = null;
            //TODO: make api call to delete conversation from DB
            return { ...state, chatHistory: filteredChat };
        case 'DELETE_CHAT_HISTORY':
            //TODO: make api call to delete all conversations from DB
            return { ...state, chatHistory: [], filteredChatHistory: [], filterHistory: false, currentChat: null };
        case 'DELETE_CURRENT_CHAT_MESSAGES':
            //TODO: make api call to delete current conversation messages from DB
            if(!state.currentChat){
                return state;
            }
            const updatedCurrentChat = {
                ...state.currentChat,
                messages: []
            };
            return {
                ...state,
                currentChat: updatedCurrentChat
            };
        case 'FETCH_CHAT_HISTORY':
            return { ...state, chatHistory: action.payload };
        default:
            return state;
      }
};