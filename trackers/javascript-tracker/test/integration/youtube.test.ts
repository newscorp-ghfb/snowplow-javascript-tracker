/*
 * Copyright (c) 2021 Snowplow Analytics Ltd, 2010 Anthon Pang
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

import { DockerWrapper, start, stop, fetchMostRecentResult } from '../micro';

describe('YouTube Tracker', () => {
  let docker: DockerWrapper;
  let player: WebdriverIO.Element;

  beforeAll(() => {
    browser.call(() => {
      return start().then((container) => {
        docker = container;
      });
    });
    browser.url('/index.html');
    browser.setCookies({ name: 'container', value: docker.url });
    browser.url('/youtube-tracking.html');
    browser.waitUntil(() => $('#youtube').isExisting(), {
      timeout: 10000,
      timeoutMsg: 'expected youtube after 5s',
    });
    player = $('#youtube');
    browser.pause(10000); //Give Micro time to get started
  });

  afterAll(() => {
    browser.call(() => {
      return stop(docker.container);
    });
  });

  it('tracks play', () => {
    player.click();
    browser.pause(1000);
    return fetchMostRecentResult(docker.url).then((result) => {
      expect(result.event.unstruct_event.data.data.type).toEqual('play');
    });
  });

  it('tracks seeking', () => {
    player.moveTo({ xOffset: 150, yOffset: 270 });
    browser.pause(1000);
    player.click();
    return fetchMostRecentResult(docker.url).then((result) => {
      expect(result.event.unstruct_event.data.data.type).toEqual('pause');
    });
  });

  it('tracks pause', () => {
    player.moveTo({ xOffset: 10, yOffset: 300 });
    player.click();
    browser.pause(1000);
    return fetchMostRecentResult(docker.url).then((result) => {
      expect(result.event.unstruct_event.data.data.type).toEqual('seek');
    });
  });
});
