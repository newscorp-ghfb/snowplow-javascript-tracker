import { MediaElement, MediaPlayerEvent, VideoElement } from './contexts';
import { SnowplowMediaEvent } from './snowplowEvents';
import { YTCustomEvent, YTEvent, YTState, YTStateEvent } from './youtubeEntities';

export type EventGroup = YT.Events | SnowplowMediaEvent;

export interface MediaConf {
  mediaId: string;
  percentBoundries: number[];
  captureEvents: EventGroup;
  mediaLabel?: string;
  percentTimeoutIds: any[];
  volumeChangeTimeout?: any;
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
  data: MediaElement | VideoElement | SnowplowYoutubeData;
}

export interface TextTrackObject {
  label: string;
  language: string;
  kind: string;
  mode: string;
}

export interface YTEventData {
  id?: string;
  params?: any;
  eventName: YTEvent | YTStateEvent | YTCustomEvent | SnowplowMediaEvent;
  customData?: any;
  activeState?: typeof YTState;
  currentTime?: number;
  scrubInterval?: any;
  [index: string]: any;
}
