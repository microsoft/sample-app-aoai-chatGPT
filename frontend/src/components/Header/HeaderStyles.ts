import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const HeaderStyles = makeStyles({
    container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: '20px',
    },

    titleContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        ...shorthands.gap('12px'),
    },

    rightCommandBar: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        ...shorthands.gap('12px'),
    },

    headerIcon: {
        height: '32px',
        width: '32px'
    },
    headerTitle: {
        color: tokens.colorNeutralForeground1,
        // on hover hide underline for link
        '&:hover': {
            ...shorthands.textDecoration('none'),
            color: tokens.colorNeutralForeground1,
        },
        // on press hide underline for link
        '&:active': {
            ...shorthands.textDecoration('none'),
            color: tokens.colorNeutralForeground1,
        },
    },
});