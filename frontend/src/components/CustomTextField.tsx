import React, { useContext, useState } from 'react';
import { TextField, PrimaryButton } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';
import { AppStateContext } from '../state/AppProvider';
import style from "../pages/layout/Layout.module.css"

interface Props {
  placeholder: string,
  onButtonClick?: () => void;
  text: string,
  setText?: (value: string) => void;
  allowBorder?: boolean,
  isButtonRequired?: boolean
  onFocus?: () => void;
  onBlur?: () => void;
  isTextFieldFocused?: boolean
}

const CustomTextField: React.FC<Props> = ({ placeholder, onButtonClick, text, setText, allowBorder = false, isButtonRequired = true, onFocus, onBlur, isTextFieldFocused = false }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    borderRadius: '35px',
    backgroundColor: isTextFieldFocused ? "#313F46" : "#313F46",
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
    borderRadius: '25px',
  };
  const appStateContext = useContext(AppStateContext)

  const [isButtonClicked, setIsButtonClicked] = useState(false);

  const handleChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setInputText(newValue || '');
  };
  const [inputText, setInputText] = useState<string>("");
  const navigate = useNavigate();

  const handleNavigate = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setIsButtonClicked(true);
    const inputPayload = text + ` ${inputText}`;
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
      const promptValue = `${text} ${inputText}`;
      setText?.(promptValue || '')
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
    <div style={{ display: "flex", alignItems: "center", flexDirection: "column", width: "100%" }}>
      <div className={isTextFieldFocused ? style.focusInputField : style.mainInputField}>
        <div style={textFieldWrapperStyle}>
          <TextField
            placeholder={placeholder}
            borderless
            value={inputText}
            resizable={false}
            multiline
            rows={isTextFieldFocused ? 4 : 1}
            styles={{
              root: {
                color: "#FFFFFF",
                '@media (max-width: 1000px)': {
                  fontSize: "14px",
                  height: isTextFieldFocused ? "150px" : "30px",
                },
                '@media (max-width: 2500px) and (min-width: 1000px)': {
                  fontSize: "24px",
                  fontWeight: "100",
                  marginLeft: !isTextFieldFocused ? 15 : 2,
                  height: isTextFieldFocused ? "230px" : "50px",
                },
                textOverflow: !isTextFieldFocused ? 'ellipsis' : 'initial',
                overflow: 'hidden',
              },
              fieldGroup: {
                borderRadius: '25px',
                backgroundColor: 'inherit',
                margin: "-2px",
                '@media (max-width: 1000px)': {
                  fontSize: "14px",
                  height: isTextFieldFocused ? "150px" : "30px",
                },
                '@media (max-width: 2500px) and (min-width: 400px)': {
                  fontSize: "24px",
                  fontWeight: "100",
                  height: isTextFieldFocused ? "230px" : "50px",
                },
                textOverflow: !isTextFieldFocused ? 'ellipsis' : 'initial',
                overflow: 'hidden',
                lineHeight: isTextFieldFocused ? "1.6em" : "1,5em",
                border: 'none',
              },
              field: {
                backgroundColor: 'inherit',
                textOverflow: !isTextFieldFocused ? 'ellipsis' : 'initial',
                overflow: 'hidden',
                '@media (max-width: 600px)': {
                  fontSize: "14px",
                  height: isTextFieldFocused ? "150px" : "30px",
                },
                '@media (max-width: 1000px) and (min-width: 600px)': {
                  fontSize: "18px",
                  fontWeight: "500",
                  height: isTextFieldFocused ? "230px" : "50px",
                },
                '@media (max-width: 2500px) and (min-width: 1000px)': {
                  fontSize: "30px",
                  fontWeight: "100",
                  height: isTextFieldFocused ? "230px" : "50px",
                },
                lineHeight: isTextFieldFocused ? "1.6em" : "1.5em",
                color: "#FFFFFF",
                '::placeholder': {
                  color: '#7c909b',
                  '@media (max-width: 1500px) and (min-width: 1000px)': {
                    fontWeight: "500",
                    fontSize:"16px"
                  },
                  '@media (max-width: 2500px) and (min-width: 1500px)': {
                    fontWeight: "500",
                    fontSize:"30px"
                  },
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
              root: {
                '@media (max-width: 600px)': {
                  height: "50px",
                  width:"380px !important"
                },
                '@media (max-width: 1000px) and (min-width: 600px)': {
                  height: "60px",
                },
                '@media (max-width: 2500px) and (min-width: 1000px)': {
                  height: "80px"
                },
              },
              label:{
                '@media (max-width: 1000px) and (min-width: 600px)': {
                  fontSize:"20px"
                },
                '@media (max-width: 2500px) and (min-width: 1000px)': {
                  fontSize:"30px"
                },
              }
            }
          }
          style={{
            width: "100%",
            marginTop: 20,
            borderRadius: 10,
            padding: 20,
            fontSize: "0.875rem",
            background: "black",
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

export default CustomTextField;
