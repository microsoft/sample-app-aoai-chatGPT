import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioTextBox } from './BrioTextBox'

export default {
  title: 'Brio Node Types/BrioTextBox',
  component: BrioTextBox,
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
  },
} as ComponentMeta<typeof BrioTextBox>

const Template: ComponentStory<typeof BrioTextBox> = args => <BrioTextBox {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithValue = Template.bind({})
WithValue.args = {
  value: 'One ring to rule them all',
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value: 'One ring to bind them',
  readOnly: true,
}
