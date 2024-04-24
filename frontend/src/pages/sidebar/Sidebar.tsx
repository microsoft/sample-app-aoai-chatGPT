import styles from "./Sidebar.module.css";
import { Link } from "react-router-dom";
import { Stack } from "@fluentui/react";

const Sidebar = () => {
    return(
        <div className={styles.sidebarContainer}>            
            <Stack horizontalAlign="center">
                <Link to="https://ai-dev.bv.com" className={styles.headerTitleContainer}>
                    <h1 className={styles.headerTitle}>Home</h1>
                </Link>
                 <Link to="https://360.articulate.com/review/content/0618b59e-d3d7-4516-b76c-738614b1fa88/review" className={styles.headerTitleContainer}>
                    <h1 className={styles.headerTitle}>Training</h1>
                </Link>
                <Link to="https://blackandveatch.sharepoint.com/sites/BV/Corp/CIO/SitePages/ChatGPT.aspx?referrer=Yammer&referrerScenario=Feed.View" className={styles.headerTitleContainer}>
                    <h1 className={styles.headerTitle}>Resources</h1>
                </Link>
            </Stack>
        </div>
    );
}

export default Sidebar;