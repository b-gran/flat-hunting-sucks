import React from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'

import { FilterOptions, FilterOptionText } from './reducers/index'

import Flat from './Flat'

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
          console.log('Error:', err)
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

            <Filter filter={this.props.filter} changeFilter={this.props.onChangeFilter}/>

            <div className="listings">
              {
                !_.isEmpty(this.props.listings) &&
                // this.props.listings
                sortListings(this.props.listings, this.props.filter)
                  .map(listing => (
                    <Flat key={listing.advert_id} data={listing} />
                  ))
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
FlatListing.propTypes = {
  form: React.PropTypes.object,
  filter: React.PropTypes.object,
  listings: React.PropTypes.array,
  error: React.PropTypes.object,
  dispatch: React.PropTypes.func.isRequired,
  onChangeFilter: React.PropTypes.func.isRequired,
}

function sortListings (listings, filter) {
  const baseSortFunction = {
    [FilterOptions.sortBy.CYCLING]: (listing1, listing2) => {
      if (!listing1.cyclingDistance || !listing2.cyclingDistance) {
        return 0
      }

      return (
        listing1.cyclingDistance.duration.value -
        listing2.cyclingDistance.duration.value
      )
    },

    [FilterOptions.sortBy.PRICE]: (listing1, listing2) => {
      if (!listing1.min_rent || !listing2.min_rent) {
        return 0
      }

      return (
        Number(listing1.min_rent) -
        Number(listing2.min_rent)
      )
    },

    [FilterOptions.sortBy.TRANSIT]: (listing1, listing2) => {
      if (!listing1.transitDistance || !listing2.transitDistance) {
        return 0
      }

      return (
        listing1.transitDistance.duration.value -
        listing2.transitDistance.duration.value
      )
    },
  }[filter.sortBy]

  const ordering = {
    [FilterOptions.order.ASCENDING]: x => x,
    [FilterOptions.order.DESCENDING]: x => -x,
  }[filter.order]

  const sortFunction = _.flow(baseSortFunction, ordering)

  return listings.slice().sort(sortFunction)
}

export default connect(
  state => ({
    form: state.form,
    filter: state.filter,
    listings: state.listings,
    error: state.error,
  }),
  dispatch => ({
    dispatch: dispatch,
    onChangeFilter: (key, value) => dispatch({
      type: 'update filter',
      key: key,
      value: value
    })
  })
)(FlatListing)

function Filter (props) {
  return (
    <div className="filter">
      <div>
        <label className="label">Sort by</label>
        <div className="control">
        <span className="select">
          <select
            value={props.filter.sortBy}
            onChange={evt => props.changeFilter('sortBy', evt.target.value)}>
            {
              Object.keys(FilterOptions.sortBy).map(
                option => <option value={option}>
                  {FilterOptionText.sortBy[option]}
                </option>
              )
            }
          </select>
        </span>
        </div>
      </div>

      <div>
        <label className="label">Order</label>
        <div className="control">
        <span className="select">
          <select
            value={props.filter.order}
            onChange={evt => props.changeFilter('order', evt.target.value)}>
            {
              Object.keys(FilterOptions.order).map(
                option => <option value={option}>
                  {FilterOptionText.order[option]}
                </option>
              )
            }
          </select>
        </span>
        </div>
      </div>
    </div>
  )
}
Filter.propTypes = {
  changeFilter: React.PropTypes.func.isRequired,
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

      <div className="nav-center">
        <div className="nav-item">
          <span className="title is-3">View Listings</span>
        </div>
      </div>

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

