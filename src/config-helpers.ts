import { CustomLogMap } from './custom-logs';
import { wildcardToRegExp } from './helpers';
import {
  AttributeStateConfig,
  AttributeStateConfigRegexp,
  CustomLogMapConfig,
  HiddenConfig,
  HiddenRegExp,
  StateMap,
  StateMapRegexp,
} from './types';

export const toAttributeStateMapRegex = (attribute: AttributeStateConfig): AttributeStateConfigRegexp => ({
  name: attribute.name,
  value: wildcardToRegExp(attribute.value),
});

export const toStateMapRegex = (entityStateMap: StateMap[] | undefined): StateMapRegexp[] =>
  entityStateMap?.map(state => {
    return {
      ...state,
      value: wildcardToRegExp(state.value ?? ''),
      attributes: state.attributes?.map(a => toAttributeStateMapRegex(a)) ?? [],
    };
  }) ?? [];

export const toCustomLogMapRegex = (entityCustomLogMap: CustomLogMapConfig[] | undefined): CustomLogMap[] =>
  entityCustomLogMap?.map(customLog => {
    return {
      ...customLog,
      name: wildcardToRegExp(customLog.name),
      message: wildcardToRegExp(customLog.message),
      hidden: customLog.hidden || false,
    };
  }) ?? [];

export const toHiddenRegex = (hiddenConfig: Array<HiddenConfig | string> | undefined): HiddenRegExp[] => {
  if (hiddenConfig) {
    return hiddenConfig
      .map(h => (typeof h === 'string' ? { state: h } : h))
      .map(hs => ({
        state: wildcardToRegExp(hs.state),
        attribute: !hs.attribute
          ? undefined
          : {
              name: hs.attribute.name,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              value: wildcardToRegExp(hs.attribute.value)!,
              hideIfMissing: hs.attribute.hideIfMissing ?? false,
            },
      }));
  }
  return [];
};
