import { CustomLogMap } from './custom-logs';
import { wildcardToRegExp } from './helpers';
import { CustomLogMapConfig, HiddenConfig, HiddenRegExp, StateMap } from './types';

export const toStateMapRegex = (entityStateMap: StateMap[] | undefined): StateMap[] =>
  entityStateMap?.map(state => {
    return {
      ...state,
      regexp: wildcardToRegExp(state.value ?? ''),
    };
  }) ?? [];

export const toCustomLogMapRegex = (entityCustomLogMap: CustomLogMapConfig[] | undefined): CustomLogMap[] =>
  entityCustomLogMap?.map(customLog => {
    return {
      ...customLog,
      name: wildcardToRegExp(customLog.name),
      message: wildcardToRegExp(customLog.message),
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
