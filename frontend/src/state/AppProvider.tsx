import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { appStateReducer } from './AppReducer';
import { chatHistorySampleData } from '../constants/chatHistory';
import { ChatMessage, CosmosDBStatus, fetchChatHistoryInit, fetchHistoryList, fetchMessagesList, historyEnsure } from '../api';
import { Conversation } from '../api';
  
export interface AppState {
    isChatHistoryOpen: boolean;
    isCosmosDBAvailable: CosmosDBStatus;
    chatHistory: Conversation[] | null;
    filteredChatHistory: Conversation[] | null;
    filterHistory: boolean;
    currentChat: Conversation | null;
}

export type Action =
    | { type: 'TOGGLE_CHAT_HISTORY' }
    | { type: 'SET_COSMOSDB_STATUS', payload: CosmosDBStatus }
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
                dispatch({ type: 'FETCH_CHAT_HISTORY', payload: chatHistoryData });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        const getHistoryEnsure = async () => {
            historyEnsure().then((response) => {
                console.log("response: ", response)
                if(response.cosmosDB){
                    fetchChatHistory()
                }
                dispatch({ type: 'SET_COSMOSDB_STATUS', payload: response });
            })
            .catch((err) => {
                console.log("FAILED ON INIT: ", err)

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

// const fetchChatHistory = async() => {
//     let chatHistoryData = await fetchHistoryList();
//     // let chatHistoryData = fetchChatHistoryInit();
//     return chatHistoryData;
// }

