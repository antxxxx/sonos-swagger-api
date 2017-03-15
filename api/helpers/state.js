'use strict';

const Promise = require('bluebird');
const debug = require('debug')('helpers:state');
const commonFunctions = require('./commonFunctions');
const _ = require('lodash');

function getPlayerState(player) {
    return Promise.resolve()
        .then(() => {
            const results = _.cloneDeep(player.state);

            debug(`node-sonos-discovery state : ${commonFunctions.returnFullObject(results)}`);

            if (results.mute) {
                results.mute = 'mute on';
            } else {
                results.mute = 'mute off';
            }

            if (results.playMode.shuffle) {
                results.playMode.shuffle = 'shuffle on';
            } else {
                results.playMode.shuffle = 'shuffle off';
            }

            if (results.playMode.crossfade) {
                results.playMode.crossfade = 'crossfade on';
            } else {
                results.playMode.crossfade = 'crossfade off';
            }

            if (results.playbackState === 'PLAYING') {
                results.playbackState = 'play';
            } else {
                results.playbackState = 'pause';
            }
            debug(`new state returned : ${commonFunctions.returnFullObject(results)}`);

            return results;
        })
        .catch((error) => {
            debug(`error in getPlayerState() : ${commonFunctions.returnFullObject(error)}`);

            throw error;
        });
}

function simplifyPlayer(player) {
    return Promise.resolve()
    .then(() => {
        return getPlayerState(player);
    })
    .then((playerState) => {
        const zone = {
            uuid: player.coordinator.uuid,
            zoneName: player.coordinator.roomName
        };
        const groupState = {
            volume: player.groupState.volume
        };

        if (player.groupState.mute) {
            groupState.mute = 'mute on';
        } else {
            groupState.mute = 'mute off';
        }

        return {
            coordinator: zone,
            groupState,
            playerName: player.roomName,
            state: playerState,
            uuid: player.uuid
        };
    });
}

function simplifyPlayers(players) {
    return Promise.all(players.map((player) => {
        return simplifyPlayer(player);
    }));
}

function simplifyZone(zone) {
    return simplifyPlayer(zone.coordinator)
    .then((result) => {
        return simplifyPlayers(zone.members)
        .then((players) => {
            let returnResult = result;

            returnResult.members = players;
            returnResult.state.mute = returnResult.groupState.mute;
            returnResult.state.volume = returnResult.groupState.volume;
            returnResult.zoneName = result.playerName;
            returnResult.members = _.map(returnResult.members, (member) => {
                return {
                    playerName: member.playerName,
                    state: member.state,
                    uuid: member.uuid
                };
            });
            returnResult = _.pick(returnResult, 'zoneName', 'state', 'members', 'uuid');

            return returnResult;
        });
    });
}

module.exports = {
    getPlayerState,
    simplifyPlayer,
    simplifyZone
};
