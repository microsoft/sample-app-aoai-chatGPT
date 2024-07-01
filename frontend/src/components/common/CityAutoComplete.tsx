import React, { useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { IconButton, PrimaryButton } from '@fluentui/react';
import './CityAutoComplete.css';
import { Send24Filled, Send28Filled } from '@fluentui/react-icons';
 
interface CityAutocompleteInputProps {
  suggestions: string[];
  setSelectedValue: (selected: string) => void;
  selectedValue: boolean;
  handleSave: () => void;
}
 
const CityAutocompleteInput: React.FC<CityAutocompleteInputProps> = ({ suggestions, setSelectedValue,selectedValue, handleSave }) => {
  const [value, setValue] = useState<string>('');
  const [suggestionsList, setSuggestionsList] = useState<string[]>([]);
 
  const handleChange = (event: React.FormEvent<HTMLElement>, { newValue }: Autosuggest.ChangeEvent) => {
    setValue(newValue);
  };
 
  const handleSuggestionsFetchRequested = ({ value }: Autosuggest.SuggestionsFetchRequestedParams) => {
    setSuggestionsList(getSuggestions(value));
  };
 
  const handleSuggestionsClearRequested = () => {
    setSuggestionsList([]);
  };
 
  const getSuggestions = (value: string) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    return inputLength === 0 ? [] : suggestions.filter(suggestion =>
      suggestion.toLowerCase().slice(0, inputLength) === inputValue
    );
  };
 
  const handleSuggestionSelected = (event: React.FormEvent<any>, { suggestionValue }: Autosuggest.SuggestionSelectedEventData<string>) => {
    setValue(suggestionValue);
    setSelectedValue?.(suggestionValue);
  };
 
  const inputProps: Autosuggest.InputProps<string> = {
    placeholder: 'Enter City',
    value,
    onChange: handleChange,
  };
 
  return (
    <div className="autocomplete-container">
      <Autosuggest
        suggestions={suggestionsList}
        onSuggestionsFetchRequested={handleSuggestionsFetchRequested}
        onSuggestionsClearRequested={handleSuggestionsClearRequested}
        getSuggestionValue={(suggestion: string) => suggestion}
        renderSuggestion={(suggestion: string) => (
          <div>
            {suggestion}
          </div>
        )}
        inputProps={inputProps}
        onSuggestionSelected={handleSuggestionSelected}
      />
      <PrimaryButton
        onClick={handleSave}
        disabled={selectedValue}
        styles={{
          root: {
            backgroundColor: 'transparent',
            color: "#FFFFFF",
            borderRadius: 10,
            minWidth: 0,
            padding: "0px 5px",
            marginRight: 10,
            background: 'transparent !important',
            border: "none !important",
            borderColor: "transparent !important",
            selectors: {
              ':hover': {
                background: 'transparent !important',
                border: "none !important",
                borderColor: "transparent !important"
              },
              ':active': {
                background: '#202a2f',
                border: "none !important"
              },
              ':focus': {
                background: 'transparent',
                border: "none !important"
              }
            }
          }
        }}
      >
        <Send24Filled />
      </PrimaryButton>
    </div>
  );
};
 
export default CityAutocompleteInput;