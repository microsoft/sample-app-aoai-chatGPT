import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const SuggestionButtonStyles = makeStyles({
    container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        // center horizontally
        alignItems: 'center',
        // center vertically
        justifyContent: 'center',
        ...shorthands.gap('5px'),
        marginTop: '25px',
    },
});