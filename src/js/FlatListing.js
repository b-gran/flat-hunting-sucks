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

          <AdText text={props.data.ad_text_255} />

          <div className="bottom-row">
            <RoomsFilled
              totalRooms={parseInt(props.data.rooms_in_property)}
              roomsForRent={parseInt(props.data.rooms_for_rent)} />

            {
              props.data.cyclingDistance &&
              <Commute data={props.data.cyclingDistance} icon="fa-bicycle" />
            }

            {
              props.data.transitDistance &&
              <Commute data={props.data.transitDistance} icon="fa-subway" />
            }
          </div>
        </div>

        <div className="media-right tags">
          <span className="tag is-primary">
            { props.data.neighbourhood_name } &nbsp;
            <strong> { props.data.postcode } </strong>
          </span>

          {
            isEnsuite(props.data)
              ? <span className="tag is-success is-small">Ensuite</span>
              : <span className="tag is-danger is-small">Shared bathroom</span>
          }

          {
            isFullTime(props.data)
              ? <span className="tag is-success is-small">Full time</span>
              : <span className="tag is-danger is-small">{ props.data.days_of_wk_available }</span>
          }

          {
            isRentByRoom(props.data)
              ? <span className="tag is-success is-small">By room</span>
              : <span className="tag is-danger is-small">{ _.capitalize(props.data.rent_options) }</span>
          }
        </div>
      </div>
    </div>
  )
}
FlatItem.displayName = 'FlatItem'
FlatItem.propTypes = {
  data: React.PropTypes.object.isRequired,
}

const DistanceMatrixData = React.PropTypes.shape({
  text: React.PropTypes.string.isRequired,
  value: React.PropTypes.any.isRequired,
})
const DistanceMatrixResult = React.PropTypes.shape({
  distance: DistanceMatrixData.isRequired,
  duration: DistanceMatrixData.isRequired,
})

function Commute (props) {
  const iconClasses = `fa ${props.icon}`
  return (
    <div className="commutes-item">
      <div>
        <i className={iconClasses} />
      </div>

      <div>
        <span>{ props.data.duration.text }</span>
      </div>

      <div>
        <span>{ props.data.distance.text }</span>
      </div>
    </div>
  );
}
Commute.propTypes = {
  data: DistanceMatrixResult.isRequired,
  icon: React.PropTypes.string.isRequired,
}

function RoomsFilled (props) {
  const totalIsNumber = _.isNumber(props.totalRooms)
  const currentIsNumber = _.isNumber(props.roomsForRent)
  if (totalIsNumber && currentIsNumber) {
    return (
      <div className="rooms-filled is-inline-flex is-hcentered">
        <span className="rooms-left">
          { props.roomsForRent } of { props.totalRooms }&nbsp;
        </span>
        <span className="icon is-small">
          <i className="fa fa-bed"/>
        </span>
      </div>
    )
  }

  if (currentIsNumber && !totalIsNumber) {
    return (
      <div className="rooms-filled">
        <span className="rooms-left">
          { props.roomsForRent }
        </span>
        <i className="fa fa-bed"/>
        for rent
      </div>
    )
  }

  if (!currentIsNumber && totalIsNumber) {
    return (
      <div className="rooms-filled">
        <span className="rooms-left">
          { props.totalRooms }
        </span>
        <i className="fa fa-bed"/>
        total
      </div>
    )
  }

  // No total or current
  return null
}
RoomsFilled.propTypes = {
  totalRooms: React.PropTypes.number,
  roomsForRent: React.PropTypes.number,
}

function AdText (props) {
  return (
    <div className="ad-text is-small">
      { convertAdTextToMarkup(props.text) }
    </div>
  )
}
AdText.propTypes = {
  text: React.PropTypes.string,
}

function convertAdTextToMarkup (adText) {
  if (!_.isString(adText) || _.isEmpty(adText)) {
    return null;
  }

  const lines = adText
    .split(/\s*(\r|\n|\r\n|\n\r)+/ig)
    .map(_.trim)
    .filter(_.negate(_.isEmpty));

  return (
    <div className="ad-text-wrap">
      {
        lines.map(line => <div className="ad-text-line">{ line }</div>)
      }
    </div>
  )
}

const byRoomRegexp = /room/i;

function isRentByRoom (listingData) {
  if (_.isEmpty(listingData)) {
    return false
  }

  return byRoomRegexp.test(listingData.rent_options);
}

const regexp7 = /7/i;

function isFullTime (listingData) {
  if (_.isEmpty(listingData)) {
    return false
  }

  return regexp7.test(listingData.days_of_wk_available);
}

const ensuiteRegexp = /(ensuite?|en-suite?|en\ssuite?)/i;
const privateBathroomRegexp = /(private|own)\s+bathroom/i;

function isEnsuite (listingData) {
  if (_.isEmpty(listingData)) {
    return false
  }

  return (
    ensuiteRegexp.test(listingData.ad_text_255) ||
    ensuiteRegexp.test(listingData.ad_title) ||
    privateBathroomRegexp.test(listingData.ad_text_255) ||
    privateBathroomRegexp.test(listingData.ad_title)
  )
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

