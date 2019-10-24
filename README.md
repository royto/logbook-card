# Logbook card

A custom [Lovelace](https://www.home-assistant.io/lovelace/) component for displaying history of an entity for [Home Assistant](https://github.com/home-assistant/home-assistant).

![logbook card example](images/screenshot.png)

## Installation

### HACS

This card will be available in HACS (Home Assistant Community Store).

For now, you can add the repository as custom repository of type `plugin` in the settings page.

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

### Example usage

```yaml
type: 'custom:logbook-card'
desc: true
entity: sun.sun
hiddenState:
  - above_horizon
title: Day history
```
