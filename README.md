# Logbook card

A custom [Lovelace](https://www.home-assistant.io/lovelace/) component for displaying history of an entity for [Home Assistant](https://github.com/home-assistant/home-assistant).

![logbook card example](images/screenshot.png)

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)
[![GitHub version](https://img.shields.io/github/v/release/royto/logbook-card?style=for-the-badge)](https://github.com/royto/logbook-card/releases)
[![GitHub license](https://img.shields.io/badge/LICENCE-GPLv3-green.svg?style=for-the-badge)](/LICENSE)

## Installation

### HACS

This card is available in [HACS](https://hacs.xyz/) (Home Assistant Community Store).

### Manual

Download the logbook-card.js from the latest release and store it in your configuration/www folder.
Configure Lovelace to load the card:

```yaml
resources:
  - url: /local/logbook-card.js?v=1
    type: js
```

## Using the card

### Options

#### Card options

| Name            | Type                                              | Required     | Since | Default                 | Description                                                                                                     |
| --------------- | ------------------------------------------------- | ------------ | ----- | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| type            | string                                            | **required** | v0.1  |                         | `custom:logbook-card`                                                                                           |
| entity          | string                                            | **required** | v0.1  |                         | An entity_id.                                                                                                   |
| title           | string                                            | optional     | v0.1  | _friendly_name_ History | Card title                                                                                                      |
| history         | integer                                           | optional     | v0.1  | 5                       | Numbers of days of history of the logbook                                                                       |
| hiddenState     | string[]                                          | optional     | v0.1  | []                      | States to hide                                                                                                  |
| desc            | bool                                              | optional     | v0.1  | True                    | is logbook ordered descending                                                                                   |
| no_event        | string                                            | optional     | v0.1  | No event on the period  | message displayed if no event to display                                                                        |
| max_items       | integer                                           | optional     | v0.2  | -1                      | Number of items to display. Ignored if < 0                                                                      |
| state_map       | [state map object](#state-map-object)             | optional     | v0.2  | []                      | List of entity states to convert                                                                                |
| show            | list                                              | optional     | v0.2  |                         | List of UI elements to display/hide, for available items see available [show options](#available-show-options). |
| attributes      | [attributes object](#attribute-object)            | optional     | v0.4  |                         | List of attributes to display.                                                                                  |
| duration_labels | [duration_labels object](#duration-labels-object) | optional     | v0.5  |                         | labels for duration.                                                                                            |

#### State map object

| Name                   |  Type  |    Default    | Description              |
| ---------------------- | :----: | :-----------: | ------------------------ |
| value **_(required)_** | string |               | Value to convert.        |
| label                  | string | same as value | String to show as label. |

#### Available show options

All properties are optional.

| Name       | Default |     Options      | Description        |
| ---------- | :-----: | :--------------: | ------------------ |
| state      | `true`  | `true` / `false` | Display state      |
| duration   | `true`  | `true` / `false` | Display duration   |
| start_date | `true`  | `true` / `false` | Display start date |
| end_date   | `true`  | `true` / `false` | Display end date   |

#### Attribute object

| Name                   |  Type  |    Default    | Description                                                             |
| ---------------------- | :----: | :-----------: | ----------------------------------------------------------------------- |
| value **_(required)_** | string |               | name of the attributes.                                                 |
| label                  | string | same as value | String to show as label.                                                |
| type                   | string |    string     | Type of the value used for formatting. Only date is currently supported |

#### Duration labels object

Allows to have custom labels for duration. Must contains `${value}` which will be replaced by the duration.

| Name    |  Type  |   Default   | Description        |
| ------- | :----: | :---------: | ------------------ |
| seconds | string | `${value}s` | label for seconds. |
| minutes | string | `${value}m` | label for minutes. |
| hours   | string | `${value}h` | label for hours.   |
| days    | string | `${value}d` | label for days.    |

### Example usage

Example with hidden states

```yaml
type: "custom:logbook-card"
desc: true
entity: sun.sun
hiddenState:
  - above_horizon
title: Day history
```

Example with state label

```yaml
entity: binary_sensor.garage_opening_sensor
max_items: 10
state_map:
  - label: Open
    value: on
  - label: Closed
    value: off
title: "Garage door history"
type: "custom:logbook-card"
show:
  end_date: false
  start_date: false
```

Example with attributes

```yaml
type: "custom:logbook-card"
desc: true
entity: sun.sun
title: Day history
attributes:
  - value: elevation
  - value: next_rising
    label: Next Rising
```

Example with duration labels in french:

```yaml
type: "custom:logbook-card"
desc: true
entity: binary_sensor.garage_opening_sensor
title: 'Garage'
duration_labels:
  seconds: '${value} secondes'
  minutes: '${value} minutes'
  hours:   '${value} heures'
  days:    '${value} jours'
```
