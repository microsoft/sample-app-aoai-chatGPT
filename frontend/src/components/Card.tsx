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
            '@media (max-width: 599px)': {
              fontSize: "16px",
            },
            fontWeight: "bold",
            fontSize: "24px",
            },
        }}>
          {title}
        </Text>
        <Text className={Styles.cardDetail} styles={{
          root: {
            marginTop: "auto",
            '@media (max-width: 599px)': {
              fontSize: "20px",
              fontWeight: "400",
              lineHeight: "1.6rem",
            },
            '@media (max-height: 700px) ': {
              fontSize: "18px",
              fontWeight: "400",
              lineHeight: "1.6rem",
            },
            fontSize: "24px",
            fontWeight: "400",
          }
        }}>
          {detail}
        </Text>
      </Stack>
    </animated.div>
  );
};

export default Card;
