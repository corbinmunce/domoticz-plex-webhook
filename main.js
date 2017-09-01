const express = require('express');
const multer = require('multer');
const request = require('request');
const sha1 = require('sha1');
const upload = multer({ storage: multer.memoryStorage() });

// Domoticz Settings
const domoticzUrl = "192.168.5.28";
const domoticzIp = 8080;

var players = [];
players.push({ name: "CORBIN", idx: 132, timer: null });
players.push({ name: "Plex Web (Chrome)", idx: 134, timer: null });
players.push({ name: "Chromecast", idx: 135, timer: null });
players.push({ name: "Mi Box", idx: 163, timer: null });

const app = express();
const port = 80;

const audioTimeoutMinutes = 10; // 10 - use a short timeout for audio
const videoTimeoutMinutes = 180; // if no response received for 3 hours, set the device to stop

//var timeout = null;

app.listen(port, () => {
    console.log(`Express app running at http://localhost:${port}`);
});

// routes
app.post('/', upload.single('thumb'), function (req, res, next) {
    const payload = JSON.parse(req.body.payload);

    var idx;
    try {
        idx = players.find(x => x.name === payload.Player.title).idx;
    } catch (Exception) {
        console.log("error");
    }

    if (idx != undefined) {

        const isVideo = (payload.Metadata.librarySectionType === 'movie' || payload.Metadata.librarySectionType === 'show');
        const isAudio = (payload.Metadata.librarySectionType === 'artist');
        const key = sha1(payload.Server.uuid + payload.Metadata.ratingKey);    

        // missing required properties
        if (!payload.user || !payload.Metadata || !(isAudio || isVideo)) {
            return res.sendStatus(400);
        }

        if (payload.event === 'media.play' || payload.event === 'media.rate') {
            // there is an image attached
            // uncomment the following line to save the image
            // writeImage(key + '.jpg', req.file.buffer);
        }

        var svalue = payload.event.replace("media.", "") + ": " + formatTitle(payload.Metadata) + " - " + formatSubtitle(payload.Metadata);
        request.get("http://" + domoticzUrl + ":" + domoticzIp + "/json.htm?type=command&param=udevice&idx=" + idx + "&nvalue=0&svalue=" + svalue)
        .on('error', function (err) {
            console.log('error sending to Domoticz');
        });

        // use a timeout to set status to stopped if there is no update for n minutes
        // keep separate timeouts for each player
        clearTimeout(players.find(x => x.name === payload.Player.title).timer);
        var timeoutMinutes = audioTimeoutMinutes;
        if (isVideo) {
            timeoutMinutes = videoTimeoutMinutes
        }
        players.find(x => x.name === payload.Player.title).timer = setTimeout(setDomoticzStopped, timeoutMinutes * 60000, idx);

    }

    res.sendStatus(200);

});


function setDomoticzStopped(idx) {
    console.log('stopping ' + idx);
    request.get("http://" + domoticzUrl + ":" + domoticzIp + "/json.htm?type=command&param=udevice&idx=" + idx + "&nvalue=0&svalue=stop")
    .on('error', function (err) {
        console.log('error sending to Domoticz');
    });
}


app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send(err.message);
});

function writeImage(fileName, buffer) {
    var fs = require('fs');
    fs.access(fileName, (err) => {
        if (!err) {
            console.error('myfile already exists');
            return;
        }

        fs.open(fileName, 'wx', (err, fd) => {
            if (err) throw err;            
            fs.writeFile(fileName, buffer);
        });
    });
}

function formatTitle(metadata) {
    if (metadata.grandparentTitle) {
        return metadata.grandparentTitle;
    } else {
        let ret = metadata.title;
        if (metadata.year) {
            ret += ` (${metadata.year})`;
        }
        return ret;
    }
}

function formatSubtitle(metadata) {
    let ret = '';

    if (metadata.grandparentTitle) {
        if (metadata.type === 'track') {
            ret = metadata.parentTitle;
        } else if (metadata.index && metadata.parentIndex) {
            ret = `S${metadata.parentIndex} E${metadata.index}`;
        } else if (metadata.originallyAvailableAt) {
            ret = metadata.originallyAvailableAt;
        }

        if (metadata.title) {
            ret += ' - ' + metadata.title;
        }
    } else if (metadata.type === 'movie') {
        ret = metadata.tagline;
    }

    return ret;
}
