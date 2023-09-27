import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioRadioButtons } from './BrioRadioButtons'

export default {
  title: 'Brio Node Types/BrioRadioButtons',
  component: BrioRadioButtons,
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
      { id: 'one', text: 'One' },
      { id: 'two', text: 'Two' },
      { id: 'three', text: 'Three' },
    ],
  },
} as ComponentMeta<typeof BrioRadioButtons>

const Template: ComponentStory<typeof BrioRadioButtons> = args => <BrioRadioButtons {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithChecked = Template.bind({})
WithChecked.args = {
  value: 'one',
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value: 'three',
  readOnly: true,
}
