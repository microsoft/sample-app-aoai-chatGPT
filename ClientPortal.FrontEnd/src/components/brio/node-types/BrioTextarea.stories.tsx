import { ComponentMeta, ComponentStory } from '@storybook/react'
import { BrioForm } from '../form/BrioForm'
import { BrioFormContextProvider } from '../form/BrioFormContextProvider'
import { BrioTextarea } from './BrioTextarea'

export default {
  title: 'Brio Node Types/BrioTextarea',
  component: BrioTextarea,
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
    id: 'id',
    text: 'This is a label',
  },
} as ComponentMeta<typeof BrioTextarea>

const Template: ComponentStory<typeof BrioTextarea> = args => <BrioTextarea {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithValue = Template.bind({})
WithValue.args = {
  value:
    'Ash nazg durbatulûk,\nash nazg gimbatul,\nAsh nazg thrakatulûk\nagh burzum-ishi krimpatul.',
}

export const WithReadOnly = Template.bind({})
WithReadOnly.args = {
  value:
    'Two households, both alike in dignity\n(In fair Verona, where we lay our scene),\nFrom ancient grudge break to new mutiny,\nWhere civil blood makes civil hands unclean.\nFrom forth the fatal loins of these two foes\nA pair of star-crossed lovers take their life;\nWhose misadventured piteous overthrows\nDoth with their death bury their parents’ strife.\nThe fearful passage of their death-marked love\nAnd the continuance of their parents’ rage,\nWhich, but their children’s end, naught could remove,\nIs now the two hours’ traffic of our stage;\nThe which, if you with patient ears attend,\nWhat here shall miss, our toil shall strive to mend.',
  readOnly: true,
}
