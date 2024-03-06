import * as React from 'react';
import { HeaderStyles } from './HeaderStyles';
import { Image, Link, Title3 } from '@fluentui/react-components';
import { CosmosDBStatus } from '../../api';
import { HistoryButton, ShareButton } from '../common/Button';

export interface IHeaderProps {
    azureImageUrl: string;
    onShareClick: () => void;
    onHistoryClick: () => void;
    appStateContext: any;
}

export const Header: React.FunctionComponent<IHeaderProps> = (props: React.PropsWithChildren<IHeaderProps>) => {
    const styles = HeaderStyles();
    return (
        <div className={styles.container}>
            <div className={styles.titleContainer}>
                <Image
                    src={props.azureImageUrl}
                    aria-hidden="true"
                    className={styles.logoImage}
                />
                <span className={styles.verticalBar}>|</span>
                <Link href="/" className={styles.headerTitle}>
                    Research copilot experience
                </Link>
            </div>
            <div className={styles.rightCommandBar}>
                {(props.appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured) &&
                    <HistoryButton onClick={props.onHistoryClick} text={props.appStateContext?.state?.isChatHistoryOpen ? "Hide chat history" : "Show chat history"} />
                }
                <ShareButton className={styles.shareButton} onClick={props.onShareClick} />
            </div>
        </div>
    );
};