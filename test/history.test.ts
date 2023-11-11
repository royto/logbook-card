import { ExtendedHomeAssistant, HiddenConfig } from './../src/types';
import { EntityHistoryConfig, toHistory } from '../src/history';
import { wildcardToRegExp } from '../src/helpers';
import { History } from '../src/types';
import { expect, test, describe } from 'vitest';
import { Context } from 'home-assistant-js-websocket';
import { toHiddenRegex } from '../src/config-helpers';

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
          value: 'on',
          label: 'Marche',
          regexp: wildcardToRegExp('on'),
        },
        {
          value: 'off',
          label: 'Arrêt',
          regexp: wildcardToRegExp('off'),
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
          value: 'on',
          icon: 'mdi:lightbulb-on',
          regexp: wildcardToRegExp('on'),
        },
        {
          value: 'off',
          icon: 'mdi:lightbulb',
          icon_color: '#211081',
          regexp: wildcardToRegExp('off'),
        },
      ],
    });

    const history = toHistory(rawHistory, hass, configuration);
    expect(history[0].icon.icon).toBe('mdi:lightbulb-on');
    expect(history[0].icon.color).toBeNull();
    expect(history[1].icon.icon).toBe('mdi:lightbulb');
    expect(history[1].icon.color).toBe('#211081');
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

  test('should return empty if no attributes specified', () => {
    const configuration = buildConfig({
      attributes: [],
    });

    const history = toHistory(rawHistory, hass, configuration);
    history.forEach(h => {
      expect(h.attributes).toHaveLength(0);
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
