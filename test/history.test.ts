import { ExtendedHomeAssistant, HiddenConfig } from './../src/types';
import { EntityHistoryConfig, toHistory } from '../src/history';
import { wildcardToRegExp } from '../src/helpers';
import { History } from '../src/types';
import { expect, test, describe } from 'vitest';
import { Context } from 'home-assistant-js-websocket';
import { toHiddenRegex, toStateMapRegex } from '../src/config-helpers';

const hass = {
  locale: {
    language: 'en',
  },
  localize: key => key,
} as ExtendedHomeAssistant;

type partialEntityConfig = Partial<EntityHistoryConfig> & { hidden_state?: HiddenConfig[] };

const buildConfig = (config: partialEntityConfig): EntityHistoryConfig => {
  return {
    entity: 'default',
    hidden_state: [],
    hidden_state_regexp: toHiddenRegex(config.hidden_state),
    ...config,
    show_history: false,
  };
};

const defaultConfiguration = buildConfig({});

function expectStates(expectedStates: string[], history: History[]): void {
  expect(history).toHaveLength(expectedStates.length);
  for (let index = 0; index < expectedStates.length; index++) {
    expect(history[index].state).toBe(expectedStates[index]);
  }
}

test('should return empty if no history', () => {
  expect(toHistory([], hass, defaultConfiguration)).toHaveLength(0);
});

const context: Context = {
  id: 'guid',
  parent_id: null,
  user_id: null,
};

const rawHistory = [
  {
    entity_id: 'light.escalier',
    state: 'on',
    attributes: { color_mode: 'color', battery_level: 80, friendly_name: 'Escalier' },
    last_changed: '2023-05-29T17:27:30.199538+00:00',
    last_updated: '2023-05-29T17:27:30.199538+00:00',
    context: context,
  },
  {
    entity_id: 'light.escalier',
    state: 'off',
    attributes: { friendly_name: 'Escalier', battery_level: 80 },
    last_changed: '2023-05-29T18:04:29.805697+00:00',
    last_updated: '2023-05-29T18:04:29.805697+00:00',
    context: context,
  },
];

test('by default should return all entries', () => {
  const history = toHistory(rawHistory, hass, defaultConfiguration);
  expect(history).toHaveLength(rawHistory.length);

  expect(history[0].attributes).toHaveLength(0);
  expect(history[0].state).toBe('on');
  expect(history[0].start).toStrictEqual(new Date('2023-05-29T17:27:30.199Z'));
  expect(history[0].end).toStrictEqual(new Date('2023-05-29T18:04:29.805Z'));
});

describe('map_state', () => {
  test('should use label if specified', () => {
    const configuration = buildConfig({
      state_map: [
        {
          value: wildcardToRegExp('on'),
          label: 'Marche',
        },
        {
          value: wildcardToRegExp('off'),
          label: 'Arrêt',
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    expect(history[0].label).toBe('Marche');
    expect(history[1].label).toBe('Arrêt');
  });

  test('should use icon if specified', () => {
    const configuration = buildConfig({
      state_map: [
        {
          value: wildcardToRegExp('on'),
          icon: 'mdi:lightbulb-on',
        },
        {
          value: wildcardToRegExp('off'),
          icon: 'mdi:lightbulb',
          icon_color: '#211081',
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    expect(history[0].icon).toMatchObject({ icon: 'mdi:lightbulb-on', color: undefined });
    expect(history[1].icon).toMatchObject({ icon: 'mdi:lightbulb', color: '#211081' });
  });

  test('should use icon_color if specified and default icon ', () => {
    const configuration = buildConfig({
      state_map: [
        {
          value: wildcardToRegExp('on'),
          icon: 'mdi:lightbulb-on',
        },
        {
          value: wildcardToRegExp('off'),
          icon_color: '#211081',
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    expect(history[0].icon).toMatchObject({ icon: 'mdi:lightbulb-on', color: undefined });
    expect(history[1].icon).toMatchObject({ icon: 'hass:lightbulb', color: '#211081' });
  });

  test('should apply based on attribute', () => {
    const rawHistory = [
      {
        entity_id: 'light.escalier',
        state: 'on',
        attributes: { color_mode: 'color', battery_level: 80, friendly_name: 'Escalier' },
        last_changed: '2023-05-29T17:27:30.199538+00:00',
        last_updated: '2023-05-29T17:27:30.199538+00:00',
        context: context,
      },
      {
        entity_id: 'light.escalier',
        state: 'off',
        attributes: { friendly_name: 'Escalier', battery_level: 80 },
        last_changed: '2023-05-29T18:04:29.805697+00:00',
        last_updated: '2023-05-29T18:04:29.805697+00:00',
        context: context,
      },
      {
        entity_id: 'light.escalier',
        state: 'on',
        attributes: { color_mode: 'grey', battery_level: 80, friendly_name: 'Escalier' },
        last_changed: '2023-05-29T17:27:30.199538+00:00',
        last_updated: '2023-05-29T17:27:30.199538+00:00',
        context: context,
      },
    ];

    const configuration = buildConfig({
      state_map: [
        {
          value: wildcardToRegExp('on'),
          icon: 'mdi:lightbulb-on',
          icon_color: 'red',
          label: 'Red light',
          attributes: [
            {
              name: 'color_mode',
              value: wildcardToRegExp('color'),
            },
          ],
        },
        {
          value: wildcardToRegExp('on'),
          label: 'Grey light',
          icon: 'mdi:lightbulb-on',
          icon_color: 'grey',
        },
        {
          value: wildcardToRegExp('off'),
          icon_color: '#211081',
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    expect(history[0]).toMatchObject({ label: 'Red light', icon: { icon: 'mdi:lightbulb-on', color: 'red' } });
    expect(history[1]).toMatchObject({ icon: { icon: 'hass:lightbulb', color: '#211081' } });
    expect(history[2]).toMatchObject({ label: 'Grey light', icon: { icon: 'mdi:lightbulb-on', color: 'grey' } });
  });
});

describe('attributes', () => {
  test('should use label if specified', () => {
    const configuration = buildConfig({
      attributes: [
        {
          value: 'friendly_name',
          label: 'Nom',
        },
        {
          value: 'battery_level',
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    history.forEach(h => {
      expect(h.attributes).toHaveLength(2);
      expect(h.attributes).toEqual([
        { name: 'Nom', value: 'Escalier' },
        { name: 'battery_level', value: 80 },
      ]);
    });
  });

  test('should show attribute even if value is zero', () => {
    const configuration = buildConfig({
      attributes: [
        {
          value: 'battery_level',
        },
      ],
    });

    const historyWithBatteryLevelAtZero = rawHistory.map(h => ({
      ...h,
      attributes: { ...h.attributes, battery_level: 0 },
    }));

    const history = toHistory(historyWithBatteryLevelAtZero, hass, configuration);
    history.forEach(h => {
      expect(h.attributes).toHaveLength(1);
      expect(h.attributes).toEqual([{ name: 'battery_level', value: 0 }]);
    });
  });

  test('should return empty if no attributes specified', () => {
    const configuration = buildConfig({
      attributes: [],
    });

    const history = toHistory(rawHistory, hass, configuration);
    history.forEach(h => {
      expect(h.attributes).toHaveLength(0);
    });
  });

  test('should return only attributes present', () => {
    const configuration = buildConfig({
      attributes: [
        {
          value: 'unknown',
          label: 'Inconnu',
        },
        {
          value: 'battery_level',
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    history.forEach(h => {
      expect(h.attributes).toHaveLength(1);
      expect(h.attributes).toEqual([{ name: 'battery_level', value: 80 }]);
    });
  });

  test('attributes with null', () => {
    const raw = [
      {
        entity_id: 'sensor.notify_last_redmi_all_attr',
        state: 'state with multiple line\nline2\nline3',
        attributes: {
          Apps: null,
          icon: 'mdi:message',
          friendly_name: 'Notify last redmi all attr',
        },
        last_changed: '2023-05-29T17:27:30.199538+00:00',
        last_updated: '2023-05-29T17:27:30.199538+00:00',
        context: context,
      },
    ];

    const configuration = buildConfig({
      attributes: [
        {
          value: 'Apps',
        },
        {
          value: 'icon',
        },
      ],
    });

    const history = toHistory(raw, hass, configuration);
    history.forEach(h => {
      expect(h.attributes.length).toBe(2);
      expect(h.attributes).toEqual([
        { name: 'Apps', value: 'null' },
        { name: 'icon', value: 'mdi:message' },
      ]);
    });
  });

  test('state with line breaks', () => {
    const raw = [
      {
        entity_id: 'sensor.notify_last_redmi_all_attr',
        state: 'state with multiple line\nline2\nline3',
        attributes: {
          Apps: 'com.google.android.apps.messaging',
          icon: 'mdi:message',
          friendly_name: 'Notify last redmi all attr',
        },
        last_changed: '2023-05-29T17:27:30.199538+00:00',
        last_updated: '2023-05-29T17:27:30.199538+00:00',
        context: context,
      },
    ];

    const configuration = buildConfig({
      state_map: [
        {
          value: wildcardToRegExp('*'),
          icon: 'mid: home',
          icon_color: '#094689',
          attributes: [{ name: 'Apps', value: wildcardToRegExp('com.google.android.apps.messaging') }],
        },
      ],
    });

    const history = toHistory(raw, hass, configuration);
    history.forEach(h => {
      expect(h.icon.color).toBe('#094689');
    });
  });
});

describe('hide entry', () => {
  test('should hide based on state only', () => {
    const configuration = buildConfig({
      hidden_state: [
        {
          state: 'off',
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    expectStates(['on'], history);
  });

  test.each([
    ['of*', 1, 'on'],
    ['*ff', 1, 'on'],
    ['o*', 0, null],
    ['on', 1, 'off'],
  ])('should hide with state regexp', (state, expectedLength, expectedState) => {
    const configuration = buildConfig({
      hidden_state: [
        {
          state,
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    expect(history).toHaveLength(expectedLength);
    if (expectedLength) {
      expect(history[0].state).toBe(expectedState);
    }
  });

  test('should hide based on state and attribute', () => {
    const rawHistory = [
      {
        entity_id: 'light.escalier',
        state: 'on',
        attributes: { color_mode: 'onoff', battery_level: 80, friendly_name: 'Escalier' },
        last_changed: '2023-05-29T17:27:30.199538+00:00',
        last_updated: '2023-05-29T17:27:30.199538+00:00',
        context: context,
      },
      {
        entity_id: 'light.escalier',
        state: 'off',
        attributes: { friendly_name: 'Escalier', battery_level: 80 },
        last_changed: '2023-05-29T18:04:29.805697+00:00',
        last_updated: '2023-05-29T18:04:29.805697+00:00',
        context: context,
      },
      {
        entity_id: 'light.escalier',
        state: 'on',
        attributes: { color_mode: 'onoff', battery_level: 78, friendly_name: 'Escalier' },
        last_changed: '2023-05-29T18:27:30.199538+00:00',
        last_updated: '2023-05-29T18:27:30.199538+00:00',
        context: context,
      },
      {
        entity_id: 'light.escalier',
        state: 'off',
        attributes: { friendly_name: 'Escalier', battery_level: 77 },
        last_changed: '2023-05-29T19:05:29.805697+00:00',
        last_updated: '2023-05-29T19:05:29.805697+00:00',
        context: context,
      },
    ];

    const configuration = buildConfig({
      hidden_state: [
        {
          state: 'off',
          attribute: {
            name: 'battery_level',
            value: '80',
          },
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    expectStates(['on', 'on', 'off'], history);
  });

  test('should hide based on attribute only', () => {
    const rawHistory = [
      {
        entity_id: 'light.escalier',
        state: 'on',
        attributes: { color_mode: 'onoff', battery_level: 80, friendly_name: 'Escalier' },
        last_changed: '2023-05-29T17:27:30.199538+00:00',
        last_updated: '2023-05-29T17:27:30.199538+00:00',
        context: context,
      },
      {
        entity_id: 'light.escalier',
        state: 'off',
        attributes: { friendly_name: 'Escalier', battery_level: 80 },
        last_changed: '2023-05-29T18:04:29.805697+00:00',
        last_updated: '2023-05-29T18:04:29.805697+00:00',
        context: context,
      },
      {
        entity_id: 'light.escalier',
        state: 'on',
        attributes: { color_mode: 'onoff', battery_level: 78, friendly_name: 'Escalier' },
        last_changed: '2023-05-29T18:27:30.199538+00:00',
        last_updated: '2023-05-29T18:27:30.199538+00:00',
        context: context,
      },
      {
        entity_id: 'light.escalier',
        state: 'off',
        attributes: { friendly_name: 'Escalier', battery_level: 77 },
        last_changed: '2023-05-29T19:05:29.805697+00:00',
        last_updated: '2023-05-29T19:05:29.805697+00:00',
        context: context,
      },
    ];

    const configuration = buildConfig({
      hidden_state: [
        {
          attribute: {
            name: 'battery_level',
            value: '80',
          },
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    expectStates(['on', 'off'], history);
  });
});

// squash state
// start / end
// minimal duration
// multiple config (desc, hidden, max_items ...)

describe('minimal_duration', () => {
  const rawHistory = [
    {
      entity_id: 'light.escalier',
      state: 'on',
      attributes: { color_mode: 'onoff', battery_level: 80, friendly_name: 'Escalier' },
      last_changed: '2023-05-29T17:27:30.199538+00:00',
      last_updated: '2023-05-29T17:27:30.199538+00:00',
      context: context,
    },
    {
      entity_id: 'light.escalier',
      state: 'off',
      attributes: { friendly_name: 'Escalier', battery_level: 80 },
      last_changed: '2023-05-29T18:04:29.805697+00:00',
      last_updated: '2023-05-29T18:04:29.805697+00:00',
      context: context,
    },
    {
      entity_id: 'light.escalier',
      state: 'on',
      attributes: { friendly_name: 'Escalier', battery_level: 80 },
      last_changed: '2023-05-29T18:04:30.805697+00:00',
      last_updated: '2023-05-29T18:04:30.805697+00:00',
      context: context,
    },
    {
      entity_id: 'light.escalier',
      state: 'off',
      attributes: { friendly_name: 'Escalier', battery_level: 80 },
      last_changed: '2023-05-29T18:04:41.805697+00:00',
      last_updated: '2023-05-29T18:04:41.805697+00:00',
      context: context,
    },
    {
      entity_id: 'light.escalier',
      state: 'on',
      attributes: { friendly_name: 'Escalier', battery_level: 80 },
      last_changed: '2023-05-29T18:04:50.805697+00:00',
      last_updated: '2023-05-29T18:04:50.805697+00:00',
      context: context,
    },
  ];

  test('should returns all by default', () => {
    const history = toHistory(rawHistory, hass, defaultConfiguration);
    expect(history).toHaveLength(5);
  });

  test('should keep only items with duration higher than minimal duration', () => {
    const configuration = buildConfig({ minimal_duration: 9 });

    const history = toHistory(rawHistory, hass, configuration);
    expect(history).toHaveLength(3);
    expect(history[0].state).toBe('on');
    expect(history[1].state).toBe('off');
    expect(history[2].state).toBe('on');
  });
});

describe('duration', () => {
  const rawHistory = [
    {
      entity_id: 'light.escalier',
      state: 'on',
      attributes: { color_mode: 'onoff', battery_level: 80, friendly_name: 'Escalier' },
      last_changed: '2023-05-29T17:27:30.199538+00:00',
      last_updated: '2023-05-29T17:27:30.199538+00:00',
      context: context,
    },
    {
      entity_id: 'light.escalier',
      state: 'off',
      attributes: { friendly_name: 'Escalier', battery_level: 80 },
      last_changed: '2023-05-29T18:04:29.805697+00:00',
      last_updated: '2023-05-29T18:04:29.805697+00:00',
      context: context,
    },
    {
      entity_id: 'light.escalier',
      state: 'on',
      attributes: { friendly_name: 'Escalier', battery_level: 80 },
      last_changed: '2023-05-29T18:04:30.805697+00:00',
      last_updated: '2023-05-29T18:04:30.805697+00:00',
      context: context,
    },
    {
      entity_id: 'light.escalier',
      state: 'off',
      attributes: { friendly_name: 'Escalier', battery_level: 80 },
      last_changed: '2023-05-29T18:04:41.805697+00:00',
      last_updated: '2023-05-29T18:04:41.805697+00:00',
      context: context,
    },
    {
      entity_id: 'light.escalier',
      state: 'on',
      attributes: { friendly_name: 'Escalier', battery_level: 80 },
      last_changed: '2023-05-29T18:04:50.805697+00:00',
      last_updated: '2023-05-29T18:04:50.805697+00:00',
      context: context,
    },
  ];

  test('should calculate duration ', () => {
    const history = toHistory(rawHistory, hass, defaultConfiguration);
    //#expect(history[0].duration).toBe('1m');
    expect(history[1].duration).toBe(1000);
    expect(history[2].duration).toBe(11000);
    expect(history[3].duration).toBe(9000);
  });
});

describe('entity_name', () => {
  const rawHistory = [
    {
      entity_id: 'light.escalier',
      state: 'on',
      attributes: { color_mode: 'onoff', battery_level: 80, friendly_name: 'Escalier' },
      last_changed: '2023-05-29T17:27:30.199538+00:00',
      last_updated: '2023-05-29T17:27:30.199538+00:00',
      context: context,
    },
  ];

  test('should returns friendly name by default', () => {
    const history = toHistory(rawHistory, hass, defaultConfiguration);
    expect(history[0].entity_name).toBe('Escalier');
  });

  test('should returns entity name defined in config', () => {
    const configuration = buildConfig({ entity_name: 'Lumiere escalier' });

    const history = toHistory(rawHistory, hass, configuration);
    expect(history[0].entity_name).toBe('Lumiere escalier');
  });
});
