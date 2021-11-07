class Trie {

    root = {
        value: -1,
        symbol: null,
        children: []
    }
    insert(value) {
        findInsertionPoint(this.root, value);
    }

    has(value) {
        return hasValue(this.root, value);
    }
}

module.exports = Trie;

function hasValue(node, value) {
    var matchingChild = -1;
    var returnMe = false;

    for (let i = 0; i < node.children.length; i++) {
        if (value.indexOf(node.children[i].symbol) === 0) {
            if (value.length == node.children[i].symbol.length && node.children[i].value >= 0) {
                returnMe = true;
            } else {
                matchingChild = i;
                break;
            }
        }
    }

    if (matchingChild > -1) {
        //if a child matched, search it for matches
        return hasValue(node.children[matchingChild], value);
    } else {
        //either we found it (true), or we searched the whole tree (false)
        return returnMe;
    }
}

function findInsertionPoint(node, value) {
    let matchingChild = -1;

    for (let i = 0; i < node.children.length; i++) {
        //for each child
        if (value.indexOf(node.children[i].symbol) === 0) {
            //if the current node matches the start of the value
            if (value.length == node.children[i].symbol.length) {
                node.children[i].value = Date.now() + Math.random();
                return;
            }
            //mark the index of the child whose symbol appears in the value to be inserted
            matchingChild = i;
            break;
        }
    }

    if (matchingChild > -1) {
        //if a child matched, search it for matches
        findInsertionPoint(node.children[matchingChild], value);
    } else {
        //if no children match, insert one
        insertChild(node, value);
        findInsertionPoint(node, value);
    }
}

function insertChild(parent, value) {
    let len = parent.symbol ? parent.symbol.length : 0;

    parent.children.push({
        value: -1,
        symbol: value.substr(0, len + 1),
        children: []
    });
}

function test() {
    var t = new Trie();
    t.insert("ass");
    t.insert("face");
    t.insert("penis");

    console.log("t has ass", t.has("ass"));
    console.log("t has AS", t.has("AS"));
    console.log("t has as", t.has("as"));
    console.log("t has face", t.has("face"));
    console.log("t has steve", t.has("steve"));

}