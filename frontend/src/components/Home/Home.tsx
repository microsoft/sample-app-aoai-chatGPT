import { DefaultButton, Stack, Text } from '@fluentui/react';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { dummydata } from '../../constants/dummydata';
import { CategoryItem, ChildItem } from '../../types/DummyDataItem';
import CustomTextField from '../CustomTextField';
import CustomIconButton from '../CustomIconButton';
import { useNavigate } from 'react-router-dom';
import { AppStateContext } from '../../state/AppProvider';
import template from '../../constants/templete';
import style from "./Home.module.css"
import Chip from '../Chip';

const Home: React.FC = () => {

    const appStateContext = useContext(AppStateContext)
    const [inputValue, setInputValue] = useState<string>('');
    const [isTextFieldFocused, setIsTextFieldFocused] = useState<boolean>(false);
    const [showMore, setShowMore] = useState<{ [key: string]: boolean }>({});
    const [selectedKeys, setSelectedKeys] = useState<{ key: string, value: string, type: 'parent' | 'child', promptValue: string }[]>([]);

    const navigate = useNavigate();
    const [tags, setTags] = useState<{ [key: string]: string[] }>(() => {
        const initialTags: { [key: string]: string[] } = {};
        for (const [key, value] of Object.entries(dummydata)) {
            if (key !== "id") {
                const categories = value.map((item: any) => item.category);
                initialTags[key] = categories;
            }
        }
        return initialTags;
    });

    const handleGroupSelection = (key: string, tag: string) => {
        if (Object.keys(dummydata).includes(key)) {
            const categoryArray = (dummydata as any)[key];
            const selectedCategory = categoryArray.find((categoryItem: CategoryItem) => categoryItem.category === tag && categoryItem?.child?.length > 0);

            setTags(prevTags => {
                const updatedTags = { ...prevTags };

                if (selectedCategory) {
                    const categoryIndex = updatedTags[key].indexOf(tag);
                    if (categoryIndex !== -1) {
                        const childTags = selectedCategory.child.map((child: ChildItem) => Object.keys(child)[0]);
                        updatedTags[key] = [...childTags];
                    }
                }

                return updatedTags;
            });

            const type = selectedCategory || key === "prioritize" ? 'parent' : 'child';
            const existingIndex = selectedKeys.findIndex(item => item.key === key && item.value === tag);
            let promptValue: string;
            if (type === "child") {
                const matchingChild = categoryArray.reduce((result: string | undefined, categoryItem: CategoryItem) => {
                    if (result) return result;
                    const matchingChild = categoryItem.child.find((child: ChildItem) => Object.keys(child)[0] === tag);
                    if (matchingChild) {
                        promptValue = Object.values(matchingChild)[0];
                        return Object.values(matchingChild)[0];
                    }
                    return result;
                }, undefined);
            }
            if (existingIndex !== -1) {
                setSelectedKeys(prevKeys => prevKeys.filter((_, index) => index !== existingIndex));
            } else {
                setSelectedKeys(prevKeys => [
                    ...prevKeys,
                    { key, value: tag, type, promptValue: promptValue }
                ]);
            }
        }
    };

    const toggleShowMore = (heading: string) => {
        setShowMore(prevState => ({
            ...prevState,
            [heading]: !prevState[heading]
        }));
    };

    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };


    const processTemplate = () => {
        let result = '';

        (Object.keys(template) as (keyof typeof template)[]).forEach((key) => {
            const parentKeys = selectedKeys.filter(item => item.key === key && item.type === 'parent');
            const childKeys = selectedKeys.filter(item => item.key === key && item.type === 'child');

            let processedValue = template[key];

            if (parentKeys.length > 0) {
                const parentValues = parentKeys.map(item => item.value).filter(Boolean).join(', ');
                processedValue = processedValue.replace(`[${capitalizeFirstLetter(key)} Level 1]`, parentValues);
            }

            const validChildKeys = childKeys.filter(item => item.promptValue);
            if (validChildKeys.length > 0) {
                const children = validChildKeys.map(item => item.promptValue).join(', ');
                processedValue = processedValue.replace(`[${capitalizeFirstLetter(key)} Level 2]`, children);
            } else {
                const level2Placeholder = `[${capitalizeFirstLetter(key)} Level 2]`;
                processedValue = processedValue.replace(`, including ${level2Placeholder}`, '');
                processedValue = processedValue.replace(`, specially ${level2Placeholder}`, '');
                processedValue = processedValue.replace(`with ${level2Placeholder}`, '');
            }

            if (parentKeys.length > 0 || validChildKeys.length > 0) {
                result += processedValue.trim() + ' ';
            }
        });

        result += "What are the top 3 boat models we should recommend?";

        return result.trim();
    };

    useEffect(() => {
        const processedTemplate = processTemplate();
        if (processedTemplate.trim() !== "" && selectedKeys?.length > 0) {
            setInputValue(processedTemplate);
        }
    }, [selectedKeys]);

    const buttonDisabled = useMemo(() => {
        return selectedKeys?.length === 0;
    }, [selectedKeys, inputValue]);

    const handleSubmit = () => {
        appStateContext?.dispatch({ type: 'SET_PROMPT_VALUE', payload: inputValue })
        navigate("/recommendations");
    };

    const handleRemove = (selectedKey: string) => {
        setSelectedKeys(selectedKeys.filter(item => item.key !== selectedKey));
        setTags(prevTags => {
            const updatedTags = { ...prevTags };
            for (const [key, value] of Object.entries(dummydata)) {
                if (key === selectedKey && key !== "id") {
                    const categories = value?.map((item: any) => item.category);
                    updatedTags[key] = categories;
                }
            }
            return updatedTags;
        });
    };

    const resetAllClick = () => {
        setTags(() => {
            const initialTags: { [key: string]: string[] } = {};
            for (const [key, value] of Object.entries(dummydata)) {
                if (key !== "id") {
                    const categories = value.map((item: any) => item.category);
                    initialTags[key] = categories;
                }
            }
            return initialTags;
        });
        setSelectedKeys([]);
    }

    const focusinputField={
        '@media (max-width: 600px)': {
            width:"100% !important"

        },
    }
    return (
        <Stack
            horizontalAlign='center'
            styles={{
                root: {
                    // height: "100vh",
                    width: "100%",
                    overflowY: "auto",
                    height: "calc(100vh - 150px)",
                    padding: "50px 0 0",
                    '@media (max-width: 600px)': {
                        height: "calc(100vh - 120px)",

                    },

                }
            }}
        >
            <Stack
                // horizontalAlign="center"
                styles={{
                    //display:flex removed height auto removed ,width auto removed align items removed box sizing removed
                    root: {
                        '@media (max-width: 600px)': {
                            width: "100%"
                        },
                        '@media (max-width: 1000px) and (min-width: 600px)': {
                            width: "80%"
                        },
                        '@media (max-width: 1500px) and (min-width: 1000px)': {
                            width: "80%"
                        },
                        '@media (max-width: 2500px) and (min-width: 1500px)': {
                            width: "60%",
                        },
                    }
                }}
                style={{
                    padding: "0px 20px 0px 20px",
                }}
            >
                <Stack
                    tokens={{ childrenGap: 10 }}
                    styles={{
                        root: {
                        opacity:isTextFieldFocused ?0.2 :1,

                            '@media (max-width: 2500px) and (min-width: 600px)': {
                                justifyContent: "center",
                                marginTop: 0
                            },
                        }
                    }}
                >
                    {Object.keys(tags).map((key) => (
                        <React.Fragment key={key}>
                            <Stack horizontalAlign='start' styles={{
                                root: {
                                    '@media (max-width: 2500px)': {
                                        marginBottom: 12
                                    },
                                    width: "100%"
                                }
                            }}
                            >
                               {key === "who" && <div className={style.resetAll} onClick={() => resetAllClick()}>Reset</div>}
                                <Text
                                    styles={{
                                        root: {
                                            '@media (max-width: 600px)': {
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                fontStyle: "normal",
                                                display: "block"
                                            },
                                            '@media (max-width: 1000px) and (min-width: 600px)': {
                                                fontSize: "26px",
                                                fontWeight: "500",
                                                fontStyle: "normal",
                                                display: "block"
                                            },
                                            '@media (max-width: 2500px) and (min-width: 1000px)': {
                                                fontSize: "32px",
                                                fontWeight: "500",
                                                fontStyle: "normal",
                                                display: "block"
                                            },
                                        }
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems:"center",
                                        width: "100%",
                                        color: "rgba(255, 255, 255, 0.40)",
                                        textTransform: "capitalize",
                                        marginLeft: 14,
                                    }}
                                    variant="medium"
                                >
                                    <div style={{ width: "80%" }}>
                                        {key === "who" || key === "where" ? `${key}?` : key}
                                        {key !== "prioritize" && selectedKeys.filter(item => item.type === 'parent' && item.key === key).map(item => (
                                            <Chip
                                                key={item.key}
                                                label={item.value}
                                                onRemove={() => handleRemove(item.key)}
                                            />
                                        ))}
                                    </div>
                                </Text>
                            </Stack>
                            <Stack
                                horizontal
                                styles={{
                                    root: {
                                        '@media (max-width: 600px)': {
                                            display: '-webkit-inline-box',
                                    marginBottom: "35px"

                                        },
                                        '@media (max-width: 2500px) and (min-width: 600px)': {
                                            display: '-webkit-inline-box',
                                            marginBottom: "50px"

                                        },
                                    }
                                }}
                                style={{
                                    marginTop:0,
                                    width: "100%",
                                    gap: "14px",
                                    flexWrap: 'wrap',
                                }}
                            >
                                {tags[key].slice(0, showMore[key] ? tags[key]?.length : 5).map((tag, index) => (
                                    <Stack.Item key={index} grow={1} disableShrink  styles={{
                                        root: {
                                            marginLeft: "12px",
                                            marginRight: 5,
                                            '@media (max-width: 600px)': {
                                                // display: "inline-table",
                                                width: "calc(33.3333% - 10px)",
                                                marginLeft: "0px",
                                                marginRight: 0,
                                            },
                                            // '@media (max-width: 1000px) and (min-width: 700px)': {
                                            //     maxWidth: "33%",
                                            //     marginBottom: 0
                                            // },
                                            '@media (max-width: 2500px) and (min-width: 600px)': {
                                                width: "calc(33.3333% - 27px)",
                                                marginBottom: 0
                                            },
                                        }
                                    }}>
                                        <DefaultButton
                                            styles={{
                                                root: {
                                                    '@media (max-width: 600px)': {
                                                        height: "50px",
                                                        fontSize: "14px",
                                                        width: "100%",

                                                        fontWeight: 500,
                                                    },
                                                    '@media (max-width: 1000px) and (min-width: 600px)': {
                                                        width: "100%",
                                                        height: "80px",
                                                        fontSize: "20px",

                                                    },
                                                    '@media (max-width: 1500px) and (min-width: 1000px)': {
                                                        width: "100%",
                                                        height: "80px",
                                                    },
                                                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                                                        height: "100px",
                                                        width: "100%",
                                                        fontSize: "30px",
                                                        fontWeight: 400,
                                                    },
                                                },
                                                label: {
                                                    // // whiteSpace: "normal", // Add this line
                                                    // wordWrap: "break-word", // Add this line
                                                    // textAlign: "center",
                                                }
                                            }}
                                            style={{
                                                padding: "0px 15px",
                                                backgroundColor:selectedKeys.some(selected => selected.value === tag && selected.key === key) ? "#629E57" : '#151B1E',
                                                color:selectedKeys.some(selected => selected.value === tag && selected.key === key) ? "#000000":"#FFFFFF",
                                                border: "none",
                                                lineHeight: "20px",
                                                borderRadius: "12px",
                                                // whiteSpace: "nowrap",
                                            }}
                                            onClick={() => typeof tag === 'string' && handleGroupSelection(key, tag)}
                                        >
                                            {tag}
                                        </DefaultButton>
                                    </Stack.Item>
                                ))}
                                {tags[key].length > 5 && (
                                    <Stack.Item grow={1}
                                        disableShrink
                                        styles={{
                                            root: {
                                                minWidth: "90px",
                                                maxWidth: "90px",
                                                marginLeft: 10,
                                                marginTop: 10,
                                                display: "inline-table"
                                            }
                                        }}>
                                        <DefaultButton
                                            styles={{
                                                root: {
                                                    height: "50px",
                                                    backgroundColor: 'transparent',
                                                    color: "#819188",
                                                    border: "1px solid black",
                                                    borderRadius: 10
                                                }
                                            }}
                                            onClick={() => toggleShowMore(key)}
                                        >
                                            {showMore[key] ? "Less" : "More"}
                                        </DefaultButton>
                                    </Stack.Item>
                                )}
                            </Stack>
                        </React.Fragment>
                    ))}
                </Stack>

            </Stack>
            <div style={{
                width: "100%",
                zIndex: 99999,
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                bottom: 20,
                padding: "0px 20px"
            }}>
                <Stack
                    tokens={{ childrenGap: 20 }}
                    horizontalAlign='center'
                    styles={{
                        root: {
                            width: "100%",
                            '@media (max-width: 1000px)': {
                                width: "100%",
                                padding: isTextFieldFocused ? "0px" : "0px",
                                bottom: isTextFieldFocused ? 80 : 0,
                                paddingBottom: 20
                            },
                            '@media (max-width: 1500px) and (min-width: 1000px)': {
                                width: "80%",
                                padding: "10px 5px",
                                bottom: isTextFieldFocused ? 120 : 0,
                            },
                            '@media (max-width: 2500px) and (min-width: 1500px)': {
                                width: "60%",
                                padding: "10px 5px",
                                bottom: isTextFieldFocused ? 120 : 0,
                            },
                            '@media (max-width: 2000px) and (min-width: 1500px)': {
                                width: "60%",
                            },
                            '@media (max-width: 600px)': {
                                width: "100%"
                            },
                            '@media (max-width: 1000px) and (min-width: 600px)': {
                                width: "80%"
                            },

                        }
                    }}
                    style={{
                        position: "sticky",
                        zIndex: 99999,
                        display: "flex",
                        flexDirection: isTextFieldFocused ? "column" : "row",
                        alignItems: "center",
                        justifyContent: "center",
                        // height: "15%",
                    }}
                >
                    <div className={style.inputContainer} >
                        <CustomTextField
                            placeholder='Anything else?'
                            allowBorder={false}
                            text={inputValue}
                            setText={setInputValue}
                            isButtonRequired={isTextFieldFocused}
                            onFocus={() => setIsTextFieldFocused(true)} // Set focused state on focus
                            onBlur={() => setIsTextFieldFocused(false)}
                            isTextFieldFocused={isTextFieldFocused} // Remove focused state on blur
                        />
                    </div>
                    <div className={style.buttonContainer}>
                        {!isTextFieldFocused &&
                            <CustomIconButton onButtonClick={handleSubmit} disabled={buttonDisabled} />
                        }
                    </div>
                </Stack>
            </div>
        </Stack>
    );
};

export default Home;
