import { MediaPlayerEvent } from './contexts';
import { SnowplowMediaEvent } from './snowplowEvents';
import { YTCustomEvent, YTPlayerEvent, YTStateEvent } from './youtubeEntities';

export type EventGroup = (YTStateEvent | SnowplowMediaEvent | YTCustomEvent | YTPlayerEvent | string)[];

export interface TrackingOptions {
  mediaId: string;
  captureEvents: EventGroup;
  mediaLabel?: string;
  boundry?: {
    percentBoundries: number[];
    percentTimeoutIds: any[];
  };
  volumeChangeTimeout?: any;
}

export interface RecievedTrackingOptions {
  percentBoundries?: number[];
  captureEvents: EventGroup | string[];
  mediaLabel?: string;
  percentTimeoutIds?: any[];
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

export interface YTEventData {
  params?: any;
  eventName: YTPlayerEvent | YTStateEvent | YTCustomEvent | SnowplowMediaEvent;
  [index: string]: any;
}

export interface QueryStringParams {
  [index: string]: string[] | string | number;
}
