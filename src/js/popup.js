// Resets, frameworks, etc.
// This needs to come first so we can override the styles.
import './popup.css'

import 'whatwg-fetch'

import { Provider } from 'react-redux'
import { createStore } from 'redux'
import reducer from './reducers/index'

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

const store = createStore(reducer)

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app-container')
)
