import React from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'

import retrieveListings from './retrieve-listings'

import './FlatListing.css'

class FlatListing extends React.Component {
  render () {
    const onNavigateBack = () => this.props.dispatch({
      type: 'change page',
      page: 'form'
    })

    const getResults = () => {
      return retrieveListings(this.props.form)
        .then(res => {
          this.props.dispatch({
            type: 'load listings',
            data: res,
          })
        })
        .catch(err => {
          return this.props.dispatch({
            type: 'error',
            message: 'Could not fetch listings',
            data: err
          })
        })
    }

    return (
      <div className="columns">
        <div className="column">
          <div className="container is-fluid">
            <Navigation onClickBack={onNavigateBack} onClickRefresh={getResults}/>

            <div className="listings">
              {
                !_.isEmpty(this.props.listings) &&
                this.props.listings
                  .map(listing => <FlatItem data={listing} />)
              }

              {
                _.isEmpty(this.props.listings) &&
                  <div className="box">
                    <p>No listings yet. Click refresh to retrieve more.</p>
                  </div>
              }

              {
                !_.isEmpty(this.props.error) &&
                  <div className="notification is-danger">
                    <h2 className="title is-2">
                      { this.props.error.message }
                    </h2>

                    <pre><code>
                      { JSON.stringify(this.props.error.data) }
                    </code></pre>
                  </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(
  state => ({
    form: state.form,
    listings: state.listings,
    error: state.error,
  }),
  dispatch => ({
    dispatch: dispatch
  })
)(FlatListing)
function FlatItem (props) {
  return (
    <div className="box">
      <div className="media">
        <div className="media-left listing-left">
          <figure className="image">
            <img src={props.data.main_image_square_url} />
          </figure>

          <RentBox per={props.data.per} rent={props.data.min_rent} />
        </div>

        <div className="media-content">
          <p>
            <strong>{ props.data.ad_title }</strong>
          </p>
        </div>

        <div className="media-right">
          <span className="tag is-primary">
            { props.data.neighbourhood_name } &nbsp;
            <strong> { props.data.postcode } </strong>
          </span>
        </div>
      </div>
    </div>
  )
}
FlatItem.displayName = 'FlatItem'
FlatItem.propTypes = {
  data: React.PropTypes.object.isRequired,
}

function RentBox (props) {
  return (
    <span className="rent is-inline-flex is-vcentered is-hcentered">
      <span className="icon is-small">
        <i className="fa fa-gbp" />
      </span>
      <span className="is-bold">{ props.rent }</span>
      &nbsp;
      { props.per }
    </span>
  )
}
RentBox.displayName = 'RentBox'
RentBox.propTypes = {
  rent: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]).isRequired,
  per: React.PropTypes.string.isRequired,
}

function Navigation (props) {
  return (
    <nav className="page-navigation nav">
      <div className="nav-left">
        <div className="nav-item">
          <a onClick={props.onClickBack} className="button-wrap back-button">
            <span className="icon is-medium">
              <i className="fa fa-arrow-left" />
            </span>

            <span className="title is-3">&nbsp;Back</span>
          </a>
        </div>
      </div>

      <divikjasdfasdfaiasdif className="nav-center">
        <div className="nav-item">
          <span className="title is-3">View Listings</span>
        </div>
      </divikjasdfasdfaiasdif>

      <div className="nav-right">
        <div className="nav-item">
          <a onClick={props.onClickRefresh} className="button-wrap back-button">
            <span className="icon is-medium">
              <i className="fa fa-refresh" />
            </span>

            <span className="title is-3">&nbsp;Refresh</span>
          </a>
        </div>
      </div>
    </nav>
  )
}
Navigation.propTypes = {
  onClickBack: React.PropTypes.func.isRequired,
  onClickRefresh: React.PropTypes.func.isRequired,
}

