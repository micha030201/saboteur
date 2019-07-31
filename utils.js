"use strict"
/* exported doesIncludeArray DefaultDict shuffle Join */

function doesIncludeArray(haystack, needle){
    let i, j, current;
    for(i = 0; i < haystack.length; ++i){
        if(needle.length === haystack[i].length){
            current = haystack[i];
            for(j = 0; j < needle.length && needle[j] === current[j]; ++j);
            if(j === needle.length)
                return true;
        }
    }
    return false;
}

class DefaultDict {
    constructor(defaultInit) {
        return new Proxy({}, {
            get: (target, name) => name in target ?
                target[name] :
                (target[name] = typeof defaultInit === 'function' ?
                    new defaultInit().valueOf() :
                    defaultInit)
        })
    }
}

Array.prototype.any = function() {
    return this.some(function(x) { return x });
}

Array.prototype.all = function() {
    return this.every(function(x) { return x });
}

Array.prototype.randomElement = function() {
    return this[Math.floor(Math.random() * this.length)];
}

function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

Node.prototype.a = function() {
    for (let i = 0; i < arguments.length; i += 2) {
        this.setAttribute(arguments[i], arguments[i + 1]);
    }
}

class Join {
    constructor(n, callback) {
        this.k = 0;
        this.n = n;
        this.callback = callback;

        this.oneDone = this._oneDone.bind(this);
    }

    _oneDone() {
        this.k += 1;
        console.log(this.k, this.n);
        if (this.k === this.n) {
            setTimeout(this.callback, 0);
        }
    }
}
