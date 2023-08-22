import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { appStateReducer } from './AppReducer';
import { chatHistorySampleData } from '../constants/chatHistory';
import { ChatMessage, fetchChatHistoryInit } from '../api';
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
    | { type: 'UPDATE_CHAT_HISTORY', payload: Conversation }
    | { type: 'UPDATE_CHAT_TITLE', payload: Conversation }
    | { type: 'DELETE_CHAT_ENTRY', payload: string }
    | { type: 'DELETE_CHAT_HISTORY'}
    | { type: 'DELETE_CURRENT_CHAT_MESSAGES' }
    | { type: 'FETCH_CHAT_HISTORY', payload: string }

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
        dispatch({ type: 'FETCH_CHAT_HISTORY', payload: "cosmosDb_user_id?" });
    }, []);
  
    return (
      <AppStateContext.Provider value={{ state, dispatch }}>
        {children}
      </AppStateContext.Provider>
    );
  };


