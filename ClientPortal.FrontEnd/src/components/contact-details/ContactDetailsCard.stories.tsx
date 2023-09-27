import { ComponentMeta, ComponentStory } from '@storybook/react'
import { ContactDetailsCard } from './ContactDetailsCard'

export default {
  title: 'Contact Details/ContactDetailsCard',
  component: ContactDetailsCard,
  argTypes: {},
  args: {
    email: 'test@carnegie.se',
    phoneNumber: '+46701234567',
    onClick: () => undefined,
  },
} as ComponentMeta<typeof ContactDetailsCard>

const Template: ComponentStory<typeof ContactDetailsCard> = args => <ContactDetailsCard {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithNoEdit = Template.bind({})
WithNoEdit.args = {
  onClick: undefined,
}

export const WithMissingEmail = Template.bind({})
WithMissingEmail.args = {
  email: undefined,
}
