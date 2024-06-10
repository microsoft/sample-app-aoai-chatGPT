import React, { useContext } from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import "./carouselStyle.css"
import { Text, Stack, mergeStyles, Spinner } from '@fluentui/react';
import { AppStateContext } from '../state/AppProvider';

const carouselContainerStyle = mergeStyles({
  marginTop: 20,
  width: '90%',
  backgroundColor: '#eccb3c',
  borderRadius: 10,
  height: "80%",
});

const slideStyle = mergeStyles({
  padding: "50px 10px",
  textAlign: 'center',
  boxSizing: 'border-box',
  height: "100%",
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
});

const titleStyle = mergeStyles({
  position: 'absolute',
  top: 20,
  left: 20,
  fontWeight: 'bold',
});

const contentStackStyle = mergeStyles({
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
});

const responsive = {
  superLargeDesktop: {
    breakpoint: { max: 4000, min: 3000 },
    items: 1
  },
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 1
  },
  tablet: {
    breakpoint: { max: 1024, min: 464 },
    items: 1
  },
  mobile: {
    breakpoint: { max: 464, min: 0 },
    items: 1
  }
};

const CarouselComponent: React.FC = () => {
  const appStateContext = useContext(AppStateContext);
  const walkthroughData = appStateContext?.state?.walkthorugh;
  const isLoading = appStateContext?.state?.isLoadingWalkThrough

  return (
    <>
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <Spinner label="Loading Walk around..." />
        </div>
      ) : (
        <>
          {walkthroughData && walkthroughData?.length > 0 ? (
            <div className={carouselContainerStyle}>
              <Carousel
                responsive={responsive}
                showDots
                infinite={false}
                autoPlay={false}
                arrows={false}
                itemClass='react-multi-carousel-list'
              >
                {walkthroughData.map((item) => (
                  <div key={item.title} className={slideStyle}>
                    <Text variant="xLarge" className={titleStyle}>
                      {item.title}
                    </Text>
                    <Stack tokens={{ childrenGap: 10 }} className={contentStackStyle}>
                      {/* <ul style={{ padding: '0 20px', margin: 0, listStyle: 'disc', display: "flex", alignItems: 'center', flexDirection: "column", marginTop: 20 }}> */}
                      <Text key={item.title} style={{ fontWeight: 500, textAlign: "justify", marginBottom: 10, marginTop: 10, fontSize: "1.25rem" }}>
                        {item.detail}
                      </Text>
                      {/* </ul> */}
                    </Stack>
                  </div>
                ))}
              </Carousel>
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: "1.25rem", fontWeight: "bold" }}>No Walk Around Found</Text>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default CarouselComponent;
