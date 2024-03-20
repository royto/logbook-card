import { expect, test } from 'vitest';
import { toStateMapRegex } from '../src/config-helpers';
import { StateMap, StateMapRegexp } from '../src/types';

test('should return empty array if state map is not defined', () => {
  expect(toStateMapRegex(undefined)).toStrictEqual([]);
});

test('should return convert array if state map not ', () => {
  const statesMap: Array<StateMap> = [
    {
      value: 'home',
      icon: 'mdi:home',
      icon_color: 'green',
    },
    {
      value: 'away',
      icon: 'mdi:home',
      icon_color: 'red',
      attributes: [
        {
          name: 'gps_accuracy',
          value: '13',
        },
      ],
    },
  ];

  const expectedRegexpMap: Array<StateMapRegexp> = [
    {
      value: new RegExp('^home$', 's'),
      icon: 'mdi:home',
      icon_color: 'green',
      attributes: [],
    },
    {
      value: new RegExp('^away$', 's'),
      icon: 'mdi:home',
      icon_color: 'red',
      attributes: [
        {
          name: 'gps_accuracy',
          value: new RegExp('^13$', 's'),
        },
      ],
    },
  ];

  expect(toStateMapRegex(statesMap)).toStrictEqual(expectedRegexpMap);
});
