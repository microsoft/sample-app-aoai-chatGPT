import { DocumentResult } from "../../api";
import styles from "./SupportingContent.module.css";

interface Props {
    supportingContent: DocumentResult;
}

export const SupportingContent = ({ supportingContent }: Props) => {
    return (
        <ul className={styles.supportingContentNavList}>
            <li className={styles.supportingContentItem}>
                <h4 className={styles.supportingContentItemHeader}>{supportingContent.title}</h4>
                <p className={styles.supportingContentItemText}>{supportingContent.content}</p>
            </li>
        </ul>
    );
};
