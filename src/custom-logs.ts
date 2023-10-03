import { CustomLogEvent, ExtendedHomeAssistant, LogbookCardConfig } from './types';

const logbookLogContext = 'log';

export const getCustomLogsPromise = (
  hass: ExtendedHomeAssistant,
  config: LogbookCardConfig,
  startDate: Date,
): Promise<CustomLogEvent[]> => {
  if (config.custom_logs) {
    return hass.callApi('GET', `logbook/${startDate.toISOString()}?entity=${config.entity}`).then((response: any) => {
      return response
        .filter(e => e.context_service === logbookLogContext)
        .map(e => ({ start: new Date(e.when), name: e.name, message: e.message }));
    });
  }
  return Promise.resolve([]);
};
