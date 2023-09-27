import { ComponentMeta, ComponentStory } from '@storybook/react'
import { ContactUsToChangeBanner } from './ContactUsToChangeBanner'

export default {
  title: 'Banners/ContactUsToChangeBanner',
  component: ContactUsToChangeBanner,
  argTypes: {},
} as ComponentMeta<typeof ContactUsToChangeBanner>

const Template: ComponentStory<typeof ContactUsToChangeBanner> = args => (
  <ContactUsToChangeBanner {...args} />
)

export const Default = Template.bind({})
Default.args = {}
