const Clutter = imports.gi.Clutter;

const History = imports.misc.history;
const Main = imports.ui.main;


function injectToFunction(parent, name, func) {
    let origin = parent[name];
    parent[name] = function() {
        let ret;
        if (origin !== undefined) {
            ret = origin.apply(this, arguments);
        }
        ret = func.apply(this, arguments);
        return ret;
    }
    return origin;
}
function removeInjection(object, injection, name) {
    if (injection[name] === undefined) {
        delete object[name];
    } else {
        object[name] = injection[name];
    }
}

let historyManagerInjections;

function resetState() {
    historyManagerInjections = {};
}

function enable() {
    resetState();
    
    historyManagerInjections['prevItemPrefix'] = undefined;
    historyManagerInjections['nextItemPrefix'] = undefined;
    historyManagerInjections['_onEntryKeyPress'] = undefined;
    
    historyManagerInjections['prevItemPrefix'] = injectToFunction(History.HistoryManager.prototype, 'prevItemPrefix', function(text, prefix) {
        function _hasPrefix(s1, prefix) {
            return s1.indexOf(prefix) == 0;
        }
        
        for (let i = this._historyIndex - 1; i >= 0; i--) {
            if (_hasPrefix(this._history[i], prefix) && this._history[i] != text) {
                this._historyIndex = i;
                return this._indexChanged();
            }
        }
        
        return text;
    });
    
    historyManagerInjections['nextItemPrefix'] = injectToFunction(History.HistoryManager.prototype, 'nextItemPrefix', function(text, prefix) {
        function _hasPrefix(s1, prefix) {
            return s1.indexOf(prefix) == 0;
        }
        
        for (let i = this._historyIndex + 1; i < this._history.length; i++) {
            if (_hasPrefix(this._history[i], prefix) && this._history[i] != text) {
                this._historyIndex = i;
                return this._indexChanged();
            }
        }
        
        return text;
    });
    
    historyManagerInjections['_onEntryKeyPress'] = injectToFunction(History.HistoryManager.prototype, '_onEntryKeyPress', function(entry, event) {
        let symbol = event.get_key_symbol();
        if (symbol == Clutter.KEY_Page_Up) {
            let pos = (entry.get_cursor_position() != -1) ? entry.get_cursor_position() : entry.get_text().length;
            if (pos > 0) {
                this.prevItemPrefix(entry.get_text(), entry.get_text().slice(0, pos));
                entry.set_selection(pos, pos);
            } else {
                this.prevItem(entry.get_text());
            }
            return true;
        } else if (symbol == Clutter.KEY_Page_Down) {
            let pos = (entry.get_cursor_position() != -1) ? entry.get_cursor_position() : entry.get_text().length;
            if (pos > 0) {
                this.nextItemPrefix(entry.get_text(), entry.get_text().slice(0, pos));
                entry.set_selection(pos, pos);
            } else {
                this.nextItem(entry.get_text());
            }
            return true;
        }
        
        return false;
    });

}

function disable() {
    for (i in historyManagerInjections) {
        removeInjection(History.HistoryManager.prototype, historyManagerInjections, i);
    }
    resetState();
}

function init() {
    // Stateless
}

// 3.0 API backward compatibility
function main() {
    init();
    enable();
}

