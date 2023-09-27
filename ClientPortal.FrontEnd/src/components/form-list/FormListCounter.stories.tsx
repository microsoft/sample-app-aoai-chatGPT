import { ComponentMeta, ComponentStory } from '@storybook/react'
import { QuestionnaireStatus } from '../../enums'
import { FormListCounter } from './FormListCounter'

export default {
  title: 'Forms/FormListCounter',
  component: FormListCounter,
  decorators: [Story => <Story />],
  argTypes: {},
  args: {
    forms: [
      {
        label: 'Frågor om dig som kund',
        number: 1,
        status: QuestionnaireStatus.Done,
        title: 'Kundkännedom',
        onClick: () => undefined,
      },
      {
        label: 'Frågor kring mina behov',
        number: 2,
        status: QuestionnaireStatus.Pending,
        title: 'Behovsanalys',
        onClick: () => undefined,
      },
    ],
  },
} as ComponentMeta<typeof FormListCounter>

const Template: ComponentStory<typeof FormListCounter> = args => <FormListCounter {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithAllDone = Template.bind({})
WithAllDone.args = {
  forms: [
    {
      label: 'Frågor om dig som kund',
      number: 1,
      status: QuestionnaireStatus.Done,
      title: 'Kundkännedom',
      onClick: () => undefined,
    },
    {
      label: 'Frågor kring mina behov',
      number: 2,
      status: QuestionnaireStatus.Done,
      title: 'Behovsanalys',
      onClick: () => undefined,
    },
  ],
}

export const WithNoneDone = Template.bind({})
WithNoneDone.args = {
  forms: [
    {
      label: 'Frågor om dig som kund',
      number: 1,
      status: QuestionnaireStatus.Pending,
      title: 'Kundkännedom',
      onClick: () => undefined,
    },
    {
      label: 'Frågor kring mina behov',
      number: 2,
      status: QuestionnaireStatus.Pending,
      title: 'Behovsanalys',
      onClick: () => undefined,
    },
  ],
}
