'use strict';

const rp = require('request-promise');
const xml2js = require('xml-to-json-promise');
const Promise = require('bluebird');
const _ = require('lodash');
const log4js = require('log4js');
const logger = log4js.getLogger('helpers/iplayer_on_damand.js');
const stations = require('./iplayerStations').stations;

function getFeed(channelId) {
    return Promise.resolve()
    .then(() => {
        return rp(`http://www.bbc.co.uk/radio/aod/availability/${channelId}.xml`);
    })
    .then((data) => {
        return xml2js.xmlDataToJSON(data);
    })
    .catch((error) => {
        if (error.statusCode === 404) {
            logger.error(`cant get feed for ${channelId}`);
        } else {
            logger.error(error);
        }

        return null;
    });
}

function refreshChannel(station, iplayerProgramDB) {
    const currentDate = new Date();

    return Promise.resolve()
    .then(() => {
        return iplayerProgramDB.removeAsync({
            channelId: station.channelId
        }, {
            multi: true
        });
    })
    .then(() => {
        return getFeed(station.channelId);
    })
    .then((data) => {
        if (data) {
            return Promise.map(data.schedule.entry, (entry) => {
                const availabilityStart = new Date(entry.availability[0].$.start);
                const availabilityEnd = new Date(entry.availability[0].$.end);

                if (availabilityStart < currentDate && availabilityEnd > currentDate) {
                    const dataToInsert = {
                        channelId: station.channelId,
                        pid: entry.$.pid,
                        service: station.name,
                        synopsis: entry.synopsis[0],
                        title: entry.title[0],
                        imageUrl: entry.images[0].image[0],
                        broadcast: entry.broadcast[0].$.start,
                        duration: entry.broadcast[0].$.duration,
                        streamingLink: _.get(_.find(entry.links[0].link, (link) => {
                            return link.$.transferformat === 'hls';
                        }), '_')
                    };

                    return iplayerProgramDB.insertAsync(dataToInsert);
                }

                return null;
            });
        }

        return null;
    });
}

function refreshAllChannels(iplayerProgramDB, refreshSettingsDB) {
    return Promise.resolve()
    .then(() => {
        return Promise.map(stations.national, (station) => {
            return refreshChannel(station, iplayerProgramDB);
        });
    })
    .then(() => {
        return Promise.map(stations.regional, (station) => {
            return refreshChannel(station, iplayerProgramDB);
        });
    })
    .then(() => {
        return Promise.map(stations.local, (station) => {
            return refreshChannel(station, iplayerProgramDB);
        });
    })
    .then(() => {
        return refreshSettingsDB.findAsync({
            refreshType: 'iplayerOnDemand'
        });
    })
    .then((result) => {
        if (result.length > 0) {
            return refreshSettingsDB.updateAsync({
                refreshType: 'iplayerOnDemand'
            }, {
                refreshType: 'iplayerOnDemand',
                lastRefresh: new Date()
            });
        }

        return refreshSettingsDB.insertAsync({
            refreshType: 'iplayerOnDemand',
            lastRefresh: new Date()
        });
    });
}

function refreshIfNeeded(iplayerProgramDB, refreshSettingsDB) {
    return Promise.resolve()
    .then(() => {
        return refreshSettingsDB.findAsync({
            refreshType: 'iplayerOnDemand'
        });
    })
    .then((result) => {
        // Only refresh if last refresh was more than 24 hours ago

        if (result.length > 0) {
            const lastRefreshTime = new Date(result[0].lastRefresh);
            const yesterday = new Date();

            yesterday.setDate(yesterday.getDate() - 1);
            if (lastRefreshTime < yesterday) {
                return true;
            }

            return false;
        }

        // Forec a refresh if it has never happened
        return true;
    })
    .then((doRefresh) => {
        if (doRefresh === true) {
            return refreshAllChannels(iplayerProgramDB, refreshSettingsDB);
        }

        return null;
    });
}

function search(player, type, query, offset, limit, settings) {
    return Promise.resolve()
    .then(() => {
        return refreshIfNeeded(settings.dbSettings.iplayerProgramDB, settings.dbSettings.refreshSettingsDB);
    })
    .then(() => {
        const queryRegExp = new RegExp(query, 'i');
        let iplayerQuery;

        switch (type) {
            case 'title':
                iplayerQuery = {
                    title: {
                        $regex: queryRegExp
                    }
                };
                break;
            case 'synopsis':
                iplayerQuery = {
                    synopsis: {
                        $regex: queryRegExp
                    }
                };
                break;
            default:
                throw new Error('this search has not been implemented yet');
        }

        return settings.dbSettings.iplayerProgramDB.findAsync(iplayerQuery);
    })
    .then((data) => {
        const uniqueResults = _.uniqWith(data, (entry, otherValue) => {
            return _.isEqual({
                title: entry.title,
                synopsis: entry.synopsis
            }, {
                title: otherValue.title,
                synopsis: otherValue.synopsis
            });
        });
        const sortedResults = _.sortBy(uniqueResults, ['title', 'station', 'broadcast']);
        const offsetResults = _.slice(sortedResults, offset || 0, limit + offset || 20);
        const searchResults = _.map(offsetResults, (result) => {
            return {
                uri: result.streamingLink.replace('http://', 'x-rincon-mp3radio://'),
                title: result.title,
                type: 'iplayer stream',
                metadata: `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/"><item id="R:0/0/223" parentID="R:0/0" restricted="true"><dc:title>${result.title}</dc:title><upnp:class>object.item.audioItem.audioBroadcast</upnp:class><desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON65031_</desc></item></DIDL-Lite>`,
                synopsis: result.synopsis,
                station: result.service,
                broadcast: result.broadcast,
                duration: parseInt(result.duration)
            };
        });
        const results = {
            returned: searchResults.length,
            start: offset || 0,
            total: sortedResults.length,
            items: searchResults
        };

        if (offset > 0) {
            results.previous = `${settings.webRoot}/search?service=iplayer&type=${type}&q=${query}&limit=${limit}&offset=${(offset - limit < 0 ? 0 : offset - limit)}`;
        }
        if (offset + searchResults.length < sortedResults.length) {
            results.next = `${settings.webRoot}/search?service=iplayer&type=${type}&q=${query}&limit=${limit}&offset=${(offset + limit)}`;
        }

        return results;
    });
}

module.exports = {
    search,
    refreshAllChannels
};
