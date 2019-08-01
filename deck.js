"use strict"
/* global DefaultDict */
/* exported dirs type impairmentType finishCards cardIndices rolesN finishCardAB finishCardIndex */

const DESTROY_CARDS = 3;
const MAP_CARDS = 6;
const IMPAIR_CARDS = 99;
const REPAIR_CARDS = 9;

let _dirs = [
    { up: "yes",  down: "yes",  left: "yes",  right: "yes"  },
    { up: "yes",  down: "yes",  left: "yes",  right: "yes"  },
    { up: "no",   down: "yes",  left: "yes",  right: "no"   },
    { up: "no",   down: "yes",  left: "no",   right: "yes"  },
    { up: "yes",  down: "yes",  left: "yes",  right: "yes"  },
    { up: "yes",  down: "yes",  left: "yes",  right: "yes"  },
    { up: "yes",  down: "yes",  left: "yes",  right: "yes"  },
    { up: "yes",  down: "yes",  left: "yes",  right: "yes"  },
    { up: "yes",  down: "no",   left: "yes",  right: "yes"  },
    { up: "yes",  down: "no",   left: "yes",  right: "yes"  },
    { up: "yes",  down: "no",   left: "yes",  right: "yes"  },
    { up: "yes",  down: "yes",  left: "yes",  right: "no"   },
    { up: "yes",  down: "yes",  left: "yes",  right: "no"   },
    { up: "no",   down: "dead", left: "no",   right: "no"   },
    { up: "yes",  down: "yes",  left: "no",   right: "yes"  },
    { up: "yes",  down: "yes",  left: "no",   right: "yes"  },
    { up: "yes",  down: "yes",  left: "no",   right: "yes"  },
    { up: "yes",  down: "no",   left: "yes",  right: "no"   },
    { up: "yes",  down: "no",   left: "yes",  right: "no"   },
    { up: "dead", down: "dead", left: "dead", right: "no"   },
    { up: "dead", down: "dead", left: "no",   right: "no"   },
    { up: "no",   down: "no",   left: "yes",  right: "yes"  },
    { up: "no",   down: "no",   left: "yes",  right: "yes"  },
    { up: "no",   down: "no",   left: "yes",  right: "yes"  },
    { up: "yes",  down: "no",   left: "no",   right: "yes"  },
    { up: "yes",  down: "no",   left: "no",   right: "yes"  },
    { up: "yes",  down: "no",   left: "no",   right: "yes"  },
    { up: "yes",  down: "yes",  left: "no",   right: "no"   },
    { up: "yes",  down: "yes",  left: "no",   right: "no"   },
    { up: "yes",  down: "yes",  left: "no",   right: "no"   },
    { up: "yes",  down: "yes",  left: "no",   right: "no"   },
    { up: "no",   down: "yes",  left: "no",   right: "yes"  },
    { up: "no",   down: "yes",  left: "no",   right: "yes"  },
    { up: "no",   down: "yes",  left: "yes",  right: "no"   },
    { up: "no",   down: "yes",  left: "yes",  right: "no"   },
    { up: "no",   down: "yes",  left: "yes",  right: "no"   },
    { up: "no",   down: "yes",  left: "yes",  right: "yes"  },
    { up: "no",   down: "dead", left: "dead", right: "no"   },
    { up: "dead", down: "no",   left: "dead", right: "dead" },
    { up: "no",   down: "dead", left: "no",   right: "dead" },
    { up: "no",   down: "no",   left: "dead", right: "dead" },
    { up: "no",   down: "no",   left: "dead", right: "no"   },
    { up: "dead", down: "dead", left: "dead", right: "dead" },
];

let finishCards = [1, 2, 3];

let cardIndices = [];
for (let i = 4; i < _dirs.length + DESTROY_CARDS + MAP_CARDS + IMPAIR_CARDS + REPAIR_CARDS; ++i) {
    cardIndices.push(i);
}

function type(card) {
    if (card < _dirs.length) {
        return "path";
    }
    if (card < _dirs.length + DESTROY_CARDS) {
        return "destroy";
    }
    if (card < _dirs.length + DESTROY_CARDS + MAP_CARDS) {
        return "map";
    }
    if (card < _dirs.length + DESTROY_CARDS + MAP_CARDS + IMPAIR_CARDS) {
        return "impair";
    }
    if (card < _dirs.length + DESTROY_CARDS + MAP_CARDS + IMPAIR_CARDS + REPAIR_CARDS) {
        return "repair";
    }
}

function dirs(card) {
    let c = _dirs[Math.abs(card)];
    if (typeof c === "undefined") {
	console.log(card);
    }
    return {
        up: card < 0 ? c.down : c.up,
        down: card < 0 ? c.up : c.down,
        left: card < 0 ? c.right : c.left,
        right: card < 0 ? c.left : c.right,
    }
}

function impairmentType(card) {
    return [(Math.abs(card) - DESTROY_CARDS - MAP_CARDS) % 3];
}

let rolesN = [
    null,
    ["miner"],
    ["miner", "miner", "saboteur"],
    ["miner", "miner", "saboteur", "miner"],
    ["miner", "miner", "saboteur", "miner", "miner"],
    ["miner", "miner", "saboteur", "miner", "miner", "saboteur"],
    ["miner", "miner", "saboteur", "miner", "miner", "saboteur", "miner"],
    ["miner", "miner", "saboteur", "miner", "miner", "saboteur", "miner", "saboteur"],
    ["miner", "miner", "saboteur", "miner", "miner", "saboteur", "miner", "saboteur", "miner"],
    ["miner", "miner", "saboteur", "miner", "miner", "saboteur", "miner", "saboteur", "miner", "miner"],
];

let finishCardAB = [
    [8, -2],
    [8, 0],
    [8, 2],
];

let finishCardIndex = new DefaultDict(function () { return {}; });
finishCardIndex[8][-2] = 0;
finishCardIndex[8][0] = 1;
finishCardIndex[8][2] = 2;
