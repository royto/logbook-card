# Logbook card

A custom [Lovelace](https://www.home-assistant.io/lovelace/) component for displaying history of an entity for [Home Assistant](https://github.com/home-assistant/home-assistant).

![logbook card example](images/screenshot.png)

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)
[![GitHub version](https://img.shields.io/github/v/release/royto/logbook-card?style=for-the-badge)](https://github.com/royto/logbook-card/releases)
[![GitHub license](https://img.shields.io/badge/LICENCE-GPLv3-green.svg?style=for-the-badge)](/LICENSE)

**WARNING**: Since 1.0.0, the resource type of the card is `JavaScript Module` and not `JavaScript File` anymore. In case of loading error, check if the resource type is `JavaScript module`.

## Installation

### HACS

This card is available in [HACS](https://hacs.xyz/) (Home Assistant Community Store).

### Manual

Download the logbook-card.js from the latest release and store it in your configuration/www folder.
Configure Lovelace to load the card:

```yaml
resources:
  - url: /local/logbook-card.js?v=1
    type: module
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
| date_format     | string                                            | optional     | v1.0  | default date time format                        | see [fecha formatting token](https://github.com/taylorhakes/fecha#formatting-tokens)       |
| separator_style     | [separator_style object](#separator-style-object)                          | optional     | v1.0  |                          | see style for separator (if activated)       |

#### State map object

| Name                   |  Type  |    Default         | Description              |
| ---------------------- | :----: | :----------------: | ------------------------ |
| value **_(required)_** | string |                    | Value to convert.        |
| label                  | string | same as value      | String to show as label. |
| icon                   | string | default state icon | Icon to show.            |

#### Available show options

All properties are optional.

| Name       | Default |     Options      | Description        |
| ---------- | :-----: | :--------------: | ------------------ |
| state      | `true`  | `true` / `false` | Display state      |
| duration   | `true`  | `true` / `false` | Display duration   |
| start_date | `true`  | `true` / `false` | Display start date |
| end_date   | `true`  | `true` / `false` | Display end date   |
| icon       | `true`  | `true` / `false` | Display icon       |
| separator  | `false` | `true` / `false` | Display separator  |

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
| second  | string | `${value}s` | label for second.  |
| seconds | string | `${value}s` | label for seconds. |
| minute  | string | `${value}m` | label for minute.  |
| minutes | string | `${value}m` | label for minutes. |
| hour    | string | `${value}h` | label for hour.    |
| hours   | string | `${value}h` | label for hours.   |
| day     | string | `${value}d` | label for day.     |
| days    | string | `${value}d` | label for days.    |

#### Separator style object

| Name       |  Type  |    Default         | Description              |
| -----------| :----: | :----------------: | ------------------------ |
| width      | number | `1`                    | Width of the separator. |
| style      | string | `solid`                | [Style](https://developer.mozilla.org/en-US/docs/Web/CSS/border-style) of the separator. |
| color      | string | `var(--divider-color)` | Color of the separator. |

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
  start_date: true
```

![Custom labels](images/custom-labels.png)

Example with attributes and custom date format

```yaml
type: "custom:logbook-card"
desc: true
entity: sun.sun
title: Day history
attributes:
  - value: elevation
  - value: next_rising
    label: Next Rising
    type: date
date_format: dd/MM/YYYY hh:mm
```

![Attributes and custom date format](images/attributes.png)

Example with duration labels in french:

```yaml
type: "custom:logbook-card"
desc: true
entity: binary_sensor.garage_opening_sensor
title: 'Garage'
duration_labels:
  second:  '${value} seconde'
  seconds: '${value} secondes'
  minute:  '${value} minute'
  minutes: '${value} minutes'
  hour:    '${value} heure'
  hours:   '${value} heures'
  day:     '${value} jour'
  days:    '${value} jours'
```

Example with custom separator style:

```yaml
type: "custom:logbook-card"
desc: true
entity: binary_sensor.garage_opening_sensor
title: 'Garage Door History'
show:
  separator: true
separator_style:
  color: black
  style: dashed
```

![Custom Separator](images/custom-separator.png)

Example with custom icons:

```yaml
entity: sensor.vacuum
hiddenState:
  - ''
state_map:
  - icon: 'mdi:stove'
    value: Kitchen
  - icon: 'mdi:hotel'
    value: Girls bedroom
  - icon: 'mdi:bed-double'
    value: Bedroom
  - icon: 'mdi:water-pump'
    value: Bathroom
  - icon: 'mdi:television'
    value: Living room
title: Vacuum History
type: 'custom:logbook-card'
```

![custom icon](images/custom-icon.png)
