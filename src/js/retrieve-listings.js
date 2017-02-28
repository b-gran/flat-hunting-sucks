// import GoogleMaps from '@google/maps'
import _ from 'lodash'
import Promise from 'bluebird'
import 'whatwg-fetch'

// const google = window.google
//
// const geocoder = new google.maps.Geocoder()
// const distance = new google.maps.DistanceMatrixService()

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
  return Promise.resolve(true)
  // return getSRQueryString(form)
  //   .then(uriParams => {
  //     return fetch(
  //       `https://www.spareroom.co.uk/flatshare/api.pl?${uriParams}`,
  //       {
  //         mode: 'cors',
  //         credentials: 'include',
  //         // referrer: 'https://www.spareroom.co.uk/flatshare/index.cgi?&search_id=443756521&show_results=as+a+map&mode=edit&editing=438645562'
  //         // headers: {
  //         //   Cookie: '__lc.visitor_id.1040610=S1483629845.95c34c9e16; cc=GB; session_id=206611558; session_key=148719954344584; user_id=8811196; moreinfocount=4; new_search_history=443756521',
  //         // }
  //       }
  //     )
  //   })
  //   .then(res => {
  //     console.log('res', res)
  //   })
  //   .catch(err => {
  //     console.log('err', err)
  //   })
}

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

        latitude:51.536213040708596,
        longitude:-0.14420300000006137,
        latitude_delta:0.05894100000000435,
        longitude_delta:0.10747400000002472

        // latitude: location.lat,
        // longitude: location.lng,
        // latitude_delta: 0.06317200000000867,
        // longitude_delta: 0.11094100000002527
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