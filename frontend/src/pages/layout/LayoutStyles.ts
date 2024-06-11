import { makeStyles, shorthands } from "@fluentui/react-components";

export const LayoutStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        paddingTop: '10px',
        paddingLeft: '20px',
        paddingRight: '20px',
        boxSizing: 'border-box',
    },
    containerEmbed: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
    },
});