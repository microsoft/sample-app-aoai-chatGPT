import React, { useContext, useState } from 'react';
import { Text, Stack, TextField, PrimaryButton, DefaultButton, ITextFieldStyles, FontSizes } from '@fluentui/react';
import { useNavigate } from 'react-router-dom';
import styles from '../../pages/chat/Chat.module.css';
import { ThumbDislikeRegular, ThumbLikeRegular } from '@fluentui/react-icons';
import { sendFeedback } from '../../api';
import { AppStateContext } from '../../state/AppProvider';
 
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
        width: "100%",
        height:"300px",
        border: 'none',
        outline: 'none',
        backgroundColor: 'inherit',
    };
 
    const textFieldWrapperStyle: React.CSSProperties = {
        flex: 1,
        borderRadius: '25px',
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
        navigate("/");
    }
 
    const handleIconClick = (selectedValue: string): void => {
        setSelectedButton(selectedValue);
    }
 
    return (
        <div className={styles.chatContainer}>
            <Stack
                horizontalAlign="center"
                verticalAlign={"center"}
                styles={{
                    root: {
                        height: '100vh', marginTop: !showThankYou ? "0px" : "0px",
                        '@media (max-width: 1000px)': {
                            width: "100%",
                            padding: "0px 20px"
                        },
                        '@media (max-width: 1500px) and (min-width: 1000px)': {
                            width: "60%",
                        },
                        '@media (max-width: 2500px) and (min-width: 1500px)': {
                            width: "40%",
                        },
                    }
                }}
                tokens={{ childrenGap: 40 }}
            >
                {showThankYou ? (
                    <Stack tokens={{ childrenGap: 10 }} horizontalAlign="center" verticalAlign='center' >
                        <Text variant="xxLarge" style={{ color: "#FFFFFF", marginBottom: 20 }}
                            styles={{
                                root: {
                                    marginBottom:20,
                                    '@media (max-width: 600px)': {
                                        fontSize: "18px"
                                    },
                                    '@media (max-width: 1000px) and (min-width: 600px)': {
                                        fontSize: "24px"
                                    },
                                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                                        fontSize: "32px"
                                    },
                                }
                            }}
                        >Thank you for your response!</Text>
                        <PrimaryButton
                            styles={{
                                root: {
                                    '@media (max-width: 600px)': {
                                        height: "50px"
                                    },
                                    '@media (max-width: 1000px) and (min-width: 600px)': {
                                        height: "70px"
 
                                    },
                                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                                        height: "80px"
                                    },
                                },
                                label: {
                                    '@media (max-width: 1000px)': {
                                        fontSize: "0.875rem"
                                    },
                                    '@media (max-width: 1000px) and (min-width: 600px)': {
                                        fontSize: "1.25rem"
 
 
                                    },
                                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                                        fontSize: "24px"
                                    },
                                }
                            }}
                            style={{ width: "100%", borderRadius: 10, padding: 20, background: 'black', border: "none" }} onClick={handleNaviagte}>Go to Home</PrimaryButton>
                    </Stack>
                ) : (
                    <>
                        <Stack tokens={{ childrenGap: 10 }} horizontalAlign="center" style={{marginBottom:20}}>
                            <Text styles={{
                                root: {
                                    '@media (max-width: 1000px)': {
                                        fontSize: "18px"
 
                                    },
                                    '@media (max-width: 1000px) and (min-width: 600px)': {
                                        fontSize: "24px",
                                    },
                                    '@media (max-width: 1500px) and (min-width: 1000px)': {
                                        fontSize: "40px",
                                    },
                                    '@media (max-width: 2500px) and (min-width: 1500px)': {
                                        fontSize: "32px"
                                    },
                                }
                            }} style={{ color: "#EEE" }} variant="xLarge">Rate your experience</Text>
                        </Stack>
                        <Stack horizontal style={{ width: "100%" }} tokens={{ childrenGap: 15 }}>
                            <DefaultButton
                                styles={{
                                    root: {
                                        '@media (max-width: 1000px)': {
                                            height: "86px"
                                        },
                                        '@media (max-width: 2500px) and (min-width: 1000px)': {
                                            height: "150px"
                                        },
                                    }
                                }}
                                style={{ width: "50%", backgroundColor: selectedButton === "Like" ? "#629E57" : "#151B1E", borderRadius: "21px", padding: "50px", border: "none" }}
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
                                        style={{ color: selectedButton === "Like" ? "#000" : "#EEE", marginBottom: "8px" }}>Good</Text>
                                </Stack>
                            </DefaultButton>
                            <DefaultButton
                                styles={{
                                    root: {
                                        '@media (max-width: 1000px)': {
                                            height: "86px"
                                        },
                                        '@media (max-width: 2500px) and (min-width: 1000px)': {
                                            height: "150px"
                                        },
                                    }
                                }}
                                style={{ width: "50%", backgroundColor: selectedButton === "DisLike" ? "#F05A74" : "#151B1E", borderRadius: "21px", padding: "50px", border: "none" }}
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
                                        style={{ color: selectedButton === "DisLike" ? "#000" : "#EEE" }}>Improve</Text>
                                </Stack>
                            </DefaultButton>
                        </Stack>
                        <TextField
                            placeholder="Anything specific you would like to share?"
                            multiline
                            resizable={false}
                            rows={5}
                            value={feedback}
                            style={textFieldStyle}
                            onChange={handleFeedbackChange}
                            styles={{
                                root: {
                                    color: "#FFFFFF",
                                    width: "100%",
                                    overflow: 'hidden',
                                    background: "#232e34",
                                    borderRadius: 20,
                                    // ":hover": {
                                        border: "1px solid black"
                                    // }
                                },
                                fieldGroup: {
                                    borderRadius: '25px',
                                    backgroundColor: 'inherit',
                                    margin: "-2px",
                                    overflow: 'hidden',
                                    border: 'none',
                                },
                                field: {
                                    height: "200px",
                                    lineHeight: "1.6em",
                                    color: "white",
                                    '@media (max-width: 1000px)': {
                                        fontSize: "14px"
                                    },
                                    '@media (max-width: 1500px) and (min-width: 1000px)': {
                                        fontSize: "28px",
                                        marginLeft: 10
                                    },
                                    '@media (max-width: 2500px) and (min-width: 1500px)': {
                                        fontSize: "24px",
                                        marginLeft: 10
                                    },
                                    padding: 20, selectors: {
                                        '::placeholder': {
                                            color: '#7c909b'
                                        }
                                    }
                                },
                            }}
                        />
                        <Stack
                            horizontalAlign='center'
                            style={{ height: "10%", width: '100%' }}
                            styles={{
                                root: {
                                    flexWrap: "wrap",
                                    '@media (max-width: 1000px)': {
                                        width: "100%",
                                    },
                                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                                        width: "50%",
                                    },
                                }
                            }}
                        >
                            <PrimaryButton
                                styles={{
                                    root: {
                                        fontSize: "0.875rem",
                                        '@media (max-width: 600px)': {
                                            height: "50px",
                                        },
                                        '@media (max-width: 1000px) and (min-width: 600px)': {
                                            height: "70px",
                                        },
                                        '@media (max-width: 2500px) and (min-width: 1000px)': {
                                            height: "80px",
                                        },
                                    },
                                    label: {
                                        '@media (max-width: 1000px) and (min-width: 600px)': {
                                            fontSize: "20px",
                                        },
                                        '@media (max-width: 2500px) and (min-width: 1000px)': {
                                            fontSize: "24px",
                                        },
                                    }
                                }}
                                disabled={!selectedButton && feedback === ""} style={{ width: "100%", fontSize: "0.875rem", borderRadius: 10, padding: 20, background: 'black', border: "none" }} onClick={handleSubmit}>Submit</PrimaryButton>
                        </Stack>
                    </>)}
            </Stack>
        </div>
    );
};
 
export default Feedback;