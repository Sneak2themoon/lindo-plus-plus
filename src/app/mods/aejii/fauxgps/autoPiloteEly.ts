//OLDDDDDDDDDDDDDDDDDDD
/* eslint-disable @typescript-eslint/no-implied-eval */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-for-in-array */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable no-fallthrough */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-var */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/member-ordering */

import { Mod } from "../../mod"

//import {API} from "./api"

import * as util from 'util'
import { inspect } from 'util'
import { TranslateService } from "@ngx-translate/core"
import { API } from "../.."
import { FauxGPSBase } from "./fauxGpsBase"
import { SimplePathMapFinder } from "./SimplePathMapFinder"

import { PF } from "./pathfindinglib";//const PF = require('./pathfindinglib')

export class AutoPiloteEly extends Mod{

    //public api: API
    public checkSiMort:boolean

    public evConnect
    public evDisconnect
    public menuInitialized
    public evMenuOpen
    public btnGoTo
    public btnRemove
    public btnCancel

    public initialized
    public Debug

    public fauxGpsBase:FauxGPSBase
    private windowManager

    public api:API

    public pathManager

    startMod(): void {
        //this.api = api
        this.checkSiMort = false
        //Logger.info("- autopilote active");
    }

    constructor(wGame: any,settings,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api= api
        this.Debug = true
        this.windowManager = this.api.getwindowSing
        this.fauxGpsBase = new FauxGPSBase(wGame,settings,translate, api)
        this.loadPathManager();
        this.init();
        setTimeout(() => {
            try {
              this.initContextualMenu();
            } catch (ex) {
              console.error(ex);
            }
        }, 3000);
        this.evConnect = () => { 
            setTimeout(() => {
              try {
                this.initContextualMenu();
              } catch (ex) {
                console.error(ex);
              }
            }, 1000);
        };
        this.evDisconnect = () => { 
            this.removeContextMenu();
            this.menuInitialized = false;
        };
      
        this.on(this.wGame.gui, 'connected', this.evConnect)
        this.on(this.wGame.gui, 'disconnect', this.evDisconnect)
    }

    public init() {
        if (!this.initialized && this.getMoverManager()) {
          this.fauxGpsBase.moveManager.moveStackAdjust = 8641901
    
          /*this.createOtherKey("CancelAction"    , "Annuler le dernier mouvement"   , "CTRL+DELETE", () => {
            if (this.fauxGpsBase.actionQueue) {
              if (this.fauxGpsBase.actionQueue.queue.length == 0 && this.fauxGpsBase.actionQueue.inProgress) {
                //Cancel current move
                if (window.isoEngine.actorManager.userActor.moving) {
                  window.isoEngine.actorManager.userActor.cancelMovement(() => {
                    this.fauxGpsBase.actionQueue.clear();
                    this.fauxGpsBase.initQueue();
                    this.log("Current move canceled");
                  });
                }
              }
              else {
                //Remove latest in the queue
                this.fauxGpsBase.actionQueue.removeLast(); 
                this.log("Latest move canceled");
              }
            }
          });*/
          
          this.initialized = true;
          this.log("Enabled");
        }
    }

    public initContextualMenu() {
        if (!this.menuInitialized && this.initialized && this.getContextualMapMenu()) {
          let contextParam = null;
          let coords = {};
          let menu = this.getContextualMapMenu();
    
          let evAPBtnGoToTap = () => {
            this.addPointToPath(coords);
          };
          let evAPBtnRemoveTap = () => {
            this.removePathFromPoint(coords);
          };
          let evAPBtnCancelTap = () => {
            this.cancelPath();
          };
    
          this.evMenuOpen = (params) => {
            contextParam = params;
            coords = { posX: contextParam.i, posY: contextParam.j };
            //Create btn is not yet exist
            if (!this.btnGoTo) {
              this.btnGoTo = menu._addEntry("Se rendre ici", evAPBtnGoToTap);
              this.btnRemove = menu._addEntry("Stopper le trajet ici", evAPBtnRemoveTap);
              this.btnCancel = menu._addEntry("Annuler le trajet", evAPBtnCancelTap);
              let separator = menu.entryList.rootElement.querySelectorAll('.separator')[1];
        
              menu.entryList.rootElement.insertBefore(this.btnGoTo.rootElement, separator);
              menu.entryList.rootElement.insertBefore(this.btnRemove.rootElement, separator);
              menu.entryList.rootElement.insertBefore(this.btnCancel.rootElement, separator);
            }
            this.btnGoTo.hide();
            this.btnRemove.hide();
            this.btnCancel.hide();
            if (this.isAutoPilotePOI(params)) {
              if (this.isLatestActionPos(coords)) {
                this.btnCancel.show();
              } else {
                this.btnRemove.show();
              }
            }
            else {
              this.btnGoTo.show();
            }
          };
          menu.on('open', this.evMenuOpen);
    
          this.menuInitialized = true;
        }
    }

    public isLatestActionPos(coords) {
        let ret = false;
        let latestAction = this.fauxGpsBase.actionQueue.getLatestAction();
        if (latestAction && this.actionMatch(latestAction, coords)) {
        ret = true;
        }
        return ret;
    }

    public isAutoPilotePOI(params) {
        let icons = params.icons;
        let ret = false;
        if (icons) {
          for (let i = 0, len = icons.length; i < len; i += 1) {
            let icon = icons[i];
            if (icon.categoryId === 'elyAutoPilote') {
              ret = true;
              break;
            }
          }
        }
        return ret;
    }

    public addPointToPath(coords) {
      let latestAction = this.fauxGpsBase.actionQueue.getLatestAction();
      let source
      if(latestAction == null){
        source = null
      }else{
        source = latestAction.info.coords;
      }
       
      if (!source) source = this.fauxGpsBase.getCurrentCoords();
      this.log("New path from : " + this.fauxGpsBase.getStrCoords(source) + " to " + this.fauxGpsBase.getStrCoords(coords));
      let calculatedPath = this.pathManager.getPathMapFinder.getPath(source, coords);
      let queue = this.fauxGpsBase.actionQueue.queue;
      calculatedPath.forEach((a) => {
          queue.push(a);
      });
      if (queue.length > 0) {
          this.fauxGpsBase.actionQueue.refreshCompass();
          if (!this.fauxGpsBase.actionQueue.inProgress) {
              this.fauxGpsBase.actionQueue.dequeue();
          }
      }
    }

    public cancelPath() {
        if (this.fauxGpsBase && this.fauxGpsBase.actionQueue.inProgress) {
          //Cancel current move
          if (this.wGame.isoEngine.actorManager.userActor.moving) {
            this.wGame.isoEngine.actorManager.userActor.cancelMovement(() => {
                this.fauxGpsBase.actionQueue.clear();
                this.fauxGpsBase.initQueue();
                this.log("Current move canceled");
            });
          }
          else {
            this.fauxGpsBase.actionQueue.clear();
            this.fauxGpsBase.initQueue();
            this.log("Current move canceled");
          }
        }
    }

    public removePathFromPoint(coords) {
          let queue = this.fauxGpsBase.actionQueue.queue;
          let exist = queue.filter((a) => this.actionMatch(a, coords))[0];
          if (this.fauxGpsBase.actionQueue.inProgress && this.actionMatch(this.fauxGpsBase.actionQueue.currentAction, coords)) {
            //Cancel current move
            if (this.wGame.isoEngine.actorManager.userActor.moving) {
              this.wGame.isoEngine.actorManager.userActor.cancelMovement(() => {
                this.fauxGpsBase.actionQueue.clear();
                this.fauxGpsBase.initQueue();
                this.log("Current move canceled");
              });
            }
          } else if (exist) {
            this.log("Remove path from point : " + this.fauxGpsBase.getStrCoords(coords));
            let firstIdx = queue.indexOf(exist) + 1;
            if (firstIdx >= 0) {
              queue.splice(firstIdx);
            }
            this.fauxGpsBase.actionQueue.refreshCompass();
          }
    }

    public actionMatch(action, coords) {
        let currenWorlmapId = this.wGame.gui.playerData.position.worldmapId;
        return action.info.coords.posX == coords.posX && action.info.coords.posY == coords.posY && action.info.worldmapId == currenWorlmapId;
    }
    
    public getContextualMapMenu() {
        //TODO   test
        return this.api.mover.finder.getSingletonObjectWithKey('getContextMenu').getContextMenu('map')
        //return window?.mirage?.findSingleton('getContextMenu')?.getContextMenu('map');
    }
       
    public createOtherKey(id, name, defaultShortcut, action) {
        /*this.sMove.setItem(id, name, defaultShortcut);
        let currentShortcut = this.sMove.getShortcut(id);
        this.log("Register '" + name + "' with " + currentShortcut);
        this.shortcuts.bind(currentShortcut, action);*/
    }
    
    public getMoverManager() {
        return this.fauxGpsBase.moveManager;
    }
     
    public log(msg, force = false) {
        if (force || this.Debug) {
          console.log(msg);
        }
    }

    public loadPathManager() {
        try {
          this.initPathManager();
        } catch (ex) {
          console.error(ex);
        }
    }

    public removeContextMenu() {
        this.getContextualMapMenu().removeListener('open', this.evMenuOpen);
        this.btnGoTo = null;
        this.btnRemove = null;
        this.btnCancel = null;
    }

    public reset() {
        super.reset()
        this.checkSiMort = true
        //Logger.info(' - autopilote deactiver')
        this.removeContextMenu();
        this.menuInitialized = false;
        this.initialized = false;
        if (this.getMoverManager().moveStackAdjust) {
            this.getMoverManager().moveStackAdjust = 0;
        }
    }

    public initPathManager() {
        this.pathManager = {};
        if (!this.pathManager.libraryLoaded) {


          this.pathManager.libraryLoaded = true;
        }
        this.pathManager.getPathMapFinder = new SimplePathMapFinder(this.wGame, this.settings, this.translate, this.fauxGpsBase.moveManager, PF)
        /*() => {
          return new class SimplePathMapFinder {
            
          }
        }*/
    }
}