class WordEvolver {
    constructor(charset, mutationChance) {
        this.charset = charset;
        this.mutationChance = mutationChance;
    }

    getNewWords(message) {
		// console.log("getNewWords", message);
		var self = this;
        let words = message.split(" ");
        let parentPairs = [];
        let children = [];
        let mutatedChildren = [];

        if (Math.random() <= this.mutationChance) {
            let a = Math.floor(Math.random() * words.length);
            let b = Math.floor(Math.random() * words.length);

            if (a == b) {
                a++;
                if (a >= words.length) {
                    a = 0
                }
            }

            parentPairs.push({
                a: words[a],
                b: words[b]
            });
        }

        parentPairs.forEach(function (pair) {
            let offspring = self.recombinate(pair.a, pair.b);

            children.push(self.chromosomalDrift(self.mutate(offspring.a)));
            children.push(self.chromosomalDrift(self.mutate(offspring.b)));
        });

        return (children.length > 0) ? children : [];
    }

    recombinate(a, b) {
        //given two entities, return two offspring

        var pivotA = 1 + Math.floor(Math.random() * (a.length - 2));
        var pivotB = 1 + Math.floor(Math.random() * (b.length - 2));

        var offspringA = a.substr(0, pivotA) + b.substr(pivotB);
        var offspringB = b.substr(0, pivotB) + a.substr(pivotA);

        return {
            a: offspringA,
            b: offspringB
        };
    }

    mutate(entity) {
        //pass in a string to mutate, get the mutated string back

        let returnMe = entity;
        //how often will a character change
        let mutationSize = 0.1;

        for (let i = 0; i < returnMe.length; i++) {
            if (Math.random() <= mutationSize) {
                returnMe = this.replaceAt(returnMe, i, this.charset[Math.floor(Math.random() * this.charset.length)]);
            }
        }

        // if (entity === returnMe) {
            // console.log("entity unchanged");
        // }

        return returnMe;
    }

    chromosomalDrift(entity) {

        var i = Math.floor(Math.random() * entity.length);
        return this.replaceAt(entity, i, String.fromCharCode(entity.charCodeAt(i) + (Math.floor(Math.random() * 2) ? 1 : -1)));
    }

    replaceAt(str, index, character) {
        return str.substr(0, index) + character + str.substr(index + character.length);
    }
}

module.exports = WordEvolver;
