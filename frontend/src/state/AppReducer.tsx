import { Action, AppState } from './AppProvider';

// Define the reducer function
export const appStateReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'TOGGLE_CHAT_HISTORY':
          return { ...state, isChatHistoryOpen: !state.isChatHistoryOpen };
        default:
          return state;
      }
};