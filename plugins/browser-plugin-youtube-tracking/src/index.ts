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
import { addEnableJsApiToIframeSrc, getAllUrlParams } from './helperFunctions';
import { YTCustomEvent, YTError, YTPlayerEvent, YTState, YTStateEvent } from './youtubeEntities';
import { QueryStringParams, RecievedTrackingOptions } from './types';
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

export function trackEvent(
  event: SelfDescribingJson<MediaPlayerEvent> & CommonEventProperties,
  trackers: Array<string> = Object.keys(_trackers)
): void {
  console.log(event.data.type);
  dispatchToTrackersInCollection(trackers, _trackers, (t) => {
    t.core.track(buildSelfDescribingEvent({ event }), event.context, event.timestamp);
  });
}

export function trackingOptionsParser(mediaId: string, options?: RecievedTrackingOptions): TrackingOptions {
  let defaults: TrackingOptions = {
    mediaId: mediaId,
    captureEvents: DefaultEvents,
  };
  if (options?.captureEvents) {
    let namedEvents = [];
    for (let ev of options.captureEvents) {
      // If an event is an EventGroup, get the events from that group
      if (EventGroups.hasOwnProperty(ev)) {
        for (let event of EventGroups[ev]) {
          if (namedEvents.indexOf(event) === -1) {
            // If Percent Progress is an event as part of a group
            if (event === SnowplowMediaEvent.PERCENTPROGRESS) {
              defaults.boundry = {
                percentBoundries: options.percentBoundries || [10, 25, 50, 75],
                percentTimeoutIds: [],
              };
            }
            namedEvents.push(event);
          }
        }
      } else if (!Object.keys(YTEventName).filter((k) => YTEventName[k] === ev)) {
        console.error(`'${ev}' is not a valid captureEvent.`);
        // If Percent Progress is a standalone event
      } else if (ev === SnowplowMediaEvent.PERCENTPROGRESS) {
        defaults.boundry = {
          percentBoundries: options.percentBoundries || [10, 25, 50, 75],
          percentTimeoutIds: [],
        };
      } else {
        namedEvents.push(Object.keys(YTEventName).filter((k) => YTEventName[k] === ev)[0] || ev);
      }
    }

    options.captureEvents = namedEvents;
  }
  // Percent boundries are now included in the 'boundry' object, so it can be removed before spread
  delete options?.percentBoundries;
  return { ...defaults, ...options };
}

export function enableYoutubeTracking(args: { id: string; trackingOptions?: RecievedTrackingOptions }) {
  let trackingOptions: TrackingOptions = trackingOptionsParser(args.id, args.trackingOptions);
  let el: HTMLIFrameElement = document.getElementById(args.id) as HTMLIFrameElement;
  if (!el) {
    console.error('Cannot find YouTube IFrame element');
    return;
  }

  // Youtube IFrame API activation
  const tag: HTMLScriptElement = document.createElement('script');
  tag.id = 'test';
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);

  // Function to run when the API is loaded
  window.onYouTubeIframeAPIReady = () => {
    let queryStringParams: QueryStringParams = getAllUrlParams(el.src!);
    el = addEnableJsApiToIframeSrc(queryStringParams, el);
    playerSetup(el, trackingOptions, queryStringParams);
  };
}

function playerSetup(el: HTMLIFrameElement, trackingOptions: TrackingOptions, queryStringParams: QueryStringParams) {
  // Events provided by the YouTube API
  let builtInEvents: { [event: string]: { [playerEvent: string]: Function } } = {
    [YTPlayerEvent.ONPLAYERREADY]: {
      onReady: () => buildAndTrackEvent(player, YTPlayerEvent.ONPLAYERREADY, queryStringParams, trackingOptions),
    },
    [YTPlayerEvent.ONSTATECHANGE]: {
      onStateChange: (e: YT.OnStateChangeEvent) => {
        if (trackingOptions.captureEvents.indexOf(YTState[e.data] as YTPlayerEvent) !== -1) {
          buildAndTrackEvent(player, YTState[e.data], queryStringParams, trackingOptions);
        }
      },
    },
    [YTPlayerEvent.ONPLAYBACKQUALITYCHANGE]: {
      onPlaybackQualityChange: () =>
        buildAndTrackEvent(player, YTPlayerEvent.ONPLAYBACKQUALITYCHANGE, queryStringParams, trackingOptions),
    },
    [YTPlayerEvent.ONAPICHANGE]: {
      onApiChange: () => buildAndTrackEvent(player, YTPlayerEvent.ONAPICHANGE, queryStringParams, trackingOptions),
    },
    [YTPlayerEvent.ONERROR]: {
      onError: (e: YT.OnErrorEvent) =>
        buildAndTrackEvent(player, YTPlayerEvent.ONERROR, queryStringParams, trackingOptions, {
          error: YTError[e.data],
        }),
    },
    [YTPlayerEvent.ONPLAYBACKRATECHANGE]: {
      onPlaybackRateChange: () =>
        buildAndTrackEvent(player, YTPlayerEvent.ONPLAYBACKRATECHANGE, queryStringParams, trackingOptions),
    },
  };

  let playerEvents = {};
  // If any state change events exist (i.e. play, pause etc), we need an OnStateChange listener
  if (trackingOptions.captureEvents.some((event) => stateChangeEvents.indexOf(event as YTStateEvent) >= 0)) {
    playerEvents = { ...playerEvents, ...builtInEvents[YTPlayerEvent.ONSTATECHANGE] };
  }
  // Adds any other 'on' events provided by the YouTube API
  for (let ev of trackingOptions.captureEvents) {
    if (ev in builtInEvents) {
      playerEvents = { ...playerEvents, ...builtInEvents[ev] };
    }
  }

  let player = new YT.Player(el.id!, {
    events: { ...playerEvents },
  });
}

function buildAndTrackEvent(
  player: YT.Player,
  eventName: string,
  queryStringParams: QueryStringParams,
  trackingOptions: TrackingOptions,
  eventData?: any
) {
  const eventActions: { [event: string]: Function } = {
    [YTStateEvent.PLAYING]: () => {
      if (!isSeekTrackingEnabled) enableSeekTracking(player, queryStringParams, eventData);
      if (!isVolumeTrackingEnabled) enableVolumeTracking(player, queryStringParams, eventData);
    },
  };

  if (eventName in eventActions) eventActions[eventName]();

  if (trackingOptions?.boundry) {
    progressHandler(player, eventName, trackingOptions, queryStringParams);
  }

  let mediaEventData: MediaPlayerEvent = {
    type: eventName in YTEventName ? YTEventName[eventName] : eventName,
    media_type: 'VIDEO',
  };

  let mediaContext = [getPlayerEntities(player, queryStringParams)];
  let snowplowContext = getSnowplowEntities(eventName, eventData);
  if (snowplowContext) mediaContext.push(snowplowContext);

  trackEvent({
    schema: 'iglu:com.snowplowanalytics/media_player_event/jsonschema/1-0-0',
    data: mediaEventData,
    context: mediaContext,
  });
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

function getPlayerEntities(player: YT.Player, queryStringParams: QueryStringParams): any {
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

  let data = {
    player_id: player.getIframe().id,
    auto_play: queryParamPresentAndEnabled(YTQueryStringParameter.AUTOPLAY, queryStringParams),
    avaliable_playback_rates: player.getAvailablePlaybackRates(),
    controls: queryParamPresentAndEnabled(YTQueryStringParameter.CONTROLS, queryStringParams),
    current_time: player[YTEntityFunction.CURRENTTIME](),
    default_playback_rate: 1,
    duration: player[YTEntityFunction.DURATION](),
    loaded: player[YTEntityFunction.VIDEOLOADEDFRACTION](),
    muted: player[YTEntityFunction.MUTED](),
    playback_rate: player[YTEntityFunction.PLAYBACKRATE](),
    playlist_index: player[YTEntityFunction.PLAYLISTINDEX](),
    playlist: player[YTEntityFunction.PLAYLIST](),
    url: player[YTEntityFunction.VIDEOURL](),
    volume: player[YTEntityFunction.VOLUME](),
    loop: queryParamPresentAndEnabled(YTQueryStringParameter.LOOP, queryStringParams),
    ...playerState,
    ...spherical,
  };

  return {
    schema: 'iglu:org.youtube/youtube/jsonschema/1-0-0',
    data: data,
  };
}

// Percent Boundry Tracking
function progressHandler(
  player: YT.Player,
  eventName: any,
  trackingOptions: TrackingOptions,
  queryStringParams: QueryStringParams
) {
  let timeoutIds = trackingOptions.boundry!.percentTimeoutIds;
  console.log('handling progress');
  if (eventName === YTStateEvent.PAUSED) {
    while (timeoutIds.length) {
      clearTimeout(timeoutIds.pop());
    }
  }

  if (eventName === YTStateEvent.PLAYING) {
    setPercentageBoundTimeouts(player, trackingOptions, queryStringParams);
  }
}

function setPercentageBoundTimeouts(
  player: YT.Player,
  trackingOptions: TrackingOptions,
  queryStringParams: QueryStringParams
) {
  let currentTime = player.getCurrentTime();
  for (let p of trackingOptions.boundry!.percentBoundries) {
    let percentTime = player.getDuration() * 1000 * (p / 100);
    if (currentTime === 0) {
      percentTime -= currentTime * 1000;
    }
    if (p < percentTime) {
      trackingOptions.boundry!.percentTimeoutIds.push(
        setTimeout(
          () => waitAnyRemainingTimeAfterTimeout(player, trackingOptions, queryStringParams, percentTime, p),
          percentTime
        )
      );
    }
  }
}

// Setting the timeout callback above as MediaPlayerEvent will result in a discrepency between the setTimeout time and
// the current video time when the event fires of ~100 - 300ms

// The below function waits any required amount of remaining time, to ensure the event is fired as close as possible to the
// appropriate percentage boundry time.

function waitAnyRemainingTimeAfterTimeout(
  player: YT.Player,
  trackingOptions: TrackingOptions,
  queryStringParams: QueryStringParams,
  percentTime: number,
  p: number
) {
  if (player.getCurrentTime() * 1000 < percentTime) {
    setTimeout(() => waitAnyRemainingTimeAfterTimeout(player, trackingOptions, queryStringParams, percentTime, p), 10);
  } else {
    buildAndTrackEvent(player, SnowplowMediaEvent.PERCENTPROGRESS, queryStringParams, trackingOptions, {
      percentThrough: p,
    });
  }
}

// Seek Tracking
let currentTime: number = 0;
let isSeekTrackingEnabled: boolean = false;

function enableSeekTracking(player: YT.Player, queryStringParams: QueryStringParams, eventDetail?: any) {
  setInterval(() => seekEventTracker(player, queryStringParams, eventDetail), 500);
}

function seekEventTracker(player: YT.Player, queryStringParams: QueryStringParams, eventDetail?: any) {
  let playerTime = player.getCurrentTime();
  if (Math.abs(playerTime - (currentTime + 0.5)) > 1) {
    buildAndTrackEvent(player, YTCustomEvent.SEEK, queryStringParams, eventDetail);
  }
  currentTime = playerTime;
}

// Volume Change Tracking
let prevVolume: number;
let isVolumeTrackingEnabled: boolean = false;

function enableVolumeTracking(player: YT.Player, queryStringParams: QueryStringParams, eventDetail?: any) {
  prevVolume = player.getVolume();
  setInterval(() => volumeEventTracker(player, queryStringParams, eventDetail), 500);
}

function volumeEventTracker(player: YT.Player, queryStringParams: QueryStringParams, eventDetail?: any) {
  let playerVolume = player.getVolume();
  if (playerVolume !== prevVolume) {
    buildAndTrackEvent(player, YTCustomEvent.VOLUMECHANGE, queryStringParams, eventDetail);
  }
  prevVolume = playerVolume;
}
