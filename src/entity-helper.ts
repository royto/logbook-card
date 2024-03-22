import { HassEntity } from 'home-assistant-js-websocket/dist/types';
import { Attribute, AttributeConfig, ExtendedHomeAssistant, History, IconState, StateMapRegexp } from './types';
import { computeStateDisplay, stateIcon } from 'custom-card-helpers';
import { formatAttributeValue, formatEntityAttributeValue } from './formatter';
import { addSlashes } from './helpers';
import { EntityHistoryConfig } from './history';

const findMatchingState = (states: StateMapRegexp[], entity: HassEntity): StateMapRegexp | undefined => {
  return states.find(
    s =>
      s.value?.test(entity.state) &&
      (s.attributes === undefined ||
        s.attributes.every(
          attribute =>
            attribute.name === undefined ||
            attribute.value === undefined ||
            attribute.value.test(entity.attributes[attribute?.name]),
        )),
  );
};

export const mapState = (hass: ExtendedHomeAssistant, entity: HassEntity, states: StateMapRegexp[]): string => {
  const s = findMatchingState(states, entity);
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

export const mapIcon = (item: HassEntity, states: StateMapRegexp[]): IconState | null => {
  const s = findMatchingState(states, item);
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
    if (item.attributes.hasOwnProperty(c.value)) {
      const attributeValue = item.attributes[c.value];
      if (attributeValue === null) {
        const attributeName = hass.formatEntityAttributeName ? hass.formatEntityAttributeName(item, c.value) : c.value;
        p.push({
          name: c.label ? c.label : attributeName,
          value: 'null',
        });
        return p;
      }
      if (typeof attributeValue === 'object' && !Array.isArray(attributeValue)) {
        const keys = Object.keys(attributeValue);
        keys.forEach(key => {
          p.push({
            name: key,
            value: formatAttributeValue(hass, attributeValue[key], undefined, config.date_format),
          });
        });
      } else if (Array.isArray(attributeValue)) {
        p.push({
          name: c.label ? c.label : c.value,
          value: formatAttributeValue(hass, attributeValue.join(','), undefined, config.date_format),
        });
      } else {
        const attributeName = hass.formatEntityAttributeName ? hass.formatEntityAttributeName(item, c.value) : c.value;
        p.push({
          name: c.label ? c.label : attributeName,
          value: formatEntityAttributeValue(
            hass,
            item,
            c.value,
            attributeValue,
            c.type,
            config.date_format,
            c.link_label,
          ),
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
