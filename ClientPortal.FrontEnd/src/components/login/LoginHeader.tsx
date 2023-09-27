import { Flex, FlexCol } from '@carnegie/duplo'
import { FC } from 'react'
import { CarnegieLogoSmall } from '../../assets/CarnegieLogoSmall'
import { LoginSubtitle } from './LoginSubtitle'
import { LoginTitle } from './LoginTitle'

type Props = {
  title: string
  subtitle: string
}

export const LoginHeader: FC<Props> = ({ title, subtitle }) => (
  <FlexCol gap={16}>
    <Flex height={96} width={192} alignSelf="center" justifyContent="center">
      <CarnegieLogoSmall fill="#212D40" />
    </Flex>
    <LoginTitle title={title} />
    <LoginSubtitle subtitle={subtitle} />
  </FlexCol>
)
