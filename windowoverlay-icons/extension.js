const Mainloop = imports.mainloop;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const Main = imports.ui.main;
const Workspace = imports.ui.workspace;

const WINDOWOVERLAY_ICON_SIZE = 22;

function injectToFunction(parent, name, func) {
    let origin = parent[name];
    parent[name] = function() {
        let ret;
        ret = origin.apply(this, arguments);
        if (ret === undefined)
                ret = func.apply(this, arguments);
        return ret;
    }
}

function main() {

    injectToFunction(Workspace.WindowOverlay.prototype, '_init', function(windowClone, parentActor) {
        let tracker = Shell.WindowTracker.get_default();
        let apps = tracker.get_running_apps('');
        
        for (let i = 0; i < apps.length; i++) {
            let windows = apps[i].get_windows();
            for (let j = 0; j < windows.length; j++) {
                if (windows[j] == windowClone.metaWindow) {
                    this._icon = apps[i].create_icon_texture(WINDOWOVERLAY_ICON_SIZE);
                }
            }
        }
        if (this._icon == undefined) {
            this._icon = new St.Icon({ icon_name: 'applications-other', icon_type: St.IconType.FULLCOLOR, icon_size: 22 });
        }
                
        parentActor.add_actor(this._icon);
    });
    
    injectToFunction(Workspace.WindowOverlay.prototype, 'hide', function() {
        this._icon.hide();
    });
    injectToFunction(Workspace.WindowOverlay.prototype, 'show', function() {
        this._icon.show();
    });
    
    injectToFunction(Workspace.WindowOverlay.prototype, 'updatePositions', function(cloneX, cloneY, cloneWidth, cloneHeight) {
        this._icon.set_position(Math.floor(this.title.x - WINDOWOVERLAY_ICON_SIZE - 3), Math.floor(this.title.y));
        this._icon.raise_top();
    });
    
    injectToFunction(Workspace.WindowOverlay.prototype, '_onDestroy', function() {
        this._icon.destroy();
    });

}
