import { MediaPlayerEvent } from './contexts';
import { queryParamPresentAndEnabled } from './helperFunctions';
import { SnowplowMediaEvent } from './snowplowEvents';
import { MediaEntities, YTEventData } from './types';
import {
  YTCustomEvent,
  YTEntityFunction,
  YTQueryStringParameter,
  YTState,
  YTStateEvent,
  YTStateName,
} from './youtubeEntities';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: any;
    YT: any;
  }
}

let scrubInterval: any;
let currentTime: number = 0;

function seekEventTracker(player: YT.Player, eventData: YTEventData) {
  let playerTime = player.getCurrentTime();
  if (Math.abs(playerTime - (currentTime + 0.5)) > 2) {
    eventData.eventName = YTCustomEvent.SEEK;
    buildYoutubeEvent(player, eventData);
  }
  currentTime = playerTime;
}

export function buildYoutubeEvent(player: YT.Player, eventData: YTEventData, eventDetail?: any) {
  const eventActions: { [index: string]: any } = {
    [YTStateEvent.PLAYING]: () => {
      if (scrubInterval === undefined) {
        scrubInterval = setInterval(() => {
          seekEventTracker(player, eventData);
        }, 500);
      }
    },

    [YTStateEvent.PAUSED]: () => {
      clearInterval(scrubInterval);
      scrubInterval = undefined;
    },
  };

  if (eventData.eventName in eventActions) eventActions[eventData.eventName]();

  let mediaEventData: MediaPlayerEvent = {
    type: eventData.eventName,
    player_id: eventData.htmlId,
    media_type: 'VIDEO',
  };

  let mediaContext = [getYoutubePlayerEntities(player, eventData)];

  let snowplowContext = getSnowplowEntities(eventData.eventName, eventDetail);
  if (snowplowContext) mediaContext.push(snowplowContext);

  return {
    schema: 'iglu:com.snowplowanalytics/media_player_event/jsonschema/1-0-0',
    data: mediaEventData,
    context: mediaContext,
  };
}

function getSnowplowEntities(e: any, eventDetail: any): MediaEntities | null {
  let snowplowData: any = {};

  if (e === SnowplowMediaEvent.PERCENTPROGRESS) {
    snowplowData.percent = eventDetail.percentThrough;
  }
  if (!Object.keys(snowplowData).length) return null;

  return {
    schema: 'iglu:com.snowplowanalytics/media_player/jsonschema/1-0-0',
    data: {
      ...snowplowData,
    },
  };
}

function getYoutubePlayerEntities(player: YT.Player, eventData: any): any {
  let playerState: { [index: string]: boolean } = {};
  for (let s of Object.keys(YTState)) {
    if (YTStateName.hasOwnProperty(s)) playerState[YTStateName[s]] = false;
  }
  playerState[YTStateName[player.getPlayerState()]] = true;

  let spherical: YT.SphericalProperties = player.getSphericalProperties();

  let data = {
    auto_play: queryParamPresentAndEnabled(YTQueryStringParameter.AUTOPLAY, eventData.params),
    avaliable_playback_rates: player.getAvailablePlaybackRates(),
    controls: queryParamPresentAndEnabled(YTQueryStringParameter.CONTROLS, eventData.params),
    current_time: player[YTEntityFunction.CURRENTTIME](),
    default_playback_rate: 1,
    duration: player[YTEntityFunction.DURATION](),
    loaded: player[YTEntityFunction.VIDEOLOADEDFRACTION](),
    muted: player[YTEntityFunction.MUTED](),
    origin: queryParamPresentAndEnabled(YTQueryStringParameter.ORIGIN, eventData.params),
    playback_rate: player[YTEntityFunction.PLAYBACKRATE](),
    playlist_index: player[YTEntityFunction.PLAYLISTINDEX](),
    playlist: player[YTEntityFunction.PLAYLIST](),
    url: player[YTEntityFunction.VIDEOURL](),
    volume: player[YTEntityFunction.VOLUME](),
    loop: queryParamPresentAndEnabled(YTQueryStringParameter.LOOP, eventData.params),
    ...playerState,
    ...eventData.customData,
    ...spherical,
  };

  return {
    schema: 'iglu:org.google/youtube/jsonschema/1-0-0',
    data: data,
  };
}
