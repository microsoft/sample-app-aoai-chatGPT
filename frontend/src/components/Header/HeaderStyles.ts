import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const HeaderStyles = makeStyles({
    container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: '10px',
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

    headerTitle: {
        marginLeft: '5px',
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

    logoImage: {
        marginRight: '10px',
    },
});