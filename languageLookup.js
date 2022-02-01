var fs = require('fs');
var path = require('path');
const Trie = require('./trie');

class LanguageLookup {

    constructor() {
        this.languages = this.readFiles();
    }

    readFiles() {

        var returnMe = {};
        let p = path.resolve(__dirname, "languages");

        fs.readdirSync(p).forEach(file => {
            let f = path.resolve(p, file);

            if (fs.existsSync(f)) {
                let language = new Trie();

                let language_name = path.basename(f, path.extname(f));
                console.log("Language file:", language_name);

                try {
                    let data = fs.readFileSync(f, 'utf8');
                    let lines = data.split(/\r?\n/);
                    lines.forEach(line => {
                        language.insert(line);
                    });
                } catch (err) {
                    console.log(err);
                }

                returnMe[language_name] = language;
            }
        });
        console.log("Loaded languages", returnMe);
        return returnMe;
    }

    find(word) {
		// return an array of strings indicating the languages that contain the word
        let violations = []
        Object.keys(this.languages).forEach(lang => {
            if (this.languages[lang].has(word)) {
                violations.push(lang);
            }
        });
        return violations;
    }
}

module.exports = LanguageLookup;
