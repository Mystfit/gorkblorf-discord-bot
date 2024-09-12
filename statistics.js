class Statistics {

    constructor() {
        this.userStatistics = new Map();
        // key: "userid", value: {words: Set("words"), violations: [{key: "word", value: timestamp}]}
    }

    addToWordList(userId, wordList /* Array */) {
        var stats = this.userStatistics.get(userId) ?? {
            "words": new Set(),
            "violations": []
        };
        var words = stats?.words;

        wordList.forEach(function (word) {
            words.add(word);
        });

        stats.words = words;
        this.userStatistics.set(userId, stats);
    }

    addToViolations(userId, violationList /* Array */) {
        var stats = this.userStatistics.get(userId) ?? {
            "words": new Set(),
            "violations": []
        }
        var violations = stats.violations;

        if (!!violations) {
            violations = [];
        }

        violationList.forEach(function (violation) {
            violation.timestamp = new Date(Date.now());
            violations.push(violation);
        });

        stats.violations = violations;
        this.userStatistics.set(userId, stats);
    }

}

module.exports = Statistics;