/*
 * Copyright (c) 2021 Snowplow Analytics Ltd
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import { getAllUrlParams } from './helperFunctions';
import { YTCustomEvent, YTError, YTPlayerEvent, YTState, YTStateEvent } from './youtubeEntities';
import { MediaConf, MediaEventData } from './types';
import { stateChangeEvents, YTEventName } from './youtubeEvents';
import { TrackingOptions } from './types';
import { BrowserPlugin, BrowserTracker, dispatchToTrackersInCollection } from '@snowplow/browser-tracker-core';
import { buildSelfDescribingEvent, CommonEventProperties, SelfDescribingJson } from '@snowplow/tracker-core';
import { queryParamPresentAndEnabled } from './helperFunctions';
import { SnowplowMediaEvent } from './snowplowEvents';
import { MediaEntities } from './types';
import { YTEntityFunction, YTQueryStringParameter, YTStateName } from './youtubeEntities';
import { MediaPlayerEvent } from './contexts';
import { DefaultEvents, EventGroups } from './eventGroups';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: any;
    YT: any;
  }
}

export const _trackers: Record<string, BrowserTracker> = {};

export function YouTubeTrackingPlugin(): BrowserPlugin {
  return {
    activateBrowserPlugin: (tracker: BrowserTracker) => {
      _trackers[tracker.id] = tracker;
    },
  };
}

export function trackYoutubeEvent(
  event: SelfDescribingJson<MediaPlayerEvent> & CommonEventProperties,
  trackers: Array<string> = Object.keys(_trackers)
): void {
  dispatchToTrackersInCollection(trackers, _trackers, (t) => {
    t.core.track(buildSelfDescribingEvent({ event }), event.context, event.timestamp);
  });
}

export function configParser(mediaId: string, options?: TrackingOptions): MediaConf {
  let defaults: MediaConf = {
    mediaId: mediaId,
    captureEvents: DefaultEvents,
    percentBoundries: [10, 25, 50, 75],
    percentTimeoutIds: [],
  };
  if (options?.captureEvents) {
    let namedEvents = [];
    for (let ev of options.captureEvents) {
      if (EventGroups.hasOwnProperty(ev)) {
        for (let event of EventGroups[ev]) {
          if (namedEvents.indexOf(event) === -1) {
            namedEvents.push(event);
          }
        }
      } else if (!Object.keys(YTEventName).filter((k) => YTEventName[k] === ev)) {
        console.error(`'${ev}' is not a valid captureEvent.`);
      } else {
        namedEvents.push(Object.keys(YTEventName).filter((k) => YTEventName[k] === ev)[0] || ev);
      }
    }

    options.captureEvents = namedEvents;
  }
  return { ...defaults, ...options };
}

export function enableYoutubeTracking(args: { id: string; trackingOptions?: TrackingOptions }) {
  let config = configParser(args.id, args.trackingOptions);
  let el: HTMLIFrameElement = document.getElementById(args.id) as HTMLIFrameElement;

  const tag: HTMLScriptElement = document.createElement('script');
  tag.id = 'test';
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    let queryStringParams: { [index: string]: string[] | string | number } = getAllUrlParams(el.src!);

    if (!queryStringParams.hasOwnProperty('enablejsapi')) {
      queryStringParams['enablejsapi'] = 1;
    }
    let url: string = el.src?.split('?')[0];
    if (url && url.length > 1) {
      el.src +=
        '?' +
        Object.keys(queryStringParams)
          .map((k) => `${k}=${queryStringParams[k]}`)
          .join('&');
    }
    playerSetup(el, config, queryStringParams);
  };
}

function playerSetup(el: HTMLIFrameElement, config: TrackingOptions, queryStringParams: any) {
  let builtInEvents: { [event: string]: { [playerEvent: string]: Function } } = {
    [YTPlayerEvent.ONPLAYERREADY]: {
      onReady: () => trackEvent(player, YTPlayerEvent.ONPLAYERREADY, queryStringParams),
    },
    [YTPlayerEvent.ONSTATECHANGE]: {
      onStateChange: (e: YT.OnStateChangeEvent) => {
        if (config.captureEvents?.indexOf(YTState[e.data] as YTPlayerEvent) !== -1) {
          trackEvent(player, YTState[e.data], queryStringParams);
        }
      },
    },
    [YTPlayerEvent.ONPLAYBACKQUALITYCHANGE]: {
      onPlaybackQualityChange: () => trackEvent(player, YTPlayerEvent.ONPLAYBACKQUALITYCHANGE, queryStringParams),
    },
    [YTPlayerEvent.ONAPICHANGE]: {
      onApiChange: () => trackEvent(player, YTPlayerEvent.ONAPICHANGE, queryStringParams),
    },
    [YTPlayerEvent.ONERROR]: {
      onError: (e: YT.OnErrorEvent) =>
        trackEvent(player, YTPlayerEvent.ONERROR, queryStringParams, { error: YTError[e.data] }),
    },
    [YTPlayerEvent.ONPLAYBACKRATECHANGE]: {
      onPlaybackRateChange: () => trackEvent(player, YTPlayerEvent.ONPLAYBACKRATECHANGE, queryStringParams),
    },
  };

  let playerEvents = {};
  if (config.captureEvents?.some((event) => stateChangeEvents.indexOf(event as YTStateEvent) >= 0)) {
    playerEvents = { ...playerEvents, ...builtInEvents[YTPlayerEvent.ONSTATECHANGE] };
  }
  if (config.captureEvents) {
    for (let ev of config.captureEvents) {
      if (ev in builtInEvents) {
        playerEvents = { ...playerEvents, ...builtInEvents[ev] };
      }
    }
  }

  let player = new YT.Player(el.id!, {
    events: { ...playerEvents },
  });
}

const trackEvent = (player: YT.Player, eventName: any, queryStringParams: any, eventSpecificData?: any) => {
  let youtubeEvent: MediaEventData = buildYoutubeEvent(player, eventName, queryStringParams, eventSpecificData);
  trackYoutubeEvent(youtubeEvent);
};

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
  let playerState: { [index: string]: boolean } = {
    ended: false,
    paused: false,
    buffering: false,
    cued: false,
    unstarted: false,
  };
  if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
    playerState[YTStateName[player.getPlayerState()]] = true;
  }

  let spherical: YT.SphericalProperties = player.getSphericalProperties();
  if (spherical.fov) {
    spherical.fov = parseFloat(spherical.fov.toFixed(2));
  }

  let data = {
    //player_id: player.getIframe().id,
    player_id: 'test',
    auto_play: queryParamPresentAndEnabled(YTQueryStringParameter.AUTOPLAY, eventParams),
    avaliable_playback_rates: player.getAvailablePlaybackRates(),
    controls: queryParamPresentAndEnabled(YTQueryStringParameter.CONTROLS, eventParams),
    current_time: player[YTEntityFunction.CURRENTTIME](),
    default_playback_rate: 1,
    duration: player[YTEntityFunction.DURATION](),
    loaded: parseFloat(player[YTEntityFunction.VIDEOLOADEDFRACTION]().toFixed(2)),
    muted: player[YTEntityFunction.MUTED](),
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
