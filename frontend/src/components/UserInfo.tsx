import React, { useState } from 'react';
import { Stack, TextField, IconButton } from '@fluentui/react';
import { Send24Regular, ChevronRight24Regular } from '@fluentui/react-icons';

interface InputWithIconProps {
    iconType: 'send' | 'navigate';
    onIconClick: () => void;
    placeholder?: string;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({ iconType, onIconClick, placeholder }) => {
    const [inputValue, setInputValue] = useState<string>('');

    const handleInputChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setInputValue(newValue || '');
    };

    return (
        <Stack horizontal tokens={{ childrenGap: 5 }} verticalAlign="center" styles={{ root: { width: 300 } }}>
            <TextField
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder || 'Enter text...'}
                styles={{
                    fieldGroup: { borderRadius: 4, flexGrow: 1 }
                }}
            />
            <IconButton
                iconProps={iconType === 'send' ? { iconName: 'Send' } : { iconName: 'ChevronRight' }}
                onClick={onIconClick}
                styles={{
                    root: {
                        backgroundColor: 'transparent',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                    },
                    icon: {
                        fontSize: 24,
                    }
                }}
            />
        </Stack>
    );
};

export default InputWithIcon;
