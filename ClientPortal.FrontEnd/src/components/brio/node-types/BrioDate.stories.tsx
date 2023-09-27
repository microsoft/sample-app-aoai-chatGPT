import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioDate } from './BrioDate'

export default {
  title: 'Brio Node Types/BrioDate',
  component: BrioDate,
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
} as ComponentMeta<typeof BrioDate>

const Template: ComponentStory<typeof BrioDate> = args => <BrioDate {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithValue = Template.bind({})
WithValue.args = {
  value: '1986-10-26',
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value: '2022-01-01',
  readOnly: true,
}
