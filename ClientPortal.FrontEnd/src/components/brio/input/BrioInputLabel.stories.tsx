import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioInputLabel } from './BrioInputLabel'

export default {
  title: 'Brio Input/BrioInputLabel',
  component: BrioInputLabel,
  argTypes: {},
  args: {
    text: 'This is the label text',
  },
} as ComponentMeta<typeof BrioInputLabel>

const Template: ComponentStory<typeof BrioInputLabel> = args => <BrioInputLabel {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithHelpTextDrawer = Template.bind({})
WithHelpTextDrawer.args = {
  helpText: 'This is some help text that is hidden initially',
}

export const WithError = Template.bind({})
WithError.args = {
  error: new Error('Error message'),
}
