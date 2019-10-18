# Logbook card

A custom [Lovelace](https://www.home-assistant.io/lovelace/) component for displaying history of an entity for [Home Assistant](https://github.com/home-assistant/home-assistant).

![logbook card example](images/screenshot.png)

## Using the card

### Options

#### Card options

| Name | Type | Default | Since | Default | Description |
|------|------|---------|-------|---------|-------------|
| type | string | **required** | v0.1 | | `custom:logbook-card`|
| entity | string | **required** | v0.1 | | An entity_id.|
| title | string | optional | v0.1 | *friendly_name* History | Card title|
| history | integer | optional | v0.1 | 5 | Numbers of days of history of the logbook |
| hiddenState | string[] | optional | v0.1 | [] | States to hide|
| desc | bool | optional | v0.1 | True | is logbook ordered descending|

### Example usage

```yaml
type: 'custom:logbook-card'
desc: true
entity: sun.sun
hiddenState:
  - above_horizon
title: Day history
```
