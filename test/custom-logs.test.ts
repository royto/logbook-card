import { describe, expect, test } from 'vitest';
import { EntityCustomLogConfig, LogbookEntry, toCustomLogs } from '../src/custom-logs';
import { wildcardToRegExp } from '../src/helpers';

type PartialEntityConfig = Partial<EntityCustomLogConfig>;

const buildConfig = (config: PartialEntityConfig): EntityCustomLogConfig => {
  return {
    entity: 'my_entity',
    custom_logs: true,
    log_map: [],
    ...config,
  };
};

const defaultConfiguration = buildConfig({});

const entries: LogbookEntry[] = [
  {
    name: 'my name',
    message: 'my message',
    context_service: 'log',
    when: 1685374050199,
  },
  {
    name: 'my other name',
    message: 'my other message',
    context_service: 'log',
    when: 1685374050199,
  },
  {
    name: 'my name',
    message: 'my other message',
    context_service: 'log',
    when: 1685374050199,
  },
  {
    name: 'not custom log',
    message: 'not custom log message',
    when: 1696972551536,
  },
];

const customLogFromAutomation: LogbookEntry = {
  when: 1696972551536,
  name: 'from automation',
  message: "I'm triggered from automation",
  domain: 'light',
  entity_id: 'light.living_room',
  context_event_type: 'automation_triggered',
  context_domain: 'automation',
  context_name: 'DEV: Custom Log',
  context_message: 'triggered by Home Assistant starting',
  context_source: 'Home Assistant starting',
  context_entity_id: 'automation.dev_custom_log',
  context_entity_id_name: 'DEV: Custom Log',
};

test('should return empty if no entries', () => {
  expect(toCustomLogs(defaultConfiguration, [])).toHaveLength(0);
});

test('should return only log', () => {
  const customLogs = toCustomLogs(defaultConfiguration, [...entries, customLogFromAutomation]);
  expect(customLogs).toHaveLength(4);

  expect(customLogs).toMatchObject([
    {
      type: 'customLog',
      name: 'my name',
      start: new Date('2023-05-29T15:27:30.199Z'),
      message: 'my message',
    },
    {
      type: 'customLog',
      name: 'my other name',
      start: new Date('2023-05-29T15:27:30.199Z'),
      message: 'my other message',
    },
    {
      type: 'customLog',
      name: 'my name',
      start: new Date('2023-05-29T15:27:30.199Z'),
      message: 'my other message',
    },
    {
      type: 'customLog',
      name: 'from automation',
      start: new Date('2023-10-10T21:15:51.536Z'),
      message: "I'm triggered from automation",
    },
  ]);
});

describe('entity_name', () => {
  test('should returns entity by default', () => {
    const customLogs = toCustomLogs(defaultConfiguration, entries);
    expect(customLogs[0].entity_name).toBe('my_entity');
  });

  test('should returns entity name defined in config', () => {
    const configuration = buildConfig({ entity_name: 'My awesome name' });

    const customLogs = toCustomLogs(configuration, entries);
    expect(customLogs[0].entity_name).toBe('My awesome name');
  });
});

describe('map_state', () => {
  test('should not set icon by default', () => {
    const customLogs = toCustomLogs(defaultConfiguration, entries);
    expect(customLogs[0].icon).toBeUndefined;
    expect(customLogs[0].icon_color).toBeUndefined;
  });

  test('should use icon if specified when name match', () => {
    const configuration = buildConfig({
      log_map: [
        {
          name: wildcardToRegExp('my name'),
          icon: 'mdi:lightbulb-on',
          icon_color: '#211081',
        },
      ],
    });

    const customLogs = toCustomLogs(configuration, entries);
    expect(customLogs).toMatchObject([
      { icon: 'mdi:lightbulb-on', icon_color: '#211081' },
      { icon: undefined, icon_color: undefined },
      { icon: 'mdi:lightbulb-on', icon_color: '#211081' },
    ]);
  });

  test('should use icon if specified when message match', () => {
    const configuration = buildConfig({
      log_map: [
        {
          message: wildcardToRegExp('my other message'),
          icon: 'mdi:lightbulb-on',
          icon_color: '#211081',
        },
      ],
    });

    const customLogs = toCustomLogs(configuration, entries);
    expect(customLogs).toMatchObject([
      { icon: undefined, icon_color: undefined },
      { icon: 'mdi:lightbulb-on', icon_color: '#211081' },
      { icon: 'mdi:lightbulb-on', icon_color: '#211081' },
    ]);
  });

  test('should use icon if specified when name and message match', () => {
    const configuration = buildConfig({
      log_map: [
        {
          name: wildcardToRegExp('my name'),
          message: wildcardToRegExp('my message'),
          icon: 'mdi:lightbulb-on',
          icon_color: '#211081',
        },
      ],
    });

    const customLogs = toCustomLogs(configuration, entries);
    expect(customLogs).toMatchObject([
      { icon: 'mdi:lightbulb-on', icon_color: '#211081' },
      { icon: undefined, icon_color: undefined },
      { icon: undefined, icon_color: undefined },
    ]);
  });
});
