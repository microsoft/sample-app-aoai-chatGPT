import { ComponentMeta, ComponentStory } from '@storybook/react'
import { FormIncompleteBanner } from './FormIncompleteBanner'

export default {
  title: 'Banners/FormIncompleteBanner',
  component: FormIncompleteBanner,
  argTypes: {},
} as ComponentMeta<typeof FormIncompleteBanner>

const Template: ComponentStory<typeof FormIncompleteBanner> = args => (
  <FormIncompleteBanner {...args} />
)

export const Default = Template.bind({})
Default.args = {}
