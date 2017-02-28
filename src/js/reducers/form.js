import match from '../reducer'
import isNil from 'lodash/isNil'

export default match.all(
  match((action, state) => {
    return isNil(action) || isNil(state)
  }).with(() => ({})),

  match({ type: match.eq('change value') })
    .with((state, action) => {
      return {
        ...state,
        [action.key]: action.value
      }
    })
)
