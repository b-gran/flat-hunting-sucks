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

const Control = C(function Control (props) {
  return (
    <p className={getComponentClass('control', props)}>
      {props.children}
    </p>
  )
})

const ControlLabel = C(function ControlLabel (props) {
  return (
    <div className={getComponentClass('control-label', props)}>
      <Label>{props.children}</Label>
    </div>
  )
})

const HorizontalInput = C(function HorizontalInput (props) {
  const [labelSize, contentSize] = props.even
    ? ['is-6', 'is-6 ']
    : ['is-3', 'is-9']

  const [label, content] = [
    cx('column', labelSize),
    cx('column', contentSize),
  ]

  return (
    <div className="columns is-centered is-vcentered">
      <div className={label}>
        <ControlLabel className="is-paddingless">{props.label}</ControlLabel>
      </div>
      <div className={content}>
        {props.children}
      </div>
    </div>
  )
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

  const doSearch = () => props.dispatch({
    type: 'change page',
    page: 'search'
  })

  const searchButtonClasses = cx(
    'button is-primary',
    { 'is-disabled': !canViewResults(props.form) }
  )

  return (
    <div className="section">
      <div className="container">
        <div className="columns">
          <div className="column">
            <p className="title">Location</p>

            <Label>Flat Location</Label>
            <Control>
              <input value={props.form.location || ''} onChange={changeText('location')}
                     type="text" className="input"/>
            </Control>

            <Label>Work Address</Label>
            <Control>
                <textarea value={props.form.work || ''} onChange={changeText('work')}
                          className="textarea"/>
            </Control>

            <hr/>

            <div className="column">
              <div className="title">Flat Details</div>

              <div className="columns">
                <div className="column">
                  <HorizontalInput even={true} label="Bills Included">
                    <ToggleSwitch
                      checked={props.form.bills || false}
                      onChange={changeSwitch('bills')}/>
                  </HorizontalInput>
                </div>

                <div className="column">
                  <HorizontalInput even={true} label="Smoking Allowed">
                    <ToggleSwitch
                      checked={props.form.smoking || false}
                      onChange={changeSwitch('smoking')}/>
                  </HorizontalInput>
                </div>
              </div>
            </div>
          </div>

          <div className="column">
            <p className="title">Commute</p>
            <HorizontalInput label="Biking">
              <Control className='has-addons'>
                <input value={props.form.bike || ''} onChange={changeText('bike')} type="text"
                       className="input is-expanded"/>
                <a className="button is-info">minutes</a>
              </Control>
            </HorizontalInput>
            <HorizontalInput label="Public Transport">
              <Control className='has-addons'>
                <input onChange={changeText('transport')} type="text"
                       value={props.form.transport || ''}
                       className="input is-expanded"/>
                <a className="button is-info">minutes</a>
              </Control>
            </HorizontalInput>

            <p className="title">Rent</p>

            <HorizontalInput label="Max Rent">
              <Control className='has-addons'>
                <input value={props.form.rent || ''} onChange={changeText('rent')} type="text"
                       className="input is-expanded"/>
                <a className="button is-info">£ (pcm)</a>
              </Control>
            </HorizontalInput>

            <div className="level">
              <div className="level-item">
                <a onClick={doSearch} className={searchButtonClasses}>
                  <i className="fa fa-search"/>
                  Search For Flats
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
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
