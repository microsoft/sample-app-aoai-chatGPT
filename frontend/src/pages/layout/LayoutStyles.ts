import { makeStyles, shorthands } from "@fluentui/react-components";

export const LayoutStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        ...shorthands.padding('20px'),
        boxSizing: 'border-box',
    },
});