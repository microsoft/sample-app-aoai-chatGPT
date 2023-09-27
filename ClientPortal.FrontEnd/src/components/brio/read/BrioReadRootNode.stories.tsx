import { ComponentMeta, ComponentStory } from '@storybook/react'
import { encodeBase64 } from '../../../utils/base64'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioReadRootNode } from './BrioReadRootNode'

export default {
  title: 'Brio Read/BrioReadRootNode',
  component: BrioReadRootNode,
  decorators: [
    Story => (
      <BrioFormContextProvider>
        <BrioForm>
          <Story />
        </BrioForm>
      </BrioFormContextProvider>
    ),
  ],
  argTypes: {},
} as ComponentMeta<typeof BrioReadRootNode>

const Template: ComponentStory<typeof BrioReadRootNode> = args => <BrioReadRootNode {...args} />

export const Default = Template.bind({})
Default.args = {
  subNodes: [
    // Read

    {
      id: 'Read',
      nodeType: 'H3',
      text: 'Read',
    },
    {
      id: 'ButtonSwitchYesNo-id',
      nodeType: 'ButtonSwitchYesNo',
      text: 'Brio ButtonSwitchYesNo',
      helpText: 'ButtonSwitchYesNo help text',
      options: [
        { id: 'yes', text: '#Yes#' },
        { id: 'no', text: '#No#' },
      ],
      value: 'yes',
    },
    {
      id: 'CheckBox-id',
      nodeType: 'CheckBox',
      text: 'Brio CheckBox',
      helpText: 'CheckBox help text',
      value: true,
    },
    {
      id: 'CheckBoxMulti-id',
      nodeType: 'CheckBoxMulti',
      text: 'Brio CheckBoxMulti',
      helpText: 'CheckBoxMulti help text',
      options: [
        { id: '1', text: 'One' },
        { id: '2', text: 'Two' },
        { id: '3', text: 'Three' },
        { id: '4', text: 'Four' },
        { id: '5', text: 'Five' },
      ],
      value: ['1', '2', '3'],
    },
    {
      id: 'Date-id',
      nodeType: 'Date',
      text: 'Brio Date',
      helpText: 'Date help text',
      value: '2022-01-01',
    },
    {
      id: 'Decimal-id',
      nodeType: 'Decimal',
      text: 'Brio Decimal',
      helpText: 'Decimal help text',
      value: 123.5,
    },
    {
      id: 'DropDownList-id',
      nodeType: 'DropDownList',
      text: 'Brio DropDownList',
      helpText: 'DropDownList help text',
      options: [
        { id: '1', text: 'One' },
        { id: '2', text: 'Two' },
        { id: '3', text: 'Three' },
        { id: '4', text: 'Four' },
        { id: '5', text: 'Five' },
      ],
      value: '4',
    },
    {
      id: 'DropDownListAddMore-id',
      nodeType: 'DropDownListAddMore',
      text: 'Brio DropDownListAddMore',
      helpText: 'DropDownListAddMore help text',
      options: [
        { id: '1', text: 'One' },
        { id: '2', text: 'Two' },
        { id: '3', text: 'Three' },
        { id: '4', text: 'Four' },
        { id: '5', text: 'Five' },
      ],
      value: ['1', '2'],
    },
    {
      id: 'DropDownListMulti-id',
      nodeType: 'DropDownListMulti',
      text: 'Brio DropDownListMulti',
      helpText: 'DropDownListMulti help text',
      options: [
        { id: '1', text: 'One' },
        { id: '2', text: 'Two' },
        { id: '3', text: 'Three' },
        { id: '4', text: 'Four' },
        { id: '5', text: 'Five' },
      ],
      value: ['4', '5'],
    },
    {
      id: 'DropDownListYesNo-id',
      nodeType: 'DropDownListYesNo',
      text: 'Brio DropDownListYesNo',
      helpText: 'DropDownListYesNo help text',
      options: [
        { id: 'yes', text: '#Yes#' },
        { id: 'no', text: '#No#' },
      ],
      value: 'no',
    },
    {
      id: 'IntPositive-id',
      nodeType: 'IntPositive',
      text: 'Brio IntPositive',
      helpText: 'IntPositive help text',
      value: 9876,
    },
    {
      id: 'RadioButtons-id',
      nodeType: 'RadioButtons',
      text: 'Brio RadioButtons',
      helpText: 'RadioButtons help text',
      options: [
        { id: '1', text: 'One' },
        { id: '2', text: 'Two' },
        { id: '3', text: 'Three' },
        { id: '4', text: 'Four' },
        { id: '5', text: 'Five' },
      ],
      value: '5',
    },
    {
      id: 'RadioButtonsYesNo-id',
      nodeType: 'RadioButtonsYesNo',
      text: 'Brio RadioButtonsYesNo',
      helpText: 'RadioButtonsYesNo help text',
      options: [
        { id: 'yes', text: '#Yes#' },
        { id: 'no', text: '#No#' },
      ],
      value: 'yes',
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
      value: 'Be yourself; everyone else is already taken.',
    },

    // Typography

    {
      id: 'Typography',
      nodeType: 'H3',
      text: 'Typography',
    },
    {
      id: 'H3-id',
      nodeType: 'H3',
      text: 'Brio Heading 3',
    },
    {
      id: 'H4-id',
      nodeType: 'H4',
      text: 'Brio Heading 4',
    },
    {
      id: 'H5-id',
      nodeType: 'H5',
      text: 'Brio Heading 5',
    },
    {
      id: 'Paragraph-id',
      nodeType: 'Paragraph',
      text: 'Brio Paragraph',
    },

    // Segments

    {
      id: encodeBase64('Namn och Adress'),
      nodeType: 'Segment',
      text: 'Dessa uppgifter har vi inhämtat från folkbokföringsregistret. Vid behov av ändring vänligen kontakta Skatteverket.',
      subNodes: [
        {
          id: 'namn',
          nodeType: 'ListItem',
          text: 'Namn',
          value: 'Anders Andersson',
        },
        {
          id: 'nin',
          nodeType: 'ListItem',
          text: 'Personnummer',
          value: '9001019876',
        },
        {
          id: 'adress',
          nodeType: 'ListItem',
          text: 'Adress',
          value: 'Väggatan 12',
        },
        {
          id: 'postadress',
          nodeType: 'ListItem',
          text: 'Postadress',
          value: '12345 Stockholm',
        },
      ],
    },

    // Hyperlinks

    {
      id: encodeBase64('https://www.youtube.com/watch?v=DKP16d_WdZM'),
      nodeType: 'Hyperlink',
      text: 'The Uruks turn northeast',
      value: "They're taking the hobbits to Isengard!",
    },

    // Conditionals

    {
      id: 'Conditionals',
      nodeType: 'H3',
      text: 'Conditionals',
    },
    {
      id: 'DisplayConditional',
      nodeType: 'RadioButtonsYesNo',
      text: 'Display Conditional',
      helpText: 'Select yes to display conditional',
      options: [
        { id: 'True', text: '#Yes#' },
        { id: 'False', text: '#No#' },
      ],
      value: 'True',
    },
    {
      id: 'ConditionalDiv',
      nodeType: 'Div',
      condition: {
        valueType: 'Text',
        lhs: 'DisplayConditional',
        rhs: 'True',
        op: 'Equals',
        statements: [
          {
            returnValue: 'True',
          },
        ],
      },
      subNodes: [
        {
          id: 'ConditionalH3',
          nodeType: 'H3',
          text: 'Conditional Heading 3',
        },
        {
          id: 'ConditionalTextArea',
          nodeType: 'TextArea',
          text: 'Conditional TextArea',
          value:
            'Ash nazg durbatulûk,\nash nazg gimbatul,\nAsh nazg thrakatulûk\nagh burzum-ishi krimpatul.',
        },
        {
          id: 'DisplayNestedConditional',
          nodeType: 'ButtonSwitchYesNo',
          text: 'Display Nested Conditional',
          helpText: 'Select yes to display nested conditional',
          options: [
            { id: 'True', text: '#Yes#' },
            { id: 'False', text: '#No#' },
          ],
          value: 'True',
        },
        {
          id: 'NestedConditionalDiv',
          nodeType: 'Div',
          condition: {
            valueType: 'Text',
            lhs: 'DisplayNestedConditional',
            rhs: 'True',
            op: 'Equals',
            statements: [
              {
                returnValue: 'True',
              },
            ],
          },
          subNodes: [
            {
              id: 'NestedConditionalH4',
              nodeType: 'H4',
              text: 'Nested Conditional Heading 4',
            },
            {
              id: 'NestedConditionalTextArea',
              nodeType: 'TextArea',
              text: 'Nested Conditional TextArea',
              value:
                'Two households, both alike in dignity\n(In fair Verona, where we lay our scene),\nFrom ancient grudge break to new mutiny,\nWhere civil blood makes civil hands unclean.\nFrom forth the fatal loins of these two foes\nA pair of star-crossed lovers take their life;\nWhose misadventured piteous overthrows\nDoth with their death bury their parents’ strife.\nThe fearful passage of their death-marked love\nAnd the continuance of their parents’ rage,\nWhich, but their children’s end, naught could remove,\nIs now the two hours’ traffic of our stage;\nThe which, if you with patient ears attend,\nWhat here shall miss, our toil shall strive to mend.',
            },
          ],
        },
      ],
    },
  ],
}
