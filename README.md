# MMM-meal-planner

A [MagicMirror²][mm] module that displays a rolling list of upcoming meals from a
[meal-planner](https://github.com/brandonmartinez/meal-planner) instance.

## Screenshot

The module supports two layouts:

- **`week` (default)** — a full-width horizontal strip of day-cells (one per day in the rolling `days` window) showing each meal's image, day label, name, and optional description. Ideal for a bottom or full-width MagicMirror region.
- **`list`** — the original compact vertical list, one row per day. Ideal for a right-side region.

## Installation

### Install

In your terminal, go to your [MagicMirror²][mm] modules folder and clone this module:

```bash
cd ~/MagicMirror/modules
git clone https://github.com/brandonmartinez/MMM-meal-planner.git
cd MMM-meal-planner
npm install
```

### Update

```bash
cd ~/MagicMirror/modules/MMM-meal-planner
git pull
npm install
```

## Configuration

Add the module to the `modules` array in your `config/config.js`:

```js
{
    module: "MMM-meal-planner",
    position: "bottom_bar",
    header: "This Week's Meals",
    config: {
        apiBaseUrl: "https://meals.themartinez.cloud",
        apiKey: "YOUR_API_KEY",
        days: 7,
        layout: "week"   // full-width image strip (default)
    }
}
```

For the original compact list, use `position: "top_right"` and set `layout: "list"`.

You can point `apiBaseUrl` at any meal-planner instance you control; the module is not
locked to a specific deployment.

### Generating an API key

API keys are issued by your meal-planner instance (per family). See the
[meal-planner README](https://github.com/brandonmartinez/meal-planner) for how to
create one. The key is sent on every request as the `X-API-Key` header.

## Configuration options

| Option              | Type      | Default                              | Description                                                                 |
| ------------------- | --------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `apiBaseUrl`        | `string`  | `https://meals.themartinez.cloud`    | Base URL of the meal-planner instance (no trailing slash required).         |
| `apiKey`            | `string`  | `""` (**required**)                  | API key for the family whose meals should be displayed.                     |
| `days`              | `number`  | `7`                                  | Number of days to display, anchored to today (today + the next `days − 1` days). For example, `days: 3` shows today and the next 2 days. |
| `updateFrequency`   | `number`  | `300`                                | How often to refetch meals, in seconds. Minimum effective value is 30.      |
| `layout`            | `string`  | `"week"`                             | Display layout. `"week"` renders a full-width horizontal image strip; `"list"` renders the compact vertical list. |
| `showEmptyDays`     | `boolean` | `true`                               | If `true`, render days with no planned meal using `emptyDayText`.           |
| `emptyDayText`      | `string`  | `"—"`                                | Text shown for empty days when `showEmptyDays` is `true`.                   |
| `dateFormat`        | `string`  | `"ddd, MMM D"`                       | Moment.js format string for the date label.                                 |
| `showDescription`   | `boolean` | `false`                              | If `true`, show each meal's description below its name (week layout clamps to 2 lines). |
| `thumbnailHeight`   | `string`  | `"6rem"`                             | Height of the meal image container (any CSS length, e.g. `"8rem"`, `"120px"`). Increase for larger thumbnails. Images always fill the area with `object-fit: cover`. |
| `initialLoadDelay`  | `number`  | `1000`                               | Delay (ms) before the first fetch after MagicMirror boots.                  |

## Styling

The module is fully namespaced under `.MMM-meal-planner`. Useful selectors:

**List layout (`layout: "list"`):**
- `.MMM-meal-planner .meal-day` — one row per day
- `.MMM-meal-planner .meal-day.today` — the row for today
- `.MMM-meal-planner .meal-day.empty` — a row with no planned meal
- `.MMM-meal-planner .meal .placeholder` — a placeholder meal (e.g., FREE_DAY)
- `.MMM-meal-planner .meal-name` / `.meal-description` — meal text

**Week layout (`layout: "week"`):**
- `.MMM-meal-planner .meal-week-grid` — the CSS grid container
- `.MMM-meal-planner .meal-week-cell` — one column per day
- `.MMM-meal-planner .meal-week-cell.today` — today's column
- `.MMM-meal-planner .meal-week-cell.empty` — a column with no planned meal
- `.MMM-meal-planner .meal-week-item` — individual meal within a cell
- `.MMM-meal-planner .meal-week-item.placeholder` — placeholder meal
- `.MMM-meal-planner .meal-image-wrap` — image container (height driven by `thumbnailHeight`)
- `.MMM-meal-planner .meal-image-wrap.no-image` — fallback when no image
- `.MMM-meal-planner .meal-placeholder-icon` — icon shown in no-image state

Override these in your MagicMirror `custom.css` to tailor the look.

## Underlying API

This module calls:

```
GET {apiBaseUrl}/api/display/meals?days={days}
X-API-Key: {apiKey}
```

See the
[meal-planner Display API documentation](https://github.com/brandonmartinez/meal-planner#api)
for details.

## License

[MIT](LICENSE)

[mm]: https://github.com/MagicMirrorOrg/MagicMirror
