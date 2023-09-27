import { toTrapetsValues } from './to-trapets-values'

describe('toTrapetsValues', () => {
  test('should convert undefined', () => {
    expect(
      toTrapetsValues({
        one: undefined,
      }),
    ).toStrictEqual({
      one: '',
    })
  })

  test('should convert null', () => {
    expect(
      toTrapetsValues({
        one: null,
      }),
    ).toStrictEqual({
      one: '',
    })
  })

  test('should convert booleans', () => {
    expect(
      toTrapetsValues({
        one: true,
        two: false,
      }),
    ).toStrictEqual({
      one: 'True',
      two: 'False',
    })
  })

  test('should not convert string', () => {
    expect(
      toTrapetsValues({
        one: 'string',
      }),
    ).toStrictEqual({
      one: 'string',
    })
  })

  test('should convert arrays', () => {
    expect(
      toTrapetsValues({
        one: ['two', 'three', 'four'],
      }),
    ).toStrictEqual({
      one: 'two;three;four',
    })
  })

  test('should convert dates', () => {
    expect(
      toTrapetsValues({
        one: new Date('2022-01-02T01:00:00.000Z'),
      }),
    ).toStrictEqual({
      one: '2022-01-02',
    })
  })

  test('should convert numbers', () => {
    expect(
      toTrapetsValues({
        one: 1,
        two: 2,
      }),
    ).toStrictEqual({
      one: '1',
      two: '2',
    })
  })
})
