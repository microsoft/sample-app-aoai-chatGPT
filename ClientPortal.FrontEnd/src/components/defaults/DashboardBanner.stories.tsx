import { ComponentMeta, ComponentStory } from '@storybook/react'
import { QuestionnaireStatus } from '../../enums'
import { DashboardBanner } from './DashboardBanner'

export default {
  title: 'Dashboard/DashboardBanner',
  component: DashboardBanner,
  argTypes: {},
  args: {
    email: 'email',
    forms: [
      {
        label: 'Grunduppgifter',
        status: QuestionnaireStatus.Pending,
        title: 'Grunduppgifter',
        onClick: () => undefined,
      },
      {
        label: 'Frågor kring mina behov',
        status: QuestionnaireStatus.Pending,
        title: 'Behovsanalys',
        onClick: () => undefined,
      },
    ],
    phoneNumber: 'phoneNumber',
  },
} as ComponentMeta<typeof DashboardBanner>

const Template: ComponentStory<typeof DashboardBanner> = args => <DashboardBanner {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithMissingContactDetails = Template.bind({})
WithMissingContactDetails.args = {
  email: undefined,
  forms: [
    {
      label: 'Detta är ett formulär',
      status: QuestionnaireStatus.Done,
      title: 'Kundkännedom',
      onClick: () => undefined,
    },
  ],
}

export const WithFormsNotLoaded = Template.bind({})
WithFormsNotLoaded.args = {
  forms: [
    {
      label: 'Detta är ett formulär',
      status: QuestionnaireStatus.Creating,
      title: 'Kundkännedom',
      onClick: () => undefined,
    },
  ],
  formsTimeout: true,
}

export const WithFormsCreating = Template.bind({})
WithFormsCreating.args = {
  forms: [
    {
      label: 'Detta är ett formulär',
      status: QuestionnaireStatus.Creating,
      title: 'Kundkännedom',
      onClick: () => undefined,
    },
  ],
}

export const WithManualHandling = Template.bind({})
WithManualHandling.args = {
  forms: [
    {
      label: 'Låst och stängd',
      status: QuestionnaireStatus.ManualHandlingRequired,
      title: 'Behovsanalys',
      onClick: () => undefined,
    },
  ],
}

export const WithAllFormsDone = Template.bind({})
WithAllFormsDone.args = {
  forms: [
    {
      label: 'Detta är ett formulär',
      status: QuestionnaireStatus.Done,
      title: 'Kundkännedom',
      onClick: () => undefined,
    },
  ],
}
