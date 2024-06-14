import React from 'react';
import { IconButton, IButtonStyles } from '@fluentui/react';

const backIconStyles: React.CSSProperties = {
    fontSize: '16px',
    color: '#0078d4', // Custom color for the icon
};

// Custom styles to remove border and background effects
const buttonStyles: IButtonStyles = {
    root: {
        border: 'none',
        backgroundColor: 'transparent',
        padding: '0',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        selectors: {
            ':hover': {
                backgroundColor: 'transparent',
            },
            ':active': {
                backgroundColor: 'transparent',
            },
            ':focus': {
                outline: 'none',
                backgroundColor: 'transparent',
            },
        },
    },
    rootDisabled: {
        backgroundColor: 'transparent',
    },
    rootFocused: {
        outline: 'none',
        backgroundColor: 'transparent',
    },
    rootPressed: {
        backgroundColor: 'transparent',
    },
    rootChecked: {
        backgroundColor: 'transparent',
    },
    rootCheckedHovered: {
        backgroundColor: 'transparent',
    },
    rootCheckedPressed: {
        backgroundColor: 'transparent',
    },
};

interface BackButtonProps {
    onClick: () => void;
}

const BackIconButton: React.FC<BackButtonProps> = ({ onClick }) => {
    return (
        <IconButton
            iconProps={{ iconName: 'Back' }}
            styles={buttonStyles}
            onClick={onClick}
            ariaLabel="Back"
        />
    );
};

export default BackIconButton;
