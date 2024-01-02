import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const QuestionInputStyles = makeStyles({
    container: {
        width: '100%',
        display: 'flex',
    },

    textInput: {
        width: '100%',
    },

    sendButton: {
        position: 'relative',
        right: '40px',
        bottom: '0px',
        color: tokens.colorBrandForeground1
    },
});

  