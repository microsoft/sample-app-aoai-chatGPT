import { ComponentMeta, ComponentStory } from '@storybook/react'
import { encodeBase64 } from '../../../utils/base64'
import { BrioHyperlink } from './BrioHyperlink'

export default {
  title: 'Brio Node Types/BrioHyperlink',
  component: BrioHyperlink,
  argTypes: {},
  args: {
    id: encodeBase64('https://www.youtube.com/watch?v=DKP16d_WdZM'),
    text: 'The Uruks turn northeast',
    value: "They're taking the hobbits to Isengard!",
  },
} as ComponentMeta<typeof BrioHyperlink>

const Template: ComponentStory<typeof BrioHyperlink> = args => <BrioHyperlink {...args} />

export const Default = Template.bind({})
Default.args = {}
