import { ComponentMeta, ComponentStory } from '@storybook/react'
import { encodeBase64 } from '../../../utils/base64'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioSegment } from './BrioSegment'

export default {
  title: 'Brio Node Types/BrioSegment',
  component: BrioSegment,
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
    id: encodeBase64('Namn och Adress'),
    nodeType: 'Segment',
    text: 'Dessa uppgifter har vi inhämtat från folkbokföringsregistret. Vid behov av ändring vänligen kontakta Skatteverket.',
    subNodes: [
      {
        id: 'namn',
        nodeType: 'ListItem',
        text: 'Namn',
        value: 'Anders Andersson',
      },
      {
        id: 'nin',
        nodeType: 'ListItem',
        text: 'Personnummer',
        value: '9001019876',
      },
      {
        id: 'adress',
        nodeType: 'ListItem',
        text: 'Adress',
        value: 'Väggatan 12',
      },
      {
        id: 'postadress',
        nodeType: 'ListItem',
        text: 'Postadress',
        value: '12345 Stockholm',
      },
    ],
  },
} as ComponentMeta<typeof BrioSegment>

const Template: ComponentStory<typeof BrioSegment> = args => <BrioSegment {...args} />

export const Default = Template.bind({})
Default.args = {}
