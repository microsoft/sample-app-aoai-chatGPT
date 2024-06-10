import { DefaultButton, IconButton, PrimaryButton, Stack, Text } from '@fluentui/react';
import React, { useEffect, useState } from 'react';
import styles from '../../pages/chat/Chat.module.css'
import { useNavigate } from 'react-router-dom';

interface DummyDataItem {
    id: string;
    heading: string;
    values: string[];
}

const dummydata: DummyDataItem[] = [
    {
        id: '1',
        heading: "Who?",
        values: ['Family Options', 'Solo', 'Social', 'Friends', 'Others', 'Social', 'Friends', 'Others']
    },
    {
        id: '2',
        heading: "Where?",
        values: ['Ocean', 'Lakes', 'Both', 'Rivers']
    },
    {
        id: '3',
        heading: "Activities",
        values: ['Active', 'Chill', 'Both', 'Extreme']
    },
    {
        id: '4',
        heading: "Product",
        values: ['Tahoe', 'Regency', 'Suntracker']
    },
];
interface SelectedTag {
    item: DummyDataItem;
    value: string;
}
const InputLevel2: React.FC = () => {
    const [showMore, setShowMore] = useState<{ [key: string]: boolean }>({});
    const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
    const navigate = useNavigate()
    const handleTagSelection = (item: DummyDataItem, value: string) => {
        const tag: SelectedTag = { item, value };
        setSelectedTags(prevTags => {
            if (prevTags.some(tag => tag.value === value && tag.item.id === item.id)) {
                return prevTags.filter(tag => !(tag.value === value && tag.item.id === item.id));
            } else {
                return [...prevTags, tag];
            }
        });
    };

    const buttonBackgroundColors = ['#3d5a80', '#e5e5e5', '#293241', '#177389'];

    const toggleShowMore = (heading: string) => {
        setShowMore(prevState => ({ ...prevState, [heading]: !prevState[heading] }));
    };

    const handleNextClick = (): void => {
        const hasProductTag = selectedTags.some(tag => tag.item.heading === "Product");
        if (hasProductTag) {
            navigate("/productInfo")
        } else {
            navigate("/recommendations")
        }
    }

    return (
        <div className={styles.chatContainer}>
            <Stack
                verticalAlign="center"
                horizontalAlign="center"
                styles={{ root: { height: 'calc(100vh - 100px)', marginBottom: 20 } }}
            >
                <Stack
                    tokens={{ childrenGap: 20 }}
                    styles={{ root: { width: '100%', padding: 20, flexWrap: "wrap" } }}
                >
                    {dummydata.map((item, rowIndex) => (
                        <React.Fragment key={item.heading}>
                            <Stack>
                                <Text variant="large">{item.heading}</Text>
                            </Stack>
                            <Stack horizontal wrap tokens={{ childrenGap: 10 }} styles={{ root: { gap: 10 } }}>
                                {item.values.slice(0, showMore[item.heading] ? item.values.length : 5).map((value, index) => (
                                    <Stack.Item key={index} grow={1} styles={{ root: { width: "0%" } }}>
                                        <DefaultButton
                                            style={{
                                                height: "50px",
                                                width: "100%",
                                                minWidth: "100%",
                                                backgroundColor: selectedTags.some(tag => tag.value === value && tag.item.id === item.id) ? 'rgb(38, 173, 56)' : buttonBackgroundColors[rowIndex % buttonBackgroundColors.length],
                                                color:rowIndex!==1?  '#FFFFFF':'#000000',
                                                borderRadius:10
                                            }}
                                            onClick={() => handleTagSelection(item, value)}
                                        >
                                            {value}
                                        </DefaultButton>
                                    </Stack.Item>
                                ))}
                                {item.values.length > 5 && (
                                    <Stack.Item grow={1} styles={{ root: { width: "0%" } }}>
                                        <IconButton
                                            iconProps={{ iconName: showMore[item.heading] ? 'CalculatorSubtract' : 'Add' }}
                                            title={showMore[item.heading] ? 'View Less' : 'View More'}
                                            ariaLabel={showMore[item.heading] ? 'View Less' : 'View More'}
                                            onClick={() => toggleShowMore(item.heading)}
                                            styles={{
                                                root: {
                                                    height: "50px",
                                                    width: "100%",
                                                    backgroundColor: buttonBackgroundColors[rowIndex % buttonBackgroundColors.length],
                                                    color: '#FFFFFF',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: 10

                                                }
                                            }}
                                        />
                                    </Stack.Item>
                                )}
                            </Stack>
                        </React.Fragment>
                    ))}
                    <PrimaryButton disabled={selectedTags?.length===0} onClick={() => handleNextClick()}>Next</PrimaryButton>
                </Stack>
            </Stack>
        </div>
    );
};

export default InputLevel2;
