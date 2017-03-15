'use strict';
const playPause = require('./playpause');
const commonFunctions = require('./commonFunctions');
const Promise = require('bluebird');
const debug = require('debug')('helpers:playlist');


function playPlaylist(player, playlistName, timeout) {
    let trackChanged;
    let changeStateResult;
    const promiseTimeout = timeout || 20000;

    function onTransportStateChange(status) {
        debug(`status changed in onTransportStateChange ${commonFunctions.returnFullObject(status)}`);
        if (trackChanged instanceof Function) {
            trackChanged();
        }
    }

    return Promise.resolve()
      .then(() => {
          debug('calling playPause.pause()');

          return playPause.pause(player);
      })
      .then(() => {
          debug('calling player.coordinator.replaceWithPlaylist()');
          player.on('transport-state', onTransportStateChange);

          return player.coordinator.replaceWithPlaylist(playlistName);
      })
      .then((result) => {
          changeStateResult = result;
          debug('waiting for state change');

          return new Promise((resolve) => {
              trackChanged = resolve;
          });
      })
      .timeout(promiseTimeout)
      .then(() => {
          return commonFunctions.checkReturnStatus(changeStateResult);
      })
      .then(() => {
          debug('calling playPause.play()');

          return playPause.play(player);
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
