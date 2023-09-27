import { ComponentMeta, ComponentStory } from '@storybook/react'
import { UserNotLoggedInBanner } from './UserNotLoggedInBanner'

export default {
  title: 'Banners/UserNotLoggedInBanner',
  component: UserNotLoggedInBanner,
  argTypes: {},
} as ComponentMeta<typeof UserNotLoggedInBanner>

const Template: ComponentStory<typeof UserNotLoggedInBanner> = args => (
  <UserNotLoggedInBanner {...args} />
)

export const Default = Template.bind({})
Default.args = {}
