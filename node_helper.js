const NodeHelper = require("node_helper")
const axios = require("axios")
const Log = require("logger")

function logInfo(...args) {
  Log.info("MMM-meal-planner", ...args)
}

function logError(...args) {
  Log.error("MMM-meal-planner", ...args)
}

function normalizeBaseUrl(url) {
  if (!url) return ""
  return String(url).replace(/\/+$/, "")
}

// In-memory cache for server-side image proxying.
// Key: relative imageUrl (e.g. "/api/display/images/{assetId}")
// Value: { dataUri: string, etag: string|null }
const imageCache = new Map()

async function fetchImageAsDataUri(relativeUrl, baseUrl, apiKey) {
  const fullUrl = `${baseUrl}${relativeUrl}`
  const cached = imageCache.get(relativeUrl)
  const headers = { "X-API-Key": apiKey }

  if (cached && cached.etag) {
    headers["If-None-Match"] = cached.etag
  }

  const response = await axios.get(fullUrl, {
    responseType: "arraybuffer",
    headers,
    timeout: 15000,
    // Allow 304 through without throwing so we can reuse cached data URI.
    validateStatus: status => status === 200 || status === 304,
  })

  if (response.status === 304 && cached) {
    return cached.dataUri
  }

  const contentType = (response.headers["content-type"] || "image/jpeg").split(";")[0].trim()
  const b64 = Buffer.from(response.data).toString("base64")
  const dataUri = `data:${contentType};base64,${b64}`
  const etag = response.headers["etag"] || null

  imageCache.set(relativeUrl, { dataUri, etag })
  return dataUri
}

// For each meal with a relative imageUrl, proxy the bytes server-side and
// rewrite imageUrl to a data URI.  Absolute URLs are left unchanged.
// Errors per image are caught and logged; the meal is left without an image.
async function resolveImages(days, baseUrl, apiKey) {
  await Promise.all(
    days.flatMap(day =>
      (Array.isArray(day.meals) ? day.meals : []).map(async (meal) => {
        if (typeof meal.imageUrl !== "string" || !meal.imageUrl.startsWith("/")) return

        const relativeUrl = meal.imageUrl
        try {
          meal.imageUrl = await fetchImageAsDataUri(relativeUrl, baseUrl, apiKey)
        } catch (err) {
          const status = err.response && err.response.status
          const detail = status ? `HTTP ${status}` : err.message
          logError(`Failed to proxy image ${relativeUrl}: ${detail}`)
          delete meal.imageUrl
        }
      })
    )
  )
}

async function fetchMeals({ apiBaseUrl, apiKey, days }) {
  const baseUrl = normalizeBaseUrl(apiBaseUrl)
  const url = `${baseUrl}/api/display/meals`
  const params = { days: Number(days) || 7 }
  logInfo(`Fetching meals from ${url} with days=${params.days}`)

  const response = await axios.get(url, {
    params,
    headers: { "X-API-Key": apiKey },
    timeout: 15000,
  })

  if (!response.data || !Array.isArray(response.data.meals)) {
    throw new Error("Unexpected response shape from meal-planner API.")
  }

  return response.data.meals
}

module.exports = NodeHelper.create({
  start() {
    logInfo("node_helper started")
  },

  async socketNotificationReceived(notification, payload) {
    if (notification !== "GET_MEALS") return
    if (!payload || !payload.config) return

    const { identifier, config } = payload

    if (!config.apiKey) {
      this.sendSocketNotification("NEW_MEALS", {
        identifier,
        error: "Missing apiKey.",
      })
      return
    }

    try {
      const meals = await fetchMeals(config)
      logInfo(`Fetched ${meals.length} day(s) of meals for identifier ${identifier}`)

      await resolveImages(meals, normalizeBaseUrl(config.apiBaseUrl), config.apiKey)

      this.sendSocketNotification("NEW_MEALS", { identifier, data: meals })
    } catch (error) {
      const status = error.response && error.response.status
      const detail = status ? `HTTP ${status}` : error.message
      logError(`Failed to fetch meals: ${detail}`)
      this.sendSocketNotification("NEW_MEALS", {
        identifier,
        error: `Unable to reach meal-planner (${detail}).`,
      })
    }
  },
})
