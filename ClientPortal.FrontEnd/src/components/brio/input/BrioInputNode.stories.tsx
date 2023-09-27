import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioInputNode } from './BrioInputNode'

export default {
  title: 'Brio Input/BrioInputNode',
  component: BrioInputNode,
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
} as ComponentMeta<typeof BrioInputNode>

const Template: ComponentStory<typeof BrioInputNode> = args => <BrioInputNode {...args} />

export const Default = Template.bind({})
Default.args = {}
