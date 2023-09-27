import { FC } from 'react'
import { QuestionnaireStatus } from '../../enums'
import { AllFormsDoneBanner } from '../banners/AllFormsDoneBanner'
import { ContactDetailsRequiredBanner } from '../banners/ContactDetailsRequiredBanner'
import { FormsCreatingBanner } from '../banners/FormsCreatingBanner'
import { FormsNotDoneBanner } from '../banners/FormsNotDoneBanner'
import { FormsNotLoadedBanner } from '../banners/FormsNotLoadedBanner'
import { ManualHandlingRequiredBanner } from '../banners/ManualHandlingRequiredBanner'
import { FormListItemProps } from '../form-list/FormListItem'

type Props = {
  email?: string
  forms: Array<Partial<FormListItemProps>>
  formsTimeout?: boolean
  isProspect?: boolean
  phoneNumber?: string
}

export const DashboardBanner: FC<Props> = ({
  email,
  forms,
  formsTimeout = false,
  isProspect = false,
  phoneNumber,
}) => {
  const creating = forms.some(x => x.status === QuestionnaireStatus.Creating)
  const done = forms.every(x => x.status === QuestionnaireStatus.Done)
  const manualHandling = forms.some(x => x.status === QuestionnaireStatus.ManualHandlingRequired)

  if (!email || !phoneNumber) {
    return <ContactDetailsRequiredBanner />
  }

  if (manualHandling) {
    return <ManualHandlingRequiredBanner />
  }

  if (creating && formsTimeout) {
    return <FormsNotLoadedBanner />
  }

  if (creating) {
    return <FormsCreatingBanner />
  }

  if (done) {
    return <AllFormsDoneBanner isProspect={isProspect} />
  }

  return <FormsNotDoneBanner />
}
