import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioDropDownListMulti } from './BrioDropDownListMulti'

export default {
  title: 'Brio Node Types/BrioDropDownListMulti',
  component: BrioDropDownListMulti,
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
} as ComponentMeta<typeof BrioDropDownListMulti>

const Template: ComponentStory<typeof BrioDropDownListMulti> = args => (
  <BrioDropDownListMulti {...args} />
)

export const Default = Template.bind({})
Default.args = {}

export const WithValues = Template.bind({})
WithValues.args = {
  value: ['two', 'three'],
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value: ['three'],
  readOnly: true,
}
