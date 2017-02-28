import React from 'react'
import { connect } from 'react-redux'

import retrieveListings from './retrieve-listings'

import './FlatListing.css'

class FlatListing extends React.Component {

  componentDidMount () {
    retrieveListings(this.props.form)
      .then(res => {
        console.log('SR returned', res)
      })
      .then(err => {
        console.log('SR erred', err)
      })
  }

  render () {
    const onNavigateBack = () => this.props.dispatch({
      type: 'change page',
      page: 'form'
    })

    return (
      <div className="container">
        <div className="columns">
          <div className="column">
            <Navigation onClickBack={onNavigateBack}/>
          </div>
        </div>
      </div>
    )
  }
}

function Navigation (props) {
  return (
    <nav className="page-navigation nav">
      <div className="nav-left">
        <div className="nav-item">
          <a onClick={props.onClickBack} className="button-wrap back-button">
            <span className="icon is-medium">
              <i className="fa fa-arrow-left"/>
            </span>

            <span className="title is-3">&nbsp;Back</span>
          </a>
        </div>
      </div>

      <div className="nav-center">
        <div className="nav-item">
          <span className="title is-3">View Listings</span>
        </div>
      </div>

      <div className="nav-right">
        <div className="nav-item"/>
      </div>
    </nav>
  )
}
Navigation.propTypes = {
  onClickBack: React.PropTypes.func.isRequired
}

export default connect(
  state => ({
    form: state.form
  }),
  dispatch => ({
    dispatch: dispatch
  })
)(FlatListing)