import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const QuestionInputStyles = makeStyles({
    container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    form: {
        width: '100%',
        display: 'flex',
    },

    textInput: {
        width: '100%',
        boxShadow: tokens.shadow8,
    },

    twoButtonContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        right: '50px',
        top: '10px',
    },

    oneButtonContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        right: '50px',
        top: '30px',
    },

    sendButton: {
        color: tokens.colorBrandForeground1
    },

    footer: {
        display: 'flex',
        flexDirection: 'row',
        verticalAlign: 'middle',
        justifyContent: 'space-between',
        width: '100%',
        paddingRight: '25px',
    },
    footerText: {
        verticalAlign: 'middle',
        marginTop: '5px',
    },
});

