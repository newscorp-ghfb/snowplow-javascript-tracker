import { BrowserPlugin, BrowserTracker, dispatchToTrackersInCollection } from '@snowplow/browser-tracker-core';
import { buildSelfDescribingEvent, CommonEventProperties, SelfDescribingJson } from '@snowplow/tracker-core';
import { MediaPlayerEvent } from './contexts';

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
