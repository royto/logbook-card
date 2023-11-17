import { HassEntity } from 'home-assistant-js-websocket/dist/types';
import { History, ExtendedHomeAssistant, StateMap, AttributeConfig, HiddenRegExp } from './types';

import {
  extractAttributes,
  filterEntry,
  filterIfDurationIsLessThanMinimal,
  mapIcon,
  mapState,
  squashSameState,
} from './entity-helper';

export interface EntityHistoryConfig {
  attributes?: AttributeConfig[];
  date_format?: string | 'relative';
  entity: string;
  entity_name?: string;
  hidden_state_regexp: Array<HiddenRegExp>;
  minimal_duration?: number;
  state_map?: StateMap[];
  show_history: boolean;
}

export const toHistory = (
  entityHistory: HassEntity[],
  hass: ExtendedHomeAssistant,
  config: EntityHistoryConfig,
): History[] => {
  return (
    entityHistory //empty if no history
      .map(h => ({
        type: 'history',
        stateObj: h,
        entity_name: config.entity_name || h.attributes.friendly_name || config.entity,
        state: h.state,
        label: mapState(hass, h, config.state_map || []),
        start: new Date(h.last_changed),
        attributes: extractAttributes(h, config, hass),
        icon: mapIcon(h, config.state_map || []),
      }))
      .map((x, i, arr) => {
        if (i < arr.length - 1) {
          return {
            ...x,
            end: arr[i + 1].start,
          };
        }
        return { ...x, end: new Date() };
      })
      .map(
        x =>
          ({
            ...x,
            duration: x.end.valueOf() - x.start.valueOf(),
          } as History),
      )
      .filter(entry => filterIfDurationIsLessThanMinimal(config, entry))
      //squash same state or unknown with previous state
      .reduce(squashSameState, [])
      .filter(entry => filterEntry(config, entry))
  );
};

export const getHistory = (
  hass: ExtendedHomeAssistant,
  config: EntityHistoryConfig,
  startDate: Date,
): Promise<History[]> => {
  if (!config.show_history) {
    return Promise.resolve([]);
  }

  const uri =
    'history/period/' +
    startDate.toISOString() +
    '?filter_entity_id=' +
    config.entity +
    '&end_time=' +
    new Date().toISOString();

  return hass
    .callApi<Array<HassEntity[]>>('GET', uri)
    .then(hassEntityHistory => toHistory(hassEntityHistory[0] || [], hass, config));
};
