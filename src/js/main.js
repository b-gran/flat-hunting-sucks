// Resets, frameworks, etc.
// This needs to come first so we can override the styles.
import './main.css'

import 'whatwg-fetch'

import { Provider } from 'react-redux'
import { createStore } from 'redux'
import reducer from './reducers/index'
import _ from 'lodash'

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

function getFacade (_store) {
  return {
    subscribe (onChange, select = _.identity) {
      let lastState = select(_store.getState())

      return _store.subscribe(() => {
        const currentState = select(_store.getState())

        if (lastState !== currentState) {
          lastState = currentState
          return onChange(currentState)
        }
      })
    }
  }
}

function restoreFromStorage() {
  const form = restoreKey('form', _.overEvery([ _.isObject, _.negate(_.isNil) ]))
  const listings = restoreKey('listings', _.overEvery([ Array.isArray, _.negate(_.isEmpty) ]))
  const page = restoreKey('page')
  const filter = restoreKey('filter')
  return {
    form: form,
    listings: listings,
    page: page,
    filter: filter,
  }
}

function restoreKey (key, validate = _.negate(_.isNil)) {
  try {
    const item = JSON.parse(window.localStorage.getItem(key))
    if (validate(item)) {
      return item
    }
  } catch (err) {}
  return undefined
}

const store = createStore(reducer, restoreFromStorage())

const facade = getFacade(store)
facade.subscribe(
  form => {
    const nonEmptyFields = _.pickBy(
      form,
      value => value && _.trim(value).length > 0
    )

    window.localStorage.setItem('form', JSON.stringify(nonEmptyFields))
  },
  _.property('form')
)

facade.subscribe(
  listings => {
    window.localStorage.setItem('listings', JSON.stringify(listings))
  },
  _.property('listings')
)

facade.subscribe(
  page => window.localStorage.setItem('page', JSON.stringify(page)),
  _.property('page')
)

facade.subscribe(
  filter => window.localStorage.setItem('filter', JSON.stringify(filter)),
  _.property('filter')
)

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app-container')
)
