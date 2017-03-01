// Resets, frameworks, etc.
// This needs to come first so we can override the styles.
import './popup.css'

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
  try {
    const form = JSON.parse(window.localStorage.getItem('form'))
    if (_.isObject(form) && form !== null) {
      return {
        form: form
      }
    }
  } catch (err) {}

  return {}
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

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app-container')
)
