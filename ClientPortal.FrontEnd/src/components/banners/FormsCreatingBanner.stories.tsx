import { ComponentMeta, ComponentStory } from '@storybook/react'
import { FormsCreatingBanner } from './FormsCreatingBanner'

export default {
  title: 'Banners/FormsCreatingBanner',
  component: FormsCreatingBanner,
  argTypes: {},
} as ComponentMeta<typeof FormsCreatingBanner>

const Template: ComponentStory<typeof FormsCreatingBanner> = args => (
  <FormsCreatingBanner {...args} />
)

export const Default = Template.bind({})
Default.args = {}
