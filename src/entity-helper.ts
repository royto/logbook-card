import { HassEntity } from 'home-assistant-js-websocket/dist/types';
import { Attribute, AttributeConfig, ExtendedHomeAssistant, History, IconState, StateMap } from './types';
import { computeStateDisplay, stateIcon } from 'custom-card-helpers';
import { formatAttributeValue, formatEntityAttributeValue } from './formatter';
import { addSlashes } from './helpers';
import { EntityHistoryConfig } from './history';

export const mapState = (hass: ExtendedHomeAssistant, entity: HassEntity, states: StateMap[]): string => {
  const s = states.find(s => s.regexp?.test(entity.state));
  if (s !== undefined && s.label) {
    return s.label;
  }

  if (hass) {
    if (hass.formatEntityState) {
      return hass.formatEntityState(entity);
    }
    return computeStateDisplay(hass.localize, entity, hass.locale!);
  }

  return entity.state;
};

export const mapIcon = (item: HassEntity, states: StateMap[]): IconState | null => {
  const s = states.find(s => s.regexp?.test(addSlashes(item.state)));
  if (s === undefined || (s.icon === undefined && s.icon_color === undefined)) {
    return null;
  }

  const iconSvg = s !== undefined && s.icon ? s.icon : stateIcon(item);

  return { icon: iconSvg, color: s?.icon_color || undefined };
};

export const extractAttributes = (
  item: HassEntity,
  config: EntityHistoryConfig,
  hass: ExtendedHomeAssistant,
): Array<Attribute> => {
  if (config?.attributes == null) {
    return [];
  }

  return config?.attributes.reduce((p: Array<Attribute>, c: AttributeConfig): Array<Attribute> => {
    if (item.attributes[c.value]) {
      const attribute = item.attributes[c.value];
      if (typeof attribute === 'object' && !Array.isArray(attribute)) {
        const keys = Object.keys(attribute);
        keys.forEach(key => {
          p.push({
            name: key,
            value: formatAttributeValue(hass, attribute[key], undefined, config.date_format),
          });
        });
      } else if (Array.isArray(attribute)) {
        p.push({
          name: c.label ? c.label : c.value,
          value: formatAttributeValue(hass, attribute.join(','), undefined, config.date_format),
        });
      } else {
        const attributeName = hass.formatEntityAttributeName ? hass.formatEntityAttributeName(item, c.value) : c.value;
        p.push({
          name: c.label ? c.label : attributeName,
          value: formatEntityAttributeValue(hass, item, c.value, attribute, c.type, config.date_format),
        });
      }
    }
    return p;
  }, []);
};

export const squashSameState = (array: Array<History>, val: History): Array<History> => {
  const prev = array[array.length - 1];
  if (!prev || (prev.state !== val.state && val.state !== 'unknown')) {
    array.push(val);
  } else {
    prev.end = val.end;
    prev.duration += val.duration;
  }
  return array;
};

export const filterIfDurationIsLessThanMinimal = (config: EntityHistoryConfig, entry: History): boolean => {
  if (!config.minimal_duration) {
    return true;
  }
  return entry.duration >= config.minimal_duration * 1000;
};

export const filterEntry = (config: EntityHistoryConfig, entry: History): boolean => {
  if (config.hidden_state_regexp.length === 0) {
    return true;
  }
  return !config.hidden_state_regexp.some(regexp => {
    if (!!regexp.attribute && !Object.keys(entry.stateObj.attributes).some(a => a === regexp.attribute?.name)) {
      return regexp.attribute.hideIfMissing;
    }

    if (!!regexp.state && !!regexp.attribute) {
      return (
        regexp.state.test(addSlashes(entry.state)) &&
        regexp.attribute.value.test(addSlashes(entry.stateObj.attributes[regexp.attribute.name]))
      );
    }

    if (!!regexp.attribute) {
      return regexp.attribute.value.test(addSlashes(entry.stateObj.attributes[regexp.attribute.name]));
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return regexp.state!.test(addSlashes(entry.state));
  });
};
