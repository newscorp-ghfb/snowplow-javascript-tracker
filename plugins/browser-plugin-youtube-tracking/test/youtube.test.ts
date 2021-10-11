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

import { AllEvents, DefaultEvents } from '../src/eventGroups';
import { configParser } from '../src/index';
import { MediaConf } from '../src/types';

describe('config parser', () => {
  const default_output: MediaConf = {
    mediaId: 'youtube',
    captureEvents: DefaultEvents,
    percentBoundries: [10, 25, 50, 75],
    percentTimeoutIds: [],
  };

  it('assigns defaults', () => {
    let args = {
      id: 'youtube',
    };

    expect(configParser(args.id)).toEqual(default_output);
  });

  it('parses percentBoundries', () => {
    let args = {
      id: 'youtube',
      trackingOptions: {
        percentBoundries: [1, 4, 7, 9, 99],
      },
    };

    let expected_output = [1, 4, 7, 9, 99];

    expect(configParser(args.id, args.trackingOptions).percentBoundries).toEqual(expected_output);
  });

  it('parses mediaLabel', () => {
    let args = {
      id: 'youtube',
      trackingOptions: { mediaLabel: 'test-label' },
    };

    let expected_output = 'test-label';
    expect(configParser(args.id, args.trackingOptions).mediaLabel).toEqual(expected_output);
  });

  it('parses capture events', () => {
    let args = {
      id: 'youtube',
      trackingOptions: { captureEvents: ['play', 'pause'] },
    };

    let expected_output = ['PLAYING', 'PAUSED'];

    expect(configParser(args.id, args.trackingOptions).captureEvents).toEqual(expected_output);
  });

  it('parses capture event groups', () => {
    let args = {
      id: 'youtube',
      trackingOptions: { captureEvents: ['AllEvents'] },
    };

    let expected_output = AllEvents;

    expect(configParser(args.id, args.trackingOptions).captureEvents).toEqual(expected_output);
  });

  it('parses capture events and groups in same array', () => {
    let args = {
      id: 'youtube',
      trackingOptions: { captureEvents: ['DefaultEvents', 'cued'] },
    };

    let expected_output = DefaultEvents.concat(['CUED']);

    expect(configParser(args.id, args.trackingOptions).captureEvents).toEqual(expected_output);
  });
});
