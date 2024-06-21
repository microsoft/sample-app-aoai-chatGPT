import React, { useContext } from 'react';
import CarouselComponent from '../CarouselComponent';
import uuid from 'react-uuid';
import { AppStateContext } from '../../state/AppProvider';
import Card from '../Card';
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <Spinner styles={{ circle: { height: 40, width: 40, border: "2px solid #FFFFFF" }, label: { color: "#FFFFFF", fontSize: "1rem" } }} label="Loading Walk Around..." />
        </div>
      ) : (
        <>
          {walkthroughData && walkthroughData?.length > 0 ? (
            <CarouselComponent
              cards={cards}
              height="500px"
              width="50%"
              margin="0 auto"
              offset={2}
              showArrows={false}
            />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center" , justifyContent : "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: "1.25rem", fontWeight: "bold" }}>No Walk Around Found</Text>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default WalkAround;
