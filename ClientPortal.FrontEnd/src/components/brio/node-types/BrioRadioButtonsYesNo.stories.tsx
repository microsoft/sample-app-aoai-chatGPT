import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioRadioButtonsYesNo } from './BrioRadioButtonsYesNo'

export default {
  title: 'Brio Node Types/BrioRadioButtonsYesNo',
  component: BrioRadioButtonsYesNo,
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
} as ComponentMeta<typeof BrioRadioButtonsYesNo>

const Template: ComponentStory<typeof BrioRadioButtonsYesNo> = args => (
  <BrioRadioButtonsYesNo {...args} />
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
