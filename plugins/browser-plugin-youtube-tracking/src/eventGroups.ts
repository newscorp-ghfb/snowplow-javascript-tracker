import { SnowplowMediaEvent } from './snowplowEvents';
import { EventGroup } from './types';
import { YTCustomEvent, YTPlayerEvent, YTStateEvent } from './youtubeEntities';
import { YTEventName } from './youtubeEvents';

export const AllEvents: EventGroup = [...Object.keys(YTEventName), ...Object.keys(YTCustomEvent)];

export const DefaultEvents: EventGroup = [
  YTStateEvent.PAUSED,
  YTStateEvent.PLAYING,
  YTCustomEvent.SEEK,
  YTPlayerEvent.ONPLAYBACKQUALITYCHANGE,
  YTPlayerEvent.ONPLAYBACKRATECHANGE,
  SnowplowMediaEvent.PERCENTPROGRESS,
];

export const EventGroups: { [eventGroup: string]: EventGroup } = {
  AllEvents: AllEvents,
  DefaultEvents: DefaultEvents,
};
