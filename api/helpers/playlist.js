'use strict';
const playPause = require('./playpause');
const commonFunctions = require('./commonFunctions');
const Promise = require('bluebird');
const debug = require('debug')('helpers:playlist');


function playPlaylist(player, playlistName, timeout) {
    let trackChanged;
    const promiseTimeout = timeout || 20000;

    if (!playlistName) {
        return Promise.resolve()
        .then(() => {
            throw new Error('Playlist not found');
        });
    }

    function onTransportStateChange(status) {
        debug(`status changed in onTransportStateChange ${commonFunctions.returnFullObject(status)}`);
        if (trackChanged instanceof Function) {
            trackChanged();
        }
    }

    return Promise.resolve()
      .then(() => {
          debug('calling playPause.pause()');

          return playPause.pause(player, promiseTimeout);
      })
      .then(() => {
          debug('calling player.coordinator.replaceWithPlaylist()');
          player.on('transport-state', onTransportStateChange);

          return player.coordinator.replaceWithPlaylist(playlistName);
      })
      .then(() => {
          debug('waiting for state change');

          return new Promise((resolve) => {
              trackChanged = resolve;
          });
      })
      .timeout(promiseTimeout)
      .then(() => {
          debug('calling playPause.play()');

          return playPause.play(player, promiseTimeout);
      })
      .catch(Promise.TimeoutError, (error) => {
          throw new Error(`timeout waiting for state change : ${error}`);
      })
      .catch((error) => {
          debug(`error in playFavourite() :  ${commonFunctions.returnFullObject(error)}`);

          throw error;
      })
      .finally(() => {
          player.removeListener('transport-state', onTransportStateChange);
      });
}

module.exports = {
    playPlaylist
};
