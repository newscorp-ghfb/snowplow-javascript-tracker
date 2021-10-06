import { buildYoutubeEvent } from './buildYoutubeEvent';
import { SnowplowMediaEvent } from './snowplowEvents';
import { YTStateEvent } from './youtubeEntities';

export function progressHandler(player: YT.Player, e: any, percentTimeoutIds: any, percentBoundries: number[]) {
  if (e === YTStateEvent.PAUSED) {
    while (percentTimeoutIds.length) {
      clearTimeout(percentTimeoutIds.pop());
    }
  }

  if (e === YTStateEvent.PLAYING) {
    setPercentageBoundTimeouts(player, percentTimeoutIds, percentBoundries);
  }
}

export function setPercentageBoundTimeouts(player: YT.Player, percentTimeoutIds: any, percentBoundries: number[]) {
  let currentTime = player.getCurrentTime();
  for (let p of percentBoundries) {
    let percentTime = player.getDuration() * 1000 * (p / 100);
    if (currentTime === 0) {
      percentTime -= currentTime * 1000;
    }
    if (p < percentTime) {
      percentTimeoutIds.push(setTimeout(() => waitAnyRemainingTimeAfterTimeout(player, percentTime, p), percentTime));
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
    buildYoutubeEvent(player, SnowplowMediaEvent.PERCENTPROGRESS, { percentThrough: p });
  }
}
