'use strict';
const commonFunctions = require('./commonFunctions');
const Promise = require('bluebird');
const debug = require('debug')('helpers:playpause');
const state = require('./state');


function play(player, timeout) {
    let trackChanged;
    const promiseTimeout = timeout || 20000;

    function onTransportStateChange(status) {
        debug(`status changed in onTransportStateChange ${commonFunctions.returnFullObject(status)}`);
        if (trackChanged instanceof Function) {
            trackChanged();
        }
    }


    return Promise.resolve()
        .then(() => {
            return state.getPlayerState(player);
        })
        .then((currentState) => {
            if (currentState.playbackState === 'play') {
                debug('already playing so not doing anything');
                throw new Error('already playing');
            }
            if (typeof currentState.uri === 'undefined') {
                debug('nothing to play so not doing anything');
                throw new Error('nothing to play');
            }
            player.on('transport-state', onTransportStateChange);
            debug('calling player.coordinator.play()');

            return player.coordinator.play();
        })
        .then(() => {
            if (player.coordinator.state.playbackState !== 'PLAYING') {
                debug('currently not playing so waiting for state change');

                return new Promise((resolve) => {
                    trackChanged = resolve;
                });
            }
            debug('currently playing so not waiting for state change');

            return true;
        })
        .timeout(promiseTimeout)
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            if (error.message === 'already playing') {
                return;
            }
            debug(`error in play() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

function playAsync(player) {
    return Promise.resolve()
        .then(() => {
            debug('calling player.coordinator.play()');

            return player.coordinator.play();
        })
        .catch((error) => {
            debug(`error in play() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        });
}

function pause(player, timeout) {
    let trackChanged;
    const promiseTimeout = timeout || 20000;

    function onTransportStateChange(status) {
        debug(`status changed in onTransportStateChange ${commonFunctions.returnFullObject(status)}`);
        if (trackChanged instanceof Function) {
            trackChanged();
        }
    }

    return Promise.resolve()
        .then(() => {
            return state.getPlayerState(player);
        })
        .then((currentState) => {
            if (currentState.playbackState === 'pause') {
                debug('already paused so not doing anything');
                throw new Error('already paused');
            }
            player.on('transport-state', onTransportStateChange);
            debug('calling player.coordinator.pause()');

            return player.coordinator.pause();
        })
        .then(() => {
            if (player.coordinator.state.playbackState === 'PLAYING') {
                debug('currently playing so waiting for state change');

                return new Promise((resolve) => {
                    trackChanged = resolve;
                });
            }
            debug('currently not playing so not waiting for state change');

            return true;
        })
        .timeout(promiseTimeout)
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((error) => {
            if (error.message === 'already paused') {
                return;
            }
            debug(`error in pause() :  ${commonFunctions.returnFullObject(error)}`);
            throw error;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

function getPlaystate(player) {
    return Promise.resolve()
        .then(() => {
            return player.coordinator.state.playbackState;
        })
        .catch((err) => {
            debug(`Error in getPlaystate() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        });
}

function togglePlayPause(player) {
    return Promise.resolve()
        .then(() => {
            if (player.coordinator.state.playbackState === 'PLAYING') {
                debug('currently playing so calling pause()');

                return pause(player);
            }
            debug('currently not playing so calling play()');

            return play(player);
        })
        .catch((err) => {
            debug(`Error in playpause() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        });
}

function setPlaybackState(player, playbackState) {
    return Promise.resolve()
        .then(() => {
            if (playbackState === 'pause') {
                debug('calling pause()');

                return pause(player);
            } else if (playbackState === 'play') {
                debug('calling play()');

                return play(player);
            } else if (playbackState === 'toggle') {
                debug('calling togglePlayPause()');

                return togglePlayPause(player);
            }

            throw new Error('invalid playback state');
        })
        .catch((err) => {
            debug(`Error in playpause() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        });
}

module.exports = {
    getPlaystate,
    pause,
    play,
    playAsync,
    setPlaybackState,
    togglePlayPause
};
