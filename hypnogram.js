const fetch = require('sync-fetch')

    module.exports.download = function (id) {
    return new Promise(resolve => {
        // Default options are marked with *
        const response = fetch("https://s3.amazonaws.com/hypnogram-images/" + id + ".jpg", {
            method: 'GET',
            "headers": {
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "cross-site",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1"
            },
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "omit"
        });
    });
    console.log(" Downloaded image from AWS ");
    resolve(response.json());
    /*
    // expected result
    // {" image_id ":" d2b372ce9427435888911dbfc8eae2ea "," prompt ":" gorkblorf tentacles logo artstation "}

    // parses JSON response into native JavaScript objects

    // example download
    // fetch(" https : //s3.amazonaws.com/hypnogram-images/d2b372ce9427435888911dbfc8eae2ea.jpg", {
    // "headers": {
    // "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/
    /*
    // * ; q = 0.8, application / signed - exchange; v = b3; q = 0.9 ",
    // " sec - fetch - dest ": " document ",
    // " sec - fetch - mode ": " navigate ",
    // " sec - fetch - site ": " cross - site ",
    // " sec - fetch - user ": " ? 1 ",
    // " upgrade - insecure - requests ": " 1 "
    // },
    // " referrerPolicy ": " strict - origin - when - cross - origin ",
    // " body ": null,
    // " method ": " GET ",
    // " mode ": " cors ",
    // " credentials ": " omit "
    // });
     */

}

module.exports.generate = function (phrase) {
    var url = " https : / / api.hypnogram.xyz / generate ";
    var method = " POST ";
    var options = {
        "prompt": phrase,
        "high_resolution": false
    };

    // Example POST method implementation:
    function postData(url = '', data = {}) {
        return new Promise(resolve => {
            // Default options are marked with *
            const response = fetch(url, {
                method: 'POST',
                // *GET, POST, PUT, DELETE, etc.
                mode: 'cors',
                // no-cors, *cors, same-origin
                cache: 'no-cache',
                // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin',
                // include, *same-origin, omit
                "headers": {
                    "accept": "application/json ",
                    "accept-language ": "en-US,en;q=0.9 ",
                    "content-type": "application/json",
                    // " sec - fetch - dest ": " empty ",
                    // " sec - fetch - mode ": " cors ",
                    // " sec - fetch - site ": " same - site "
                },
                redirect: 'follow',
                // manual, *follow, error
                referrerPolicy: 'no-referrer',
                // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                body: JSON.stringify(data) // body data type must match " Content - Type " header
            });
            console.log(" Received response from hypnogram service ");
            resolve(response.json());
            // parses JSON response into native JavaScript objects
        });
    }

    //example hypnogram request
    // /*     fetch(" https: //api.hypnogram.xyz/generate", {
    // "headers": {
    // "accept": "application/json",
    // "accept-language": "en-US,en;q=0.9",
    // "content-type": "application/json",
    // "sec-ch-ua": "\"Chromium\";v=\"96\", \"Opera\";v=\"82\", \";Not A Brand\";v=\"99\"",
    // "sec-ch-ua-mobile": "?0",
    // "sec-ch-ua-platform": "\"Windows\"",
    // "sec-fetch-dest": "empty",
    // "sec-fetch-mode": "cors",
    // "sec-fetch-site": "same-site"
    // },
    // "referrer": "https://hypnogram.xyz/",
    // "referrerPolicy": "strict-origin-when-cross-origin",
    // "body": "{\"prompt\":\"gorkblorf logo artstation\",\"high_resolution\":false}",
    // "method": "POST",
    // "mode": "cors",
    // "credentials": "omit"
    // });
     // * /
    return postData(url, options);
    // };
}