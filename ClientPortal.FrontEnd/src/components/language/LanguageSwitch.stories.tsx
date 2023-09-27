import { ComponentMeta, ComponentStory } from '@storybook/react'
import { LanguageSwitch } from './LanguageSwitch'

export default {
  title: 'Language/LanguageSwitch',
  component: LanguageSwitch,
  argTypes: {},
} as ComponentMeta<typeof LanguageSwitch>

const Template: ComponentStory<typeof LanguageSwitch> = args => <LanguageSwitch {...args} />

export const Default = Template.bind({})
Default.args = {}
