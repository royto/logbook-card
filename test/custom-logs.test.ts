import { describe, expect, test } from 'vitest';
import { EntityCustomLogConfig, LogbookEntry, toCustomLogs } from '../src/custom-logs';

type PartialEntityConfig = Partial<EntityCustomLogConfig>;

const buildConfig = (config: PartialEntityConfig): EntityCustomLogConfig => {
  return {
    entity: 'my_entity',
    custom_logs: true,
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
    name: 'not custom log',
    message: 'not custom log message',
    when: 1696972551536,
  },
];

test('should return empty if no entries', () => {
  expect(toCustomLogs(defaultConfiguration, [])).toHaveLength(0);
});

test('should return only log', () => {
  const customLogs = toCustomLogs(defaultConfiguration, entries);
  expect(customLogs).toHaveLength(1);

  expect(customLogs[0].type).toBe('customLog');
  expect(customLogs[0].name).toBe('my name');
  expect(customLogs[0].start).toStrictEqual(new Date('2023-05-29T15:27:30.199Z'));
  expect(customLogs[0].message).toBe('my message');
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
