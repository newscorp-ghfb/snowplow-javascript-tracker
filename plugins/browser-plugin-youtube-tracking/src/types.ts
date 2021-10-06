import { MediaPlayerEvent } from './contexts';
import { SnowplowMediaEvent } from './snowplowEvents';
import { YTCustomEvent, YTPlayerEvent, YTStateEvent } from './youtubeEntities';

export type EventGroup = (YTStateEvent | SnowplowMediaEvent | YTCustomEvent | YTPlayerEvent | string)[];

export interface MediaConf {
  mediaId: string;
  percentBoundries: number[];
  captureEvents: EventGroup;
  mediaLabel?: string;
  percentTimeoutIds: any[];
  volumeChangeTimeout?: any;
}

export interface TrackingOptions {
  percentBoundries?: number[];
  captureEvents?: EventGroup | string[];
  mediaLabel?: string;
}

export interface SnowplowYoutubeData {
  percent?: number;
  [key: string]: number | undefined;
}

export interface MediaEventData {
  schema: string;
  data: MediaPlayerEvent;
  context: MediaEntities[];
}

export interface MediaEntities {
  schema: string;
  data: SnowplowYoutubeData;
}

export interface TextTrackObject {
  label: string;
  language: string;
  kind: string;
  mode: string;
}

export interface YTEventData {
  params?: any;
  eventName: YTPlayerEvent | YTStateEvent | YTCustomEvent | SnowplowMediaEvent;
  [index: string]: any;
}
