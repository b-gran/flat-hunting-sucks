import { combineReducers } from 'redux'
import form from './form'

import match from '../reducer'

export default combineReducers({
  form: form,

  page: match.defaultTo('form')(match.all(
    match({ type: match.eq('change page' )})
      .with((state, action) => action.page)
  )),

  listings: match.defaultTo([])(
    match.all(
      match({ type: match.eq('load listings') })
        .with((state, action) => action.data || [])
    )
  ),

  error: match.defaultTo(null)(match.all(
    match({ type: match.eq('error') })
      .with((state, action) => ({
        message: action.message || (action.data && action.data.message),
        data: action.data
      }))
  ))
})