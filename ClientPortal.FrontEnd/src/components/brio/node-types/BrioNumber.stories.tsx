import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioNumber } from './BrioNumber'

export default {
  title: 'Brio Node Types/BrioNumber',
  component: BrioNumber,
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
} as ComponentMeta<typeof BrioNumber>

const Template: ComponentStory<typeof BrioNumber> = args => <BrioNumber {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithValue = Template.bind({})
WithValue.args = {
  value: 12,
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value: 10000,
  readOnly: true,
}
