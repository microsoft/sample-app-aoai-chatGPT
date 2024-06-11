import { DefaultButton, Stack, Text } from '@fluentui/react';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { dummydata } from '../../constants/dummydata';
import { CategoryItem, ChildItem } from '../../types/DummyDataItem';
import CustomTextField from '../CustomTextField';
import CustomIconButton from '../CustomIconButton';
import { useNavigate } from 'react-router-dom';
import { AppStateContext } from '../../state/AppProvider';
import template from '../../constants/templete';

const Home: React.FC = () => {

    const appStateContext = useContext(AppStateContext)
    const [inputValue, setInputValue] = useState<string>('');
    const [isTextFieldFocused, setIsTextFieldFocused] = useState<boolean>(false);
    const [showMore, setShowMore] = useState<{ [key: string]: boolean }>({});
    const [selectedKeys, setSelectedKeys] = useState<{ key: string, value: string, type: 'parent' | 'child',promptValue:string }[]>([]);

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
                        updatedTags[key].splice(categoryIndex, 1, ...childTags);
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

    return (
        <Stack
            horizontalAlign="center"
            styles={{root:{
                '@media (max-width: 1000px)': {
                    width:"100%"
                },
                '@media (max-width: 2500px) and (min-width: 1000px)': {
                    width:"50%"
                },
            }}}
            style={{
                // width: "100%",
                height: "100%",
                padding: "0px 20px 0px 20px",
            }}
        >
            <Stack
                tokens={{ childrenGap: 20 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "80%",
                    maxHeight: "80%",
                    width: "100%",
                    marginTop: 50,
                    opacity: isTextFieldFocused ? 0 : 1,
                    overflowY: "auto",
                    position: "relative"
                }}
            >
                {!isTextFieldFocused && Object.keys(tags).map((key) => (
                    <React.Fragment key={key}>
                        <Stack horizontalAlign='start' style={{ width: "100%" }}>
                            <Text
                                style={{
                                    color: "rgba(255, 255, 255, 0.40)",
                                    textTransform: "capitalize",
                                    marginLeft: 14,
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    fontStyle:"normal",
                                    lineHeight:"20px"
                                }}
                                variant="medium"
                            >
                                {key === "who" || key === "where" ? `${key}?` : key}
                            </Text>
                        </Stack>
                        <Stack
                            horizontal
                            style={{
                                width: "100%",
                                display: "block",
                                alignItems: "flex-start",
                                justifyContent: "flex-start",
                                marginBottom: 10,
                                marginTop: 2,
                                flexWrap: 'wrap'
                            }}
                        >
                            {tags[key].slice(0, showMore[key] ? tags[key]?.length : 5).map((tag, index) => (
                                <Stack.Item key={index} grow={1} disableShrink styles={{
                                    root: {
                                        marginLeft: "12px",
                                        marginRight: 5,
                                        marginTop: "12px",
                                        '@media (max-width: 1000px)': {
                                            display: "inline-table"
                                        },
                                        '@media (max-width: 2500px) and (min-width: 1000px)': {
                                            display: "inline-table"
                                        },
                                    }
                                }}>
                                    <DefaultButton
                                        style={{
                                            height: "42px",
                                            padding: "0px 14px",
                                            backgroundColor: selectedKeys.some(selected => selected.value === tag && selected.key === key) ? "#264653" : '#151B1E',
                                            color: "#FFFFFF",
                                            fontSize: "14px",
                                            border: "none",
                                            fontWeight: 500,
                                            lineHeight:"20px",
                                            borderRadius: "12px",
                                            whiteSpace: "nowrap",
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
            <Stack
                tokens={{ childrenGap: 20 }}
                horizontalAlign='center'
                styles={{root:{
                    '@media (max-width: 1000px)': {
                        width: "100%",
                    },
                    '@media (max-width: 2500px) and (min-width: 1000px)': {
                        width: "50%",
                    },
                }}}
                style={{
                    position: "fixed",
                    zIndex: 99999,
                    display: "flex",
                    flexDirection: isTextFieldFocused ? "column" : "row",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "15%",
                    bottom: isTextFieldFocused ? 80 : 0,
                    padding: "0px 20px"
                }}
            >
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
                {!isTextFieldFocused &&
                    <CustomIconButton onButtonClick={handleSubmit} disabled={buttonDisabled} />
                }
            </Stack>
        </Stack>
    );
};

export default Home;
