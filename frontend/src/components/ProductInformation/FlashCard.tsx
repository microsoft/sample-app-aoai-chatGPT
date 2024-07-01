import React, { useContext } from 'react';
import { DocumentCard, DocumentCardTitle, DocumentCardDetails, Stack, Text, Spinner } from '@fluentui/react';
import { AppStateContext } from '../../state/AppProvider';
import loading from "../../assets/loader.gif";

const FlashCard: React.FC = () => {
  const appStateContext = useContext(AppStateContext);
  const valuesProps = appStateContext?.state?.valuePropositions
  const isLoading = appStateContext?.state?.isLoadingValuePropositions

  return (
    <>
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <img src={loading} alt="Logo" className="logo" style={{opacity:"0.3",width:"300px"}} />
        </div>
      ) : (
        <>
          {valuesProps && valuesProps?.length > 0 && valuesProps.map((item, index) => (
            <DocumentCard
              key={index}
              styles={{
                root: {
                  backgroundColor: '#75ac51',
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
                  padding: "20px 20px 20px 20px", width: '100%', height: "100%",
                  '@media (max-width: 2500px) and (min-width: 1000px)': {
                    padding: 20
                  },
                }
              }}>
                <Stack.Item >
                  <Text styles={{
                    root: {
                      '@media (max-width: 2500px) and (min-width: 1000px)': {
                        fontWeight: '700',
                        fontSize: "18px",
                        lineHeight: "26px",
                        marginBottom: "8px",
                        display:'block',
                      },
                      '@media (max-width: 1000px) and (min-width: 600px)': {
                        fontWeight: '700',
                        fontSize: "18px",
                        lineHeight: "22px",
                        marginBottom: "8px",
                        display:'block'

                      },
                      '@media (max-width: 600px)': {
                        marginBottom: "12px",
                        fontWeight: '700', fontSize: "16px", lineHeight: "20px",
                      },
                      textAlign: 'left', padding: 0, color: '151B1E'
                    }
                  }}>{item.title}</Text>
                </Stack.Item>
                <Stack.Item >
                  <Text style={{ color: '#2D3F2B' }} styles={{
                    root: {
                      fontWeight: '500',
                      fontSize: "18px",
                      lineHeight: "25px",

                      '@media (max-width: 600px)': {
                        fontWeight: 500, fontSize: "16px", lineHeight: "20px",
                      },

                      '@media (max-width: 2500px) and (min-width: 1000px)': {
                        fontWeight: '500',
                        fontSize: "16px",
                        lineHeight: "24px"
                      },
                    }
                  }}>{item.detail}</Text>
                </Stack.Item>
              </Stack>
            </DocumentCard>
          ))}
        </>)}
    </>
  );
};

export default FlashCard;