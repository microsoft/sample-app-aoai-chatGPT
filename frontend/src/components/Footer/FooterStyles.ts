import { makeStyles, shorthands } from "@fluentui/react-components";

export const FooterStyles = makeStyles({
    footerContainer: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...shorthands.textDecoration('none'),
        ...shorthands.gap('8px'),
    },

    footerIcon: {
        height: '12px',
        width: '12px',
    },

    footerText: {
        fontStyle: 'normal',
        fontWeight: 600,
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        color: '#242424',
    },
});
