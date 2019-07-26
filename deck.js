"use strict"
/* exported dirs */

let _dirs = [
    { up: "yes",  down: "yes",  left: "yes",  right: "yes"  },
    { up: "yes",  down: "yes",  left: "yes",  right: "yes"  },
    { up: "yes",  down: "yes",  left: "yes",  right: "yes"  },
    { up: "yes",  down: "yes",  left: "yes",  right: "yes"  },
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

let cardIndices = [];
for (let i = 0; i < _dirs.length; ++i) {
    cardIndices.push(i);
}

function dirs(card) {
    let c = _dirs[Math.abs(card)];
    return {
	up: card < 0 ? c.down : c.up,
	down: card < 0 ? c.up : c.down,
	left: card < 0 ? c.right : c.left,
	right: card < 0 ? c.left : c.right,
    }
}
