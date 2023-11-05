import { expect, test } from 'vitest';
import { localize } from '../src/localize/localize';

test.each([
  ['en', 'Version'],
  ['fr', 'Version'],
  ['nb', 'Versjon'],
])('should return translation if exist for selected Language', (language, expectedTranslation) => {
  localStorage.setItem('selectedLanguage', language);
  expect(localize('common.version')).toBe(expectedTranslation);
});

test('should return translation if exist', () => {
  localStorage.setItem('selectedLanguage', 'ch');
  expect(localize('common.version')).toBe('Version');
});

test('should return fallback to en if translation does not exist', () => {
  localStorage.setItem('selectedLanguage', 'nb');
  expect(localize('common.default_no_event')).toBe('no event on the period');
});

test('should replace placeholder', () => {
  localStorage.setItem('selectedLanguage', 'nb');
  expect(localize('logbook_card.default_title', '{entity}', 'kitchen light')).toBe('kitchen light History');
});
