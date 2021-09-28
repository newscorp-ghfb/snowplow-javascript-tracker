export enum YTQueryStringParameter {
  AUTOPLAY = 'autoplay',
  CONTROLS = 'controls',
  DIABLEKB = 'diablekb',
  ENABLEJSAPI = 'enablejsapi',
  END = 'end',
  FULLSCREENBUTTON = 'fs',
  IVLOADPOLICY = 'iv_load_policy',
  LANGUAGE = 'hl',
  LIST = 'list',
  LISTTYPE = 'listType',
  LOOP = 'loop',
  MODESTBRANDING = 'modestbranding',
  ORIGIN = 'origin',
  PLAYLIST = 'playlist',
  PLAYSINLINE = 'playsinline',
  RELATED = 'rel',
  START = 'start',
  WIDGETREFERRER = 'widget_referrer',
}

export enum YTEntityFunction {
  AVALIABLEPLAYBACKRATES = 'getAvailablePlaybackRates',
  CURRENTTIME = 'getCurrentTime',
  DURATION = 'getDuration',
  LOADED = 'getVideoLoadedFraction',
  MUTED = 'isMuted',
  PLAYBACKRATE = 'getPlaybackRate',
  PLAYERSTATE = 'getPlayerState',
  PLAYLIST = 'getPlaylist',
  PLAYLISTINDEX = 'getPlaylistIndex',
  STATE = 'getState',
  URL = 'getVideoUrl',
  VIDEOLOADEDFRACTION = 'getVideoLoadedFraction',
  VIDEOURL = 'getVideoUrl',
  VOLUME = 'getVolume',
}

// The payload a YouTube player event emits has no identifier of what event it is
// Some payloads can emit the same data
// i.e. onError and onPlaybackRateChange can both emit '{data: 2}'
export enum YTEvent {
  ONREADY = 'onReady',
  ONSTATECHANGE = 'onStateChange',
  ONPLAYBACKQUALITYCHANGE = 'onPlaybackQualityChange',
  ONERROR = 'onError',
  ONAPICHANGE = 'onApiChange',
  ONPLAYBACKRATECHANGE = 'onPlaybackRateChange',
  ONPLAYERREADY = 'onPlayerReady',
}

export enum YTStateEvent {
  UNSTARTED = 'UNSTARTED',
  ENDED = 'ENDED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  BUFFERING = 'BUFFERING',
  CUED = 'CUED',
}

export const YTError: { [index: number]: string } = {
  2: 'INVALID_URL',
  5: 'HTML5_ERROR',
  100: 'VIDEO_NOT_FOUND',
  101: 'MISSING_EMBED_PERMISSION',
  150: 'MISSING_EMBED_PERMISSION_ALT',
};

export enum YTState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

export const YTStateName: { [index: string]: string } = {
  '-1': 'unstarted',
  '0': 'ended',
  '1': 'playing',
  '2': 'paused',
  '3': 'buffering',
  '5': 'cued',
};

export enum YTCustomEvent {
  SEEK = 'seek',
}
