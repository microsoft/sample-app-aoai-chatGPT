import { ComponentMeta, ComponentStory } from '@storybook/react'
import { CarnegieHeader } from './CarnegieHeader'

export default {
  title: 'Header/CarnegieHeader',
  component: CarnegieHeader,
  argTypes: {},
  args: {
    displayName: 'Sven-Marie Anderssonsdotter',
    isLoading: false,
    isLoggedIn: false,
    language: 'sv',
  },
} as ComponentMeta<typeof CarnegieHeader>

const Template: ComponentStory<typeof CarnegieHeader> = args => <CarnegieHeader {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithLoading = Template.bind({})
WithLoading.args = {
  isLoading: true,
}

export const WithLoggedIn = Template.bind({})
WithLoggedIn.args = {
  isLoggedIn: true,
}
