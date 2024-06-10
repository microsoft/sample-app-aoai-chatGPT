import React, { useContext, useEffect, useState } from 'react';
import { Text, Stack, DefaultButton, Image, Spinner, PrimaryButton } from '@fluentui/react';
import styles from '../../pages/chat/Chat.module.css'
import { useNavigate } from 'react-router-dom';
import { AppStateContext } from '../../state/AppProvider';
import { getRecommendations } from '../../api';

const About: React.FC = () => {
    const navigate = useNavigate();
    const appStateContext = useContext(AppStateContext);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const dummyData = appStateContext?.state?.recommendation;
    const isLoading = appStateContext?.state?.isLoadingRecommendations;
    const promptValue = appStateContext?.state?.promptvalue

    const fetch = async () => {
        try {
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: true })
            const response = getRecommendations({ question: promptValue })
            const data = {
                "output": "{\"value_propositions\": [{\"title\": \"REGENCY 250 LE3 Sport\", \"detail\": \"Offers a luxurious and comfortable experience for a crew of 14, perfect for watersports with its 350-horsepower rating and ski tow pylon.\"}, {\"title\": \"TAHOE 2150\", \"detail\": \"Combines spacious luxury with sporting capability, also featuring the POWERGLIDE\® hull and ski tow pylon, ideal for families enjoying watersports.\"}, {\"title\": \"Sun Tracker Sportfish\", \"detail\": \"A versatile option that combines a fishing boat's utility with the comfort of a party barge, perfect for Lake George outings.\"}]}"
            }

            const parsedData = JSON.parse(data?.output);
            const actuallRecommendations = parsedData?.value_propositions
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_STATE', payload: actuallRecommendations })
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: false })
            appStateContext?.dispatch({ type: 'SET_CONVERSATION_ID', payload: 0 })
        } catch (error) {
            appStateContext?.dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: false })
        }
    }

    useEffect(() => {
        fetch()
    }, [])

    const handleBoatSelection = (item: any): void => {
        setSelectedItem(item);
    }
    console.log({ selectedItem })
    const handleNextClick = (): void => {
        if (selectedItem) {
            appStateContext?.dispatch({ type: 'SET_SELECTED_BOAT', payload: selectedItem?.title })

            navigate("/productInfo");


        }
    }

    return (
        <div className={styles.chatContainer}>
            {isLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Spinner label="Loading recommendations..." />
                </div>
            ) : (
                <Stack
                    horizontalAlign="center"
                    styles={{ root: { height: '90vh', marginTop: 20 } }}
                >
                    <Stack
                        tokens={{ childrenGap: 20 }}
                        styles={{ root: { width: '100%', padding: 20, marginTop: 10 } }}
                    >
                        {dummyData && dummyData.length > 0 && (
                            <Text style={{ color: "white", marginBottom: 20 }} variant="xLarge">Top Recommendations for this store</Text>
                        )}
                        {dummyData && dummyData.length > 0 && dummyData.map((item, index) => (
                            <DefaultButton key={index} styles={{ root: { width: '100%', height: "100%", padding: "10px 10px", maxHeight: 150, borderRadius: 30, opacity: selectedItem === item ? 1 : 0.8, backgroundColor: selectedItem === item ? "#FFFFFF" : "#d0d0d0" } }} onClick={() => handleBoatSelection(item)}>
                                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }} style={{ width: "100%" }}>
                                    <Image
                                        src={"https://images.unsplash.com/photo-1495433324511-bf8e92934d90"}
                                        alt={item.title}
                                        width={"30%"}
                                        height={100}
                                        styles={{ root: { borderRadius: '30%' } }}
                                    />

                                    <Stack tokens={{ childrenGap: 10 }} style={{ display: "flex", alignItems: "start", justifyContent: "center", textAlign: "initial", width: "70%" }}>
                                        <Text style={{ fontWeight: "bold" }} variant="large">{item.title}</Text>
                                        <Text >{item.detail}</Text>
                                    </Stack>
                                </Stack>
                            </DefaultButton>
                        ))}
                    </Stack>
                    {dummyData && dummyData.length === 0 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            <Text style={{ fontWeight: "bold", color: "#FFFFFF" }} variant="xLarge" >No Recommendations found</Text>
                        </div>
                    )}
                </Stack>
            )}
            <Stack
                tokens={{ childrenGap: 20 }}
                horizontalAlign='center'
                style={{ height: "10%", position: "fixed", bottom: 0 }}
                styles={{ root: { width: '100%', padding: 20, flexWrap: "wrap" } }}
            >
                <PrimaryButton style={{ width: "100%", height: "50px", fontSize: "0.875rem", borderRadius: 10, padding: 20, background: selectedItem ? "black" : "#191A1B", opacity: selectedItem ? 1 : 0.5, border: "none" }} onClick={handleNextClick}>Submit</PrimaryButton>
            </Stack>
        </div>
    );
};

export default About;
