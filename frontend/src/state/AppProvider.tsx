import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { appStateReducer } from './AppReducer';
import { ChatHistoryLoadingState, CosmosDBHealth, historyList, historyEnsure, CosmosDBStatus } from '../api';
import { Conversation } from '../api';
  
export interface AppState {
    isChatHistoryOpen: boolean;
    chatHistoryLoadingState: ChatHistoryLoadingState;
    isCosmosDBAvailable: CosmosDBHealth;
    chatHistory: Conversation[] | null;
    filteredChatHistory: Conversation[] | null;
    currentChat: Conversation | null;
}

export type Action =
    | { type: 'TOGGLE_CHAT_HISTORY' }
    | { type: 'SET_COSMOSDB_STATUS', payload: CosmosDBHealth }
    | { type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState }
    | { type: 'UPDATE_CURRENT_CHAT', payload: Conversation | null }
    | { type: 'UPDATE_FILTERED_CHAT_HISTORY', payload: Conversation[] | null }
    | { type: 'UPDATE_CHAT_HISTORY', payload: Conversation } // API Call
    | { type: 'UPDATE_CHAT_TITLE', payload: Conversation } // API Call
    | { type: 'DELETE_CHAT_ENTRY', payload: string } // API Call
    | { type: 'DELETE_CHAT_HISTORY'}  // API Call
    | { type: 'DELETE_CURRENT_CHAT_MESSAGES', payload: string }  // API Call
    | { type: 'FETCH_CHAT_HISTORY', payload: Conversation[] | null }  // API Call

const initialState: AppState = {
    isChatHistoryOpen: false,
    chatHistoryLoadingState: ChatHistoryLoadingState.Loading,
    chatHistory: null,
    filteredChatHistory: null,
    currentChat: null,
    isCosmosDBAvailable: {
        cosmosDB: false,
        status: CosmosDBStatus.NotConfigured,
    }
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
        // Check for cosmosdb config and fetch initial data here
        const fetchChatHistory = async (): Promise<Conversation[] | null> => {
            const result = await historyList().then((response) => {
                if(response){
                    dispatch({ type: 'FETCH_CHAT_HISTORY', payload: response });
                }else{
                    dispatch({ type: 'FETCH_CHAT_HISTORY', payload: null });
                }
                return response
            })
            .catch((err) => {
                dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
                dispatch({ type: 'FETCH_CHAT_HISTORY', payload: null });
                console.error("There was an issue fetching your data.");
                return null
            })
            return result
        };

        const getHistoryEnsure = async () => {
            dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Loading });
            historyEnsure().then((response) => {
                if(response?.cosmosDB){
                    fetchChatHistory()
                    .then((res) => {
                        if(res){
                            dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Success });
                            dispatch({ type: 'SET_COSMOSDB_STATUS', payload: response });
                        }else{
                            dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
                            dispatch({ type: 'SET_COSMOSDB_STATUS', payload: {cosmosDB: false, status: CosmosDBStatus.NotWorking} });
                        }
                    })
                    .catch((err) => {
                        dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
                        dispatch({ type: 'SET_COSMOSDB_STATUS', payload: {cosmosDB: false, status: CosmosDBStatus.NotWorking} });
                    })
                }else{
                    dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
                    dispatch({ type: 'SET_COSMOSDB_STATUS', payload: response });
                }
            })
            .catch((err) => {
                dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
                dispatch({ type: 'SET_COSMOSDB_STATUS', payload: {cosmosDB: false, status: CosmosDBStatus.NotConfigured} });
            })
        }
        getHistoryEnsure();
    }, []);
  
    return (
      <AppStateContext.Provider value={{ state, dispatch }}>
        {children}
      </AppStateContext.Provider>
    );
  };


