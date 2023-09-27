import { IconAtSign } from '@carnegie/duplo'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import { ContactDetailsItem } from './ContactDetailsItem'

export default {
  title: 'Contact Details/ContactDetailsItem',
  component: ContactDetailsItem,
  argTypes: {},
  args: {
    icon: IconAtSign,
    value: 'test@email.com',
  },
} as ComponentMeta<typeof ContactDetailsItem>

const Template: ComponentStory<typeof ContactDetailsItem> = args => <ContactDetailsItem {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithMissingValue = Template.bind({})
WithMissingValue.args = {
  value: undefined,
}
