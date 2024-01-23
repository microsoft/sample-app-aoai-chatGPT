import { Button, Dialog, DialogBody, DialogSurface, DialogTitle, DialogTrigger, Input, makeStyles, shorthands } from "@fluentui/react-components";
import { Copy16Regular, History24Regular, Share24Regular } from "@fluentui/react-icons";
import { useState } from "react";

interface ShareButtonProps {
  onClick: () => void;
}

const ShareDialogStyles = makeStyles({
  body: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    // align content center
    justifyContent: "center",
    alignItems: "center",
    ...shorthands.gap("10px"),
    ...shorthands.margin("10px"),
  },
});

export const ShareButton: React.FC<ShareButtonProps> = ({ onClick }) => {
  const styles = ShareDialogStyles();
  const [copyClicked, setCopyClicked] = useState<boolean>(false);
  const [copyText, setCopyText] = useState<string>("Copy URL");

  const handleCopyClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyClicked(true);
    setCopyText("Copied!");
  };

  return (
    <Dialog
      modalType="non-modal"

    >
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<Share24Regular />}>Share</Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Share the web app</DialogTitle>
          <div className={styles.body}>
            <Input
              defaultValue={window.location.href}
              readOnly
            />
            <Button
              appearance="primary"
              icon={<Copy16Regular />}
              tabIndex={0}
              aria-label="Copy"
              onClick={handleCopyClick}
              onKeyDown={e => e.key === "Enter" || e.key === " " ? handleCopyClick() : null}
            >
              {copyText}
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

interface HistoryButtonProps {
  onClick: () => void;
  text: string;
}

export const HistoryButton: React.FC<HistoryButtonProps> = ({ onClick, text }) => {
  return (
    <Button
      icon={<History24Regular />}
      onClick={onClick}
    >
      {text}
    </Button>
  )
}