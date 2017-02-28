import { combineReducers } from 'redux'
import form from './form'

import match from '../reducer'

export default combineReducers({
  form: form,

  page: match.defaultTo('form')(match.all(
    match({ type: match.eq('change page' )})
      .with((state, action) => action.page)
  ))
})