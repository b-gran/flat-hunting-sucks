import React from 'react';
import cx from 'classnames';
import _ from 'lodash';
import C from './C';

import { connect } from 'react-redux'

import './FlatSearch.css';

function getComponentClass (baseClasses, props) {
  return cx(
    baseClasses,
    props.className || ''
  )
}

const Label = C(function Label (props) {
  return (
    <label className={getComponentClass('label', props)}>
      {props.children}
    </label>
  )
})

const HorizontalInput = C(function HorizontalInput (props) {
  return <div>
    <Label className="is-paddingless">{props.label}</Label>
    <div className="grouped-control is-horizontal">
      { props.children }
    </div>
  </div>
})
HorizontalInput.propTypes = {
  label: React.PropTypes.node.isRequired,
  even: React.PropTypes.any,
}

const id = (function () {
  let current = 0;
  return function () {
    return (current++) + Math.round(
        Math.random() * 1e6
      ).toString(16);
  };
})();

const ToggleSwitch = C(function ToggleSwitch (props) {
  // Just so our label works as intended
  const temporaryRenderId = id();

  return (
    <div>
      <input
        checked={props.checked || false}
        onChange={props.onChange || _.noop} id={temporaryRenderId} type="checkbox"
        className="toggle"/>
      <label htmlFor={temporaryRenderId}/>
    </div>
  )
})

function FlatSearch (props) {
  const changeText = key => evt => props.dispatch({
    type: 'change value',
    key: key,
    value: evt.target.value
  })

  const changeSwitch = key => evt => props.dispatch({
    type: 'change value',
    key: key,
    value: evt.target.checked
  })

  return (
    <div className="section has-small-padding flat-search">
      <Label>Flat Location</Label>
      <input
        value={props.form.location || ''}
        onChange={changeText('location')}
        type="text" className="input" />

      <Label>Work Address</Label>
      <textarea
        value={props.form.work || ''}
        onChange={changeText('work')}
        className="textarea" />

      <hr/>

      <div className="columns">
        <div className="column is-6">
          <HorizontalInput even={true} label="Bills Included">
            <ToggleSwitch
              checked={props.form.bills || false}
              onChange={changeSwitch('bills')}/>
          </HorizontalInput>

        </div>

        <div className="column is-6">
          <HorizontalInput even={true} label="Smoking Allowed">
            <ToggleSwitch
              checked={props.form.smoking || false}
              onChange={changeSwitch('smoking')}/>
          </HorizontalInput>
        </div>
      </div>

      <div className="columns">
        <div className="column is-6">
          <HorizontalInput label="Bike Commute">
            <input value={props.form.bike || ''} onChange={changeText('bike')} type="text"
                   className={"input"}/>

            <a className="button is-info">min</a>
          </HorizontalInput>

        </div>

        <div className="column is-6">
          <HorizontalInput label="Transit Commute">
            <input onChange={changeText('transport')} type="text"
                   value={props.form.transport || ''}
                   className={"input"}/>
            <a className="button is-info">min</a>
          </HorizontalInput>
        </div>
      </div>

      <HorizontalInput label="Max Rent">
        <input value={props.form.rent || ''} onChange={changeText('rent')} type="text"
               className="input is-expanded"/>
        <a className="button is-info">£ (pcm)</a>
      </HorizontalInput>
    </div>
  )
}

export default connect(
  state => ({
    form: state.form
  }),
  dispatch => ({
    dispatch: dispatch,
  })
)(FlatSearch)

function canViewResults (form) {
  // location, work, bike, transport, rent, bills, smoking
  if (!form || !_.isObject(form)) {
    return false
  }

  // Need to specify location addess
  if (!form.location) {
    return false
  }

  // If work address specified, must specify at least 1 commute restriction
  if (form.work && !form.bike && !form.transport) {
    return false
  }

  return true
}
