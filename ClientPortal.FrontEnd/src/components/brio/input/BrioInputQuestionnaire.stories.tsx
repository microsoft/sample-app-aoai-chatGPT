import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioInputQuestionnaire } from './BrioInputQuestionnaire'

export default {
  title: 'Brio Input/BrioInputQuestionnaire',
  component: BrioInputQuestionnaire,
  argTypes: {},
  args: {
    navigation: {
      currentPage: 2,
      next: { enabled: true, text: '#DefaultNextPage#' },
      previous: { enabled: true, text: '#DefaultPreviousPage#' },
      totalPages: 4,
    },
    subNodes: [
      {
        id: 'H3-id',
        nodeType: 'H3',
        text: 'This is a heading for the entire form',
      },
      {
        id: 'Paragraph-id',
        nodeType: 'Paragraph',
        text: 'This is some helpful text in a Paragraph for the form',
      },
      {
        id: 'textBox-id',
        nodeType: 'TextBox',
        text: 'This is a label',
        helpText: 'This is some helpful info for the TextBox',
      },
      {
        id: 'dropdownListAddMore-id',
        nodeType: 'DropDownListAddMore',
        text: 'Heading for dropdownlist',
        helpText: 'If you select a value and press add more, you can add more',
        options: [
          { id: 'de', text: 'Denmark' },
          { id: 'fi', text: 'Finland' },
          { id: 'fr', text: 'France' },
          { id: 'gb', text: 'Great Britain' },
          { id: 'jp', text: 'Japan' },
          { id: 'no', text: 'Norway' },
          { id: 'se', text: 'Sweden' },
        ],
      },
      {
        id: 'radioButtons-id',
        nodeType: 'RadioButtons',
        text: 'Here is a radio button group',
        readOnly: false,
        value: 'no',
        options: [
          { id: 'yes', text: 'Yes' },
          { id: 'no', text: 'No' },
        ],
      },
    ],
  },
} as ComponentMeta<typeof BrioInputQuestionnaire>

const Template: ComponentStory<typeof BrioInputQuestionnaire> = args => (
  <BrioInputQuestionnaire {...args} />
)

export const Default = Template.bind({})
Default.args = {}

export const WithFinalPage = Template.bind({})
WithFinalPage.args = {
  navigation: {
    currentPage: 4,
    next: { enabled: false, text: '#DefaultNextPage#' },
    previous: { enabled: false, text: '#DefaultPreviousPage#' },
    totalPages: 4,
  },
  subNodes: [
    {
      id: 'Paragraph-id',
      nodeType: 'Paragraph',
      text: 'This text will not be displayed',
    },
  ],
}
