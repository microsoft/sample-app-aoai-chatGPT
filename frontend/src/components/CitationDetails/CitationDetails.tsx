import { Button, Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { Citation } from '../../api';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export interface ICitationDetailsProps {
    open: boolean;
    citation: Citation | undefined;
    onClose: () => void;
}

export const CitationDetails: React.FunctionComponent<ICitationDetailsProps> = (props: React.PropsWithChildren<ICitationDetailsProps>) => {
    const [showDrawer, setShowDrawer] = React.useState(false);

    const onDrawerClose = () => {
        setShowDrawer(false);
        props.onClose();
    };

    const onViewSource = (citation: Citation | undefined) => {
        if (!citation) return;
        if (citation.url && !citation.url.includes("blob.core")) {
            window.open(citation.url, "_blank");
        }
    };

    React.useEffect(() => {
        setShowDrawer(props.open);
    }, [props.open]);

    return (
        <Drawer
            type='overlay'
            open={showDrawer}
            size='medium'
            position='end'
        >
            <DrawerHeader>
                <DrawerHeaderTitle
                    action={<Button appearance='transparent' icon={<Dismiss24Regular />} aria-label="Close citations panel" onClick={onDrawerClose} />}
                >
                    Citations
                </DrawerHeaderTitle>
            </DrawerHeader>
            <DrawerBody>
                <div tabIndex={0} role="tabpanel" aria-label="Citations Panel">
                    <h5 tabIndex={0} title={props.citation?.url && !props.citation.url.includes("blob.core") ? props.citation.url : props.citation?.title ?? ""} onClick={() => onViewSource(props.citation)}>{props.citation?.title}</h5>
                    <div tabIndex={0}>
                        <ReactMarkdown
                            linkTarget="_blank"
                            children={props.citation ? props.citation.content : ""}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                        />
                    </div>
                </div>
            </DrawerBody>
        </Drawer>
    );
};