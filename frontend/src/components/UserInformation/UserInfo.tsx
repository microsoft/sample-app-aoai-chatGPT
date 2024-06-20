import * as React from 'react';
import { Stack, TextField, IconButton, PrimaryButton } from '@fluentui/react';
import uuid from 'react-uuid';
import style from "../../pages/layout/Layout.module.css"
import { Send24Filled, Send28Filled } from '@fluentui/react-icons';

const UserInfo: React.FC = () => {

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
    <Stack horizontalAlign='center' tokens={{ childrenGap: 20 }} styles={{ root: { width: "100%", margin: 'auto' } }}>
      <div style={{
        display: "flex", alignItems: "center", flexDirection: "column",
        width: "100%", padding: "0px 20px"
      }}>
        <div className={style.userinputField}>
          <div style={textFieldWrapperStyle}>
            <TextField
              placeholder={"Enter your city name"}
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
                  '@media (max-width: 1000px)': {
                    fontSize: "14px"
                  },
                  '@media (max-width: 2500px) and (min-width: 1000px)': {
                    fontSize: "24px"
                  },
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
          <PrimaryButton
            onClick={handleSave}
            styles={{
              root: {
                backgroundColor: 'transparent',
                color: "#FFFFFF",
                borderRadius: 10, border: "none",
                minWidth:0,
                padding:"0px 5px"
              }
            }}
          >
            <Send28Filled />
          </PrimaryButton>

        </div>
      </div>
    </Stack>
  );
};

export default UserInfo;
