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
import { BrowserPlugin, BrowserTracker, dispatchToTrackersInCollection } from '@snowplow/browser-tracker-core';
import { buildSelfDescribingEvent, CommonEventProperties, SelfDescribingJson } from '@snowplow/tracker-core';
import { MediaPlayerEvent } from './contexts';
import { buildYoutubeEvent } from './buildYoutubeEvent';
import { getAllUrlParams } from './helperFunctions';
import { YTError, YTEvent, YTState } from './youtubeEntities';
import { MediaEventData } from './types';

const _trackers: Record<string, BrowserTracker> = {};

export function YouTubeTrackingPlugin(): BrowserPlugin {
  return {
    activateBrowserPlugin: (tracker: BrowserTracker) => {
      _trackers[tracker.id] = tracker;
    },
  };
}

export function enableYoutubeTracking(id: string): any | null {
  let el: HTMLIFrameElement = document.getElementById(id) as HTMLIFrameElement;
  console.log(el);
  let player: YT.Player;
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

  const tag: HTMLScriptElement = document.createElement('script');
  tag.id = 'test';
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    let funcData: any = {
      id: el.id,
      params: queryStringParams,
    };
    const trackEvent = (eventName: any, eventSpecificData?: any) => {
      let youtubeEvent: MediaEventData = buildYoutubeEvent(player, {
        eventName: eventName,
        ...funcData,
        ...eventSpecificData,
      });
      trackYoutubeEvent(youtubeEvent);
    };
    player = new YT.Player(el.id!, {
      events: {
        onReady: () => trackEvent(YTEvent.ONPLAYERREADY),
        onStateChange: (e: YT.OnStateChangeEvent) => trackEvent(YTEvent.ONSTATECHANGE, { eventName: YTState[e.data] }),
        onPlaybackQualityChange: () => trackEvent(YTEvent.ONPLAYBACKQUALITYCHANGE),
        onApiChange: () => trackEvent(YTEvent.ONAPICHANGE),
        onError: (e: YT.OnErrorEvent) => trackEvent(YTEvent.ONERROR, { error: YTError[e.data] }),
        onPlaybackRateChange: () => trackEvent(YTEvent.ONPLAYBACKRATECHANGE),
      },
    });
  };
}

function trackYoutubeEvent(
  event: SelfDescribingJson<MediaPlayerEvent> & CommonEventProperties,
  trackers: Array<string> = Object.keys(_trackers)
): void {
  dispatchToTrackersInCollection(trackers, _trackers, (t) => {
    t.core.track(buildSelfDescribingEvent({ event }), event.context, event.timestamp);
  });
}
