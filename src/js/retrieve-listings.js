import _ from 'lodash'
import Promise from 'bluebird'
import 'whatwg-fetch'

const google = window.google

const geocoder = new google.maps.Geocoder()
const distance = new google.maps.DistanceMatrixService()

function getCoords (address) {
  return new Promise((resolve, reject) => {
    geocoder.geocode({
      address
    }, (results, status) => {
      if (status === 'OK') {
        return resolve({
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        })
      }

      return reject(results)
    })
  })
}

function pt2ptDistance (source, dest, mode) {
  return new Promise((resolve, reject) => {
    distance.getDistanceMatrix({
      origins: [source],
      destinations: [dest],
      travelMode: mode,
    }, (results, status) => {
      if (status === 'OK') {
        return resolve(results.rows[0].elements[0])
      }

      return reject(results)
    })
  })
}

function getDrivingDistance (source, dest) {
  return pt2ptDistance(source, dest, 'DRIVING')
}

function getCyclingDistance (source, dest) {
  return pt2ptDistance(source, dest, 'BICYCLING')
}

// getCoords('nw1 7bs')
//   .then(res => console.log('res', res))
//   .catch(err => console.log('err', err))

// getCyclingDistance(
//   'Flat 112 Carlow House, Carlow St, London NW1 7BS',
//   '20 Farringdon Road, London EC1 M3HE'
// )
//   .then(res => console.log('res', res))
//   .catch(err => console.log('err', err))

// location, work, bike, transport, rent, bills, smoking
export default function (form) {
  return getSRQueryString(form)
    .then(uriParams => {
      return fetch(
        `https://www.spareroom.co.uk/flatshare/api.pl?${uriParams}` // ,
      )
    })
    .then(result => result.json())
    .then(body => normalizeListings(body.results))
}

// pw = pcm × 0.2299794661
// pcm = pw * 4.3482142857
function normalizeListings (listings) {
  return listings.map(modify({
    min_rent: (rent, _k, listing) => {
      return listing.per === 'pw'
        ? Math.round(rent * 4.3482142857)
        : rent
    },

    per: _.constant('pcm')
  }))
}

function modify (modifier) {
  if (!_.isObject(modifier)) {
    throw new Error('modifier must be an object')
  }

  return function (object) {
    return _.mapValues(
      object,
      (val, key, wholeObject) => {
        if (_.isFunction(modifier[key])) {
          return modifier[key](val, key, wholeObject)
        }

        return val
      }
    )
  }
}

function getSRQueryString (form) {
  return getCoords(form.location)
    .then(location => {
      console.log('location', location)
      return getQSFromObject({
        show: 'all',
        max_per_page: 100,
        interactive: 0,
        encoding: 'html',
        flatshare_type: 'offered',
        where: form.location.replace(/\s+/, ' '),

        year_avail: 2000 + (new Date()).getYear(),
        location_type: 'area',
        showme_buddyup_properties: 'Y',
        ensuite: 'Y',

        showme_1beds: 'Y',
        showme_rooms: 'Y',

        miles_from_max: 1,

        day_avail: (new Date()).getDay(),
        mon_avail: '0' + ((new Date()).getMonth() + 1),

        max_rent: form.rent,
        per: 'pcm',

        // latitude:51.536213040708596,
        // longitude:-0.14420300000006137,
        // latitude_delta:0.05894100000000435,
        // longitude_delta:0.10747400000002472

        latitude: location.lat,
        longitude: location.lng,
        latitude_delta: 0.06317200000000867,
        longitude_delta: 0.11094100000002527
      })
    })
}

function getQSFromObject (object) {
  const qs = new URLSearchParams()
  for (const k in object) {
    qs.append(k, object[k])
  }
  return qs.toString().replace('%2B', '+')
}