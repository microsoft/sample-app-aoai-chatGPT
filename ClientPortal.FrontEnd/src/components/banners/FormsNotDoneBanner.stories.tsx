import { ComponentMeta, ComponentStory } from '@storybook/react'
import { FormsNotDoneBanner } from './FormsNotDoneBanner'

export default {
  title: 'Banners/FormsNotDoneBanner',
  component: FormsNotDoneBanner,
  argTypes: {},
} as ComponentMeta<typeof FormsNotDoneBanner>

const Template: ComponentStory<typeof FormsNotDoneBanner> = args => <FormsNotDoneBanner {...args} />

export const Default = Template.bind({})
Default.args = {}
