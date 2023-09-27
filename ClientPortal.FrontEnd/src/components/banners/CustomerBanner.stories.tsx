import { ComponentMeta, ComponentStory } from '@storybook/react'
import { CustomerBanner } from './CustomerBanner'

export default {
  title: 'Banners/CustomerBanner',
  component: CustomerBanner,
  argTypes: {},
  args: {
    email: 'anders@andersson.se',
    familyName: 'Andersson',
    givenName: 'Anders',
    nationalIdentityNumber: '195609069999',
    phone: '0701234567',
  },
} as ComponentMeta<typeof CustomerBanner>

const Template: ComponentStory<typeof CustomerBanner> = args => <CustomerBanner {...args} />

export const Default = Template.bind({})
Default.args = {}
