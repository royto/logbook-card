import { expect, test } from 'vitest';
import { LogbookEntry, toCustomLogs } from '../src/custom-logs';

test('should return empty if no entries', () => {
  expect(toCustomLogs('my_entity', [])).toHaveLength(0);
});

test('should return only log', () => {
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

  const customLogs = toCustomLogs('my_entity', entries);
  expect(customLogs).toHaveLength(1);

  expect(customLogs[0].type).toBe('customLog');
  expect(customLogs[0].name).toBe('my name');
  expect(customLogs[0].start).toStrictEqual(new Date('2023-05-29T15:27:30.199Z'));
  expect(customLogs[0].message).toBe('my message');
});
