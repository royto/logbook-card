import * as en from './languages/en.json';
import * as fr from './languages/fr.json';
import * as nb from './languages/nb.json';

const languages = {
  en: en,
  fr: fr,
  nb: nb,
};

const fallbackLanguage = 'en';

const isLanguageSupported = (language: string): boolean => {
  return Object.keys(languages).includes(language);
};

const translationExistsForLanguage = (section: string, key: string, language: string): boolean => {
  return languages[language][section] && languages[language][section][key];
};

export function localize(string: string, search = '', replace = ''): string {
  const section = string.split('.')[0];
  const key = string.split('.')[1];

  let language = (localStorage.getItem('selectedLanguage') || 'en').replace(/['"]+/g, '').replace('-', '_');
  if (!isLanguageSupported(language) || !translationExistsForLanguage(section, key, language)) {
    language = fallbackLanguage;
  }

  if (!translationExistsForLanguage(section, key, language)) {
    return string;
  }

  let translated = languages[language][section][key];

  if (search !== '' && replace !== '') {
    translated = translated.replace(search, replace);
  }
  return translated;
}
