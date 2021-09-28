import { buildYoutubeEvent } from './buildYoutubeEvent';
import { SnowplowMediaEvent } from './snowplowEvents';
import { MediaConf } from './types';
import { YTStateEvent } from './youtubeEntities';

export function progressHandler(player: YT.Player, e: any, conf: MediaConf) {
  if (e === YTStateEvent.PAUSED) {
    while (conf.percentTimeoutIds.length) {
      clearTimeout(conf.percentTimeoutIds.pop());
    }
  }

  if (e === YTStateEvent.PLAYING) {
    setPercentageBoundTimeouts(player, conf);
  }
}

export function setPercentageBoundTimeouts(player: YT.Player, conf: MediaConf) {
  let currentTime = player.getCurrentTime();
  for (let p of conf.percentBoundries) {
    let percentTime = player.getDuration() * 1000 * (p / 100);
    if (currentTime === 0) {
      percentTime -= currentTime * 1000;
    }
    if (p < percentTime) {
      conf.percentTimeoutIds.push(
        setTimeout(() => waitAnyRemainingTimeAfterTimeout(player, percentTime, p), percentTime)
      );
    }
  }
}

// Setting the timeout callback above as MediaPlayerEvent will result in a discrepency between the setTimeout time and
// the current video time when the event fires of ~100 - 300ms

// The below function waits any required amount of remaining time, to ensure the event is fired as close as possible to the
// appropriate percentage boundry time.

function waitAnyRemainingTimeAfterTimeout(player: YT.Player, percentTime: number, p: number) {
  if (player.getCurrentTime() * 1000 < percentTime) {
    setTimeout(() => waitAnyRemainingTimeAfterTimeout(player, percentTime, p), 10);
  } else {
    buildYoutubeEvent(player, { eventName: SnowplowMediaEvent.PERCENTPROGRESS }, { percentThrough: p });
  }
}
