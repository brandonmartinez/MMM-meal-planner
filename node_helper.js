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
