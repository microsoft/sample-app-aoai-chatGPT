// Create an upload page to upload multiple files to the server using fluentui components.
//
// Path: frontend/src/pages/upload/Upload.tsx

import styles from "./Upload.module.css";
import { IIconProps, List, PrimaryButton, Spinner, SpinnerSize, MessageBar, MessageBarType } from "@fluentui/react";
import { ChangeEvent, useRef, useState } from "react";
import { uploadFiles } from "../../api";

export interface IButtonExampleProps {
    // These are set based on the toggles shown above the examples (not needed in real code)
    disabled?: boolean;
    checked?: boolean;
  }

const uploadIcon: IIconProps = { iconName: 'Upload' };

const onRenderCell = (item: File | undefined, index: number | undefined): JSX.Element | null => {
    if (typeof item === 'undefined' || typeof index === 'undefined') {
      return null;
    }
    
    return (
        <div data-is-focusable className={index % 2 === 0 ? 'even' : 'odd'}>
            <div className={styles.itemContent}>
            {index} &nbsp; {item?.name}
            </div>
        </div>
    );
  };

const Upload: React.FunctionComponent<IButtonExampleProps> = (props) => {
    const { checked } = props;
    const [files, setFiles] = useState<File[]>([]);
    const abortFuncs = useRef([] as AbortController[]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadResponseMsg, setUploadResponseMsg] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!!uploadResponseMsg) {
            setUploadResponseMsg(null);
        }
        setUploadResponseMsg(null);

        setFiles((currentFiles: File[]) => {
            const files = e.target.files || [];
            return [...files];
        });
    };

    // Create a function to handle upload multiple files to the server using POST request to /api/upload
    const handleUpload = async () => {
        setUploadResponseMsg(null);
        if (!files || files.length === 0) {
            setError("Please upload your file(s). And try again.");
            return;
        };
        setIsUploading(true);
        const abortController = new AbortController();
        abortFuncs.current.unshift(abortController);
        try {
            const response = await uploadFiles(files, abortController.signal);
            console.log(response);
            setUploadResponseMsg(response.data?.message);
            setFiles([]);
            setError(null);
        } catch (exception: any) {
            console.log(exception);
            setError(exception.error?.message || exception?.message || "Something went wrong. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const isDisabled = isUploading || files?.length < 1;

    return (
        <div className={styles.container + "ms-depth-4"}>
            <div className={styles.uploadContainer}>
                <input type="file" onChange={handleFileChange} multiple/>
                <PrimaryButton iconProps={isUploading ? undefined : uploadIcon} onClick={handleUpload} allowDisabledFocus disabled={isDisabled} checked={checked}>
                    {
                        isUploading ? (
                            <Spinner size={SpinnerSize.small} />
                        ) : "Upload"
                    }
                </PrimaryButton>
                {
                    error && (
                        <div>
                            <MessageBar
                                delayedRender={false}
                                messageBarType={MessageBarType.error}
                            >
                                { error }
                            </MessageBar>
                        </div>
                    )
                }

                {
                    uploadResponseMsg && (
                        <div>
                            <MessageBar
                                delayedRender={false}
                                messageBarType={MessageBarType.success}
                            >
                                { uploadResponseMsg }
                            </MessageBar>
                        </div>
                    )
                }
                <div>
                    <List
                        items={files}
                        onRenderCell={onRenderCell}
                    />
                </div>
            </div>
        </div>
    );
}

export default Upload;