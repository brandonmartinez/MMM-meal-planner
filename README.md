# MMM-meal-planner

A [MagicMirror²][mm] module that displays a rolling list of upcoming meals from a
[meal-planner](https://github.com/brandonmartinez/meal-planner) instance.

## Screenshot

The module renders one row per day, starting from today, showing the planned meal(s)
for each day. Today's row is decorated and "placeholder" meals (e.g., free days,
dining out) are visually distinct.

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
    position: "top_right",
    header: "This Week's Meals",
    config: {
        apiBaseUrl: "https://meals.themartinez.cloud",
        apiKey: "YOUR_API_KEY",
        days: 7
    }
}
```

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
| `days`              | `number`  | `7`                                  | Number of rolling days to show, starting today.                             |
| `updateFrequency`   | `number`  | `300`                                | How often to refetch meals, in seconds. Minimum effective value is 30.      |
| `showEmptyDays`     | `boolean` | `true`                               | If `true`, render days with no planned meal using `emptyDayText`.           |
| `emptyDayText`      | `string`  | `"—"`                                | Text shown for empty days when `showEmptyDays` is `true`.                   |
| `dateFormat`        | `string`  | `"ddd, MMM D"`                       | Moment.js format string for the date label.                                 |
| `showDescription`   | `boolean` | `false`                              | If `true`, show each meal's description below its name.                     |
| `initialLoadDelay`  | `number`  | `1000`                               | Delay (ms) before the first fetch after MagicMirror boots.                  |

## Styling

The module is fully namespaced under `.MMM-meal-planner`. Useful selectors:

- `.MMM-meal-planner .meal-day` — one row per day
- `.MMM-meal-planner .meal-day.today` — the row for today
- `.MMM-meal-planner .meal-day.empty` — a row with no planned meal
- `.MMM-meal-planner .meal .placeholder` — a placeholder meal (e.g., FREE_DAY)
- `.MMM-meal-planner .meal-name` / `.meal-description` — meal text

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
