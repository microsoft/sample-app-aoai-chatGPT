import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const QuestionInputStyles = makeStyles({
    container: {
        width: '100%',
        display: 'flex',
    },

    textInput: {
        width: '100%',
        boxShadow: tokens.shadow8,
    },

    sendButton: {
        position: 'relative',
        right: '50px',
        top: '30px',
        color: tokens.colorBrandForeground1
    },
});

  