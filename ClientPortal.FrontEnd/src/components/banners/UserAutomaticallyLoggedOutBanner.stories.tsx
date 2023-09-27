import { ComponentMeta, ComponentStory } from '@storybook/react'
import { UserAutomaticallyLoggedOutBanner } from './UserAutomaticallyLoggedOutBanner'

export default {
  title: 'Banners/UserAutomaticallyLoggedOutBanner',
  component: UserAutomaticallyLoggedOutBanner,
  argTypes: {},
} as ComponentMeta<typeof UserAutomaticallyLoggedOutBanner>

const Template: ComponentStory<typeof UserAutomaticallyLoggedOutBanner> = args => (
  <UserAutomaticallyLoggedOutBanner {...args} />
)

export const Default = Template.bind({})
Default.args = {}
