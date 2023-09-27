import { ComponentMeta, ComponentStory } from '@storybook/react'
import { AllFormsDoneBanner } from './AllFormsDoneBanner'

export default {
  title: 'Banners/AllFormsDoneBanner',
  component: AllFormsDoneBanner,
  argTypes: {},
  args: {
    isProspect: true,
  },
} as ComponentMeta<typeof AllFormsDoneBanner>

const Template: ComponentStory<typeof AllFormsDoneBanner> = args => <AllFormsDoneBanner {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithCustomer = Template.bind({})
WithCustomer.args = {
  isProspect: false,
}

export const WithProspect = Template.bind({})
WithProspect.args = {
  isProspect: true,
}
