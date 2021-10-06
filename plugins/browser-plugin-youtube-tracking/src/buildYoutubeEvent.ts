import { MediaPlayerEvent } from './contexts';
import { queryParamPresentAndEnabled } from './helperFunctions';
import { trackYoutubeEvent } from './plugin';
import { SnowplowMediaEvent } from './snowplowEvents';
import { MediaEntities } from './types';
import {
  YTCustomEvent,
  YTEntityFunction,
  YTQueryStringParameter,
  YTState,
  YTStateEvent,
  YTStateName,
} from './youtubeEntities';
import { YTEventName } from './youtubeEvents';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: any;
    YT: any;
  }
}

let isSeekTrackingEnabled: boolean = false;

export function buildYoutubeEvent(player: YT.Player, eventName: string, eventParamas: any, eventDetail?: any) {
  const eventActions: { [event: string]: Function } = {
    [YTStateEvent.PLAYING]: () => {
      if (!isSeekTrackingEnabled) enableSeekTracking(player, eventParamas, eventDetail);
    },
  };

  if (eventName in eventActions) eventActions[eventName]();

  let mediaEventData: MediaPlayerEvent = {
    type: eventName in YTEventName ? YTEventName[eventName] : eventName,
    media_type: 'VIDEO',
  };

  let mediaContext = [getYoutubePlayerEntities(player, eventParamas)];

  let snowplowContext = getSnowplowEntities(eventName, eventDetail);
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

function getYoutubePlayerEntities(player: YT.Player, eventParams: any): any {
  let playerState: { [index: string]: boolean } = {};
  for (let s of Object.keys(YTState)) {
    if (YTStateName.hasOwnProperty(s)) playerState[YTStateName[s]] = false;
  }
  playerState[YTStateName[player.getPlayerState()]] = true;

  let spherical: YT.SphericalProperties = player.getSphericalProperties();
  if (spherical.fov) {
    spherical.fov = parseFloat(spherical.fov.toFixed(2));
  }

  let data = {
    player_id: player.getIframe().id,
    auto_play: queryParamPresentAndEnabled(YTQueryStringParameter.AUTOPLAY, eventParams),
    avaliable_playback_rates: player.getAvailablePlaybackRates(),
    controls: queryParamPresentAndEnabled(YTQueryStringParameter.CONTROLS, eventParams),
    current_time: player[YTEntityFunction.CURRENTTIME](),
    default_playback_rate: 1,
    duration: player[YTEntityFunction.DURATION](),
    loaded: parseFloat(player[YTEntityFunction.VIDEOLOADEDFRACTION]().toFixed(2)),
    muted: player[YTEntityFunction.MUTED](),
    origin: eventParams[YTQueryStringParameter.ORIGIN],
    playback_rate: player[YTEntityFunction.PLAYBACKRATE](),
    playlist_index: player[YTEntityFunction.PLAYLISTINDEX](),
    playlist: player[YTEntityFunction.PLAYLIST](),
    url: player[YTEntityFunction.VIDEOURL](),
    volume: player[YTEntityFunction.VOLUME](),
    loop: queryParamPresentAndEnabled(YTQueryStringParameter.LOOP, eventParams),
    ...playerState,
    ...spherical,
  };

  return {
    schema: 'iglu:org.youtube/youtube/jsonschema/1-0-0',
    data: data,
  };
}

let currentTime: number = 0;

export function enableSeekTracking(player: YT.Player, eventParamas: any, eventDetail?: any) {
  setInterval(() => seekEventTracker(player, eventParamas, eventDetail), 500);
}

function seekEventTracker(player: YT.Player, eventParamas: any, eventDetail?: any) {
  let playerTime = player.getCurrentTime();
  if (Math.abs(playerTime - (currentTime + 0.5)) > 1) {
    let youtubeEvent = buildYoutubeEvent(player, YTCustomEvent.SEEK, eventParamas, eventDetail);
    trackYoutubeEvent(youtubeEvent);
  }
  currentTime = playerTime;
}
