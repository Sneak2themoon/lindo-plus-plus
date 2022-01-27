import { Mod } from "../../mod"
import {ShortcutsHelper} from "@helpers/shortcuts.helper"

import * as util from 'util'
import { inspect } from 'util'
import {SettingsService} from "@services/settings.service"
import { TranslateService } from "@ngx-translate/core"
import { API } from "../.."
import { MoverFauxGPS } from "./moverFauxGps"
import { ActionQueue } from "./actionQueueFauxGps"

export class FauxGPSBase extends Mod{

    public initialized
    public actionQueue
    public evClicCanevas
    public evConnect
    public evDisconnect

    public checkSiMort:boolean

    public moveManager
    public mover
    public Debug
    private windowManager

    private api:API

    public shortcutsHelper: ShortcutsHelper

    startMod(): void {
        //this.api = api
        this.checkSiMort = false
        this.Debug = true
        Logger.info("- FauxGPSMoverBase active");
    }

    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api :API){
      super(wGame, settings, translate);
      this.api = api
      this.shortcutsHelper = new ShortcutsHelper(this.wGame);
      this.windowManager = this.api.getwindowSing
      this.loadMoveManager()
      this.initialized = false;
      this.actionQueue = null;

      this.evClicCanevas = (e) => {
        if (this.actionQueue.inProgress && !this.actionQueue.inPause) {
          if (this.moveFollowed()) {
            this.actionQueue.pauseDequeue();
          }
          else {
            //We cancel all actions if the user move manually
            this.log("Clear " + this.getCurrentActionNum() + " actions from queue");
            this.actionQueue.clear();
            this.initQueue();
          }
        }
      }
      this.evConnect = () => {
        this.init();
      }; 
      this.evDisconnect = () => {
        this.removeListeners();
      };

      this.on(this.wGame.gui, 'connected', this.evConnect)
      this.on(this.wGame.gui, 'disconnect', this.evDisconnect)
    }

    public initQueue() {
      this.actionQueue = this.moveManager.createActionQueue
      this.moveManager.createActionQueue.resetInit()
    }

    public init() {
      if (!this.initialized && this.getForeground()) {
  
        
        //Load all shortcut helpers
        this.initQueue();
        this.getForeground().addEventListener('mousedown', this.evClicCanevas);
  
        this.initialized = true;
      }
    }

    public createMoveKey(id, name, defaultShortcut, dir) {
      

      /*this.shortcutsHelper.bind(defaultShortcut, () => {
          if (this.actionQueue) {
            if (!this.moveFollowed()) {
              this.actionQueue.clear();
              this.initQueue();
            }
            this.addNewMovement(dir);
          }
      })*/
    }

    public addNewMovement(dir) {
      let coords = this.mover.getNextCoords(this.getLatestQueueCoords(), dir);
      let info =  {
          actionType: 'dir',
          coords,
          dir,
          worldmapId: this.wGame.gui.playerData.position.worldmapId
      };
      this.log("Stack movement " + dir + " to " + this.getStrCoords(coords));
      let evSucces = () => {
        this.log("Move " + dir + " to " + this.getStrCoords(coords) + " Ok");
      };
      let evFail = (reason) => {
          this.log("Move " + dir + " to " + this.getStrCoords(coords) + " Failed... (" + reason + ")");
      };
      let action = () => {
        return new Promise((success, fail) => {
          this.mover.processAction(info)
          .then(() => {
            evSucces();
            success(1);
          })
          .catch((reason) => {
            evFail(reason);
            fail(reason);
          });
        });
      };
      
      this.actionQueue.enqueue({
        info,
        action
      });
    }

    public getStrCoords(coords) {
      return "[" + coords.posX + "," + coords.posY + "]";
    }
  
    public getLatestQueueCoords() {
      let latestAction = this.actionQueue.getLatestAction();
      if (latestAction.info) {
        return latestAction.info.coords;
      }
      return this.getCurrentCoords();
    }
  
    public getCurrentCoords() {
      var mapInfo = this.wGame.gui.playerData.position;
      let x = parseInt(mapInfo.coordinates.posX), y = parseInt(mapInfo.coordinates.posY);
      return { posX: x, posY: y };
    }

    public loadMoveManager() {
        try {
            if (!this.moveManager || this.Debug) {
              this.initMoveManager();
            }
            this.mover = this.moveManager.getMover;
          } catch (ex) {
            console.error(ex);
          }
    }

    public log(msg) {
      if (this.Debug) {
        console.log(msg);
      }
    }

    public moveFollowed() {
      return this.moveManager.moveStackAdjust == 8641901;
    }

    public initMoveManager() {
      this.moveManager = {};
      this.moveManager.failReasons = {};
      this.moveManager.failReasons.WRONG_DIR = 'The given direction is wrong.';
      this.moveManager.failReasons.NO_CELL_FOUND = 'No Cell Found.';
      this.moveManager.failReasons.IN_FIGHT = 'character in fight';
      this.moveManager.failReasons.NOT_BORDER_CELL = 'The given cellId is not a border cell';
      this.moveManager.failReasons.ACTION_TIMEOUT = 'Move to timeout';
      this.moveManager.failReasons.NO_MOVE = 'No move recorded';
      this.moveManager.failReasons.UNKNOWN_ACTION = 'Unknown follow actionType';
      this.moveManager.failReasons.NOT_CORRECT_MAP = 'Mapid not matching';
      this.moveManager.failReasons.FOREGROUND_LOCKED = 'Foreground locked';
      this.moveManager.failReasons.NO_WAY = "No way, I can't go there";
      
      this.moveManager.getMover = new MoverFauxGPS(this.wGame, this.settings, this.translate, this.moveManager)
      this.moveManager.createActionQueue = new ActionQueue(this.wGame, this.settings, this.translate, this.moveManager, this.api)
    }

    public getCurrentActionNum() {
      return this.actionQueue.queue.length + 1;
    }

    public getForeground() {
      return this.wGame.document.querySelector(".foreground");
    }

    public removeListeners() {
      this.shortcutsHelper.unBindAll()
      this.getForeground().removeEventListener('mousedown', this.evClicCanevas);
      this.initialized = false;
    }

    public reset() {
        super.reset()
        this.removeListeners()
        this.checkSiMort = true
        Logger.info(' - FauxGPS deactiver')
    }
}