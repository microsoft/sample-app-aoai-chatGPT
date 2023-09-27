import { ComponentMeta, ComponentStory } from '@storybook/react'
import { ContactDetailsRequiredBanner } from './ContactDetailsRequiredBanner'

export default {
  title: 'Banners/ContactDetailsRequiredBanner',
  component: ContactDetailsRequiredBanner,
  argTypes: {},
} as ComponentMeta<typeof ContactDetailsRequiredBanner>

const Template: ComponentStory<typeof ContactDetailsRequiredBanner> = args => (
  <ContactDetailsRequiredBanner {...args} />
)

export const Default = Template.bind({})
Default.args = {}
