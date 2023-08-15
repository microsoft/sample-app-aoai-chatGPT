import { Action, AppState } from './AppProvider';

// Define the reducer function
export const appStateReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'TOGGLE_CHAT_HISTORY':
          return { ...state, isChatHistoryOpen: !state.isChatHistoryOpen };
        case 'UPDATE_CURRENT_CHAT':
          return { ...state, currentChat: action.payload };
        case 'UPDATE_CHAT_TITLE':
          const updatedChats = state.chatHistory.map(chat => {
              if (chat.id === action.payload.id) {
                  //TODO: make api call to save new title to DB
                  return { ...chat, title: action.payload.title };
              }
              return chat;
          });
          return { ...state, chatHistory: updatedChats };
        case 'DELETE_CHAT_ENTRY':
          const filteredChat = state.chatHistory.filter(chat => chat.id !== action.payload);
          //TODO: make api call to delete conversation from DB
          return { ...state, chatHistory: filteredChat };
        case 'DELETE_CHAT_HISTORY':
          return { ...state, chatHistory: [] };
        default:
          return state;
      }
};