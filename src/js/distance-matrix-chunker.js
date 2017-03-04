import Promise from 'bluebird'
import _ from 'lodash'
import async from 'async'

// Return the current hi-res time in milliseconds
const now = (() => {
  if (process && _.isFunction(process.hrtime)) {
    return nowServer
  }

  if (_.isObject(window) && _.isFunction(_.get(window, 'performance.now'))) {
    return nowBrowser
  }

  return nowFallback
})()

function nowFallback () {
  return Date.now()
}
function nowBrowser () {
  return Math.round(performance.now())
}
function nowServer () {
  return hrtoms(process.hrtime())
}

// task format: {
//    ...whateverYouWant,
//    size: Number
// }
function getQueue (doTask, elementsPerSecond) {
  const requests = []

  return async.queue((task, done) => {
    waitForBandwidth(task)
      .then(() => Promise.join(
        Promise.resolve(now()),
        doTask(task),
        (time, result) => Promise.resolve([time, result])
      ))
      .then(([time, result]) => {
        updateRequests(time, task.size)
        return done(null, result)
      })
      .catch(done)
  })

  function waitForBandwidth (task) {
    const currentTime = now()

    // How much bandwidth we need to wait for
    const bandwidthNeeded = elementsPerSecond - task.size

    // No requests yet, or the latest request was > 1sec in the past
    if (_.isEmpty(requests) || diff(currentTime, requests[0]) > 1e3)  {
      return Promise.resolve(true)
    }

    let elementsInRange = 0
    let bandwidthRestoredTime = currentTime
    let requestIndex = 0

    while (canStep()) {
      const [requestTime, requestSize] = requests[requestIndex]

      // We're done if the request was > 1sec ago
      if (diff(currentTime, requestTime) > 1e3) {
        break
      }

      elementsInRange += requestSize
      bandwidthRestoredTime = requestTime
      requestIndex += 1
    }

    // Bandwidth is fully restored every second, so we only need to wait
    // one second max.
    if (diff(currentTime, bandwidthRestoredTime) > 1e3) {
      return Promise.delay(1000)
    }

    // Wait until we get back the bandwidth needed to do the task
    return Promise.delay(diff(currentTime, bandwidthRestoredTime))

    function canStep () {
      return (
        requestIndex < requests.length &&
        diff(currentTime, bandwidthRestoredTime) < 1e3 &&
        elementsInRange < bandwidthNeeded
      )
    }
  }

  function updateRequests (requestTime, requestSize) {
    requests.unshift([ requestTime, requestSize ])
  }
}

function diff (source, dest) {
  return Math.abs(source - dest)
}

// Convert hi-res time to milliseconds
function hrtoms (hiRes) {
  return (hiRes[0] * 1e3 + hiRes[1] * 1e-6) | 0
}

const Errors = {
  SOURCES_NOT_ARRAY: `sources must be an array`,
}

// doCache: (source, dest, mode, result) => void
export default function getChunker (
  service,
  {
    maxElementsPerSecond = 100,
    elementsPerChunk = 24,
    getCachedResult,
    setCachedResult,
  } = {}
) {
  // Async queue for processing the the requests
  const Q = getQueue(
    task => {
      // Sources must already be < 25 elements
      // task: {
      //    sources: [ LatLng ],
      //    dest: LatLng,
      //    mode: String
      // }
      const taskData = task.payload

      return new Promise((resolve, reject) => {
        service.getDistanceMatrix({
          origins: taskData.sources,
          destinations: [taskData.dest],
          travelMode: taskData.mode
        }, (results, status) => {
          if (status === 'OK' && results.rows) {
            const distances = results.rows.map(_.property('elements[0]'))
            cacheResults(setCachedResult, taskData, distances)

            return resolve(distances)
          }

          console.error(`Failed ${taskData.mode} on chunk ${taskData}:`, status)
          return reject(new Error(status))
        })
      })
    },
    maxElementsPerSecond
  )

  return function (sources, dest, mode) {
    if (!Array.isArray(sources)) {
      console.error(Errors.SOURCES_NOT_ARRAY)
      return Promise.reject(new Error(Errors.SOURCES_NOT_ARRAY))
    }

    const withCachedResults = sources.map(
      source => [ source, getCachedResult(source, dest, mode) ]
    )

    const [cached, uncached] = _.partition(
      withCachedResults,
      ([ ,cached ]) => Boolean(cached)
    )

    const chunks = _.chunk(
      uncached.map(_.property(0)),
      elementsPerChunk
    )

    return Promise.map(
      chunks,
      chunk => doTask(getTask(chunk, dest, mode))
    ).then(chunkResults => {
      return cached.map(_.property(1))
        .concat(_.flatten(chunkResults))
    })
  }

  // Given a task object, returns a Promise that resolves with
  // the result
  function doTask (task) {
    return new Promise((resolve, reject) => {
      Q.push(task, (err, taskResult) => {
        if (err) {
          console.log(`task ${task} erred:`, err)
          return reject(err)
        }

        return resolve(taskResult)
      })
    })
  }

  // Returns a task object based on origins, a destination, and
  // a travel mode.
  function getTask (origins, destination, travelMode) {
    return {
      payload: {
        sources: origins,
        dest: destination,
        mode: travelMode
      },

      size: origins.length
    }
  }
}

function cacheResults (doCache, task, distances) {
  task.sources.forEach(
    (source, idx) => doCache(source, task.dest, task.mode, distances[idx])
  )
}
