import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { appStateReducer } from './AppReducer';
import { chatHistorySampleData } from '../constants/chatHistory';
import { ChatMessage, fetchChatHistoryInit, fetchHistoryList, fetchMessagesList } from '../api';
import { Conversation } from '../api';
  
export interface AppState {
    isChatHistoryOpen: boolean;
    chatHistory: Conversation[] | null;
    filteredChatHistory: Conversation[] | null;
    filterHistory: boolean;
    currentChat: Conversation | null;
}

export type Action =
    | { type: 'TOGGLE_CHAT_HISTORY' }
    | { type: 'UPDATE_CURRENT_CHAT', payload: Conversation }
    | { type: 'UPDATE_FILTERED_CHAT_HISTORY', payload: Conversation[] | null }
    | { type: 'UPDATE_CHAT_HISTORY', payload: Conversation } // API Call
    | { type: 'UPDATE_CHAT_TITLE', payload: Conversation } // API Call
    | { type: 'DELETE_CHAT_ENTRY', payload: string } // API Call
    | { type: 'DELETE_CHAT_HISTORY'}  // API Call
    | { type: 'DELETE_CURRENT_CHAT_MESSAGES' }  // API Call
    | { type: 'FETCH_CHAT_HISTORY', payload: Conversation[] }  // API Call

const initialState: AppState = {
    isChatHistoryOpen: true,
    chatHistory: null,
    filteredChatHistory: null,
    filterHistory: false,
    currentChat: null,
};

export const AppStateContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
  } | undefined>(undefined);

type AppStateProviderProps = {
    children: ReactNode;
  };
  
  export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(appStateReducer, initialState);

    useEffect(() => {
        // Fetch initial data here
        fetchMessagesList("30224227-32ef-4a4e-a82b-2c4af94387b7")
        // let chatHistoryData = fetchChatHistoryInit();
        // dispatch({ type: 'FETCH_CHAT_HISTORY', payload: chatHistoryData });

        const fetchChatHistory = async () => {
            try {
                const chatHistoryData = await fetchHistoryList();
                dispatch({ type: 'FETCH_CHAT_HISTORY', payload: chatHistoryData });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchChatHistory();

    }, []);
  
    return (
      <AppStateContext.Provider value={{ state, dispatch }}>
        {children}
      </AppStateContext.Provider>
    );
  };

// const fetchChatHistory = async() => {
//     let chatHistoryData = await fetchHistoryList();
//     // let chatHistoryData = fetchChatHistoryInit();
//     return chatHistoryData;
// }

