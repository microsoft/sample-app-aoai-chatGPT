import { Button } from "@fluentui/react-components";
import { History24Regular, Share24Regular } from "@fluentui/react-icons";

interface ShareButtonProps {
  onClick: () => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ onClick }) => {
  return (
    <Button
      appearance="primary"
      icon={<Share24Regular />}
      onClick={onClick}
    >
      Share
    </Button>
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