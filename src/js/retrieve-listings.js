import _ from 'lodash'
import Promise from 'bluebird'
import 'whatwg-fetch'
import getChunker from './distance-matrix-chunker'

const google = window.google

const geocoder = new google.maps.Geocoder()
const distance = new google.maps.DistanceMatrixService()

const doChunkedRequest = getChunker(
  distance,
  {
    maxElementsPerSecond: 100,
    elementsPerChunk: 24,
    getCachedResult: (source, dest, mode) => {
      const key = getDistanceKeyFromLatLng(source, dest, mode)
      const cachedValue = window.localStorage.getItem(key);

      if (_.isNil(cachedValue) || _.isEmpty(cachedValue)) {
        return cachedValue
      }

      return JSON.parse(cachedValue)
    },
    setCachedResult: (source, dest, mode, result) => {
      const key = getDistanceKeyFromLatLng(source, dest, mode)
      window.localStorage.setItem(key, JSON.stringify(result));
    },
  }
)

function getDistanceKeyFromLatLng (source, dest, mode) {
  const destObj = {
    lat: dest.lat(),
    lng: dest.lng(),
  }

  const sourceObj = {
    lat: source.lat(),
    lng: source.lng(),
  }

  return JSON.stringify(sourceObj) + JSON.stringify(destObj) + mode
}

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

// location, work, bike, transport, rent, bills, smoking
export default function (form) {
  return getCoords(form.work)
    .then(workRawCoords => {
      const workLatLng = new google.maps.LatLng(
        workRawCoords.lat,
        workRawCoords.lng,
      )

      return getSRQueryString(form)
        .then(uriParams => {
          return fetch(
            `https://www.spareroom.co.uk/flatshare/api.pl?${uriParams}` // ,
          )
        })
        .then(result => result.json())
        .then(body => normalizeListings(body.results, workLatLng))
    })
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

// pw = pcm × 0.2299794661
// pcm = pw * 4.3482142857
function normalizeListings (listings, work) {
  // Ensure rent is in pcm (instead of pw)
  const normalized = listings.map(modify({
    min_rent: (rent, _k, listing) => {
      return listing.per === 'pw'
        ? Math.round(rent * 4.3482142857)
        : rent
    },

    per: _.constant('pcm')
  }))

  const sources = normalized.map(listing => {
    listing.rentByRoom = isRentByRoom(listing)
    listing.isFullTime = isFullTime(listing)
    listing.ensuite = isEnsuite(listing)

    listing.LatLng = new google.maps.LatLng(
      Number(listing.latitude),
      Number(listing.longitude)
    )

    return listing
  })

  // Do these in series to make sure we don't hit API limits
  return doChunkedRequest(sources, work, 'BICYCLING')
    .then(cyclingResult => {
      return doChunkedRequest(sources, work, 'TRANSIT')
        .then(transitResult => {
          return [cyclingResult, transitResult]
        })
    })
    .then(([cyclingResult, transitResult]) => {
      return buildResult(cyclingResult, transitResult)
    })
    .catch(err => {
      console.log('Error in request:', err)
      return Promise.reject(err)
    })
}

function buildResult (cycling, transit) {
  const map = {}
  cycling.forEach(([listing, distance]) => {
    map[listing.advert_id] = map[listing.advert_id] || listing
    map[listing.advert_id].cyclingDistance = distance
  })
  transit.forEach(([listing, distance]) => {
    map[listing.advert_id] = map[listing.advert_id] || listing
    map[listing.advert_id].transitDistance = distance
  })

  return _.values(map)
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

// Other fields:
//    room_types: double | single
//    share_type: P | S
//                |   |
//                |   +- Students
//                +- Professionals
//    posted_by: agents | private_landlords
//    days_of_wk_available: "7 days a week" | "Mon to Fri only"
//    living_room: shared
//    smoking: Y | N

function getSRQueryString (form) {
  return getCoords(form.location)
    .then(location => {
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