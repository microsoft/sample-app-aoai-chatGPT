import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioButtonSwitchYesNo } from './BrioButtonSwitchYesNo'

export default {
  title: 'Brio Node Types/BrioButtonSwitchYesNo',
  component: BrioButtonSwitchYesNo,
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
      { id: 'True', text: '#Yes#' },
      { id: 'False', text: '#No#' },
    ],
  },
} as ComponentMeta<typeof BrioButtonSwitchYesNo>

const Template: ComponentStory<typeof BrioButtonSwitchYesNo> = args => (
  <BrioButtonSwitchYesNo {...args} />
)

export const Default = Template.bind({})
Default.args = {}

export const WithValue = Template.bind({})
WithValue.args = {
  value: 'True',
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value: 'False',
  readOnly: true,
}
