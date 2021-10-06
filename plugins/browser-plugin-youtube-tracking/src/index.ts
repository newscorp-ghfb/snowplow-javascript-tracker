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
import { buildYoutubeEvent } from './buildYoutubeEvent';
import { getAllUrlParams } from './helperFunctions';
import { YTError, YTPlayerEvent, YTState, YTStateEvent } from './youtubeEntities';
import { MediaConf, MediaEventData } from './types';
import { stateChangeEvents, YTEventName } from './youtubeEvents';
import { TrackingOptions } from './types';
import { DefaultEvents, EventGroups } from './eventGroups';
import { trackYoutubeEvent } from './plugin';

function configSorter(mediaId: string, options?: TrackingOptions): MediaConf {
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
          namedEvents.push(event);
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

export function enableYoutubeTracking(id: string, trackingOptions?: TrackingOptions) {
  let config = configSorter(id, trackingOptions);

  let el: HTMLIFrameElement = document.getElementById(id) as HTMLIFrameElement;

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
    [YTPlayerEvent.ONPLAYERREADY]: { onReady: () => trackEvent(YTPlayerEvent.ONPLAYERREADY) },
    [YTPlayerEvent.ONSTATECHANGE]: {
      onStateChange: (e: YT.OnStateChangeEvent) => {
        if (config.captureEvents?.indexOf(YTState[e.data] as YTPlayerEvent) !== -1) {
          trackEvent(YTPlayerEvent.ONSTATECHANGE, { eventName: YTState[e.data] });
        }
      },
    },
    [YTPlayerEvent.ONPLAYBACKQUALITYCHANGE]: {
      onPlaybackQualityChange: () => trackEvent(YTPlayerEvent.ONPLAYBACKQUALITYCHANGE),
    },
    [YTPlayerEvent.ONAPICHANGE]: { onApiChange: () => trackEvent(YTPlayerEvent.ONAPICHANGE) },
    [YTPlayerEvent.ONERROR]: {
      onError: (e: YT.OnErrorEvent) => trackEvent(YTPlayerEvent.ONERROR, { error: YTError[e.data] }),
    },
    [YTPlayerEvent.ONPLAYBACKRATECHANGE]: {
      onPlaybackRateChange: () => trackEvent(YTPlayerEvent.ONPLAYBACKRATECHANGE),
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

  const trackEvent = (eventName: any, eventSpecificData?: any) => {
    let youtubeEvent: MediaEventData = buildYoutubeEvent(player, eventName, queryStringParams, eventSpecificData);
    trackYoutubeEvent(youtubeEvent);
  };
}
