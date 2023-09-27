import { ComponentMeta, ComponentStory } from '@storybook/react'
import { QuestionnaireItemOrigin, QuestionnaireStatus } from '../../../enums'
import { BrioInputFinalPage } from './BrioInputFinalPage'

export default {
  title: 'Brio Input/BrioInputFinalPage',
  component: BrioInputFinalPage,
  argTypes: {},
  args: {},
} as ComponentMeta<typeof BrioInputFinalPage>

const Template: ComponentStory<typeof BrioInputFinalPage> = args => <BrioInputFinalPage {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithButton = Template.bind({})
WithButton.args = {
  displayButton: true,
}

export const WithForms = Template.bind({})
WithForms.args = {
  forms: [
    {
      label: 'Frågor om dig som kund',
      status: QuestionnaireStatus.Creating,
      title: 'Kundkännedom',
      onClick: () => undefined,
      sortOrder: 2,
      origin: QuestionnaireItemOrigin.Trapets,
    },
  ],
}
