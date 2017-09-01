# domoticz-plex-webhook
Provides an endpoint for Plex Webhooks to send to Domotiz home automation software.  Supports multiple Plex clients

Example usage is to control lights based on a movie being played, paused or stopped.

## Requirements
* Domoticz https://www.domoticz.com/
* Node.js https://nodejs.org/en/ (Tested with v7.10)
* Plex with Plex Pass https://www.plex.tv/features/plex-pass/

## Setup

```
git clone https://github.com/corbinmunce/domoticz-plex-webhook.git
cd domoticz-plex-webhook
npm install
```

Create a 'Dummy' hardware device in Domoticz (if you don't already have one) and then create a 'Text' virtual sensor named Plex.

Edit main.js to match your Domoticz settings:
```
const domoticzIp = "192.168.5.28"; // Domoticz IP address
const domoticzPort = 8080; // Domoticz Port
players.push({ name: "CORBIN", idx: 132, timer: null }); // Name of your Plex Player and IDX of the Domoticz text device that you have created
```

Run the script:
```
node main.js
```

Add a webhook in Plex to point to the server your are running main.js from.  eg http://192.168.5.28/11000