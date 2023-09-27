import { ComponentMeta, ComponentStory } from '@storybook/react'
import { QuestionnaireStatus } from '../../enums'
import { FormListItem } from './FormListItem'

export default {
  title: 'Forms/FormListItem',
  component: FormListItem,
  decorators: [Story => <Story />],
  argTypes: {},
  args: {
    label: 'Frågor om dig som kund',
    number: 1,
    status: QuestionnaireStatus.Pending,
    title: 'Kundkännedom',
  },
} as ComponentMeta<typeof FormListItem>

const Template: ComponentStory<typeof FormListItem> = args => <FormListItem {...args} />

export const Default = Template.bind({})
Default.args = {}

export const WithPreCreation = Template.bind({})
WithPreCreation.args = {
  status: QuestionnaireStatus.PreCreation,
}

export const WithCreating = Template.bind({})
WithCreating.args = {
  status: QuestionnaireStatus.Creating,
}

export const WithDone = Template.bind({})
WithDone.args = {
  status: QuestionnaireStatus.Done,
}

export const WithManualHandling = Template.bind({})
WithManualHandling.args = {
  status: QuestionnaireStatus.ManualHandlingRequired,
}
