'use strict';
const nowPlaying = require('./nowPlaying');
const commonFunctions = require('./commonFunctions');
const debug = require('debug')('helpers:linein');
const Promise = require('bluebird');


function setLinein(player, sourcePlayerName, timeout) {
    const promiseTimeout = timeout || 20000;

    return Promise.resolve()
      .then(() => {
          if (sourcePlayerName) {
              debug('calling getPlayer()');

              return player.system.getPlayer(decodeURIComponent(sourcePlayerName));
          }

          return player;
      })
      .then((lineinSourcePlayer) => {
          const uri = `x-rincon-stream:${lineinSourcePlayer.uuid}`;

          debug('calling setNowPlaying()');

          return nowPlaying.setNowPlaying(player, uri, '', promiseTimeout);
      })
      .catch((error) => {
          debug(`got error ${commonFunctions.returnFullObject(error)}`);
          throw error;
      });
}

module.exports = {
    setLinein
};
