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

    shareButton: {
        '@media (max-width: 400px)': {
            width: '75px',
            ...shorthands.gap("5px"),
            ...shorthands.margin("5px"),
        }
    },

    rightCommandBar: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        ...shorthands.gap('12px'),
    },

    verticalBar: {
        marginBottom: '4px',
        fontSize: '24px',
        lineHeight: '32px',
        fontWeight: '600',
        '@media (max-width: 400px)': {
            marginLeft: '0px',
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: '600',
        },
    },

    headerTitle: {
        marginLeft: '5px',
        fontSize: '24px',
        lineHeight: '32px',
        fontWeight: '600',
        '@media (max-width: 400px)': {
            marginLeft: '0px',
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: '600',
        },
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
        width: '150px',
        '@media (max-width: 400px)': {
            width: '100px',
            marginRight: '0px',
        },
    },
});