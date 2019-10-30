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

| Name | Type | Required | Since | Default | Description |
|------|------|---------|-------|---------|-------------|
| type | string | **required** | v0.1 | | `custom:logbook-card`|
| entity | string | **required** | v0.1 | | An entity_id.|
| title | string | optional | v0.1 | *friendly_name* History | Card title|
| history | integer | optional | v0.1 | 5 | Numbers of days of history of the logbook |
| hiddenState | string[] | optional | v0.1 | [] | States to hide|
| desc | bool | optional | v0.1 | True | is logbook ordered descending|
| no_event | string | optional | v0.1 | No event on the period | message displayed if no event to display |
| max_items | integer | optional | v0.2 | -1 | Number of items to display. Ignored if < 0 |
| state_map | [state map object](#state-map-object) | optional | v0.2 | [] | List of entity states to convert |
| show | list | optional | v0.2 | | List of UI elements to display/hide, for available items see available [show options](#available-show-options).

#### State map object

| Name | Type | Default | Description |
|------|:----:|:-------:|-------------|
| value ***(required)*** | string |  | Value to convert.
| label | string | same as value | String to show as label.

#### Available show options

All properties are optional.

| Name | Default | Options | Description |
|------|:-------:|:-------:|-------------|
| state | `true` | `true` / `false` | Display state |
| duration | `true` | `true` / `false` | Display duration |
| start_date | `true` | `true` / `false` | Display start date |
| end_date | `true` | `true` / `false` | Display end date |

### Example usage

Example with hidden states

```yaml
type: 'custom:logbook-card'
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
title: 'Garage door history'
type: 'custom:logbook-card'
show:
  end_date: false
  start_date: false
```
