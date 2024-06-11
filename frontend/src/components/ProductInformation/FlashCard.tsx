import React, { useContext } from 'react';
import { DocumentCard, DocumentCardTitle, DocumentCardDetails, Stack, Text, Spinner } from '@fluentui/react';
import { AppStateContext } from '../../state/AppProvider';

const FlashCard: React.FC = () => {
  const appStateContext = useContext(AppStateContext);
  const valuesProps=appStateContext?.state?.valuePropositions
  const isLoading=appStateContext?.state?.isLoadingValuePropositions

  return (
    <>
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <Spinner styles={{circle:{height:40,width:40,border:"2px solid #FFFFFF"},label:{color:"#FFFFFF",fontSize:"1rem"}}} label="Loading Value Propositions..." />
        </div>
      ) : (
        <>
          {valuesProps && valuesProps?.length>0 ? valuesProps.map((item, index) => (
            <DocumentCard
              key={index}
              styles={{
                root: {
                  backgroundColor: '#75ac51',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '200px',
                  borderRadius: 20,
                  border:"none"
                },
              }}
            >
              <Stack styles={{ root: { padding: "22px 20px 25px 20px", width: '100%' } }}>
                <Stack.Item>
                  <DocumentCardTitle title={item.title} styles={{ root: { fontWeight: '700', lineHeight:"20px",textAlign: 'left', padding: 0, height: 20, color: 'white', fontSize: "16px", whiteSpace: "nowrap", textOverflow: "ellipsis" } }} />
                </Stack.Item>
                <Stack.Item grow>
                  <DocumentCardDetails styles={{ root: { marginTop: 11 } }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.75)',fontWeight:500,fontSize:"14px",lineHeight:"20px" }}>{item.detail}</Text>
                  </DocumentCardDetails>
                </Stack.Item>
              </Stack>
            </DocumentCard>
          )) : (
<div style={{height:"100%",display:"flex",alignItems:"center"}}>
  <Text style={{color:"#FFFFFF",fontSize:"1.25rem",fontWeight:"bold"}}>No Value Props Found</Text>
</div>
          )}
        </>)}
      </>
  );
};

export default FlashCard;
