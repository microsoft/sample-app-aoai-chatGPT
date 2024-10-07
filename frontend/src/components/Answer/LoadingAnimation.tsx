import styles from './LoadingAnimation.module.css';
export default function LoadingAnimation() {
    return (
        <div className={styles.typingIndicator}>
            <span></span>
            <span></span>
            <span></span>
        </div>
    );
}