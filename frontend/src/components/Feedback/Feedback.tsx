import React, { useContext, useState } from 'react';
import { Text, Stack, TextField, DefaultButton } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';
import { ThumbDislikeRegular, ThumbLikeRegular } from '@fluentui/react-icons';
import { sendFeedback } from '../../api';
import { AppStateContext } from '../../state/AppProvider';
import style from "./Feedback.module.css";
import homeStyle from "../Home/Home.module.css"
import detailStyle from "../ProductInformation/ProductInfo.module.css"
import PrimaryButtonComponent from '../common/PrimaryButtonComponent';

const Feedback: React.FC = () => {
    const [feedback, setFeedback] = useState<string>('');
    const appStateContext = useContext(AppStateContext);

    const conversationId = appStateContext?.state?.conversationId;

    const navigate = useNavigate();
    const [selectedButton, setSelectedButton] = useState<string>("");
    const [showThankYou, setShowThankYou] = useState<boolean>(false);
    const containerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        borderRadius: '35px',
        padding: '15px',
        boxShadow: 'none',
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
        padding: "10px 10px"
        
    };

    const handleFeedbackChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setFeedback(newValue || '');
    };

    const handleSubmit = () => {
        console.log(conversationId)
        sendFeedback(feedback, selectedButton, conversationId || "")
        setFeedback('');
        setSelectedButton('');
        setShowThankYou(true);
    };

    const handleNaviagte = () => {
        appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_STATE', payload: []})
        navigate("/");
    }

    const handleIconClick = (selectedValue: string): void => {
        setSelectedButton(selectedValue);
    }

    return (
        <div className={style.mainContainer} style={{justifyContent:showThankYou ?"center":""}}>
            {!showThankYou && (
            <Stack tokens={{ childrenGap: 10 }} horizontalAlign="center" style={{ marginBottom: 50 }}>
                <Text className={detailStyle.thankuText}>Rate your experience</Text>
            </Stack>
            )}
            <Stack
                horizontalAlign="center"
                verticalAlign={"center"}
                styles={{
                    root: {
                        flex:1,
                        height: '100%', marginTop: !showThankYou ? "0px" : "0px",
                        width: "100%",
                        maxWidth: "500px",
                        padding: "0px 20px"
                    }
                }}
                tokens={{ childrenGap: 30 }}
            >
                {showThankYou ? (
                    <Stack tokens={{ childrenGap: 10 }} horizontalAlign="center" verticalAlign='center' >
                        <Text style={{ marginBottom: 20 }} className={detailStyle.thankuText}>Thank you for your Response!</Text>
                        <PrimaryButtonComponent label="Go to Home" onClick={handleNaviagte} disabled={false} width='fit-content' />
                    </Stack>
                ) : (
                    <>
                        <Stack horizontal style={{ width: "100%" }} tokens={{ childrenGap: 15 }}>
                            <DefaultButton
                                styles={{
                                    root:{
                                        padding: "70px", 
                                        '@media (max-width: 600px)': {
                                            padding:"50px"
                                        },
                                    }
                                }}
                                style={{ width: "50%", backgroundColor: selectedButton === "Like" ? "#629E57" : "#151B1E", borderRadius: "21px", border: "none" }}
                                onClick={() => handleIconClick("Like")}
                            >
                                <Stack horizontalAlign='center' verticalAlign='center' tokens={{ childrenGap: 5 }}>
                                    <ThumbLikeRegular color={selectedButton === "Like" ? "black" : 'green'} style={{ width: '100%', height: '100%', marginTop: "8px" }} />
                                    <Text
                                        styles={{
                                            root: {
                                                '@media (max-width: 600px)': {
                                                    fontSize: "14px",
                                                    fontWeight: "500"
                                                },
                                                '@media (max-width: 1000px) and (min-width: 600px)': {
                                                    fontSize: "20px",
                                                },
                                                '@media (max-width: 2500px) and (min-width: 1000px)': {
                                                    fontSize: "24px",
                                                    fontWeight: "700"
                                                },
                                            }
                                        }}
                                        style={{ color: selectedButton === "Like" ? "#000" : "#629E57", marginBottom: "8px" }}>Good</Text>
                                </Stack>
                            </DefaultButton>
                            <DefaultButton
                                styles={{
                                    root: {
                                        padding: "70px",
                                        '@media (max-width: 600px)': {
                                            padding:"50px"
                                        },

                                    }
                                }}
                                style={{ width: "50%", backgroundColor: selectedButton === "DisLike" ? "#F05A74" : "#151B1E", borderRadius: "21px", border: "none" }}
                                onClick={() => handleIconClick("DisLike")}
                            >
                                <Stack horizontalAlign='center' verticalAlign='center' tokens={{ childrenGap: 5 }}>
                                    <ThumbDislikeRegular color={selectedButton === "DisLike" ? "black" : '#e46969'} style={{ width: '70%', height: '70%' }} />
                                    <Text styles={{
                                        root: {
                                            '@media (max-width: 00px)': {
                                                fontSize: "14px",
                                                fontWeight: "500"
                                            },
                                            '@media (max-width: 1000px) and (min-width: 600px)': {
                                                fontSize: "20px",
                                            },
                                            '@media (max-width: 2500px) and (min-width: 1000px)': {
                                                fontSize: "24px",
                                                fontWeight: "700"
                                            },
                                        }
                                    }}
                                        style={{ color: selectedButton === "DisLike" ? "#000" : "#e46969" }}>Improve</Text>
                                </Stack>
                            </DefaultButton>
                        </Stack>
                        <div className={homeStyle.mainInputField} style={{marginBottom:"20px"}}>
                            <div style={textFieldWrapperStyle}>
                                <TextField
                                    placeholder="Anything specific you would like to share?"
                                    multiline
                                    resizable={false}
                                    rows={14}
                                    borderless
                                    value={feedback}
                                    style={textFieldStyle}
                                    onChange={handleFeedbackChange}
                                    styles={{
                                        root: {
                                            color: "#000000",
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                        },
                                        fieldGroup: {
                                            borderRadius: '10px',
                                            backgroundColor: 'inherit',
                                            minHeight: 'auto',
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                            lineHeight: "1,5em",
                                            border: 'none',
                                        },
                                        field: {
                                            backgroundColor: 'inherit',
                                            textOverflow: 'ellipsis',
                                            fontSize: "16px",
                                            fontWeight: 300,
                                            overflow: 'hidden',
                                            lineHeight: "1.2em",
                                            color: "#ffffff",
                                            '::placeholder': {
                                                color: "#8fa5b0",
                                                fontWeight: "300",
                                                fontSize: "16px",
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </div>

                    </>)}
            </Stack>
            {!showThankYou && (
            <Stack
                            horizontalAlign='center'
                            style={{width: "100%",marginTop:"auto",padding:"0px 20px"}}
                            styles={{
                                root: {
                                    flexWrap: "wrap",
                                    // '@media (max-width: 1000px)': {
                                    //     width: "100%",
                                    // },
                                    // '@media (max-width: 2500px) and (min-width: 1000px)': {
                                    //     width: "50%",
                                    // },
                                }
                            }}
                        >
                            <PrimaryButtonComponent label="Submit" onClick={handleSubmit} disabled={!selectedButton && feedback === ""} />
                        </Stack>
            )}
        </div>
    );
};

export default Feedback;