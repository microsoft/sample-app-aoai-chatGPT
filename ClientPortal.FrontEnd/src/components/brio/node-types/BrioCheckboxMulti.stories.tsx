import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioCheckboxMulti } from './BrioCheckboxMulti'

export default {
  title: 'Brio Node Types/BrioCheckboxMulti',
  component: BrioCheckboxMulti,
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
} as ComponentMeta<typeof BrioCheckboxMulti>

const Template: ComponentStory<typeof BrioCheckboxMulti> = args => <BrioCheckboxMulti {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithChecked = Template.bind({})
WithChecked.args = {
  value: ['one', 'two'],
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value: ['three'],
  readOnly: true,
}
