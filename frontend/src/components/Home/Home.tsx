import { DefaultButton, Stack, Text } from '@fluentui/react';
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { dummydata } from '../../constants/dummydata'
import { CategoryItem, ChildItem } from '../../types/DummyDataItem'
import CustomIconButton from '../CustomIconButton'
import { useNavigate } from 'react-router-dom'
import { AppStateContext } from '../../state/AppProvider'
import template from '../../constants/templete'
import style from './Home.module.css'
import Chip from '../Chip'
import TextFieldComponent from './TextField'
import DesktopTextField from './DesktopTextField';

const Home: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const appendedQuestion=" What are the top 3 boat models you would recommend, phrase your response as [Brand] [Model] and limit responses to specific brand and models, not series.";

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const appStateContext = useContext(AppStateContext)
  const [inputValue, setInputValue] = useState<string>('')
  const [isTextFieldFocused, setIsTextFieldFocused] = useState<boolean>(false)
  const [showMore, setShowMore] = useState<{ [key: string]: boolean }>({})
  const [selectedKeys, setSelectedKeys] = useState<
    { key: string; value: string; type: 'parent' | 'child'; promptValue: string }[]
  >([])
  const [textFieldValue,setTextFieldValue] = useState<string>('');

  const navigate = useNavigate()
  const [tags, setTags] = useState<{ [key: string]: { tags: string[]; level: string } }>(() => {
    const initialTags: { [key: string]: { tags: string[]; level: string } } = {}
    for (const [key, value] of Object.entries(dummydata)) {
      if (key !== 'id') {
        const categories = value.map((item: any) => item.category);
        initialTags[key] = { tags: categories, level: 'level1' }; // Initialize with level1
      }
    }
    return initialTags;
  })

  const handleGroupSelection = (key: string, tag: string) => {
    if (Object.keys(dummydata).includes(key)) {
      const categoryArray = (dummydata as any)[key]
      const selectedCategory = categoryArray.find(
        (categoryItem: CategoryItem) => categoryItem.category === tag && categoryItem?.child?.length > 0
      )

      setTags(prevTags => {
        const updatedTags = { ...prevTags }

        if (selectedCategory) {
          const categoryIndex = updatedTags[key].tags.indexOf(tag)
          if (categoryIndex !== -1) {
            const childTags = selectedCategory.child.map((child: ChildItem) => Object.keys(child)[0])
            updatedTags[key] = { tags: [...childTags], level: 'level2' } // Update level to level2
          }
        }
        return updatedTags
      })

      const type = selectedCategory || key === 'prioritize' ? 'parent' : 'child'
      const existingIndex = selectedKeys.findIndex(item => item.key === key && item.value === tag)
      let promptValue: string
      if (type === 'child') {
        const matchingChild = categoryArray.reduce((result: string | undefined, categoryItem: CategoryItem) => {
          if (result) return result
          const matchingChild = categoryItem.child.find((child: ChildItem) => Object.keys(child)[0] === tag)
          if (matchingChild) {
            promptValue = Object.values(matchingChild)[0]
            return Object.values(matchingChild)[0]
          }
          return result
        }, undefined)
      }
      if (existingIndex !== -1) {
        setSelectedKeys(prevKeys => prevKeys.filter((_, index) => index !== existingIndex))
      } else {
        setSelectedKeys(prevKeys => [...prevKeys, { key, value: tag, type, promptValue: promptValue }])
      }
    }
  }

  const toggleShowMore = (heading: string) => {
    setShowMore(prevState => ({
      ...prevState,
      [heading]: !prevState[heading]
    }))
  }

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  const processTemplate = () => {
    let result = ''

      ; (Object.keys(template) as (keyof typeof template)[]).forEach(key => {
        const parentKeys = selectedKeys.filter(item => item.key === key && item.type === 'parent')
        const childKeys = selectedKeys.filter(item => item.key === key && item.type === 'child')

        let processedValue = template[key]

        if (parentKeys.length > 0) {
          const parentValues = parentKeys
            .map(item => item.value)
            .filter(Boolean)
            .join(', ')
          processedValue = processedValue.replace(`[${capitalizeFirstLetter(key)} Level 1]`, parentValues)
        }

        const validChildKeys = childKeys.filter(item => item.promptValue)
        if (validChildKeys.length > 0) {
          const children = validChildKeys.map(item => item.promptValue).join(', ')
          processedValue = processedValue.replace(`[${capitalizeFirstLetter(key)} Level 2]`, children)
        } else {
          const level2Placeholder = `[${capitalizeFirstLetter(key)} Level 2]`
          processedValue = processedValue.replace(`, including ${level2Placeholder}`, '')
          processedValue = processedValue.replace(`, specially ${level2Placeholder}`, '')
          processedValue = processedValue.replace(`with ${level2Placeholder}`, '')
        }

        if (parentKeys.length > 0 || validChildKeys.length > 0) {
          result += processedValue.trim() + ' '
        }
      })

    return result.trim()
  }

  useEffect(() => {
    const processedTemplate = processTemplate()
    if (processedTemplate.trim() !== '' && selectedKeys?.length > 0) {
      setInputValue(processedTemplate)
    } else {
      setInputValue("")
      setTextFieldValue("")
    }
  }, [selectedKeys])

  const buttonDisabled = useMemo(() => {
    return selectedKeys?.length === 0 
  }, [selectedKeys, inputValue,textFieldValue])

  const handleSubmit = () => {
    const inputPayload = inputValue + ` ${textFieldValue && textFieldValue+"."}` + appendedQuestion;
    appStateContext?.dispatch({ type: 'SET_PROMPT_VALUE', payload: inputPayload })
    navigate("/recommendations");
};
console.log({inputValue})

  const handleRemove = (selectedKey: string) => {
    setSelectedKeys(selectedKeys.filter(item => item.key !== selectedKey))
    setTags(prevTags => {
      const updatedTags = { ...prevTags }
      for (const [key, value] of Object.entries(dummydata)) {
        if (key === selectedKey && key !== 'id') {
          const categories = value?.map((item: any) => item.category)
          updatedTags[key] = { tags: categories, level: 'level1' } // Reset level to level1
        }
      }
      return updatedTags
    })
  }

  const resetAllClick = () => {
    setTags(() => {
      const initialTags: { [key: string]: { tags: string[]; level: string } } = {}
      for (const [key, value] of Object.entries(dummydata)) {
        if (key !== 'id') {
          const categories = value.map((item: any) => item.category)
          initialTags[key] = { tags: categories, level: 'level1' } // Reset all to level1
        }
      }
      return initialTags
    })
    setSelectedKeys([])
    setInputValue("");
    setTextFieldValue("");
  }

  const memoizedInputPlaceholder = (view: 'desktop' | 'mobile') => useMemo(() => {
    if(selectedKeys && selectedKeys.length > 0) {
      return 'Anything else?';
    } else {
      if(view === 'desktop') {
        return 'Please select an option before adding more details.';
      } else {
        return 'Please select an option first.';
      }
    }
  }, [selectedKeys])

  return (
    <>
    <Stack className={style.mainStackContainer}>
      {selectedKeys?.length>0 && (<div className={style.resetDiv}>
        <DefaultButton
          onClick={() => resetAllClick()}
          className={style.resetButton}
          styles={{
            label: { fontWeight: 'normal', color: 'rgba(255,255,255,0.41)' }
          }}>
          Reset
        </DefaultButton>
      </div>)}
      <Stack className={style.mainContentStackContainer}>
        
        <Stack className={style.contentStackContainer} style={{ opacity: isTextFieldFocused ? 0.3 : 1 }}>
          {Object.keys(tags).map(key => (
            <React.Fragment key={key}>
              <Stack className={style.tagTypeStack}>
                <Text className={style.heading}>
                  <div>
                    {key === 'who' || key === 'where' ? `${key}?` : key}
                    {key !== 'prioritize' &&
                      selectedKeys
                        .filter(item => item.type === 'parent' && item.key === key)
                        .map(item => (
                          <Chip key={item.key} label={item.value} onRemove={() => handleRemove(item.key)} />
                        ))}
                  </div>
                </Text>
              </Stack>
              <Stack className={style.mainStackTags}>
                {tags[key].tags.slice(0, showMore[key] ? tags[key]?.tags.length : 5).map((tag, index) => (
                  <Stack.Item key={index} grow={1} disableShrink className={style.stackitem}>
                    <DefaultButton
                      className={style.tagButton}
                      style={{
                        backgroundColor:
                          key !== 'prioritize' && tags[key]?.level === 'level1'
                            ? '#151B1E'
                            : tags[key]?.level === 'level2' &&
                              !selectedKeys.some(selected => selected.value === tag && selected.key === key)
                              ? '#909B97'
                              : selectedKeys.some(selected => selected.value === tag && selected.key === key)
                                ? '#629E57'
                                : '#151B1E',
                        color:
                          selectedKeys.some(selected => selected.value === tag && selected.key === key) ||
                            tags[key]?.level === 'level2'
                            ? '#151B1E'
                            : '#FFFFFF'
                      }}
                      styles={{
                        label: {
                          display: 'block',
                          lineHeight: '100%'
                        }
                      }}
                      onClick={() => typeof tag === 'string' && handleGroupSelection(key, tag)}>
                      {tag}
                    </DefaultButton>
                  </Stack.Item>
                ))}
                {tags[key].tags.length > 5 && (
                  <Stack.Item  grow={1} disableShrink className={style.stackitem}>
                    <DefaultButton
                      styles={{
                        root: {
                          width: "60px",
                          height: "100%",
                          padding: "18px",
                          fontSize: "14px",
                          letterSpacing: "0px",
                          fontWeight: 600,
                          backgroundColor: 'transparent',
                          color: '#819188',
                          border: '1px solid black',
                          borderRadius: 10
                        },
                        rootHovered: {
                          backgroundColor: '#313e44ff', 
                          color: '#819188', 
                          border: '1px solid black',
                        },
                        rootFocused: {
                          backgroundColor: 'transparent',
                          color: '#819188', 
                          border: '1px solid black', 
                        },
                        rootPressed: {
                          backgroundColor: 'transparent',
                          color: '#819188', 
                          border: '1px solid black', 
                        }

                      }}
                      onClick={() => toggleShowMore(key)}>
                      {showMore[key] ? 'Less' : 'More'}
                    </DefaultButton>
                  </Stack.Item>
                )}
              </Stack>
            </React.Fragment>
          ))}
        </Stack>
      </Stack>
      {/* {windowWidth <1700 ? ( */}

            {/* ) : ( */}
        <div className={style.desktopTextField}>
        <DesktopTextField 
                      placeholder={memoizedInputPlaceholder('desktop')}
                      allowBorder={false}
                      text={textFieldValue}
                      setText={setTextFieldValue}
                      isButtonRequired={true}
                      promptValue={inputValue}
                      onFocus={() => setIsTextFieldFocused(true)} // Set focused state on focus
                      onBlur={() => setIsTextFieldFocused(false)}
                      isTextFieldFocused={isTextFieldFocused} 
                      isButtonEnabled={selectedKeys?.length>0}
        />
        </div>
            {/* )} */}
    </Stack>
          <div
          className={style.footer}
          style={{
            height: isTextFieldFocused ? '280px' : '100px',
            bottom: isTextFieldFocused ? '20px' : '0px',
            alignItems: isTextFieldFocused ? 'end' : 'center',
          }}>
          <Stack tokens={{ childrenGap: 20 }} horizontalAlign="center" className={style.footerMainStack}>
            <div className={style.inputContainer}>
              <TextFieldComponent
                placeholder={memoizedInputPlaceholder('mobile')}
                allowBorder={false}
                text={textFieldValue}
                setText={setTextFieldValue}
                isButtonRequired={isTextFieldFocused}
                onFocus={() => setIsTextFieldFocused(true)} // Set focused state on focus
                onBlur={() => setIsTextFieldFocused(false)}
                isTextFieldFocused={isTextFieldFocused} // Remove focused state on blur
                disabled={buttonDisabled}
              />
            </div>
            <div className={style.buttonContainer}>
              <CustomIconButton onButtonClick={handleSubmit} disabled={buttonDisabled} />
            </div>
          </Stack>
        </div>
        </>
  )
}

export default Home
