import { TFunction } from 'i18next'
import { BrioNode, PersonResponse } from '../../../types'
import { encodeBase64 } from '../../base64'

type Options = {
  t: TFunction<'questionnaires'>
  person: PersonResponse
}

export const getPage1 = ({ t, person }: Options): BrioNode[] => {
  const name = person.name
  const identification = person.identifications.find(x => x.type === 'NationalRegNo')
  const domicileAddress = person.addresses.find(x => x.isDomicile)
  const preferredAddress = person.addresses.find(x => x.isPreferred)

  if (!domicileAddress && !preferredAddress) {
    throw new Error('No domicile nor preferred address found')
  }

  return [
    {
      id: 'h3',
      nodeType: 'H3',
      text: t('baseInfo.page1.personalData'),
    },
    {
      id: encodeBase64(t('baseInfo.page1.nameAndAddress')),
      nodeType: 'Segment',
      text: t('baseInfo.page1.populationRegisterText'),
      subNodes: [
        {
          id: 'namn',
          nodeType: 'ListItem',
          text: t('baseInfo.page1.name'),
          value: name,
        },
        {
          id: 'nin',
          nodeType: 'ListItem',
          text: t('baseInfo.page1.ssn'),
          value: identification?.identifier,
        },
        {
          id: 'adress',
          nodeType: 'ListItem',
          text: t('baseInfo.page1.address'),
          value: domicileAddress?.address1,
        },
        {
          id: 'postadress',
          nodeType: 'ListItem',
          text: t('baseInfo.page1.postalAddress'),
          value: `${domicileAddress?.postalCode ?? ''} ${domicileAddress?.city ?? ''}`,
        },
      ],
    },

    ...((preferredAddress && preferredAddress.id !== domicileAddress?.id
      ? [
          {
            id: encodeBase64(t('baseInfo.page1.preferredAddress')),
            nodeType: 'Segment',
            text: t('baseInfo.page1.registeredAddressText'),
            subNodes: [
              {
                id: 'adress',
                nodeType: 'ListItem',
                text: t('baseInfo.page1.address'),
                value: preferredAddress.address1,
              },
              {
                id: 'postadress',
                nodeType: 'ListItem',
                text: t('baseInfo.page1.postalAddress'),
                value: `${preferredAddress.postalCode} ${preferredAddress.city}`,
              },
            ],
          },
        ]
      : []) satisfies BrioNode[]),

    {
      id: encodeBase64('https://www.carnegie.se/behandling-av-personuppgifter/'),
      nodeType: 'Hyperlink',
      text: t('baseInfo.page1.doYouWantToKnowMore'),
      value: t('baseInfo.page1.privacyPolicy'),
    },
  ]
}
