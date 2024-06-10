import * as React from 'react';
import { Stack, TextField, IconButton } from '@fluentui/react';
import uuid from 'react-uuid';


const UserInfo: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    borderRadius: '35px',
    padding: '15px',
    backgroundColor:"#313F46",
    boxShadow: 'none',
    border: "2px solid #378588"
  };

  const textFieldStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'inherit',
  };

  const textFieldWrapperStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: '25px',
  };
  const [inputValue, setInputValue] = React.useState<string>('');

  const handleChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setInputValue(newValue || "")
  }

  const handleSave = () => {
    const dataToSave = { name: inputValue, id: uuid() };
    localStorage.setItem('userInfo', JSON.stringify([dataToSave]));
    window.location.reload();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      handleSave?.();
    }
  };

  return (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { width: 350, margin: 'auto' } }}>
      <div style={{ display: "flex", alignItems: "center", flexDirection: "column", width: "100%" }}>
        <div style={containerStyle}>
          <div style={textFieldWrapperStyle}>
            <TextField
              placeholder={"Enter your Full Name"}
              borderless
              value={inputValue}
              styles={{
                root: {
                  color: "#FFFFFF",
                  overflow: 'hidden',
                },
                fieldGroup: {
                  borderRadius: '25px',
                  backgroundColor: 'inherit',
                  margin: "-2px",
                  overflow: 'hidden',
                  border: 'none',
                },
                field: {
                  backgroundColor: 'inherit',
                  overflow: 'hidden',
                  color: "#FFFFFF",
                  '::placeholder': {
                    color: '#7c909b',
                  },
                },
              }}
              style={textFieldStyle}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          </div>
          <IconButton
            iconProps={{ iconName: 'Send' }}
            ariaLabel="Send"
            styles={{
              root: {
                backgroundColor: 'transparent',
                color: "#FFFFFF",
                borderRadius: 10
              }
            }}
            onClick={handleSave}
          />
        </div>
      </div>
    </Stack>
  );
};

export default UserInfo;
