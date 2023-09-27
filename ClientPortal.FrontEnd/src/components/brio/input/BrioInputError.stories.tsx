import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioInputError } from './BrioInputError'

export default {
  title: 'Brio Input/BrioInputError',
  component: BrioInputError,
  argTypes: {},
  args: {
    error: new Error('Error message'),
  },
} as ComponentMeta<typeof BrioInputError>

const Template: ComponentStory<typeof BrioInputError> = args => <BrioInputError {...args} />

export const Default = Template.bind({})
Default.args = {}
