import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { appStateReducer } from './AppReducer';
import { ChatHistoryLoadingState, CosmosDBStatus, fetchHistoryList, historyEnsure } from '../api';
import { Conversation } from '../api';
  
export interface AppState {
    isChatHistoryOpen: boolean;
    chatHistoryLoadingState: ChatHistoryLoadingState;
    isCosmosDBAvailable: CosmosDBStatus;
    chatHistory: Conversation[] | null;
    filteredChatHistory: Conversation[] | null;
    filterHistory: boolean;
    currentChat: Conversation | null;
}

export type Action =
    | { type: 'TOGGLE_CHAT_HISTORY' }
    | { type: 'SET_COSMOSDB_STATUS', payload: CosmosDBStatus }
    | { type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState }
    | { type: 'UPDATE_CURRENT_CHAT', payload: Conversation | null }
    | { type: 'UPDATE_FILTERED_CHAT_HISTORY', payload: Conversation[] | null }
    | { type: 'UPDATE_CHAT_HISTORY', payload: Conversation } // API Call
    | { type: 'UPDATE_CHAT_TITLE', payload: Conversation } // API Call
    | { type: 'DELETE_CHAT_ENTRY', payload: string } // API Call
    | { type: 'DELETE_CHAT_HISTORY'}  // API Call
    | { type: 'DELETE_CURRENT_CHAT_MESSAGES' }  // API Call
    | { type: 'FETCH_CHAT_HISTORY', payload: Conversation[] }  // API Call

const initialState: AppState = {
    isChatHistoryOpen: true,
    chatHistoryLoadingState: ChatHistoryLoadingState.Loading,
    chatHistory: null,
    filteredChatHistory: null,
    filterHistory: false,
    currentChat: null,
    isCosmosDBAvailable: {
        cosmosDB: false,
        status: "",
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
        // Fetch initial data here
        const fetchChatHistory = async () => {
            try {
                const chatHistoryData = await fetchHistoryList();
                dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Success });
                dispatch({ type: 'FETCH_CHAT_HISTORY', payload: chatHistoryData });
            } catch (error) {
                dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
                console.error('Error fetching data:', error);
            }
        };

        const getHistoryEnsure = async () => {
            dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Loading });
            historyEnsure().then((response) => {
                if(response.cosmosDB){
                    fetchChatHistory()
                }
                dispatch({ type: 'SET_COSMOSDB_STATUS', payload: response });
            })
            .catch((err) => {
                console.error("FAILED ON INIT: ", err)
                dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail });
                dispatch({ type: 'SET_COSMOSDB_STATUS', payload: {cosmosDB: false, status: 'Error'} });
            })
        }

        // fetchChatHistory();
        getHistoryEnsure();
    }, []);
  
    return (
      <AppStateContext.Provider value={{ state, dispatch }}>
        {children}
      </AppStateContext.Provider>
    );
  };


