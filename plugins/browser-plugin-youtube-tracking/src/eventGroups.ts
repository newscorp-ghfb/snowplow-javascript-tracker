import { SnowplowMediaEvent } from './snowplowEvents';
import { EventGroup } from './types';
import { YTCustomEvent, YTPlayerEvent, YTStateEvent } from './youtubeEntities';

export const AllEvents: string[] = Object.keys(YTStateEvent).concat(
  Object.keys(YTCustomEvent),
  Object.keys(SnowplowMediaEvent)
);

export const DefaultEvents: EventGroup = [
  YTStateEvent.PAUSED,
  YTStateEvent.PLAYING,
  YTCustomEvent.SEEK,
  YTPlayerEvent.ONPLAYBACKQUALITYCHANGE,
  YTPlayerEvent.ONPLAYBACKRATECHANGE,
  SnowplowMediaEvent.PERCENTPROGRESS,
];

export const EventGroups: { [eventGroup: string]: EventGroup } = {
  DefaultEvents: DefaultEvents,
};
