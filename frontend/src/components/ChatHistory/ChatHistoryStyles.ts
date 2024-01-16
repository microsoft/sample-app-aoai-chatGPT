import { makeStyles, shorthands } from "@fluentui/react-components";

export const ChatHistoryStyles = makeStyles({
    panelHeader: {
        // Display cards in row and equal space between
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',

    },
    container: {
        maxHeight: 'calc(100vh - 100px)',
        width: '300px',
    },
    listContainer: {
        ...shorthands.overflow('hidden', 'auto'),
        maxHeight: 'calc(90vh - 105px)',
    },
    itemCell: {
        maxWidth: '270px',
        minHeight: '32px',
        cursor: 'pointer',
        paddingLeft: '15px',
        paddingRight: '5px',
        paddingTop: '5px',
        paddingBottom: '5px',
        boxSizing: 'border-box',
        ...shorthands.borderRadius('5px'),
        display: 'flex',
    },

    itemButton: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '28px',
        height: '28px',
        ...shorthands.border('1px', 'solid', '#d1d1d1'),
        ...shorthands.borderRadius('5px'),
        backgroundColor: 'white',
        ...shorthands.margin('auto', '2.5px'),
        cursor: 'pointer',
    },
    itemButtonHover: {
        backgroundColor: '#E6E6E6',
    },
    chatGroup: {
        ...shorthands.margin('auto 5px'),
        width: '100%',
    },
    spinnerContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50px',
    },
    chatList: {
        width: '100%',
    },
    chatMonth: {
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '5px',
        paddingLeft: '15px',
    },
    chatTitle: {
        width: '80%',
        ...shorthands.overflow('hidden'),
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },

});