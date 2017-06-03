# domoticz-plex-webhook
Provides an endpoint for Plex Webhooks to send to Domotiz home automation sofware

## Requirements
* Domoticz https://www.domoticz.com/
* Node.js https://nodejs.org/en/
* Plex with Plex Pass https://www.plex.tv/features/plex-pass/

## Setup
```
git clone https://github.com/corbinmunce/domoticz-plex-webhook.git
cd domoticz-plex-webhook
npm install
```

Create a 'Dummy' hardware device in Domoticz (if you don't already have one) and then create a 'Text' virutal sensor named Plex.

Edit main.js to match your Domoticz settings:
```
const domoticzIp = "192.168.5.27"; // Domoticz IP address
const domoticzPort = 8080; // Domoticz Port
const deviceIdx = 132 // IDX of a Domoticz text device that you have created
```

Run the script:
```
node main.js
```

Add a webhook in Plex to point to the server your are running main.js from.  (http://192.168.5.27/11000)