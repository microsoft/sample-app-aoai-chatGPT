import { ComponentMeta, ComponentStory } from '@storybook/react'
import { FormsNotLoadedBanner } from './FormsNotLoadedBanner'

export default {
  title: 'Banners/FormsNotLoadedBanner',
  component: FormsNotLoadedBanner,
  argTypes: {},
} as ComponentMeta<typeof FormsNotLoadedBanner>

const Template: ComponentStory<typeof FormsNotLoadedBanner> = args => (
  <FormsNotLoadedBanner {...args} />
)

export const Default = Template.bind({})
Default.args = {}
