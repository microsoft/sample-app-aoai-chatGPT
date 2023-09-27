import { ComponentMeta, ComponentStory } from '@storybook/react'
import { QuestionnaireItemOrigin, QuestionnaireStatus } from '../../enums'
import { FormList } from './FormList'

export default {
  title: 'Forms/FormList',
  component: FormList,
  decorators: [Story => <Story />],
  argTypes: {},
  args: {
    title: 'Kunduppgifter',
    forms: [
      {
        label: 'Grunduppgifter',
        status: QuestionnaireStatus.Pending,
        title: 'Grunduppgifter',
        onClick: () => undefined,
        sortOrder: 1,
        origin: QuestionnaireItemOrigin.Trapets,
      },
      {
        label: 'Frågor om dig som kund',
        status: QuestionnaireStatus.Done,
        title: 'Kundkännedom',
        onClick: () => undefined,
        sortOrder: 1,
        origin: QuestionnaireItemOrigin.Trapets,
      },
      {
        label: 'Frågor kring mina behov',
        status: QuestionnaireStatus.Pending,
        title: 'Behovsanalys',
        onClick: () => undefined,
        sortOrder: 1,
        origin: QuestionnaireItemOrigin.Trapets,
      },
    ],
  },
} as ComponentMeta<typeof FormList>

const Template: ComponentStory<typeof FormList> = args => <FormList {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithEmptyForms = Template.bind({})
WithEmptyForms.args = {
  forms: [],
}

export const WithFormsPreCreation = Template.bind({})
WithFormsPreCreation.args = {
  forms: [
    {
      label: 'Inväntar mera',
      status: QuestionnaireStatus.PreCreation,
      title: 'Ska skapa kyc',
      onClick: () => undefined,
      sortOrder: 1,
      origin: QuestionnaireItemOrigin.Trapets,
    },
  ],
}

export const WithFormsCreating = Template.bind({})
WithFormsCreating.args = {
  forms: [
    {
      label: 'Inväntar mera',
      status: QuestionnaireStatus.Creating,
      title: 'Skapar KYC',
      onClick: () => undefined,
      sortOrder: 1,
      origin: QuestionnaireItemOrigin.Trapets,
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
      sortOrder: 1,
      origin: QuestionnaireItemOrigin.Trapets,
    },
  ],
}
