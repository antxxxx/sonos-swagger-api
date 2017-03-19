'use strict';
const commonFunctions = require('./commonFunctions');
const playPause = require('./playpause');
const nowPlaying = require('./nowPlaying');
const seek = require('./seek');
const state = require('./state');
const Promise = require('bluebird');
const debug = require('debug')('helpers:queue');
const _ = require('lodash');

function simplify(items) {
    return items
        .map((item) => {
            return {
                album: item.album,
                albumArtUri: item.albumArtUri,
                artist: item.artist,
                title: item.title
            };
        });
}

function getQueue(player, detailed) {
    return Promise.resolve()
        .then(() => {
            const queue = player.coordinator.getQueue();

            return queue;
        })
        .then((result) => {
            if (detailed) {
                return result;
            }

            return simplify(result);
        })
        .catch((err) => {
            debug(`Error in getQueue() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        });
}

function addToQueue(player, uri, metadata, desiredFirstTrackNumberEnqueued, enqueAsNext) {
    return Promise.resolve()
        .then(() => {
            return player.coordinator.addURIToQueue(uri, metadata, enqueAsNext, desiredFirstTrackNumberEnqueued);
        })
        .catch((err) => {
            debug(`Error in addToQueue() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        });
}

function addMultipleItemsToQueue(player, items) {
    return Promise.resolve()
        .then(() => {
            const remapedItems = [];

            _.forEach(items, (item) => {
                remapedItems.push([item.uri, item.metadata]);
            });

            return remapedItems;
        })
        .then((remapedItems) => {
            debug(remapedItems);

            return player.coordinator.addMultipleURIsToQueue(remapedItems, items[0].uri);
        })
        .catch((err) => {
            debug(`Error in addMultipleItemsToQueue() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        });
}

function clearQueue(player, timeout) {
    let trackChanged;
    let initialState;
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
        .then((result) => {
            initialState = result;

            player.on('transport-state', onTransportStateChange);
            debug('calling player.coordinator.clearQueue()');

            return player.coordinator.clearQueue();
        })
        .then(() => {
            if (initialState.currentTrack.type === 'track' && initialState.playbackState === 'play') {
                debug('currently playing track so waiting for state change');

                return new Promise((resolve) => {
                    trackChanged = resolve;
                });
            }
            debug('currently not playing track so not waiting for state change');

            return true;
        })
        .timeout(promiseTimeout)
        .catch(Promise.TimeoutError, (error) => {
            debug(`got error ${commonFunctions.returnFullObject(error)}`);
            throw new Error(`timeout waiting for state change : ${error}`);
        })
        .catch((err) => {
            debug(`Error in clearQueue() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        })
        .finally(() => {
            player.removeListener('transport-state', onTransportStateChange);
        });
}

function replaceQueue(player, uri, metadata) {
    return Promise.resolve()
        .then(() => {
            return clearQueue(player);
        })
        .then(() => {
            return addToQueue(player, uri, metadata);
        })
        .catch((err) => {
            debug(`Error in replaceQueue() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        });
}

function replaceQueueAndPlay(player, uri, metadata) {
    let returnData;

    return Promise.resolve()
        .then(() => {
            return replaceQueue(player, uri, metadata);
        })
        .then((result) => {
            returnData = result;

            return state.getPlayerState(player);
        })
        .then((currentState) => {
            if (currentState.type === 'track') {
                return playPause.pause(player);
            }

            return true;
        })
        .then(() => {
            const nowPlayinguri = 'x-rincon-queue:RINCON_000E58C4373C01400#0';

            debug('calling setNowPlaying()');

            return nowPlaying.setNowPlaying(player, nowPlayinguri, '');
        })
        .then(() => {
            return playPause.play(player);
        })
        .then(() => {
            return returnData;
        })
        .catch((err) => {
            debug(`Error in replaceQueue() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        });
}

function addToQueueAndPlay(player, uri, metadata) {
    let returnData;

    return Promise.resolve()
        .then(() => {
            debug('calling queue.addToQueue()');

            return addToQueue(player, uri, metadata, player.state.trackNo + 1, true);
        })
        .then((result) => {
            returnData = result;
            debug('calling playPause.pause()');

            return playPause.pause(player);
        })
        .then(() => {
            const nowPlayinguri = 'x-rincon-queue:RINCON_000E58C4373C01400#0';

            debug('calling nowPlaying.setNowPlaying()');

            return nowPlaying.setNowPlaying(player, nowPlayinguri, '');
        })
        .then(() => {
            debug('calling seek.trackSeek()');

            return seek.trackSeek(player, returnData.firsttracknumberenqueued);
        })
        .then(() => {
            debug('calling playPause.play()');

            return playPause.play(player);
        })
        .then(() => {
            return returnData;
        })
        .catch((err) => {
            debug(`Error in replaceQueue() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        });
}

function replaceQueueWithMultipleItems(player, items) {
    const initialState = player.state;
    let returnData;

    return Promise.resolve()
        .then(() => {
            return clearQueue(player);
        })
        .then(() => {
            return addMultipleItemsToQueue(player, items);
        })
        .then((result) => {
            returnData = result;
            if (initialState.playbackState === 'PLAYING') {
                return playPause.play(player);
            }

            return 1;
        })
        .then(() => {
            return returnData;
        })
        .catch((err) => {
            debug(`Error in replaceQueue() : ${commonFunctions.returnFullObject(err)}`);
            throw err;
        });
}

module.exports = {
    addToQueue,
    clearQueue,
    getQueue,
    replaceQueue,
    replaceQueueAndPlay,
    addMultipleItemsToQueue,
    replaceQueueWithMultipleItems,
    addToQueueAndPlay
};
