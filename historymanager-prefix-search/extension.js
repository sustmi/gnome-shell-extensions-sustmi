// Search command history by prefix in Gnome-shell's prompts.
// Copyright (C) 2011 Miroslav Sustek

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const Clutter = imports.gi.Clutter;

const History = imports.misc.history;
const Main = imports.ui.main;

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

function injectToFunction(objectPrototype, functionName, injectedFunction) {
    let originalFunction = objectPrototype[functionName];

    objectPrototype[functionName] = function() {
        let returnValue;

        let originalReturnValue = originalFunction.apply(this, arguments);
        returnValue = injectedFunction.apply(this, arguments);

        if (returnValue === undefined) {
            returnValue = originalReturnValue;
        }

        return returnValue;
    }

    return originalFunction;
}

function removeInjection(objectPrototype, injection, functionName) {
    if (injection[functionName] === undefined) {
        delete objectPrototype[functionName];
    } else {
        objectPrototype[functionName] = injection[functionName];
    }
}

function disable() {
    for (let i in historyManagerInjections) {
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
