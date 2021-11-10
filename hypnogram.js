const fetch = require('sync-fetch')

module.exports.generate = function(phrase) {
    var url = "https://api.hypnogram.xyz/generate";
    var method = "POST";
    var options = {
        "algorithm": "Hypnogram/1.1.1",
        "prompt": phrase
    };

    // Example POST method implementation:
    function postData(url='', data={}) {
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
	            headers: {
	                'Content-Type': 'application/json'// 'Content-Type': 'application/x-www-form-urlencoded',
	            },
	            redirect: 'follow',
	            // manual, *follow, error
	            referrerPolicy: 'no-referrer',
	            // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
	            body: JSON.stringify(data)// body data type must match "Content-Type" header
	        });
			resolve(response.json());
	        // parses JSON response into native JavaScript objects
	    });
	}

	return postData(url, options);
};
