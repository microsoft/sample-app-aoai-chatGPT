import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioReadNode } from './BrioReadNode'

export default {
  title: 'Brio Read/BrioReadNode',
  component: BrioReadNode,
  decorators: [
    Story => (
      <BrioFormContextProvider>
        <BrioForm>
          <Story />
        </BrioForm>
      </BrioFormContextProvider>
    ),
  ],
  argTypes: {},
  args: {
    id: 'radioButtons-id',
    nodeType: 'RadioButtons',
    questionId: 'radioButtons-id',
    text: 'this is a radio button',
    helpText: 'This is helper text',
    readOnly: false,
    value: 'no',
    options: [
      { id: 'yes', text: 'Yes' },
      { id: 'no', text: 'No' },
    ],
  },
} as ComponentMeta<typeof BrioReadNode>

const Template: ComponentStory<typeof BrioReadNode> = args => <BrioReadNode {...args} />

export const Default = Template.bind({})
Default.args = {}
