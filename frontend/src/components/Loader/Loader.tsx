import React from "react";
import styles from "./Loader.module.css";

const Loader = () => {
  return (
    <div className={styles.loading_screen}>
      <div className={styles.loading_spinner}></div>
    </div>
  );
};

export default Loader;
