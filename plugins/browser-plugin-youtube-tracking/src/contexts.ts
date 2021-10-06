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
export interface Youtube {
  /**
   * The HTML id of the video element
   **/
  player_id: string;

  /**
   * This specifies whether the initial video will automatically start to play when the player loads.
   **/
  auto_play: boolean;

  /**
   * Whether the video player controls are displayed
   **/
  controls: boolean;

  /**
   * The current playback time
   **/
  current_time: number;

  /**
   * The default media playback rate of the player
   **/
  default_playback_rate: number;

  /**
   * The duration in seconds of the currently playing video. If the currently playing video is a live event, duration will be the elapsed time since the live video stream began.
   **/
  duration?: number | null;

  /**
   * If playback of the media has ended
   **/
  ended: boolean;

  /**
   * An object of the latest error to occur, or null if no errors
   **/
  error?: object | null;

  /**
   * The percentage of the video that the player shows as buffered
   **/
  loaded: number;

  /**
   * If the video restarts after ended
   **/
  loop: boolean;

  /**
   * If the video is muted
   **/
  muted: boolean;

  /**
   * The origin domain of the embed
   **/
  origin: string;

  /**
   * If the media element is paused
   **/
  paused: boolean;

  /**
   * Playback rate relative to 1 (normal speed)
   **/
  playback_rate: number;

  /**
   * An array of the video IDs in the playlist as they are currently ordered.
   **/
  playlist?: Array<string> | null;

  /**
   * The index of the playlist video that is currently playing
   **/
  playlist_index?: number | null;

  /**
   * The YouTube embed URL of the media resource
   **/
  url: string;

  /**
   * Volume level
   **/
  volume: number;

  /**
   * The field-of-view of the view in degrees, as measured along the longer edge of the viewport
   **/
  fov: number;

  /**
   * The clockwise or counterclockwise rotational angle of the view in degrees
   **/
  roll: number;

  /**
   * The vertical angle of the view in degrees
   **/
  pitch: number;

  /**
   * The horizontal angle of the view in degrees
   **/
  yaw: number;

  /**
   * An array of playback rates in which the current video is available
   **/
  avaliable_playback_rates: Array<number>;

  /**
   * If the video is cued
   **/
  cued: boolean;
  [key: string]: unknown;
}

export interface MediaPlayer {
  /**
   * The percent of the way through the media
   **/
  percent_progress: number;

  /**
   * The media file format
   **/
  file_extension: string;

  /**
   * If the video element is fullscreen
   **/
  fullscreen: boolean;

  /**
   * If the video element is showing Picture-In-Picture
   **/
  picture_in_picture: boolean;
  [key: string]: unknown;
}

export interface MediaPlayerEvent {
  /**
   * The event fired by the media player
   **/
  type: string;

  /**
   * If the media is a video element, or audio
   **/
  media_type: 'AUDIO' | 'VIDEO';

  /**
   * The custom media identifier given by the user
   **/
  media_label?: string | null;
  [key: string]: unknown;
}
