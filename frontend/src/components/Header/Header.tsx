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
                    width={150}
                    className={styles.logoImage}
                />
                <Title3 style={{ marginBottom: '4px' }}> | </Title3>
                <Link href="/" className={styles.headerTitle}>
                    <Title3>MSR Chat</Title3>
                </Link>
            </div>
            <div className={styles.rightCommandBar}>
                {(props.appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured) &&
                    <HistoryButton onClick={props.onHistoryClick} text={props.appStateContext?.state?.isChatHistoryOpen ? "Hide chat history" : "Show chat history"} />
                }
                <ShareButton onClick={props.onShareClick} />
            </div>
        </div>
    );
};