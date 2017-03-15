SWAGGER SONOS API
=================

** This project was inspired by [https://github.com/jishi/node-sonos-http-api](https://github.com/jishi/node-sonos-http-api). 
However it is implemented in a very different way and its usage is different, so it is not compatable with node-sonos-http-api.  
Many thanks to [jishi](https://github.com/jishi) for the excellent work on node-sonos-http-api, sonos-discovery, and the initial idea of a REST API for interacting with sonos

**This application requires node 4.0.0 or higher!**

# Table of contents
- [Introduction](#introduction)
- [Installation instructions](#installation-instructions)
- [Configuration](#configuration)
- [Swagger](#swagger)
- [Players and zones](#players-and-zones)
- [API usage](#api-usage)
  - [/players](#players)
  - [/players/{playerName}](#playersplayername)
  - [/players/{playerName}/state](#playersplayernamestate)
  - [/players/{playerName}/nowplaying](#playersplayernamenowplaying)
  - [/players/{playerName}/queue](#playersplayernamequeue)
  - [/zones](#zones)
  - [/zones/{zoneName}](#zoneszonename)
  - [/zones/{zoneName}/state](#zoneszonenamestate)
  - [/zones/{zoneName}/nowplaying](#zoneszonenamenowplaying)
  - [/zones/{zoneName}/queue](#zoneszonenamequeue)
  - [/zones/{zoneName}/members](#zoneszonenamemembers)
  - [/zones/{zoneName}/members/{roomName}](#zoneszonenamemembersroomname)
  - [/search](#search)
  - [/favourites](#favourites)
  - [/favourites/{favourite}](#favouritesfavourite)
  - [/swagger](#swagger-1)

Introduction
------------
This is a REST API for interacting with a sonos system. It uses a swagger (or open api specification as it is now known) file to document the api as well as control behaviour in the code.  
It tries to follow a design pattern for the api where the URL describes the resource being acted on, and you use different http verbs on the URL to control what happens when the it is called.  

For instance when interacting with the queue on the bedroom player  
When you want to view the queue you would call 
GET /players/bedroom/queue   
When you want to add something to the queue you would call 
PATCH /players/bedroom/queue  
When you want to replace the whole queue you would call 
POST /players/bedroom/queue  
When you want to delete the queue you would call 
DELETE /players/bedroom/queue

By default, all calls are synchronous, so when you make a call to change something, it will only return once the change has been made.   
This can be overridden by passing a paramater async=true in the query string.   
Obviously if you pass this, then you will not know if the call has worked or not, but you will get a response back

It includes [swagger-ui](https://github.com/swagger-api/swagger-ui) to provide interactive documentation when the server is running   


Installation instructions
-------------------------

Once you have cloned this repository, start by installing the dependencies.  
Run the following command from the directory where this has been cloned to:

`npm install --production`

This will download the necessary dependencies.

The program writes to the local filesystem while it is running, so the following directories must be writable by the user running the program

./localDatabase   
./api/swagger   
./static/tts   

You can start the server by running

`npm start`

When it is running, you can see full documentation for the API and try different calls by going to http://localhost:10010/docs/

Configuration
-------------
You can override the default configuration and set custom values by copying settings.json.example to setting.json and putting values in there.   
Available options are
- port - this is the port the service runs on
- staticWebRootPath - this is a full path to a static site that will be served and anouncements will be downloaded to
- ttsProvider - which text to speach provider to use - currently available ones are google and voicerss
- webRoot - this is the full URL that content will be served from. This needs to be set for announcemnts and swagger-ui to work correctly and should be set to your ip address eg http://192.168.1.17:10010/
- databasePath - path to keep database files. Currently only used by iplayer search
- voicerssApiKey - this is an api key that is used to access [http://www.voicerss.org/](http://www.voicerss.org/). You must sign up for a key on that website for access

Example:
```
{
    "settings": {
        "webRoot": "http://192.168.1.17:10010",
    }
}
```

Swagger
-------
[Swagger](http://swagger.io/) is a framework for documenting APIs. It is now officially known as open api specificaton so you may also see reference to that in places

This program has a swagger file in ./api/swagger/swagger.yaml.  
You can see the swagger file when it is running by going to [http://localhost:10010/swagger/](http://localhost:10010/swagger/)  

If you want to edit a swagger file, you can use [swagger editor](http://editor.swagger.io) or another tool like [stoplight](https://stoplight.io/).   
Each endpoint in the file has an x-swagger-router-controller attribute that defines which controller file (in ./api/controllers) is associated with the endpoint.  
The operationId attribute specifies which  function in the controller file is called when the endpoint is called.   

This all happens using the [swagger-restify-mw](https://github.com/apigee-127/swagger-restify) framework

All documentation is included in the swagger file, and even most of this readme is generated from it using [swagger-markdown](https://github.com/syroegkin/swagger-markdown)

Players and zones
-----------------
Within this API, players refer to individual sonos players and zones refer to a group of one or more players.   
Most operations behave the same on players and zones - ie if you change whats playing on a player, then it also changes what is playing in the zone.   
The exception to this is volume where you can change the volume on an individual player or for the whole zone.


# API Usage

SONOS SWAGGER API
=================


**Version:** 0.9

### /players
---
##### ***GET***
**Summary:** get all players

**Description:** This gets information about all players currently discovered

Example call
```
curl -X GET 'http://localhost:10010/players'
```

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

### /players/{playerName}
---
##### ***GET***
**Summary:** get individual player

**Description:** This gets the details of an individual player

Example call
```
curl -X GET 'http://localhost:10010/players/bedroom'
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| playerName | path | The player name | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

### /players/{playerName}/state
---
##### ***GET***
**Summary:** get player state

**Description:** This gets the status of an individual player

Example call
```
curl -X GET 'http://localhost:10010/players/bedroom/state'
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| playerName | path | The player name | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

##### ***PUT***
**Summary:** set player state

**Description:** This endpoint is used to to change the status of a player. The available states you can change are

* volume - can either set the volume to an absolute value by passing a number, or relative by passing in a string prefixed by + or -
```
curl -X PUT -H "Content-Type: application/json" -d '{"volume": 10}' "http://localhost:10010/players/bedroom/state"
curl -X PUT -H "Content-Type: application/json" -d '{"volume": "+5"}' "http://localhost:10010/players/bedroom/state"
```

* mute - can be either mute on or mute off
```
curl -X PUT -H "Content-Type: application/json -d '{"mute": "mute on"}' "http://localhost:10010/players/bedroom/state"
```
* trackNo - used to skip to a specific track
```
curl -X PUT -H "Content-Type: application/json -d '{"trackNo": 5}' "http://localhost:10010/players/bedroom/state"
```
* elapsedTime - used to skip to a time in the current track
```
curl -X PUT -H "Content-Type: application/json -d '{"elapsedTime": 5}' "http://localhost:10010/players/bedroom/state"
```
* playbackState - used to set playback state - can be either play, pause or toggle
```
curl -X PUT -H "Content-Type: application/json -d '{"playbackState": "play"}' "http://localhost:10010/players/bedroom/state"
```
* repeat - used to set repeat mode - can be either all, one or none
```
curl -X PUT -H "Content-Type: application/json" -d '  {"playMode": {"repeat": "none"}}' "http://localhost:10010/players/bedroom/state"
```
* shuffle - used to set shuffle mode - can be either shuffle on or shuffle off
```
curl -X PUT -H "Content-Type: application/json" -d '  {"playMode": {"shuffle": "shuffle on"}}' "http://localhost:10010/players/bedroom/state"
```
* crossfade - used to set crossfade mode - can be either crossfade on or crossfade off
```
curl -X PUT -H "Content-Type: application/json" -d '  {"playMode": {"crossfade": "crossfade on"}}' "http://localhost:10010/players/bedroom/state"
```
* currentTrack/favourite - used to play a sonos favourite. Returns a 404 error if favourite not found
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"favourite": "BBC Radio 1"}}' "http://localhost:10010/players/bedroom/state"
```
* currentTrack/playlist - used to play a sonos playlist. Returns a 404 error if playlist not found
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"playlist": "test playlist"}}' "http://localhost:10010/players/bedroom/state"
```
* currentTrack/clip - plays a clip and then resumes playback (apart from when playing from spotify connect). The clip must be in the directory static/clips/
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"clip":"http://192.168.1.17:10010/static/clips/sample_clip.mp3"}}' "http://localhost:10010/players/bedroom/state"
```
* currentTrack/text - says some text and then resumes playback (apart from when playing from spotify connect)
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"text":"hello world"}}' "http://localhost:10010/players/bedroom/state"
```
* currentTrack/next - skips to the next track
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"skip":"next"}}' "http://localhost:10010/players/bedroom/state"
```
* currentTrack/previous - skips to the previous track
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"skip":"previous"}}' "http://localhost:10010/players/bedroom/state"
```
* currentTrack/linein - sets input to be linein of a specified player
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"lineinSource":"kitchen"}}' "http://localhost:10010/players/bedroom/state"
```
* currentTrack/artistTopTracks - plays the top tracks of the first artist returned by a spotify search
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"artistTopTracks":"blink 182"}}' "http://localhost:10010/players/bedroom/state"
```
* currentTrack/artistRadio - plays the artist radio of the first artist returned by a spotify search
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"artistRadio":"blink 182"}}' "http://localhost:10010/players/bedroom/state"
```
* currentTrack/song - plays the first song returned by a spotify search
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"song":"all the small things"}}' "http://localhost:10010/players/bedroom/state"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| playerName | path | The player name | Yes | string |
| async | query |  | No | boolean |
| body | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 | successful result |
| 202 | default asynchronous result |
| default | error result |

### /players/{playerName}/nowplaying
---
##### ***GET***
**Summary:** get player now playing

**Description:** This gets details of the currently playing track

Example call
```
curl -X GET "http://localhost:10010/zones/bedroom/nowplaying"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| playerName | path | The zone name | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

##### ***POST***
**Summary:** set player now playing

**Description:** This is used to set the currently playing track or radio.   
The input should be passed in the body of the request and be an item returned from a search result

Example call
```
curl -X POST -H "Content-Type: application/json"-d '{"title": "The Animal In Me","artist": "The Animal In Me","album": "The Animal In Me","imageUrl": "https://i.scdn.co/image/37eff75cf19923b7dc796ba374515dbe45098c14","type": "artist","uri": "x-sonosapi-radio:spotify%3aartistRadio%3a6hyAYqBdxyramm4W9TB7R0?sid=9&flags=8300&sn=5","metadata": "<DIDL-Lite xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\"\n          xmlns:r=\"urn:schemas-rinconnetworks-com:metadata-1-0/\" xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/\">\n          <item id=\"000c206cspotify%3aartistRadio%3a6hyAYqBdxyramm4W9TB7R0\" parentID=\"00052064spotify%3aartist%3athe animal in me\" restricted=\"true\"><dc:title>The Animal In Me radio</dc:title><upnp:class>object.item.audioItem.audioBroadcast.#artistRadio</upnp:class>\n          <desc id=\"cdudn\" nameSpace=\"urn:schemas-rinconnetworks-com:metadata-1-0/\">SA_RINCON2311_X_#Svc2311-0-Token</desc></item></DIDL-Lite>"}' "http://localhost:10010/zones/bedroom/nowplaying"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| playerName | path | The zone name | Yes | string |
| async | query |  | No | boolean |
| body | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 | successful result |
| 202 | default asynchronous result |
| default | error result |

### /players/{playerName}/queue
---
##### ***GET***
**Summary:** get player queue

**Description:** This gets the details of the current queue

Example call
```
curl -X GET "http://localhost:10010/zones/bedroom/queue?detailed=true"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| playerName | path | The zone name | Yes | string |
| detailed | query | Flag to indicate if detailed information should be returned. Default is false | No | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

##### ***PATCH***
**Summary:** add to player queue

**Description:** This is used to add an individual item to the current queue.  
The input should be passed in the body of the request and be an item returned from a search result

Example call
```
curl -X PATCH -H "Content-Type: application/json" -d '{"uri": "x-sonos-spotify:spotify%3atrack%3a1D3ODoXHBLpdxolZRHWV1j?sid=9&flags=8224&sn=5","metadata": "<DIDL-Lite xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\" xmlns:r=\"urn:schemas-rinconnetworks-com:metadata-1-0/\" xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/\"><item id=\"00032020spotify%3atrack%3a1D3ODoXHBLpdxolZRHWV1j\" parentID=\"00020000track:1D3ODoXHBLpdxolZRHWV1j\" restricted=\"true\"><dc:title></dc:title><upnp:class>object.item.audioItem.musicTrack</upnp:class><desc id=\"cdudn\" nameSpace=\"urn:schemas-rinconnetworks-com:metadata-1-0/\">SA_RINCON2311_X_#Svc2311-0-Token</desc></item></DIDL-Lite>"}' "http://localhost:10010/zones/bedroom/queue"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| playerName | path | The zone name | Yes | string |
| async | query |  | No | boolean |
| body | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| 202 | default asynchronous result |
| default | error result |

##### ***DELETE***
**Summary:** clear player queue

**Description:** This is used to clear the current queue

Example call
```
curl -X DELETE -H "Content-Type: application/json" -d '' "http://localhost:10010/zones/bedroom/queue"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| playerName | path | The zone name | Yes | string |
| async | query |  | No | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| 202 | default asynchronous result |
| default | error result |

##### ***POST***
**Summary:** replace playerqueue

**Description:** This replaces the current queue with specified tracks.  
The input should be passed in the body of the request and be an item returned from a search result

Example call
```
curl -X POST -H "Content-Type: application/json" -d '  {"uri": "x-sonos-spotify:spotify%3atrack%3a1D3ODoXHBLpdxolZRHWV1j?sid=9&flags=8224&sn=5", "metadata": "<DIDL-Lite xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\" xmlns:r=\"urn:schemas-rinconnetworks-com:metadata-1-0/\" xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/\"><item id=\"00032020spotify%3atrack%3a1D3ODoXHBLpdxolZRHWV1j\" parentID=\"00020000track:1D3ODoXHBLpdxolZRHWV1j\" restricted=\"true\"><dc:title></dc:title><upnp:class>object.item.audioItem.musicTrack</upnp:class><desc id=\"cdudn\" nameSpace=\"urn:schemas-rinconnetworks-com:metadata-1-0/\">SA_RINCON2311_X_#Svc2311-0-Token</desc></item></DIDL-Lite>"}' "http://localhost:10010/zones/bedroom/queue"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| playerName | path | The zone name | Yes | string |
| async | query |  | No | boolean |
| body | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 | successful result |
| 202 | default asynchronous result |
| default | error result |

### /zones
---
##### ***GET***
**Summary:** get all zones

**Description:** This gets information about all zones currently discovered

Example call
```
curl -X GET 'http://localhost:10010/zones'
```

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

### /zones/{zoneName}
---
##### ***GET***
**Summary:** get individual zone

**Description:** This gets the details of an individual zone

Example call
```
curl -X GET 'http://localhost:10010/zones/bedroom'
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path | The zone name | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

### /zones/{zoneName}/state
---
##### ***GET***
**Summary:** get zone state

**Description:** This gets the status of an individual zone

Example call
```
curl -X GET 'http://localhost:10010/zones/bedroom/state'
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path | The zone name | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

##### ***PUT***
**Summary:** set zone state

**Description:** This endpoint is used to to change the status of a zone. The available states you can change are

* volume - can either set the volume to an absolute value by passing a number, or relative by passing in a string prefixed by + or -
```
curl -X PUT -H "Content-Type: application/json" -d '{"volume": 10}' "http://localhost:10010/zones/bedroom/state"
curl -X PUT -H "Content-Type: application/json" -d '{"volume": "+5"}' "http://localhost:10010/zones/bedroom/state"
```

* mute - can be either mute on or mute off
```
curl -X PUT -H "Content-Type: application/json -d '{"mute": "mute on"}' "http://localhost:10010/zones/bedroom/state"
```
* trackNo - used to skip to a specific track
```
curl -X PUT -H "Content-Type: application/json -d '{"trackNo": 5}' "http://localhost:10010/zones/bedroom/state"
```
* elapsedTime - used to skip to a time in the current track
```
curl -X PUT -H "Content-Type: application/json -d '{"elapsedTime": 5}' "http://localhost:10010/zones/bedroom/state"
```
* playbackState - used to set playback state - can be either play, pause or toggle
```
curl -X PUT -H "Content-Type: application/json -d '{"playbackState": "play"}' "http://localhost:10010/zones/bedroom/state"
```
* repeat - used to set repeat mode - can be either all, one or none
```
curl -X PUT -H "Content-Type: application/json" -d '  {"playMode": {"repeat": "none"}}' "http://localhost:10010/zones/bedroom/state"
```
* shuffle - used to set shuffle mode - can be either shuffle on or shuffle off
```
curl -X PUT -H "Content-Type: application/json" -d '  {"playMode": {"shuffle": "shuffle on"}}' "http://localhost:10010/zones/bedroom/state"
```
* crossfade - used to set crossfade mode - can be either crossfade on or crossfade off
```
curl -X PUT -H "Content-Type: application/json" -d '  {"playMode": {"crossfade": "crossfade on"}}' "http://localhost:10010/zones/bedroom/state"
```
* currentTrack/favourite - used to play a sonos favourite. Returns a 404 error if favourite not found
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"favourite": "BBC Radio 1"}}' "http://localhost:10010/zones/bedroom/state"
```
* currentTrack/playlist - used to play a sonos playlist. Returns a 404 error if playlist not found
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"playlist": "test playlist"}}' "http://localhost:10010/zones/bedroom/state"
```
* currentTrack/clip - plays a clip and then resumes playback (apart from when playing from spotify connect). The clip must exist in static/clips directory
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"clip":"http://192.168.1.17:10010/static/clips/sample_clip.mp3"}}' "http://localhost:10010/zones/bedroom/state"
```
* currentTrack/text - says some text and then resumes playback (apart from when playing from spotify connect)
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"text":"hello world"}}' "http://localhost:10010/zones/bedroom/state"
```
* currentTrack/next - skips to the next track
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"skip":"next"}}' "http://localhost:10010/players/zones/state"
```
* currentTrack/previous - skips to the previous track
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"skip":"previous"}}' "http://localhost:10010/zones/bedroom/state"
```
* currentTrack/linein - sets input to be linein of a specified player
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"lineinSource":"kitchen"}}' "http://localhost:10010/zones/bedroom/state"
```
* currentTrack/artistTopTracks - plays the top tracks of the first artist returned by a spotify search
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"artistTopTracks":"blink 182"}}' "http://localhost:10010/zones/bedroom/state"
```
* currentTrack/artistRadio - plays the artist radio of the first artist returned by a spotify search
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"artistRadio":"blink 182"}}' "http://localhost:10010/zones/bedroom/state"
```
* currentTrack/song - plays the first song returned by a spotify search
```
curl -X PUT -H "Content-Type: application/json" -d '  {"currentTrack": {"song":"all the small things"}}' "http://localhost:10010/zones/bedroom/state"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path | The zone name | Yes | string |
| async | query |  | No | boolean |
| body | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 | successful result |
| 202 | default asynchronous result |
| default | error result |

### /zones/{zoneName}/nowplaying
---
##### ***GET***
**Summary:** get zone now playing

**Description:** This gets details of the currently playing track

Example call
```
curl -X GET "http://localhost:10010/zones/bedroom/nowplaying"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path | The zone name | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

##### ***POST***
**Summary:** set zone now playing

**Description:** This is used to set the currently playing track or radio.   
The input should be passed in the body of the request and be an item returned from a search result

Example call
```
curl -X POST -H "Content-Type: application/json"-d '{"title": "The Animal In Me","artist": "The Animal In Me","album": "The Animal In Me","imageUrl": "https://i.scdn.co/image/37eff75cf19923b7dc796ba374515dbe45098c14","type": "artist","uri": "x-sonosapi-radio:spotify%3aartistRadio%3a6hyAYqBdxyramm4W9TB7R0?sid=9&flags=8300&sn=5","metadata": "<DIDL-Lite xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\"\n          xmlns:r=\"urn:schemas-rinconnetworks-com:metadata-1-0/\" xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/\">\n          <item id=\"000c206cspotify%3aartistRadio%3a6hyAYqBdxyramm4W9TB7R0\" parentID=\"00052064spotify%3aartist%3athe animal in me\" restricted=\"true\"><dc:title>The Animal In Me radio</dc:title><upnp:class>object.item.audioItem.audioBroadcast.#artistRadio</upnp:class>\n          <desc id=\"cdudn\" nameSpace=\"urn:schemas-rinconnetworks-com:metadata-1-0/\">SA_RINCON2311_X_#Svc2311-0-Token</desc></item></DIDL-Lite>"}' "http://localhost:10010/zones/bedroom/nowplaying"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path | The zone name | Yes | string |
| async | query |  | No | boolean |
| body | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 | successful result |
| 202 | default asynchronous result |
| default | error result |

### /zones/{zoneName}/queue
---
##### ***GET***
**Summary:** get zone queue

**Description:** This gets the details of the current queue

Example call
```
curl -X GET "http://localhost:10010/zones/bedroom/queue?detailed=true"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path | The zone name | Yes | string |
| detailed | query | Flag to indicate if detailed information should be returned. Default is false | No | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

##### ***PATCH***
**Summary:** add to zone queue

**Description:** This is used to add an individual item to the current queue.  
The input should be passed in the body of the request and be an item returned from a search result

Example call
```
curl -X PATCH -H "Content-Type: application/json" -d '{"uri": "x-sonos-spotify:spotify%3atrack%3a1D3ODoXHBLpdxolZRHWV1j?sid=9&flags=8224&sn=5","metadata": "<DIDL-Lite xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\" xmlns:r=\"urn:schemas-rinconnetworks-com:metadata-1-0/\" xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/\"><item id=\"00032020spotify%3atrack%3a1D3ODoXHBLpdxolZRHWV1j\" parentID=\"00020000track:1D3ODoXHBLpdxolZRHWV1j\" restricted=\"true\"><dc:title></dc:title><upnp:class>object.item.audioItem.musicTrack</upnp:class><desc id=\"cdudn\" nameSpace=\"urn:schemas-rinconnetworks-com:metadata-1-0/\">SA_RINCON2311_X_#Svc2311-0-Token</desc></item></DIDL-Lite>"}' "http://localhost:10010/zones/bedroom/queue"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path | The zone name | Yes | string |
| async | query |  | No | boolean |
| body | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| 202 | default asynchronous result |
| default | error result |

##### ***DELETE***
**Summary:** clear zone queue

**Description:** This is used to clear the current queue

Example call
```
curl -X DELETE -H "Content-Type: application/json" -d '' "http://localhost:10010/zones/bedroom/queue"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path | The zone name | Yes | string |
| async | query |  | No | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| 202 | default asynchronous result |
| default | error result |

##### ***POST***
**Summary:** replace zone queue

**Description:** This replaces the current queue with specified tracks.  
The input should be passed in the body of the request and be an item returned from a search result

Example call
```
curl -X POST -H "Content-Type: application/json" -d '  {"uri": "x-sonos-spotify:spotify%3atrack%3a1D3ODoXHBLpdxolZRHWV1j?sid=9&flags=8224&sn=5", "metadata": "<DIDL-Lite xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:upnp=\"urn:schemas-upnp-org:metadata-1-0/upnp/\" xmlns:r=\"urn:schemas-rinconnetworks-com:metadata-1-0/\" xmlns=\"urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/\"><item id=\"00032020spotify%3atrack%3a1D3ODoXHBLpdxolZRHWV1j\" parentID=\"00020000track:1D3ODoXHBLpdxolZRHWV1j\" restricted=\"true\"><dc:title></dc:title><upnp:class>object.item.audioItem.musicTrack</upnp:class><desc id=\"cdudn\" nameSpace=\"urn:schemas-rinconnetworks-com:metadata-1-0/\">SA_RINCON2311_X_#Svc2311-0-Token</desc></item></DIDL-Lite>"}' "http://localhost:10010/zones/bedroom/queue"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path | The zone name | Yes | string |
| async | query |  | No | boolean |
| body | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 | successful result |
| 202 | default asynchronous result |
| default | error result |

### /zones/{zoneName}/members
---
##### ***GET***
**Summary:** get zone members

**Description:** This gets all members of the zone   
Example call
 ```
 curl -X GET -H "Content-Type: application/json"  "http://localhost:10010/zones/bedroom/members"
 ```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path |  | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

##### ***POST***
**Summary:** add zone member

**Description:** This adds a player to a zone   
Example call
```
curl -X POST -H "Content-Type: application/json" -d '{
  "player": "kitchen"
}' "http://localhost:10010/zones/bedroom/members"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path |  | Yes | string |
| async | query |  | No | boolean |
| body | body |  | No |  |

**Responses**

| Code | Description |
| ---- | ----------- |
| 201 | successful result |
| 202 | default asynchronous result |
| default | error result |

### /zones/{zoneName}/members/{roomName}
---
##### ***DELETE***
**Summary:** remove zone member

**Description:** This removes a member from a zone   
Example call
```
curl -X DELETE -d '' "http://localhost:10010/zones/bedroom/members/kitchen"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| zoneName | path |  | Yes | string |
| roomName | path |  | Yes | string |
| async | query |  | No | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| 202 | default asynchronous result |
| default | error result |

### /search
---
##### ***GET***
**Summary:** get search results from a music service

**Description:** This is used to search different music services.  

The service paramater controls which service to search. Currently implemented services are  
* library
* spotify
* iplayer

The type paramater controls what type to search for. This may vary accross services, but currently implemented for library and spotify services are
* song
* album
* artist

For spotify, the type can also be specifed as artisttoptracks and it returns results which play the top tracks by the artist.

For iplayer, this returns on demand programmes and the search types implemented are
* title
* synopsis

For iplayer, the available list of programmes is refreshed every 24 hours, so the first time it is called, or if the data has not been refreshed for more than 24 hours, it may take a long time to run. You can force a refresh by calling 

The limit paramater allows you to limit the number of results returned. This defaults to 20 if not specified.

The offset paramater allows you to page through results. This defaults to 0 if not specified.
 
The returned results include an array of items. Each item in the array can be used as input to add to queue or set now playing endpoints. If the results returned are a radio stream then it can only be added to now playing.   
Note - spotify retruns a radio stream for artist so can only be added to now playing

Also included are links to next and previous results when more than the limit are returned to allow easy paging through the results, and details of the number of results returned and available.

Example call
```
curl -X GET 'http://localhost:10010/search?service=spotify&type=song&q=blue'
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| service | query | The service to search | Yes | string |
| type | query | The type of search to perform - can be song, album, artist | Yes | string |
| q | query | The term to search for | Yes | string |
| offset | query | Used when multiple pages of results are returned to show results starting at offset | No | integer |
| limit | query | How many search items to return | No | integer |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

### /favourites
---
##### ***GET***
**Summary:** get favourites from sonos

**Description:** This returns a list of favourites from sonos

Example call
```
curl -X GET 'http://localhost:10010/favourites'
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| detailed | query | Used to specify if return just the names of the favourites or full details. Defaults to false | No | boolean |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

### /favourites/{favourite}
---
##### ***GET***
**Summary:** get individual favourite

**Description:** This gets details of an individual favourite.  
Example call
```
curl -X GET "http://localhost:10010/favourites/6%20Music/"
```

**Parameters**

| Name | Located in | Description | Required | Type |
| ---- | ---------- | ----------- | -------- | ---- |
| favourite | path |  | Yes | string |

**Responses**

| Code | Description |
| ---- | ----------- |
| 200 | successful result |
| default | error result |

### /swagger
---
##### ***GET***
**Description:** Gets the swagger definiton

**Responses**

| Code | Description |
| ---- | ----------- |
| default |  |
