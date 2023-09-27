import { FlexCol, Heading3 } from '@carnegie/duplo'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { ContactDetailsContainer } from '../../containers/ContactDetailsContainer'
import { DashboardBannerContainer } from '../../containers/DashboardBannerContainer'
import { FormListContainer } from '../../containers/FormListContainer'
import { useUser } from '../../context'
import { safelyParse } from '../../utils/safely-parse'

export const DashboardPage: FC = () => {
  const { id, isProspect } = useUser()
  const { t } = useTranslation('common')
  const debug = safelyParse(window.ENV?.DEBUG)

  return (
    <FlexCol gap={24}>
      <Heading3>{t('nouns.welcome')}</Heading3>
      <DashboardBannerContainer customerId={id} debug={debug} isProspect={isProspect} />
      <ContactDetailsContainer customerId={id} debug={debug} />
      <FormListContainer customerId={id} debug={debug} />
    </FlexCol>
  )
}
