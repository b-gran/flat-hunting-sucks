import { combineReducers } from 'redux'
import form from './form'
import isNil from 'lodash/isNil'

import match from '../reducer'

export const FilterOptions = {
  sortBy: {
    PRICE: 'PRICE',
    CYCLING: 'CYCLING',
    TRANSIT: 'TRANSIT',
    BEST: 'BEST',
  },

  order: {
    ASCENDING: 'ASCENDING',
    DESCENDING: 'DESCENDING',
  }
}

export const FilterOptionText = {
  sortBy: {
    PRICE: 'Price',
    CYCLING: 'Cycling time',
    TRANSIT: 'Transit time',
    BEST: 'Best result',
  },

  order: {
    ASCENDING: 'Ascending',
    DESCENDING: 'Descending',
  }
}

export default combineReducers({
  form: form,

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
  )),

  filter: match.defaultTo({
    sortBy: FilterOptions.sortBy.PRICE,
    order: FilterOptions.order.ASCENDING,
  })(
    match.all(
      match({ type: match.eq('update filter') })
        .with((state, action) => {
          return {
            ...state,
            [action.key]: action.value
          }
        })
    )
  )
})
