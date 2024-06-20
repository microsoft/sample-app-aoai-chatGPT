import React, { useContext } from 'react';
import { DocumentCard, DocumentCardTitle, DocumentCardDetails, Stack, Text, Spinner } from '@fluentui/react';
import { AppStateContext } from '../../state/AppProvider';
 
const FlashCard: React.FC = () => {
  const appStateContext = useContext(AppStateContext);
  const valuesProps = appStateContext?.state?.valuePropositions
  const isLoading = appStateContext?.state?.isLoadingValuePropositions
 
  return (
    <>
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <Spinner styles={{ circle: { height: 40, width: 40, border: "2px solid #FFFFFF" }, label: { color: "#FFFFFF", fontSize: "1rem" } }} label="Loading Value Propositions..." />
        </div>
      ) : (
        <>
          {valuesProps && valuesProps?.length > 0 ? valuesProps.map((item, index) => (
            <DocumentCard
              key={index}
              styles={{
                root: {
                  backgroundColor: '#75ac51',
                  width: '100%',
                  maxWidth: '100%',
                  height:"fit-content",
                  '@media (max-width: 2500px) and (min-width: 600px)': {
                    minHeight: "150px",
                    marginBottom: 10
                  },
                  '@media (max-width: 600px)': {
                    //marginTop: index===0 ?"30px":0
                    marginBottom: 10
                  },
                  minWidth: '200px',
                  borderRadius: 20,
                  border: "none"
                },
              }}
            >
              <Stack styles={{
                root: {
                  padding: "22px 20px 25px 20px", width: '100%', height: "100%",
                  '@media (max-width: 2500px) and (min-width: 1000px)': {
                    padding: 30
                  },
                }
              }}>
                <Stack.Item style={{marginBottom: "15px"}}>
                  <Text styles={{
                    root: {
                      '@media (max-width: 1000px) and (min-width: 600px)': {
                        fontWeight: '800',
                        fontSize: "28px",
                        lineHeight:30,
                      },
                      '@media (max-width: 2500px) and (min-width: 1000px)': {
                        fontWeight: '700',
                        fontSize: "28px",
                        lineHeight:"20px"
                      },
                      fontWeight: '700', fontSize: "14px", lineHeight: "20px", textAlign: 'left', padding: 0, color: '151B1E'
                    }
                  }}>{item.title}</Text>
                </Stack.Item>
                <Stack.Item >
                  <Text style={{ color: '#2D3F2B' }} styles={{
                    root: {
                      fontWeight: 500, fontSize: "14px", lineHeight: "20px",
                      '@media (max-width: 1000px) and (min-width: 600px)': {
                        fontWeight: '500',
                        fontSize: "28px",
                        lineHeight:30,
                      },
 
                      '@media (max-width: 2500px) and (min-width: 1000px)': {
                        fontWeight: '600',
                        fontSize: "28px",
                        lineHeight: "30px"
                      },
                    }
                  }}>{item.detail}</Text>
                </Stack.Item>
              </Stack>
            </DocumentCard>
          )) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: "1.25rem", fontWeight: "bold" }}>No Value Props Found</Text>
            </div>
          )}
        </>)}
    </>
  );
};
 
export default FlashCard;