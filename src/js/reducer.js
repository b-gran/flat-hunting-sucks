/*
 * Condition :: (any -> boolean) | Object<Condition>
 *
 * State :: any
 * Action :: Object<any>
 * Reducer :: State -> Action -> State
 *
 * match :: Condition -> Reducer -> Reducer
 *
 * Composable redux reducer creation.
 *
 * The match function takes a condition predicate and returns
 * a Reducer. Reducers can be used directly with Redux, but they
 * also have a Reducer#with() function which returns a new Reducer
 * which matches the same condition as the original Reducer, but
 * which applies the reducer function passed as the argument to
 * any actions that match the condition.
 *
 * A few helper functions are applied automatically to match():
 *
 *  1.  shape() helper: if you pass a shape-compatible object whose
 *      values are predicate functions, it will automatically be
 *      converted to a shape() predicate.
 *
 *  2.  with() combined reducers helper: if you pass multiple reducer
 *      functions to with(), they will automatically be combined using
 *      combineReducers()
 *
 *  3.  with() any() helper: if you pass a plain reducer function to
 *      with(), it will automatically be wrapped in any()
 *
 * Usage:
 *
 *    // Redux counter example
 *    const counterExample = match.defaultTo(0)(match.all(
 *      match({ type: match.eq('INCREMENT') })
 *        .with(state => state + 1),
 *
 *      match({ type: match.eq('DECREMENT') })
 *        .with(state => state - 1)
 *    ))
 */

import _ from 'lodash'
const eq = _.curry(_.isEqual)

const privates = new WeakMap()

export default function match (condition) {
  if (!_.isFunction(condition) && !_.isObject(condition)) {
    throw new Error(`condition must be an object or function`)
  }

  // To make the library a bit more terse, automatically apply
  // shape() to any plain objects.
  const wrappedCondition = _.isPlainObject(condition)
    ? shape(condition)
    : condition

  return Reducer(wrappedCondition)
}

match.all = function (...reducers) {
  return combineReducers(() => true, reducers)
}
match.eq = eq
match.any = any
match.shape = shape
match.defaultTo = function (initialValue) {
  return reducer => Reducer(
    privates.get(reducer).condition,
    any((state = initialValue, action) => {
      return reducer(state, action)
    })
  )
}

function Reducer (condition, reducer = _.identity) {
  function reduce (state, action) {
    if (!condition(action, state)) {
      return state
    }

    return reducer(state, action)
  }

  Object.defineProperty(
    reduce,
    'with',
    {
      value: bindWith(condition),
      writable: false
    }
  )

  privates.set(reduce, { condition: condition })

  return reduce
}

function bindWith (condition) {
  return (...reducers) => combineReducers(
    condition,
    reducers.map(reducer => {
      // For terseness, wrap vanilla reducer functions in
      // any() Reducers
      return !isReducer(reducer)
        ? any(reducer)
        : reducer
    })
  )
}

// Given an action condition and a list of Reducers, a Reducer
// whose condition is the supplied condition and whose action
// reducer is the first matching reducer in the supplied
// list of reducers.
function combineReducers (condition, reducers) {
  function getFirstMatchingReducer (state, action) {
    const matchingReducer = _.defaultTo(
      _.find(
        reducers,
        reducer => privates.get(reducer).condition(action, state)
      ),
      _.identity
    )

    return matchingReducer(state, action)
  }

  return Reducer(condition, getFirstMatchingReducer)
}

export function isReducer (maybeMatch) {
  return privates.has(maybeMatch)
}

// A Reducer that matches an action.
export function any (reducer) {
  return Reducer(_.constant(true), reducer)
}

// An action condition that takes an object whose values are predicate functions.
// The action matches the object if each predicate property of the object
// returns true for the corresponding property value of the action.
export function shape (shapeObject) {
  return action => actionConformsToShape(action, shapeObject)
}

// Implementation of the shape() action condition
function actionConformsToShape (action, shapeObject) {
  for (const key in shapeObject) {
    const keyMatches = shapeObject[key](action[key])
    if (!keyMatches) {
      return false
    }
  }

  return true
}
