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
          <Spinner label="Loading Value Propositions..." />
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
                  boxShadow: '1px 1px 0px black',
                },
              }}
            >
              <Stack styles={{ root: { padding: 20, width: '100%' } }}>
                <Stack.Item>
                  <DocumentCardTitle title={item.title} styles={{ root: { fontWeight: '500', textAlign: 'left', padding: 0, height: 20, color: 'white', fontSize: "1rem", whiteSpace: "nowrap", textOverflow: "ellipsis" } }} />
                </Stack.Item>
                <Stack.Item grow>
                  <DocumentCardDetails styles={{ root: { marginTop: 10 } }}>
                    <Text style={{ color: 'white' }}>{item.detail}</Text>
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
