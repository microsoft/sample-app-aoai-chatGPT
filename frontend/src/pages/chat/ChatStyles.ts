import { makeStyles, shorthands } from "@fluentui/react-components";

export const ChatStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.padding('20px'),
        boxSizing: 'border-box',
    },

    chatContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            //background: 'radial-gradient(108.78% 108.78% at 50.02% 19.78%, #FFFFFF 57.29%, #EEF6FE 100%)',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.14), 0px 0px 2px rgba(0, 0, 0, 0.12)',
            ...shorthands.borderRadius('8px'),
            overflowY: 'auto',
            height: 'calc(100vh - 130px)',
            ...shorthands.padding('30px'),
            boxSizing: 'border-box',
    },

    questionDisplayRow: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },

    chatEmptyState: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },

    chatMessageErrorContent: {
        ...shorthands.gap('12px'),
        alignItems: "center",
        display: "flex",
    },

    chatInput: {
        display: 'flex',
        width: '100%',
        maxWidth: '1080px',
        flexDirection: 'row',
    },

    chatButtonsLeftContainer: {
        // Display vertically and equal space between
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        ...shorthands.gap('10px'),
        ...shorthands.margin('8px'),
    },

    citationPanelHeaderContainer: {
        width: '100%',
          // display horizontally and equal space between
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
    },

    citationPanelHeader: {
        fontStyle: 'normal',
        fontWeight: 600,
        fontSize: '18px',
        lineHeight: '24px',
        color: '#000000',
        order: 0,
        flexGrow: 0      
    },

    stopGeneratingContainer: {
        ...shorthands.margin('8px'),
    },

    chatMessageStream: {
        // display vertically and 10px gap
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('10px'),
        width: '100%',
        maxWidth: '1080px',
    },

});

  