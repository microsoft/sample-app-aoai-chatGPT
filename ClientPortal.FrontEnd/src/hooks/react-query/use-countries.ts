import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CountriesResponse, Country } from '../../types'
import { useBff } from '../api/use-bff'

export const useCountries = (): UseQueryResult<CountriesResponse, Error> => {
  const bff = useBff()
  const { t } = useTranslation('countries')

  /**
   * Temporary mock until this endpoint has been created
   */
  const countries: Array<Omit<Country, 'name'>> = [
    {
      countryCode: 'SE',
      identificationType: [],
      tin: false,
    },
    {
      countryCode: 'AF',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'AL',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'DZ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'AS',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'AD',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'AO',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'AI',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'AQ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'AG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'AR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'AM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'AW',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'AU',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'AT',
      identificationType: ['NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'AZ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'BS',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'BH',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'BD',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BB',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'BY',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BE',
      identificationType: ['NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'BZ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'BJ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'BT',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BO',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BQ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BW',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BV',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'IO',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'BG',
      identificationType: ['NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'BF',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BI',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CV',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'KH',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'KY',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'CF',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TD',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CL',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'CN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'CX',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CC',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CO',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'KM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CD',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CK',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'CR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'HR',
      identificationType: ['NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'CU',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CW',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'CY',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'CZ',
      identificationType: ['NationalIdRegNo', 'NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'CI',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'DK',
      identificationType: ['NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'DJ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'DM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'DO',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'EC',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'EG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'SV',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'GQ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'ER',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'EE',
      identificationType: ['NationalIdRegNo'],
      tin: true,
    },
    {
      countryCode: 'SZ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'ET',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'FK',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'FO',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'FJ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'FI',
      identificationType: ['NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'FR',
      identificationType: ['NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'GF',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'PF',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TF',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'GA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'GM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'GE',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'DE',
      identificationType: ['NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'GH',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'GI',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'GR',
      identificationType: ['NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'GL',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'GD',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'GP',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'GU',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'GT',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'GG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'GN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'GW',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'GY',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'HT',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'HM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'VA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'HN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'HK',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'HU',
      identificationType: ['NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'IS',
      identificationType: ['NationalIdRegNo'],
      tin: true,
    },
    {
      countryCode: 'IN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'ID',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'IR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'IQ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'IE',
      identificationType: ['NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'IM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'IL',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'IT',
      identificationType: ['NationalIdRegNo'],
      tin: true,
    },
    {
      countryCode: 'JM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'JP',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'JE',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'JO',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'KZ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'KE',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'KI',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'KP',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'KR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'KW',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'KG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'LA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'LV',
      identificationType: ['NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'LB',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'LS',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'LR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'LY',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'LI',
      identificationType: ['NationalIdPassport', 'NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'LT',
      identificationType: ['NationalIdRegNo', 'NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'LU',
      identificationType: ['NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'MO',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'MG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MW',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MY',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'MV',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'ML',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MT',
      identificationType: ['NationalIdRegNo', 'NationalIdPassport'],
      tin: true,
    },
    {
      countryCode: 'MH',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'MQ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MU',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'YT',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MX',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'FM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MD',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MC',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'MN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'ME',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MS',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'MA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MZ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'NA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'NR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'NP',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'NL',
      identificationType: ['NationalIdPassport', 'NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'NC',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'NZ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'NI',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'NE',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'NG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'NU',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'NF',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'MP',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'NO',
      identificationType: ['NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'OM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'PK',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'PW',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'PS',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'PA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'PG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'PY',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'PE',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'PH',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'PN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'PL',
      identificationType: ['NationalIdRegNo', 'NationalIdPassport'],
      tin: true,
    },
    {
      countryCode: 'PT',
      identificationType: ['NationalIdRegNo', 'NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'PR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'QA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'MK',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'RO',
      identificationType: ['NationalIdRegNo', 'NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'RU',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'RW',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'RE',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'BL',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'SH',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'KN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'LC',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'MF',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'PM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'VC',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'WS',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'SM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'ST',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'SA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'SN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'RS',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'SC',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'SL',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'SG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'SX',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'SK',
      identificationType: ['NationalIdRegNo', 'NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'SI',
      identificationType: ['NationalIdRegNo', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'SB',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'SO',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'ZA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'GS',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'SS',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'ES',
      identificationType: ['NationalIdRegNo'],
      tin: true,
    },
    {
      countryCode: 'LK',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'SD',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'SR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'SJ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'CH',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'SY',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TW',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TJ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TZ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TH',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TL',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TK',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TO',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TT',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'TN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TR',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'TM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'TC',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'TV',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'UG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'UA',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'AE',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'GB',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'UM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'US',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'UY',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'UZ',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'VU',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'VE',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'VN',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'VG',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: true,
    },
    {
      countryCode: 'VI',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'WF',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'EH',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'YE',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'ZM',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'ZW',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
    {
      countryCode: 'AX',
      identificationType: ['NationalIdPassport', 'NationalIdConcat'],
      tin: false,
    },
  ]

  const items: Country[] = countries.map(x => ({ ...x, name: t(x.countryCode as any) }))

  return {
    data: { items },
    error: undefined,
    isLoading: false,
  } as unknown as UseQueryResult<CountriesResponse, Error>

  return useQuery<CountriesResponse, Error>({
    cacheTime: 360000,
    queryKey: ['use-countries'],
    queryFn: () =>
      bff.get<CountriesResponse>('/countries').then(({ data }) => ({
        ...data,
        items: data.items?.map(x => ({ ...x, name: t(x.countryCode as any) })),
      })),
  })
}
