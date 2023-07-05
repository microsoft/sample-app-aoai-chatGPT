import { Dropdown, IDropdownOption, IDropdownStyles } from "@fluentui/react";
import { useEffect, useState } from "react";
import { getSearchIndexes } from "../../api";
import useAppStore from "../../stores/appStore";

export const IndexDropdown = () => {
  const { searchIndex, setSearchIndex } = useAppStore((state) => state);
  const dropdownStyles: Partial<IDropdownStyles> = {
    dropdown: { width: 300 },
  };

  const [indexes, setIndexes] = useState<IDropdownOption[]>([]);
  useEffect(() => {
    getSearchIndexes().then((data) => {
      setIndexes(data.map((index) => ({ key: index, text: index })));
      setSearchIndex(data[0]);
    });
  }, []);

  return (
    
    <Dropdown
      placeholder="Select a search index"
      options={indexes}
      styles={dropdownStyles}
      selectedKey={searchIndex}
      onChange={(event, option) => setSearchIndex(option?.key as string)}
    />
  );
};
