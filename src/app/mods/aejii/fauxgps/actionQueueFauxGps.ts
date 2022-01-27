import {
    Mod
} from "../../mod"
import {
    inspect
} from 'util'
import {
    SettingsService
} from "@services/settings.service"
import {
    TranslateService
} from "@ngx-translate/core"
import {
    API
} from "../api"


export class ActionQueue extends Mod {

    //public api: API
    public checkSiMort: boolean
    public queue
    public mapPoints
    public inProgress
    public currentAction
    public retryMode
    public inPause
    public moveManager
    public canceled: boolean
    private api: API
    public VISIBLE_ACTIONS_TYPE

    startMod(): void {
        //this.api = api
        this.checkSiMort = false
        Logger.info("- ActionQueue active");
    }

    constructor(wGame: any, settings: SettingsService, translate: TranslateService, moveManager, api) {
        super(wGame, settings, translate);
        this.api = api
        this.moveManager = moveManager
        this.VISIBLE_ACTIONS_TYPE = ['map', 'dir', 'sun'];
        this.queue = [];
        this.canceled = false
        this.mapPoints = [];
        this.inProgress = false;
        this.currentAction = null;
        this.retryMode = false;
        this.inPause = false;
    }

    public resetInit(){
        this.queue = [];
        this.canceled = false
        this.mapPoints = [];
        this.inProgress = false;
        this.currentAction = null;
        this.retryMode = false;
        this.inPause = false;
    }

    /**
     * Add and execute the action if it is the first
     * @param {*} action 
     */
    public enqueue(action) {
        try {
            this.add(action);
            if (!this.inProgress) {
                this.dequeue();
            }
        } catch (ex) {
            console.error(ex);
        }
        return this;
    }

    public remove(action) {
        let idx = this.queue.indexOf(action);
        if (idx > -1)
            this.queue.splice(idx, 1);
        this.refreshCompass();
        return this;
    }

    /**
     * Only add the action to the queue without execution
     * @param {*} action 
     */
    public add(action) {
        this.queue.push(action);
        this.refreshCompass();
    }

    public dequeue() {
        try {
            if (!this.canceled) {
                this.refreshMapPoints();
                let actionInfo = this.getNextInCurrentMap();
                if (actionInfo) {
                    this.currentAction = actionInfo;
                    this.inProgress = true;
                    let delay = 0
                    if (actionInfo.delay) {
                        delay = actionInfo.delay
                    }
                    let action = this.currentAction.action;
                    if (!action) action = this.moveManager.getMover.processAction(action.info); //window.mirage.moveManager.getMover().processAction(action.info);
                    setTimeout(() => {
                        action()
                            .then(() => {
                                if (!this.canceled && !this.inPause && this.inProgress) {
                                    this.retryMode = false;
                                    this.dequeue();
                                }
                            })
                            .catch((reason) => {
                                if (!this.canceled && !this.inPause && this.inProgress) {
                                    if (!this.retryMode) {
                                        switch (reason) {
                                            case this.moveManager.failReasons.FOREGROUND_LOCKED:
                                            case this.moveManager.failReasons.NO_MOVE:
                                                this.retryCurrent();
                                                break;
                                            default:
                                                this.failCurrent();
                                                break;
                                        }
                                    } else {
                                        this.failCurrent();
                                    }
                                }
                            });
                    }, delay);
                } else {
                    if (this.isCurrentMoveAction(this.currentAction) && this.moveFollowed()) {
                        this.wGame.gui.chat.logMsg("Vous êtes arrivé à destination.");

                        const map = this.worldMap;
                        if (map.isVisible()) map.close();
                    }
                    this.finishCurrent();
                }
            }
        } catch (ex) {
            console.error(ex);
        }
    }

    public failCurrent() {
        if (this.isCurrentMoveAction(this.currentAction)) {
            this.wGame.gui.chat.logMsg("Impossible de se rendre en " + this.getStrCoords(this.currentAction.info.coords) + " depuis ici.");
        }
        if (this.moveFollowed()) this.pauseDequeue();
        else this.clear();
    }

    public pauseDequeue() {
        if (!this.canceled && !this.inPause) {
            this.retryMode = false;
            if (this.queue.length > 0) {
                this.inPause = true;
                this.wGame.gui.chat.logMsg("Mise en pause du trajet.");
                this.moveManager.getMover.onMapChange(60000)
                    .then(() => {
                        if (!this.canceled) {
                            let next = this.getNextInCurrentMap();
                            if (next) {
                                this.queue.unshift(next);
                                this.wGame.gui.chat.logMsg("Reprise du trajet.");
                                this.inPause = false;
                                this.dequeue();
                            } else {
                                this.clear();
                                this.wGame.gui.chat.logMsg("Trajet interrompu.");
                            }
                        }
                    })
                    .catch(() => {
                        if (!this.canceled) {
                            this.clear();
                            this.wGame.gui.chat.logMsg("Trajet interrompu.");
                        }
                    });
            } else {
                this.clear();
                if (this.isCurrentMoveAction(this.currentAction)) {
                    this.wGame.gui.chat.logMsg("Trajet terminé.");
                }
            }
        }
    }

    setCanceled() {
        this.canceled = true;
    }

    public getNextInCurrentMap() {
        let next = undefined;
        do {
            next = this.goToNextAction();
        }
        while (next && !this.isDestinationMap(next));
        //console.log('next:')
        //console.log(next)
        return next;
    }

    public isDestinationMap(action) {
        let ret = action != null && action != undefined;
        if (ret && action.info.skipMapCheck) {
          this.initMapDefault(action);
          return true;
        }
        if (ret && action.info.mapId && action.info.mapId !== this.wGame.isoEngine.mapRenderer.mapId) ret = false;
        if (ret && !action.info.mapId && action.info.coords) {
          let mover = this.moveManager.getMover;
          let origCoords = action.info.dir ? mover.getInitialCoords(action.info.coords, action.info.dir) : action.info.coords;
          let mapInfo = this.wGame.gui.playerData.position;
          ret = origCoords.posX == mapInfo.coordinates.posX && origCoords.posY == mapInfo.coordinates.posY;
        }
        return ret;
    }

    public initMapDefault(action) {
        const pos = this.wGame.gui.playerData.position;
        action.info.mapId = pos.mapId;
        action.info.coords = {
            posX: pos.coordinates.posX,
            posY: pos.coordinates.posY
        };
    }

    public retryCurrent() {
        console.log("Retry the current action");
        this.retryMode = true;
        this.queue.unshift(this.currentAction);
        this.refreshCompass();
        this.dequeue();
      }

    get worldMap() {
        return this.api.getwindowSing.getWindow('worldMap');
    }

    public getStrCoords(coords) {
        return "[" + coords.posX + "," + coords.posY + "]";
    }

    public isCurrentMoveAction(action) {
        if (action != null) {
            return action.info.actionType == 'dir' || action.info.actionType == 'sun' || action.info.actionType == 'map';
        } else {
            return false
        }
    }

    public finishCurrent() {
        this.inPause = false;
        setTimeout(() => {
            this.canceled = false
        }, 1000);
        this.retryMode = false;
        this.inProgress = false;
        this.currentAction = null;
        this.refreshCompass();
    }

    public clear() {
        //console.log('queue clear')
        this.queue = [];
        this.finishCurrent();
    }

    public removeLast() {
        this.queue.pop();
        this.refreshCompass();
    }

    public getLatestAction() {
        let latest = this.queue.slice().pop();
        if (!latest) latest = this.currentAction;
        return latest;
    }

    public goToNextAction() {
        let next = this.queue.shift();
        return next;
    }

    public moveFollowed() {
        return this.moveManager.moveStackAdjust == 8641901;
    }

    public getVisibleActions() {
        let actions = this.queue.slice();
        if (this.currentAction) actions.unshift(this.currentAction);
        actions = actions.filter((c) => this.VISIBLE_ACTIONS_TYPE.includes(c.info.actionType));
        return actions;
    }

    public refreshCompass() {
        if (!this.canceled && this.moveFollowed()) {
          let dest = this.getVisibleActions().pop();
          if (dest && dest.info.coords) {
            //Add or move point on card
            this.wGame.gui.GPS._updatePOI({
              id: 'elyMoveDest',
              x: dest.info.coords.posX,
              y: dest.info.coords.posY,
              categoryId: 'elyAutoPilote',
              nameId: "Destination de trajet",
              color: { r: 0, g: 0, b: 0, a:1},
              mapId: dest.info.worldmapId,
              iconId:'icon_410',
              isDestination: true
            });
          }
          else {
            //Remove point on map
            this.wGame.gui.GPS.removePOI("elyMoveDest", this.wGame.gui.playerData.position.worldmapId);
          }
          //Redraw path
          this.refreshMapPoints();

          //Refresh map and compass
          this.wGame.gui.compass.renderAllMarkers();
        }
      }

    public refreshMapPoints() {
        if (this.moveFollowed()) {
          //Remove old points
          this.mapPoints.forEach((poi) => {
            this.wGame.gui.GPS.removePOI(poi.id, poi.worldmapId);
          });
          this.mapPoints = [];

          //Create new points
          let newPoints = this.getVisibleActions();
          newPoints.pop();
          let max = newPoints.length;
          let i = 0;
          newPoints.forEach((action) => {
            i++;
            let poi = {
                id: '',
                isAction: false,
              num: i,
              posX: action.info.coords.posX,
              posY: action.info.coords.posY,
              worldmapId: action.info.worldmapId,
            };
            poi.id = "elyMovePoint_" + poi.posX + "_" + poi.posY + "_" + poi.num;
            poi.isAction = !this.isCurrentMoveAction(action);
            let lbl = "Etape du trajet (" + poi.num + "/" + max + ")";
            let icon = poi.isAction ? "icon_420" : "icon_440";
            if (poi.isAction) lbl += " : Action";
            this.wGame.gui.GPS._updatePOI({
              id: poi.id,
              x: poi.posX,
              y: poi.posY,
              categoryId: 'elyAutoPilote',
              nameId: lbl,
              color: { r: 0, g: 0, b: 0, a:1},
              iconId: icon,
              mapId: poi.worldmapId,
              isDestination: false
            });
            this.mapPoints.push(poi);
          });
        }
      }

    public reset() {
        super.reset()
        this.checkSiMort = true
        Logger.info(' - ActionQueue deactiver')
    }
}