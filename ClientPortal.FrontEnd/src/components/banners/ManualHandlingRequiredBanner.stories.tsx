import { ComponentMeta, ComponentStory } from '@storybook/react'
import { ManualHandlingRequiredBanner } from './ManualHandlingRequiredBanner'

export default {
  title: 'Banners/ManualHandlingRequiredBanner',
  component: ManualHandlingRequiredBanner,
  argTypes: {},
} as ComponentMeta<typeof ManualHandlingRequiredBanner>

const Template: ComponentStory<typeof ManualHandlingRequiredBanner> = args => (
  <ManualHandlingRequiredBanner {...args} />
)

export const Default = Template.bind({})
Default.args = {}
