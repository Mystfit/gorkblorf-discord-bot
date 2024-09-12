const fetch = require('sync-fetch');

module.exports.download = async function (id) {
    console.log("download", id);
    // Default options are marked with *
    const response = await fetch("https://s3.amazonaws.com/hypnogram-images/" + id + ".jpg", {
        method: 'GET',
         "headers": {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36"
        // "sec-fetch-dest": "document",
        // "sec-fetch-mode": "navigate",
        // "sec-fetch-site": "cross-site",
        // "sec-fetch-user": "?1",
        // "upgrade-insecure-requests": "1"
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "mode": "cors",
        "credentials": "include"
    });

    return response;
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
    var url = " https://api.hypnogram.xyz/generate";
    var method = " POST ";
    var options = {
        "prompt": getFirst73(phrase),
        "high_resolution": false
    };

    console.log("options", options);

    function getFirst73(string) {
        let reversed = [...string.substr(0, 73)].reverse().join("");
        let index = reversed.indexOf(" ");
        return [...reversed.substr(index)].reverse().join("");
    }

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
