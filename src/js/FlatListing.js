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
  const averages = precomputeAverages(listings)
  const minmax = precomputeMinMax(listings)

  const baseSortFunction = {
    [FilterOptions.sortBy.PRICE]: sortByProperty('min_rent'),
    [FilterOptions.sortBy.CYCLING]: sortByProperty('cyclingDistance.duration.value'),
    [FilterOptions.sortBy.TRANSIT]: sortByProperty('transitDistance.duration.value'),
    [FilterOptions.sortBy.BEST]: (listing1, listing2) => {
      return (
        getRating(listing1, minmax) -
        getRating(listing2, minmax)
      )
    }
  }[filter.sortBy]

  const ordering = {
    [FilterOptions.order.ASCENDING]: x => x,
    [FilterOptions.order.DESCENDING]: x => -x,
  }[filter.order]

  const sortFunction = _.flow(baseSortFunction, ordering)

  return listings.slice().sort(sortFunction)
}

function getRating (listing, minmax) {
  const cycling = getRatio(
    listing,
    'cyclingDistance.duration.value',
    minmax[FilterOptions.sortBy.CYCLING]
  )

  const rent = getRatio(
    listing,
    'min_rent',
    minmax[FilterOptions.sortBy.PRICE]
  )

  const transit = getRatio(
    listing,
    'transitDistance.duration.value',
    minmax[FilterOptions.sortBy.TRANSIT]
  )

  return (
    rent + cycling + transit +
    (listing.ensuite ? 1 : -1) +
    (listing.isFullTime ? 1 : -1) +
    (listing.rentByRoom ? 1 : -1)
  ) / 6
}

function getRatio (listing, property, minmax) {
  const [minValue,maxValue] = minmax

  const value = _.get(listing, property)

  if (_.isNil(value)) {
    return 0
  }

  return (
    1 -
    ((value - minValue) / (maxValue - minValue))
  )
}

function precomputeMinMax (listings) {
  const rentMinMax = getMinMax(listings, 'min_rent')
  const cyclingMinMax = getMinMax(listings, 'cyclingDistance.duration.value')
  const transitMinMax = getMinMax(listings, 'transitDistance.duration.value')

  return {
    [FilterOptions.sortBy.PRICE]: rentMinMax,
    [FilterOptions.sortBy.CYCLING]: cyclingMinMax,
    [FilterOptions.sortBy.TRANSIT]: transitMinMax,
  }
}

function getMinMax (listings, property) {
  const values = _.map(listings, property)
  return [
    _.min(values),
    _.max(values)
  ]
}

// function getRating (listing, averages) {
//   return (
//     point(
//       listing,
//       'min_rent',
//       averages[FilterOptions.sortBy.PRICE]
//     ) +
//     point(
//       listing,
//       'cyclingDistance.duration.value',
//       averages[FilterOptions.sortBy.CYCLING]
//     ) +
//     point(
//       listing,
//       'transitDistance.duration.value',
//       averages[FilterOptions.sortBy.TRANSIT]
//     ) +
//     (listing.ensuite ? 1 : -1) +
//     (listing.isFullTime ? 1 : -2) +
//     (listing.rentByRoom ? 1 : -2)
//   )
// }

function point (listing, property, average) {
  const value = _.get(listing, property)

  if (_.isNil(value)) {
    return 0
  }

  return value < average
    ? 1
    : 0
}

function precomputeAverages (listings) {
  const averagePrice = computeAverage(listings, 'min_rent')
  const averageCyclingDuration = computeAverage(listings, 'cyclingDistance.duration.value')
  const averageTransitDuration = computeAverage(listings, 'transitDistance.duration.value')

  return {
    [FilterOptions.sortBy.PRICE]: averagePrice,
    [FilterOptions.sortBy.CYCLING]: averageCyclingDuration,
    [FilterOptions.sortBy.TRANSIT]: averageTransitDuration,
  }
}

function computeAverage (listings, property) {
  return listings.reduce(
      (average, listing) => {
        const value = _.get(listing, property)
        return _.isNil(value)
          ? average
          : (average + value)
      }
    ) / listings.length
}

function sortByProperty (property, transform = _.identity) {
  return function (object1, object2) {
    const value1 = _.get(object1, property)
    const value2 = _.get(object2, property)

    if (_.isNil(value1) || _.isNil(value2)) {
      return 0
    }

    return transform(value1) - transform(value2)
  }
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

