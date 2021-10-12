import { YTStateEvent } from './youtubeEntities';

export const YTEventName: { [event: string]: string } = {
  PAUSED: 'pause',
  PLAYING: 'play',
  CUED: 'cued',
  ENDED: 'ended',
  BUFFERING: 'buffering',
  UNSTARTED: 'unstarted',
  PERCENTPROGRESS: 'percentprogress',
  onReady: 'ready',
  onStateChange: 'statechange',
  onPlaybackQualityChange: 'playbackqualitychange',
  onError: 'error',
  onApiChange: 'apichange',
  onPlaybackRateChange: 'playbackratechange',
  onPlayerReady: 'playerready',
};

export const stateChangeEvents = [
  YTStateEvent.BUFFERING,
  YTStateEvent.CUED,
  YTStateEvent.ENDED,
  YTStateEvent.PAUSED,
  YTStateEvent.PLAYING,
  YTStateEvent.UNSTARTED,
];
