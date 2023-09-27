import { FormState } from '../../types'
import { verifyCondition } from './verify-condition'

describe('verifyCondition', () => {
  const formState: FormState = {
    arrayWithValues: ['array1', 'array2'],
    emptyArray: [],
    emptyString: '',
    nullValue: null,
    numberValue: 400,
    stringWithValue: 'string1',
  }

  describe('Contains', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'arrayWithValues',
              rhs: 'array1',
              op: 'Contains',
              returnValue: 'True',
              valueType: 'Option',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'emptyArray',
              rhs: 'array1',
              op: 'Contains',
              returnValue: 'True',
              valueType: 'Option',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('ContainsAllOf', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'arrayWithValues',
              rhs: 'array1;array2',
              op: 'ContainsAllOf',
              returnValue: 'True',
              valueType: 'Option',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'arrayWithValues',
              rhs: 'array1;array3',
              op: 'ContainsAllOf',
              returnValue: 'True',
              valueType: 'Option',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('ContainsAnyOf', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'arrayWithValues',
              rhs: 'array1;array2;array3;array4',
              op: 'ContainsAnyOf',
              returnValue: 'True',
              valueType: 'Option',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'arrayWithValues',
              rhs: 'array3;array4',
              op: 'ContainsAnyOf',
              returnValue: 'True',
              valueType: 'Option',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('Equals', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string1',
              op: 'Equals',
              returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              rhs: 999,
              op: 'Equals',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('GreaterThan', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              rhs: 399,
              op: 'GreaterThan',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              rhs: 400,
              op: 'GreaterThan',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('GreaterThanOrEqualTo', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              rhs: 400,
              op: 'GreaterThanOrEqualTo',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              rhs: 401,
              op: 'GreaterThanOrEqualTo',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('IsEmpty', () => {
    it('should resolve true on empty array', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'emptyArray',
              op: 'IsEmpty',
              returnValue: 'True',
              valueType: 'Option',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve true on empty string', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'emptyString',
              op: 'IsEmpty',
              returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve true on null value', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'nullValue',
              op: 'IsEmpty',
              returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              op: 'IsEmpty',
              returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('IsNotEmpty', () => {
    it('should resolve true on array', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'arrayWithValues',
              op: 'IsNotEmpty',
              returnValue: 'True',
              valueType: 'Option',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve true on string', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              op: 'IsNotEmpty',
              returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve true on number', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              op: 'IsNotEmpty',
              returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'nullValue',
              op: 'IsNotEmpty',
              returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('LessThan', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              rhs: 401,
              op: 'LessThan',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              rhs: 400,
              op: 'LessThan',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('LessThanOrEqualTo', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              rhs: 400,
              op: 'LessThanOrEqualTo',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              rhs: 399,
              op: 'LessThanOrEqualTo',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('NotEquals', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string2',
              op: 'NotEquals',
              returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'numberValue',
              rhs: 400,
              op: 'NotEquals',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('Using returnValue', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string1',
              op: 'Equals',
              returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(true)
    })
  })

  describe('Using returnValue inside statement', () => {
    it('should resolve true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string1',
              op: 'Equals',
              statements: [{ returnValue: 'True' }],
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve true with junk data inside statement', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string1',
              op: 'Equals',
              statements: [
                {
                  op: 'Equals',
                  returnValue: 'True',
                  statements: [],
                  valueType: 'Text',
                },
              ],
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(true)
    })
  })

  describe('Using multiple statements', () => {
    it('should resolve true when all statements are true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string1',
              op: 'Equals',
              returnValue: 'True',
              valueType: 'Text',
            },
            {
              lhs: 'numberValue',
              rhs: 400,
              op: 'Equals',
              statements: [{ returnValue: 'True' }],
              valueType: 'Number',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve true when one statement is true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string1',
              op: 'Equals',
              returnValue: 'True',
              valueType: 'Text',
            },
            {
              lhs: 'numberValue',
              rhs: 999,
              op: 'Equals',
              statements: [{ returnValue: 'True' }],
              valueType: 'Number',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false when all statements are false', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'wrong',
              op: 'Equals',
              returnValue: 'True',
              valueType: 'Text',
            },
            {
              lhs: 'numberValue',
              rhs: 999,
              op: 'Equals',
              statements: [{ returnValue: 'True' }],
              valueType: 'Number',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('Using multiple nestled statements', () => {
    it('should resolve true when all statements are true', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string1',
              op: 'Equals',
              returnValue: 'True',
              statements: [
                {
                  lhs: 'numberValue',
                  rhs: 400,
                  op: 'Equals',
                  statements: [{ returnValue: 'True' }],
                  valueType: 'Number',
                },
              ],
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(true)
    })

    it('should resolve false when a nestled statement is wrong', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string1',
              op: 'Equals',
              returnValue: 'True',
              statements: [
                {
                  lhs: 'numberValue',
                  rhs: 999,
                  op: 'Equals',
                  statements: [{ returnValue: 'True' }],
                  valueType: 'Number',
                },
              ],
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(false)
    })
  })

  describe('With errors', () => {
    it('should fail on missing lhs', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              // lhs: 'stringWithValue',
              rhs: 'string1',
              op: 'Equals',
              // returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(false)
    })

    it('should fail on missing op', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string1',
              // op: 'Equals',
              returnValue: 'True',
              valueType: 'Text',
            },
          ],
        }),
      ).toBe(false)
    })

    it('should fail on missing value type', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string1',
              op: 'Equals',
              returnValue: 'True',
              // valueType: 'Text',
            },
          ],
        }),
      ).toBe(false)
    })

    it('should fail on invalid rhs type [ Bool ]', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string',
              op: 'Equals',
              returnValue: 'True',
              valueType: 'Bool',
            },
          ],
        }),
      ).toBe(false)
    })

    it('should fail on invalid rhs type [ Decimal ]', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'string',
              op: 'Equals',
              returnValue: 'True',
              valueType: 'Decimal',
            },
          ],
        }),
      ).toBe(false)
    })

    it('should fail on invalid rhs type [ Text ]', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 999,
              op: 'Equals',
              returnValue: 'True',
              valueType: 'Bool',
            },
          ],
        }),
      ).toBe(false)
    })

    it('should fail on missing return value', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 999,
              op: 'Equals',
              // returnValue: "True",
              valueType: 'Bool',
            },
          ],
        }),
      ).toBe(false)
    })

    it('should fail on invalid lhs value', () => {
      expect(
        verifyCondition(formState, {
          statements: [
            {
              lhs: 'stringWithValue',
              rhs: 'array1',
              op: 'Contains',
              returnValue: 'True',
              valueType: 'Option',
            },
          ],
        }),
      ).toBe(false)
    })
  })
})
