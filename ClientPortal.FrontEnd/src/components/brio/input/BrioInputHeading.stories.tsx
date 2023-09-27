import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioInputHeading } from './BrioInputHeading'

export default {
  title: 'Brio Input/BrioInputHeading',
  component: BrioInputHeading,
  argTypes: {},
  args: {
    text: 'This is the label text',
    nodeType: 'H3',
  },
} as ComponentMeta<typeof BrioInputHeading>

const Template: ComponentStory<typeof BrioInputHeading> = args => <BrioInputHeading {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithHeading4 = Template.bind({})
WithHeading4.args = {
  nodeType: 'H4',
}

export const WithHeading5 = Template.bind({})
WithHeading5.args = {
  nodeType: 'H5',
}

export const WithHelpTextDrawer = Template.bind({})
WithHelpTextDrawer.args = {
  helpText: 'This is some help text that is hidden initially',
}
