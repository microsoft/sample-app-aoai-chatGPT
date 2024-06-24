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
                  marginBottom: 20,
                  borderRadius: 20,
                  border: "none",
                  minWidth: "auto",
                  maxWidth: "auto",
                  width: "calc(50% - 10px)",
                  '@media (max-width: 767px)': {
                    width: "100%"
                  },
                },
              }}
            >
              <Stack styles={{
                root: {
                  padding: "22px 20px 25px 20px", width: '100%', height: "100%",
                  '@media (max-width: 2500px) and (min-width: 1000px)': {
                    padding: 20
                  },
                }
              }}>
                <Stack.Item style={{ marginBottom: "15px" }}>
                  <Text styles={{
                    root: {
                      '@media (max-width: 2500px) and (min-width: 1000px)': {
                        fontWeight: '700',
                        fontSize: "24px",
                        lineHeight: "30px"
                      },
                      '@media (max-width: 600px)': {
                        fontWeight: '700', fontSize: "14px", lineHeight: "20px",
                      },
                      textAlign: 'left', padding: 0, color: '151B1E'
                    }
                  }}>{item.title}</Text>
                </Stack.Item>
                <Stack.Item >
                  <Text style={{ color: '#2D3F2B' }} styles={{
                    root: {
                      fontWeight: '600',
                      fontSize: "18px",
                      lineHeight: "28px",

                      '@media (max-width: 600px)': {
                        fontWeight: 500, fontSize: "14px", lineHeight: "20px",
                      },

                      '@media (max-width: 2500px) and (min-width: 1000px)': {
                        fontWeight: '600',
                        fontSize: "18px",
                        lineHeight: "28px"
                      },
                    }
                  }}>{item.detail}</Text>
                </Stack.Item>
              </Stack>
            </DocumentCard>
          )) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: "1.25rem", fontWeight: "bold" }}>No Value Props Found</Text>
            </div>
          )}
        </>)}
    </>
  );
};

export default FlashCard;