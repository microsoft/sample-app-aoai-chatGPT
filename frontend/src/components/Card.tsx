import React, { useState } from "react";
import { useSpring, animated } from "react-spring";
import Styles from "./Card.module.css";
import { Stack, Text } from "@fluentui/react";

interface CardProps {
  title: string;
  detail: string;
}

const Card: React.FC<CardProps> = ({ title, detail }) => {
  const [show, setShown] = useState(false);

  const props3 = useSpring({
    transform: show ? "scale(1.03)" : "scale(1)",
    boxShadow: show
      ? "0 20px 25px rgba(0, 0, 0, 0.25)"
      : "0 2px 10px rgba(0, 0, 0, 0.08)",
  });

  return (
    <animated.div
      className={Styles.card}
      style={props3}
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => setShown(false)}
    >
      <Stack styles={{ root: { display: "flex", flexDirection: "column", height: "100%", padding: "0px 0px 10px 0px" } }}>
        <Text className={Styles.cardTitle} styles={{
          root: {
            height: "25%",
            '@media (max-width: 600px)': {
              fontWeight: "bold",
              fontSize: "16px",
            },
            '@media (max-width: 1300px) and (min-width: 600px)': {
              fontWeight: "bold",
              fontSize: "22px",
            },
            '@media (max-width: 2500px) and (min-width: 1300px)': {
              fontWeight: "bold",
              fontSize: "24px",
            },
          }
        }}>
          {title}
        </Text>
        <Text className={Styles.cardDetail} styles={{
          root: {
            marginTop: "auto",
            '@media (max-width: 575px)': {
              fontSize: "18px",
              fontWeight: "500",
              lineHeight: "1.6rem",
            },
            '@media (max-width: 1700px) and (min-width: 600px)': {
              fontWeight: "400",
              fontSize: "22px",
            },
            '@media (max-width: 2500px) and (min-width: 1700px)': {
              fontWeight: "400",
              fontSize: "28px",
            },
          }
        }}>
          {detail}
        </Text>
      </Stack>
    </animated.div>
  );
};

export default Card;
