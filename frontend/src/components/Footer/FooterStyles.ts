import { makeStyles, shorthands } from "@fluentui/react-components";

export const FooterStyles = makeStyles({
    footerContainer: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...shorthands.textDecoration('none'),
        ...shorthands.gap('8px'),
        marginTop: '10px',
    },

    footerIcon: {
        height: '12px',
        width: '12px',
    },

    footerText: {
        display: 'flex',
        alignItems: 'center',
    },
});
