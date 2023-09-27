import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioReadQuestionnaire } from './BrioReadQuestionnaire'

export default {
  title: 'Brio Read/BrioReadQuestionnaire',
  component: BrioReadQuestionnaire,
  argTypes: {},
  args: {
    pages: [
      {
        navigation: {
          currentPage: 1,
          next: { enabled: true, text: '#DefaultNextPage#' },
          previous: { enabled: true, text: '#DefaultPreviousPage#' },
          totalPages: 3,
        },
        rootNode: {
          subNodes: [
            {
              id: 'H3-id',
              nodeType: 'H3',
              text: 'This is a heading for the entire form',
            },
            {
              id: 'H4-id',
              nodeType: 'H4',
              text: 'This is a H4-heading',
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
              value: 'This is the value inside the textbox',
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
              value: ['de', 'fi', 'fr'],
            },
            {
              id: 'H5-id',
              nodeType: 'H5',
              text: 'This is a H5-heading',
            },
            {
              id: 'radioButtons-id',
              nodeType: 'RadioButtons',
              text: 'Here is a radio button group',
              readOnly: false,
              options: [
                { id: 'yes', text: 'Yes' },
                { id: 'no', text: 'No' },
              ],
              value: 'yes',
            },
          ],
        },
      },
      {
        navigation: {
          currentPage: 2,
          next: { enabled: true, text: '#DefaultNextPage#' },
          previous: { enabled: true, text: '#DefaultPreviousPage#' },
          totalPages: 3,
        },
        rootNode: {
          subNodes: [
            {
              id: 'second-H3-id',
              nodeType: 'H3',
              text: 'This is a heading for the next page',
            },
            {
              id: 'TextArea-id',
              nodeType: 'TextArea',
              text: 'Brio TextArea',
              helpText: 'TextArea help text',
              value:
                'The disc, being flat, has no real horizon. Any adventurous sailor who got funny ideas from staring at eggs and oranges for too long and set out for the antipodes soon learned that the reason why distant ships sometimes looked as though they were disappearing over the edge of the world was that they were disappearing over the edge of the world.',
            },
            {
              id: 'TextBox-id',
              nodeType: 'TextBox',
              text: 'Brio TextBox',
              helpText: 'TextBox help text',
              value: "They're taking the hobbits to isengard!",
            },
          ],
        },
      },
    ],
  },
} as ComponentMeta<typeof BrioReadQuestionnaire>

const Template: ComponentStory<typeof BrioReadQuestionnaire> = args => (
  <BrioReadQuestionnaire {...args} />
)

export const Default = Template.bind({})
Default.args = {}
