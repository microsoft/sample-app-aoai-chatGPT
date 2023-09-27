import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioDropDownListAddMore } from './BrioDropDownListAddMore'

export default {
  title: 'Brio Node Types/BrioDropDownListAddMore',
  component: BrioDropDownListAddMore,
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
  args: {
    id: 'id',
    text: 'This is a label',
    options: [
      { id: '1', text: 'One' },
      { id: '2', text: 'Two' },
      { id: '3', text: 'Three' },
      { id: '4', text: 'Four' },
      { id: '5', text: 'Five' },
    ],
  },
} as ComponentMeta<typeof BrioDropDownListAddMore>

const Template: ComponentStory<typeof BrioDropDownListAddMore> = args => (
  <BrioDropDownListAddMore {...args} />
)

export const Default = Template.bind({})
Default.args = {}

export const WithValue = Template.bind({})
WithValue.args = {
  value: ['2', '3'],
}

export const WithEmptyValue = Template.bind({})
WithEmptyValue.args = {
  value: undefined,
}

export const WithEmptyArrayValue = Template.bind({})
WithEmptyArrayValue.args = {
  value: [],
}

export const WithEmptyStringValue = Template.bind({})
WithEmptyStringValue.args = {
  value: '',
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value: ['2', '3'],
  readOnly: true,
}
