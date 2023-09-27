import { toBffBaseInfoValues } from './to-bff-base-info-values'

describe('toBffBaseInfoValues', () => {
  test('should resolve with specific citizenship data', () => {
    expect(
      toBffBaseInfoValues({
        citizenships: ['CZ'],
        confirmation: true,
        more_tax_countries: [],
        primary_tax_country: 'SE',
        usa_specific_tin: undefined,
        usa_specific: 'False',

        identification__CZ: 'CZ145124',
        identification__type__CZ: 'NationalIdPassport',
      }),
    ).toStrictEqual({
      citizenships: [
        {
          countryCode: 'CZ',
          identifier: 'CZ145124',
          identifierType: 'NationalIdPassport',
        },
      ],
      taxCountries: [
        {
          countryCode: 'SE',
          tin: '0',
          primary: true,
        },
      ],
      confirmation: true,
    })
  })

  test('should resolve with automatic data for sweden', () => {
    expect(
      toBffBaseInfoValues({
        citizenships: ['SE'],
        confirmation: true,
        more_tax_countries: [],
        primary_tax_country: 'SE',
        usa_specific_tin: undefined,
        usa_specific: 'False',
      }),
    ).toStrictEqual({
      citizenships: [
        {
          countryCode: 'SE',
          identifier: '0',
          identifierType: 'NationalIdRegNo',
        },
      ],
      taxCountries: [
        {
          countryCode: 'SE',
          tin: '0',
          primary: true,
        },
      ],
      confirmation: true,
    })
  })

  test('should resolve with automatic data for germany', () => {
    expect(
      toBffBaseInfoValues({
        citizenships: ['DE'],
        confirmation: true,
        more_tax_countries: [],
        primary_tax_country: 'SE',
        usa_specific_tin: undefined,
        usa_specific: 'False',
      }),
    ).toStrictEqual({
      citizenships: [
        {
          countryCode: 'DE',
          identifier: '0',
          identifierType: 'NationalIdConcat',
        },
      ],
      taxCountries: [
        {
          countryCode: 'SE',
          tin: '0',
          primary: true,
        },
      ],
      confirmation: true,
    })
  })

  test('should filter extra data', () => {
    expect(
      toBffBaseInfoValues({
        'aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQ==':
          'Carnegies policy för personuppgifter',
        adress: 'Väggatan 21',
        citizenships: ['SE', 'DE', 'CZ', 'IE'],
        confirmation: true,
        more_tax_countries: [],
        namn: 'Amelin Bamsesson',
        nin: '190609069810',
        postadress: '123 45 Lund',
        primary_tax_country: 'SE',
        usa_specific_tin: undefined,
        usa_specific: 'False',

        identification__CZ: 'CZ145124',
        identification__IE: 'IE123451235',
        identification__IT: 'IE123451235',
        identification__type__CZ: 'NationalIdRegNo',
        identification__type__IE: 'NationalIdPassport',
        identification__type__IT: 'NationalIdPassport',
      }),
    ).toStrictEqual({
      citizenships: [
        {
          countryCode: 'SE',
          identifier: '0',
          identifierType: 'NationalIdRegNo',
        },
        {
          countryCode: 'DE',
          identifier: '0',
          identifierType: 'NationalIdConcat',
        },
        {
          countryCode: 'CZ',
          identifier: 'CZ145124',
          identifierType: 'NationalIdRegNo',
        },
        {
          countryCode: 'IE',
          identifier: 'IE123451235',
          identifierType: 'NationalIdPassport',
        },
      ],
      taxCountries: [
        {
          countryCode: 'SE',
          tin: '0',
          primary: true,
        },
      ],
      confirmation: true,
    })
  })

  test('should filter empty data', () => {
    expect(
      toBffBaseInfoValues({
        citizenships: ['', '0', undefined],
        confirmation: true,
        more_tax_countries: ['', '0', undefined],
        primary_tax_country: 'SE',
        usa_specific: 'False',
      }),
    ).toStrictEqual({
      citizenships: [],
      taxCountries: [
        {
          countryCode: 'SE',
          tin: '0',
          primary: true,
        },
      ],
      confirmation: true,
    })
  })

  test('should resolve with TIN data', () => {
    expect(
      toBffBaseInfoValues({
        citizenships: ['SE'],
        confirmation: true,
        more_tax_countries: ['DE', 'IE', 'AZ'],
        primary_tax_country: 'AL',
        usa_specific_tin: '12351251253',
        usa_specific: 'True',

        primary__tin__AL: 'AL34567',
        tin__DE: 'DE12345',
        tin__IE: 'IE56789',
      }),
    ).toStrictEqual({
      citizenships: [
        {
          countryCode: 'SE',
          identifier: '0',
          identifierType: 'NationalIdRegNo',
        },
      ],
      taxCountries: [
        {
          countryCode: 'AL',
          tin: 'AL34567',
          primary: true,
        },
        {
          countryCode: 'DE',
          tin: 'DE12345',
          primary: false,
        },
        {
          countryCode: 'IE',
          tin: 'IE56789',
          primary: false,
        },
        {
          countryCode: 'AZ',
          tin: '0',
          primary: false,
        },
        {
          countryCode: 'US',
          tin: '12351251253',
          primary: false,
        },
      ],
      confirmation: true,
    })
  })
})
