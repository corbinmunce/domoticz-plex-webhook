const express = require('express');
const multer = require('multer');
const request = require('request');
const sha1 = require('sha1');
const upload = multer({ storage: multer.memoryStorage() });

// Domoticz Settings
const domoticzUrl = "192.168.5.28";
const domoticzIp = 8080;
const deviceIdx = 132;

// Array of Plex Players to listen for
var players = ["CORBIN","abc123"];

const app = express();
const port = 11000;

app.listen(port, () => {
    console.log(`Express app running at http://localhost:${port}`);
});

//
// routes
app.post('/', upload.single('thumb'), function (req, res, next) {
    const payload = JSON.parse(req.body.payload);
    if (players.includes(payload.Player.title)) {

        const isVideo = (payload.Metadata.librarySectionType === 'movie' || payload.Metadata.librarySectionType === 'show');
        const isAudio = (payload.Metadata.librarySectionType === 'artist');
        const key = sha1(payload.Server.uuid + payload.Metadata.ratingKey);    

        // missing required properties
        if (!payload.user || !payload.Metadata || !(isAudio || isVideo)) {
            return res.sendStatus(400);
        }
        //console.log(payload);
    
        if (payload.event === 'media.play' || payload.event === 'media.rate') {
            // there is an image attached
            // uncomment the following line to save the image
            // writeImage(key + '.jpg', req.file.buffer);
        }

        var svalue = payload.event.replace("media.", "") + ": " + formatTitle(payload.Metadata) + " - " + formatSubtitle(payload.Metadata);
        request.get("http://" + domoticzUrl + ":" + domoticzIp + "/json.htm?type=command&param=udevice&idx=" + deviceIdx + "&nvalue=0&svalue=" + svalue)
        .on('error', function (err) {
            console.log('error sending to Domoticz');
        });

    }
    res.sendStatus(200);

});


//
// error handlers

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send(err.message);
});

//
// helpers

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





