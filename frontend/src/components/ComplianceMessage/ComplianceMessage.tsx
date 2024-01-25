
import * as React from "react";
import {
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
    Button,
} from "@fluentui/react-components";

import { Info16Regular, Dismiss16Regular } from "@fluentui/react-icons";

export interface IComplianceMessageProps { }

export const ComplianceMessage: React.FunctionComponent<IComplianceMessageProps> = (props: React.PropsWithChildren<IComplianceMessageProps>) => {
    return (
        <Dialog>
            <DialogTrigger disableButtonEnhancement>
                <Button
                    title="About"
                    appearance="transparent"
                    icon={<Info16Regular />}
                />
            </DialogTrigger>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle
                        action={
                            <DialogTrigger action="close">
                                <Button
                                    appearance="subtle"
                                    aria-label="close"
                                    icon={<Dismiss16Regular />}
                                />
                            </DialogTrigger>
                        }
                    >
                        About
                    </DialogTitle>
                    <DialogContent>
                        Chat interactions will be saved anonymously. This is used to help improve response quality. Personal identifiers, such as your name or email address are not captured.
                    </DialogContent>
                    <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary">Close</Button>
                        </DialogTrigger>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};