import { TFunction } from 'i18next'
import {
  BrioNode,
  BrioNodeOption,
  CountriesResponse,
  PersonIdentificationType,
  PersonResponse,
} from '../../../types'
import {
  FatcaInformationInfoModalText,
  TaxInformationInfoModalText,
} from './tax-information-more-info'

const identificationTypeFilter = (id: PersonIdentificationType) => id !== 'NationalIdConcat'

const citizenshipIdentifiers = ['NationalIdPassport', 'NationalIdRegNo', 'NationalRegNo']
const taxIdentifiers = ['TaxIdNumber', 'UniqueTaxIdNumber']

type Options = {
  t: TFunction<'questionnaires'>
  countries: CountriesResponse
  person: PersonResponse
}

export const getPage2 = ({ t, countries, person }: Options): BrioNode[] => {
  const countryOptions: BrioNodeOption[] = countries.items.map(x => ({
    id: x.countryCode,
    text: x.name,
  }))

  // lists

  const citizenshipCountriesNinList = countries.items.filter(
    x => !!x.identificationType.filter(identificationTypeFilter).length,
  )

  const primaryTaxCountriesTinList = countries.items
    .filter(x => x.tin === true)
    .filter(x => x.countryCode !== 'SE')

  const moreTaxCountriesTinList = countries.items
    .filter(x => x.tin === true)
    .filter(x => x.countryCode !== 'SE')
    .filter(x => x.countryCode !== 'US')

  const personNinList = person.identifications.filter(x => citizenshipIdentifiers.includes(x.type))

  const personTinList = person.identifications.filter(x => taxIdentifiers.includes(x.type))

  // values

  const personCitizenships =
    countries.items
      .filter(x => person.citizenships.map(x => x.countryCode).includes(x.countryCode))
      .map(x => x.countryCode) || []

  const personPrimaryTaxCountry = person.primaryTaxCountry?.countryCode

  const personUsaSpecificTin = personTinList.find(x => x.country.countryCode === 'US')?.identifier

  const personMoreTaxCountries =
    countries.items
      .filter(x => personTinList.map(x => x.country.countryCode).includes(x.countryCode))
      .filter(x => x.countryCode !== personPrimaryTaxCountry)
      .filter(x => x.countryCode !== 'US')
      .map(x => x.countryCode) || []

  // result

  return [
    {
      id: 'h3',
      nodeType: 'H3',
      text: t('baseInfo.page2.citizenshipAndTaxResidence'),
    },

    {
      id: 'citizenships',
      nodeType: 'DropDownListAddMore',
      options: countryOptions,
      text: t('baseInfo.page2.whichCitizenships'),
      value: personCitizenships,
    },

    // Creates conditional for all NIN countries

    ...citizenshipCountriesNinList.map<BrioNode>(x => ({
      id: `div_nin_${x.countryCode}`,
      nodeType: 'Div',
      condition: {
        statements: [
          {
            lhs: 'citizenships',
            op: 'Contains',
            rhs: x.countryCode,
            statements: [{ returnValue: 'True' }],
            valueType: 'Option',
          },
        ],
      },
      subNodes: [
        {
          id: `identification__${x.countryCode}`,
          nodeType: 'TextBox',
          text: t('baseInfo.page2.inputIdentificationFor', { country: x.name }),
          value: personNinList.find(i => i.country.countryCode === x.countryCode)?.identifier,
        },
        {
          id: `identification__type__${x.countryCode}`,
          nodeType: 'DropDownList',
          options: x.identificationType.filter(identificationTypeFilter).map(id => ({
            id,
            text: t(`identificationTypes.${id}` as any, { ns: 'questionnaires' }),
          })),
          readOnly: x.identificationType.filter(identificationTypeFilter).length === 1,
          text: t('baseInfo.page2.identificationType'),
          value:
            personNinList.find(i => i.country.countryCode === x.countryCode)?.type ||
            x.identificationType[0],
        },
      ],
    })),

    {
      id: 'primary_tax_country',
      nodeType: 'DropDownList',
      options: countryOptions,
      text: t('baseInfo.page2.whichTaxResidence'),
      value: personPrimaryTaxCountry,
      helpText: TaxInformationInfoModalText(t),
      helpTitle: t('baseInfo.page2.whichTaxResidenceMoreInfoTitle'),
    },

    ...primaryTaxCountriesTinList.map<BrioNode>(x => ({
      id: `div_primary_tin_${x.countryCode}`,
      nodeType: 'Div',
      condition: {
        statements: [
          {
            lhs: 'primary_tax_country',
            op: 'Equals',
            rhs: x.countryCode,
            statements: [{ returnValue: 'True' }],
            valueType: 'Option',
          },
        ],
      },
      subNodes: [
        {
          id: `primary__tin__${x.countryCode}`,
          nodeType: 'TextBox',
          text: t('baseInfo.page2.inputTinFor', { country: x.name }),
          value: personTinList.find(i => i.country.countryCode === x.countryCode)?.identifier,
        },
      ],
    })),

    {
      id: 'usa_specific',
      nodeType: 'RadioButtonsYesNo',
      text: t('baseInfo.page2.usaSpecific'),
      helpText: FatcaInformationInfoModalText(t),
      helpTitle: t('baseInfo.page2.usaSpecificMoreInfoTitle'),
      options: [
        {
          id: 'True',
          text: '#Yes#',
        },
        {
          id: 'False',
          text: '#No#',
        },
      ],
      value: personUsaSpecificTin ? 'True' : 'False',
      defaultValue: '#No#',
    },
    {
      id: 'div_usa_specific',
      nodeType: 'Div',
      condition: {
        statements: [
          {
            lhs: 'usa_specific',
            op: 'Equals',
            rhs: 'True',
            statements: [{ returnValue: 'True' }],
            valueType: 'Text',
          },
        ],
      },
      subNodes: [
        {
          id: 'usa_specific_tin',
          nodeType: 'TextBox',
          text: t('baseInfo.page2.usaSpecificTin'),
          value: personUsaSpecificTin,
        },
      ],
    },

    {
      id: 'more_tax_countries_yes_no',
      nodeType: 'RadioButtonsYesNo',
      text: t('baseInfo.page2.moreTaxResidences'),
      options: [
        {
          id: 'True',
          text: '#Yes#',
        },
        {
          id: 'False',
          text: '#No#',
        },
      ],
      value: personMoreTaxCountries.length ? 'True' : 'False',
      defaultValue: '#No#',
    },
    {
      id: 'div_more_tax_countries_yes_no',
      nodeType: 'Div',
      condition: {
        statements: [
          {
            lhs: 'more_tax_countries_yes_no',
            op: 'Equals',
            rhs: 'True',
            statements: [
              {
                lhs: 'primary_tax_country',
                op: 'NotEquals',
                rhs: '',
                statements: [{ returnValue: 'True' }],
                valueType: 'Option',
              },
            ],
            valueType: 'Text',
          },
        ],
      },
      subNodes: [
        {
          id: 'more_tax_countries',
          nodeType: 'DropDownListAddMore',
          options: countryOptions,
          text: t('baseInfo.page2.pleaseAddMoreTaxResidences'),
          value: personMoreTaxCountries,
        },

        ...moreTaxCountriesTinList.map<BrioNode>(x => ({
          id: `div_tin_${x.countryCode}`,
          nodeType: 'Div',
          condition: {
            statements: [
              {
                lhs: 'more_tax_countries',
                op: 'Contains',
                rhs: x.countryCode,
                statements: [{ returnValue: 'True' }],
                valueType: 'Option',
              },
            ],
          },
          subNodes: [
            {
              id: `tin__${x.countryCode}`,
              nodeType: 'TextBox',
              text: t('baseInfo.page2.inputTinFor', { country: x.name }),
              value: personTinList.find(i => i.country.countryCode === x.countryCode)?.identifier,
            },
          ],
        })),
      ],
    },

    {
      id: 'confirmation',
      nodeType: 'CheckBox',
      text: t('baseInfo.page2.confirmationText'),
      defaultValue: '#Yes#',
    },
  ]
}
