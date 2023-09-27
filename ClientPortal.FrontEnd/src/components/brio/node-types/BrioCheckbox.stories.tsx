import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioCheckbox } from './BrioCheckbox'

export default {
  title: 'Brio Node Types/BrioCheckbox',
  component: BrioCheckbox,
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
} as ComponentMeta<typeof BrioCheckbox>

const Template: ComponentStory<typeof BrioCheckbox> = args => <BrioCheckbox {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithChecked = Template.bind({})
WithChecked.args = {
  value: true,
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value: true,
  readOnly: true,
}
