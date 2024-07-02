import React, { useContext } from 'react';
import CarouselComponent from '../CarouselComponent';
import uuid from 'react-uuid';
import { AppStateContext } from '../../state/AppProvider';
import Card from '../Card';
import loading from "../../assets/loader.gif"
import { Spinner, Text } from '@fluentui/react';

interface Walkthrough {
  titles: string[];
  details: string[];
}

const WalkAround: React.FC = () => {
  const appStateContext = useContext(AppStateContext);
  const walkthroughData = appStateContext?.state?.walkthorugh;
  const isLoading = appStateContext?.state?.isLoadingWalkThrough;

  // Create cards from walkthroughData
  let cards = walkthroughData?.map((item, index) => ({
    key: uuid(),
    content: <Card title={item.title} detail={item.detail} />,
    onClick: () => { } // Placeholder onClick function
  })) || [];

  return (
    <>
      {isLoading ? (
        // <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 100px)" }}>
          <img src={loading} alt="Logo" className="logo" style={{opacity:"0.3",width:"300px"}} />
        // </div>
      ) : (
        <>
          {walkthroughData && walkthroughData?.length > 0 ? (
            <CarouselComponent
              cards={cards}
              height="calc(100vh - 300px)"
              width="50%"
              margin="0 auto"
              offset={2}
              showArrows={false}
            />
          ) : (
            <Text style={{
              color: "#FFFFFF",
              fontSize: "26px"
            }}>No Data found</Text>
          )}
        </>
      )}
    </>
  );
};

export default WalkAround;
