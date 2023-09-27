import { ComponentMeta, ComponentStory } from '@storybook/react'
import { ContactDetailsDrawer } from './ContactDetailsDrawer'

export default {
  title: 'Contact Details/ContactDetailsDrawer',
  component: ContactDetailsDrawer,
  argTypes: {},
  args: {
    email: 'test@carnegie.se',
    phoneNumber: '+46701234567',
    open: true,
    onClose: () => undefined,
    onSave: () => undefined,
  },
} as ComponentMeta<typeof ContactDetailsDrawer>

const Template: ComponentStory<typeof ContactDetailsDrawer> = args => (
  <ContactDetailsDrawer {...args} />
)

export const Default = Template.bind({})
Default.args = {}
