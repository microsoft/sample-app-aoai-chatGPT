import { FieldValues } from 'react-hook-form'
import { BffBaseInfoRequestBody } from '../../types'

const countryCodeNotEmpty = (countryCode: string) =>
  !!countryCode && countryCode.length >= 2 && countryCode.length <= 3

export const toBffBaseInfoValues = (fieldValues: FieldValues): BffBaseInfoRequestBody => ({
  citizenships: fieldValues.citizenships.filter(countryCodeNotEmpty).map((countryCode: string) => ({
    countryCode,
    identifier: fieldValues[`identification__${countryCode}`] || '0',
    /**
     * SWEDEN IS SPECIAL AND HANDLED IN THE BFF
     *
     * Pick identifier type if it is set.
     * If country is sweden we will default to NIDN
     * Otherwise we default to CONCAT
     */
    identifierType: fieldValues[`identification__type__${countryCode}`]
      ? fieldValues[`identification__type__${countryCode}`]
      : countryCode === 'SE'
      ? 'NationalIdRegNo'
      : 'NationalIdConcat',
  })),
  taxCountries: [
    {
      countryCode: fieldValues.primary_tax_country,
      tin: fieldValues[`primary__tin__${fieldValues.primary_tax_country}`] || '0',
      primary: true,
    },

    ...(fieldValues.more_tax_countries || [])
      .filter(countryCodeNotEmpty)
      .map((countryCode: string) => ({
        countryCode,
        tin: fieldValues[`tin__${countryCode}`] || '0',
        primary: false,
      })),

    /**
     * USA IS SPECIAL
     */
    ...(fieldValues.usa_specific_tin
      ? [
          {
            countryCode: 'US',
            tin: fieldValues.usa_specific_tin || '0',
            primary: false,
          },
        ]
      : []),
  ],
  confirmation: fieldValues.confirmation,
})
