import React from 'react'
import _ from 'lodash'

import './Flat.css'

export default function Flat (props) {
  return (
    <div className="box">
      <div className="media">
        <div className="media-left listing-left">
          <a href={getSpareRoomURL(props.data)} className="image">
            <img src={props.data.main_image_square_url} />
          </a>

          <RentBox per={props.data.per} rent={props.data.min_rent} />
        </div>

        <div className="media-content">
          <p>
            <a href={getSpareRoomURL(props.data)}>
              <strong>{ props.data.ad_title }</strong>
            </a>
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
          <LocationTag data={props.data} />

          {
            props.data.ensuite
              ? <span className="tag is-success is-small">Ensuite</span>
              : <span className="tag is-danger is-small">Shared bathroom</span>
          }

          {
            props.data.isFullTime
              ? <span className="tag is-success is-small">Full time</span>
              : <span className="tag is-danger is-small">{ props.data.days_of_wk_available }</span>
          }

          {
            props.data.rentByRoom
              ? <span className="tag is-success is-small">By room</span>
              : <span className="tag is-danger is-small">{ _.capitalize(props.data.rent_options) }</span>
          }
        </div>
      </div>
    </div>
  )
}
Flat.displayName = 'Flat'
Flat.propTypes = {
  data: React.PropTypes.object.isRequired,
}

function LocationTag (props) {
  return (
    <a href={googleMapsUrl(props.data)} className="tag is-primary">
      { props.data.neighbourhood_name } &nbsp;
      <strong> { props.data.postcode } </strong>
    </a>
  )
}
LocationTag.propTypes = {
  data: React.PropTypes.object.isRequired
}

function googleMapsUrl (listing) {
  const coords = `${listing.latitude},${listing.longitude}`
  return `https://maps.google.com/?q=${coords}`
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
        lines.map(line => (
          <div key={line} className="ad-text-line">{ line }</div>
        ))
      }
    </div>
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

function getSpareRoomURL (listing) {
  return `https://www.spareroom.co.uk/${listing.advert_id}`
}

