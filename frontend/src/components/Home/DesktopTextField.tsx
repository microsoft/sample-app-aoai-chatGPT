import React, { useContext, useState } from 'react';
import { TextField, PrimaryButton, FontSizes, DefaultButton } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';
import style from "./Home.module.css"
import { AppStateContext } from '../../state/AppProvider';
 
interface Props {
  placeholder: string,
  onButtonClick?: () => void;
  promptValue:string,
  allowBorder?: boolean,
  isButtonRequired?: boolean
  onFocus?: () => void;
  onBlur?: () => void;
  isTextFieldFocused?: boolean
}
 
const DesktopTextField: React.FC<Props> = ({ placeholder, onButtonClick,  promptValue,allowBorder = false, isButtonRequired = true, onFocus, onBlur, isTextFieldFocused = false }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    borderRadius: '5px',
    backgroundColor: "#313F46",
    padding: '15px',
    boxShadow: 'none',
    border: allowBorder ? "2px solid #378588" : "none"
  };
 
  const textFieldStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'inherit',
  };
 
  const textFieldWrapperStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: '5px',
    height: "100%",
    padding:"10px 10px"
  };
  const appStateContext = useContext(AppStateContext)
 
  const [isButtonClicked, setIsButtonClicked] = useState(false);
 
  const handleChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setInputText(newValue || '');
    // setText?.(newValue || '');
  };
  const [inputText, setInputText] = useState<string>("");
  const navigate = useNavigate();
 
  const handleNavigate = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setIsButtonClicked(true);
    const inputPayload = promptValue + ` ${inputText}`;
    appStateContext?.dispatch({ type: 'SET_PROMPT_VALUE', payload: inputPayload })
    navigate("recommendations");
    setIsButtonClicked(false);
  };
 
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      onButtonClick?.();
    }
  };
 
  const handleBlur = () => {
    if (!isButtonClicked) {
      onBlur?.();
    }
  };
 
  const handleMouseDown = () => {
    setIsButtonClicked(true);
  };
 
  const handleMouseUp = () => {
    setTimeout(() => {
      setIsButtonClicked(false);
    }, 0);
  };
 
  return (
    <div className={style.inputFieldContainer}>
      <div className={style.mainInputField}>
        <div style={textFieldWrapperStyle}>
          <TextField
            placeholder={placeholder}
            borderless
            value={inputText}
            resizable={false}
            multiline
            rows={12}
            styles={{
              root: {
                color: "#000000",
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              },
              fieldGroup: {
                borderRadius: '10px',
                backgroundColor: 'inherit',
                minHeight:'auto',
                textOverflow: 'ellipsis',

                overflow: 'hidden',
                lineHeight: "1,5em",
                border: 'none',
              },
              field: {
                backgroundColor: 'inherit',
                textOverflow: 'ellipsis',

                fontSize:"24px",
                fontWeight: 400,
                overflow: 'hidden',
                lineHeight: "1.2em",
                color:"#ffffff",
                '::placeholder': {
                  color:"#8fa5b0",
                    fontWeight: "300",
                    fontSize:"22px",
                },
              },
            }}
            style={textFieldStyle}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={handleBlur}
          />
        </div>
      </div>
      {isButtonRequired && (
        <PrimaryButton
          styles={
            {
              label:{
                '@media (max-width: 2500px) and (min-width: 1300px)': {
                  fontSize:"20px"
                },
              }
            }
          }
          style={{
            width: "100%",
            marginTop: 20,
            borderRadius: 10,
            padding: 25,
            fontSize: "0.875rem",
            background: "#151B1E",
            border: "none"
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleNavigate}
        >
          Submit
        </PrimaryButton>
      )}
      </div>
  );
};
 
export default DesktopTextField;