Module.register("MMM-meal-planner", {
  defaults: {
    apiBaseUrl: "https://meals.themartinez.cloud",
    apiKey: "",
    days: 7,
    updateFrequency: 300,
    showEmptyDays: true,
    emptyDayText: "—",
    dateFormat: "ddd, MMM D",
    showDescription: false,
    showHeaderForToday: true,
    initialLoadDelay: 1000,
    layout: "week",
    thumbnailHeight: "6rem",
  },

  getStyles() {
    return ["MMM-meal-planner.css"]
  },

  getHeader() {
    return this.data.header
  },

  start() {
    this.meals = null
    this.error = null
    this.loaded = false

    if (!this.config.apiKey) {
      this.error = "Missing apiKey in module config."
      this.logError(this.error)
      this.updateDom()
      return
    }

    setTimeout(() => this.fetchMeals(), this.config.initialLoadDelay)
    setInterval(
      () => this.fetchMeals(),
      Math.max(30, Number(this.config.updateFrequency)) * 1000,
    )
  },

  fetchMeals() {
    this.logInfo("Requesting meals for identifier: " + this.identifier)
    this.sendSocketNotification("GET_MEALS", {
      identifier: this.identifier,
      config: {
        apiBaseUrl: this.config.apiBaseUrl,
        apiKey: this.config.apiKey,
        days: this.config.days,
      },
    })
  },

  socketNotificationReceived(notification, payload) {
    if (notification !== "NEW_MEALS" || !payload || payload.identifier !== this.identifier) {
      return
    }

    this.loaded = true
    if (payload.error) {
      this.error = payload.error
      this.meals = null
    } else {
      this.error = null
      this.meals = Array.isArray(payload.data) ? payload.data : []
    }
    this.updateDom()
  },

  getDom() {
    const wrapper = document.createElement("div")
    wrapper.className = "MMM-meal-planner"
    wrapper.style.setProperty("--mmp-thumb-height", this.config.thumbnailHeight)

    if (!this.loaded && !this.error) {
      wrapper.innerHTML = "Loading meals…"
      wrapper.classList.add("dimmed", "light", "small")
      return wrapper
    }

    if (this.error) {
      wrapper.innerHTML = "Meal planner: " + this.escapeHtml(this.error)
      wrapper.classList.add("dimmed", "light", "small")
      return wrapper
    }

    if (!this.meals || this.meals.length === 0) {
      wrapper.innerHTML = "No upcoming meals."
      wrapper.classList.add("dimmed", "light", "small")
      return wrapper
    }

    if (this.config.layout === "week") {
      this.renderWeek(wrapper)
    } else {
      this.renderList(wrapper)
    }

    return wrapper
  },

  renderList(wrapper) {
    const todayKey = this.toDateKey(new Date())

    this.meals.forEach((day) => {
      const hasMeals = Array.isArray(day.meals) && day.meals.length > 0
      if (!hasMeals && !this.config.showEmptyDays) {
        return
      }

      const row = document.createElement("div")
      row.className = "meal-day"
      if (day.date === todayKey) {
        row.classList.add("today")
      }
      if (!hasMeals) {
        row.classList.add("empty")
      }

      const dateEl = document.createElement("span")
      dateEl.className = "meal-date"
      dateEl.textContent = this.formatDate(day.date, day.dayOfWeek)
      row.appendChild(dateEl)

      const mealsEl = document.createElement("span")
      mealsEl.className = "meal-list"

      if (!hasMeals) {
        const emptyEl = document.createElement("span")
        emptyEl.className = "meal meal-empty"
        emptyEl.textContent = this.config.emptyDayText
        mealsEl.appendChild(emptyEl)
      } else {
        day.meals.forEach((meal) => {
          const mealEl = document.createElement("span")
          mealEl.className = "meal"
          if (meal.placeholderKind) {
            mealEl.classList.add("placeholder")
            mealEl.classList.add("placeholder-" + String(meal.placeholderKind).toLowerCase().replace(/_/g, "-"))
          }

          const nameEl = document.createElement("span")
          nameEl.className = "meal-name"
          nameEl.textContent = meal.name || ""
          mealEl.appendChild(nameEl)

          if (this.config.showDescription && meal.description) {
            const descEl = document.createElement("span")
            descEl.className = "meal-description"
            descEl.textContent = meal.description
            mealEl.appendChild(descEl)
          }

          mealsEl.appendChild(mealEl)
        })
      }

      row.appendChild(mealsEl)
      wrapper.appendChild(row)
    })
  },

  renderWeek(wrapper) {
    wrapper.classList.add("layout-week")
    const todayKey = this.toDateKey(new Date())

    const daysToRender = this.meals.filter((day) => {
      const hasMeals = Array.isArray(day.meals) && day.meals.length > 0
      return hasMeals || this.config.showEmptyDays
    })

    const grid = document.createElement("div")
    grid.className = "meal-week-grid"
    if (daysToRender.length > 0) {
      grid.style.gridTemplateColumns = "repeat(" + daysToRender.length + ", 1fr)"
    }

    daysToRender.forEach((day) => {
      const hasMeals = Array.isArray(day.meals) && day.meals.length > 0

      const cell = document.createElement("div")
      cell.className = "meal-week-cell"
      if (day.date === todayKey) {
        cell.classList.add("today")
      }
      if (!hasMeals) {
        cell.classList.add("empty")
      }

      // Day label
      const dateEl = document.createElement("div")
      dateEl.className = "meal-date"
      dateEl.textContent = this.formatDate(day.date, day.dayOfWeek)
      cell.appendChild(dateEl)

      if (!hasMeals) {
        // Empty-day placeholder item
        const item = document.createElement("div")
        item.className = "meal-week-item"

        const imageWrap = document.createElement("div")
        imageWrap.className = "meal-image-wrap no-image"
        const iconEl = document.createElement("span")
        iconEl.className = "meal-placeholder-icon"
        iconEl.textContent = "—"
        imageWrap.appendChild(iconEl)
        item.appendChild(imageWrap)

        const nameEl = document.createElement("div")
        nameEl.className = "meal-name meal-empty"
        nameEl.textContent = this.config.emptyDayText
        item.appendChild(nameEl)

        cell.appendChild(item)
      } else {
        day.meals.forEach((meal) => {
          const item = document.createElement("div")
          item.className = "meal-week-item"
          if (meal.placeholderKind) {
            item.classList.add("placeholder")
            item.classList.add("placeholder-" + String(meal.placeholderKind).toLowerCase().replace(/_/g, "-"))
          }

          // Image or placeholder treatment
          const imageWrap = document.createElement("div")
          imageWrap.className = "meal-image-wrap"

          const hasImage = !meal.placeholderKind
            && typeof meal.imageUrl === "string"
            && meal.imageUrl.length > 0

          if (hasImage) {
            const img = document.createElement("img")
            img.className = "meal-image"
            img.src = meal.imageUrl // DOM property — safe, no innerHTML interpolation
            img.alt = meal.name || ""
            img.loading = "lazy"
            imageWrap.appendChild(img)
          } else {
            // No real image: show icon centred on dimmed background
            imageWrap.classList.add("no-image")
            const iconEl = document.createElement("span")
            iconEl.className = "meal-placeholder-icon"
            iconEl.textContent = (typeof meal.icon === "string" && meal.icon) ? meal.icon : "🍽"
            imageWrap.appendChild(iconEl)
          }

          item.appendChild(imageWrap)

          // Meal name
          const nameEl = document.createElement("div")
          nameEl.className = "meal-name"
          nameEl.textContent = meal.name || ""
          item.appendChild(nameEl)

          // Optional description
          if (this.config.showDescription && meal.description) {
            const descEl = document.createElement("div")
            descEl.className = "meal-description"
            descEl.textContent = meal.description
            item.appendChild(descEl)
          }

          cell.appendChild(item)
        })
      }

      grid.appendChild(cell)
    })

    wrapper.appendChild(grid)
  },

  formatDate(dateStr, fallbackDayOfWeek) {
    if (typeof moment !== "undefined") {
      return moment(dateStr, "YYYY-MM-DD").format(this.config.dateFormat)
    }
    return fallbackDayOfWeek || dateStr
  },

  toDateKey(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  },

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  },

  logInfo(...args) {
    Log.info("MMM-meal-planner", ...args)
  },

  logError(...args) {
    Log.error("MMM-meal-planner", ...args)
  },
})
