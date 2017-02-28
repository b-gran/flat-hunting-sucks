import match, { shape, any, isReducer } from './reducer'
import _ from 'lodash'

const eq = _.curry(_.isEqual)

// empty function
const __ = () => {}

describe('match', () => {
  describe(`match(...).with(...)`, () => {
    const reducer = match(
      { type: eq('Something') },
    ).with(
      match({ foo: _.isNumber }).with(
        (state, action) => {
          return state + 1
        }
      ),

      match({ foo: _.isString }).with(
        (state, action) => {
          return state - 1
        }
      ),

      (state, action) => state + 5
    )

    it(`matches 'state + 1' reducer`, () => {
      expect(reducer(
        0,
        {
          type: 'Something',
          foo: 5
        }
      )).toBe(1)
    })

    it(`matches 'state - 1' reducer`, () => {
      expect(reducer(
        0,
        {
          type: 'Something',
          foo: 'something else'
        }
      )).toBe(-1)
    })

    it(`matches 'state + 5' reducer`, () => {
      expect(reducer(
        0,
        {
          type: 'Something',
          foo: false
        }
      )).toBe(5)
    })

    describe(`with condition predicate`, () => {
      const conditionValue = {}
      const resultValue = {}
      const predicateReducer = match(
        maybeMatch => maybeMatch === conditionValue
      ).with(() => resultValue)

      it('returns the result value', () => {
        expect(predicateReducer(null, conditionValue)).toBe(resultValue)
      })

      it('passes through the state', () => {
        const state = {}
        const notConditionValue = {}
        expect(predicateReducer(state, notConditionValue)).toBe(state)
      })
    })
  })

  describe(`match.defaultTo`, () => {
    const defaultValue = {}
    const withDefaultValue = match
      .defaultTo(defaultValue)(match.all(_.identity))

    it(`uses the default value if state is nil`, () => {
      expect(withDefaultValue(undefined, null)).toBe(defaultValue)
    })

    it(`doesn't use the default value if state is defined`, () => {
      const state = {}
      expect(withDefaultValue(state, null)).toBe(state)
    })
  })
})

