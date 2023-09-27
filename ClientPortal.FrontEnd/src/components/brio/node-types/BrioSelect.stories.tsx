import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioSelect } from './BrioSelect'

export default {
  title: 'Brio Node Types/BrioSelect',
  component: BrioSelect,
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
} as ComponentMeta<typeof BrioSelect>

const Template: ComponentStory<typeof BrioSelect> = args => <BrioSelect {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithValue = Template.bind({})
WithValue.args = {
  value: 'two',
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value: 'three',
  readOnly: true,
}
