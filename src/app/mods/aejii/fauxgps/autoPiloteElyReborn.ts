/* eslint-disable @typescript-eslint/no-var-requires */
import { Mod } from "../../mod"

import {SettingsService} from "@services/settings.service"
import { TranslateService } from "@ngx-translate/core"
import { API } from "../.."
import { FauxGPSBase } from "./fauxGpsBase"
import { SimplePathMapFinder } from "./SimplePathMapFinder"

//import { PF } from "./pathfindinglib";
const PF = require('./pathfindinglib')


export class AutoPiloteElyReborn extends Mod{

    //public api: API
    public checkSiMort:boolean


    public Debug
    private initialized
    private menuInitialized

    public fauxGpsBase:FauxGPSBase
    private windowManager

    public api:API

    public pathManager
    public latestDelayRequest
    public evMenuOpen
    public btnGoTo
    public btnRemove
    public btnCancel
    public evWorldMapInit
    public stdCenterToMyPosition

    startMod(): void {
        //this.api = api
        this.checkSiMort = false
        Logger.info("- autopilote active");
    }

    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api= api
        this.Debug = true
        this.initialized = false
        this.menuInitialized = false
        this.windowManager = this.api.getwindowSing
        this.fauxGpsBase = new FauxGPSBase(wGame,settings,translate, api)
        this.loadPathManager();
        this.init();
    }

    //ok
    public init() {
      if (!this.initialized && this.fauxGpsBase.moveManager) {
        this.fauxGpsBase.moveManager.moveStackAdjust = 8641901
  
        setTimeout(() => {
          try {
            this.initAfterConnect();
          } catch (ex) {
            console.error(ex);
          }
        }, 1000);
        
        this.initialized = true;
        this.log("Enabled");
      }
    }

    //ok
    public initAfterConnect() {
      if (!this.menuInitialized && this.initialized && this.contextualMapMenu) {
        this.injectCode();
  
        let contextParam = null;
        let coords = {};
        let menu = this.contextualMapMenu;
  
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

    //ok
    public injectCode() {
      //ajout de "commande" supprimer

      const worldMap = this.worldMapWin;
      this.evWorldMapInit = () => {
        if (!this.stdCenterToMyPosition && worldMap._worldMap) {
          this.stdCenterToMyPosition = worldMap._worldMap.centerToMyPosition.bind(worldMap._worldMap);
          worldMap._worldMap.centerToMyPosition = () => {
            if (this.fauxGpsBase.actionQueue.inProgress && this.fauxGpsBase.actionQueue.queue.length > 0) return;
            this.stdCenterToMyPosition();
          }
        }
      }
      worldMap.once('open', this.evWorldMapInit);
    }

    public initContextualMenu() {
        
    }

    //ok
    public isLatestActionPos(coords) {
        let ret = false;
        let latestAction = this.fauxGpsBase.actionQueue.getLatestAction();
        if (latestAction && this.actionMatch(latestAction, coords)) {
        ret = true;
        }
        return ret;
    }

    //ok
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

    //ok
    public addPointToPath(coords, openMap = true) {
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
      if (openMap) this.centerMapToPoint(coords);
    }

    //ok
    public centerMapToPoint(coords) {
      const miniMap = this.miniMapModule;
      if (!miniMap || this.windowManager.getWindow('worldMap').isVisible()) this.windowManager.open('worldMap', { x: coords.posX,y: coords.posY });
  
      if (miniMap) {
        //if (miniMap.menuDrawer.isMapLocked) miniMap.menuDrawer.lockBtn.tap();
        //miniMap.menuDrawer.worldMap.centerToPosition(coords);
        //this.delayCenterToPositionMiniMap();
      }
    }

    //ok "mod swi map dans la barre a droite"
    public delayCenterToPositionMiniMap() {
      /*this.latestDelayRequest = new Date();
      const curTime = this.latestDelayRequest;
      setTimeout(() => {
        if (this.latestDelayRequest == curTime) {
          const miniMap = this.miniMapModule;
          if (miniMap) {
            if (!miniMap.menuDrawer.isMapLocked) miniMap.menuDrawer.lockBtn.tap();
            miniMap.menuDrawer.worldMap.centerToMyPosition();
          }
        }
      }, 3000);*/
    }

    //ok "integration mod swi"
    get miniMapModule() {
      return false//mirage?.modules.find((m) => m.ID == "SwiToolWorldMapInControls");
    }

    //ok
    public cancelPath() {
        if (this.fauxGpsBase && this.fauxGpsBase.actionQueue.inProgress) {
          //Cancel current move
          if (this.wGame.isoEngine.actorManager.userActor.moving) {
            this.wGame.isoEngine.actorManager.userActor.cancelMovement(() => {
                this.fauxGpsBase.actionQueue.clear();
                this.fauxGpsBase.actionQueue.setCanceled();
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

    //ok
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
            this.centerMapToPoint(coords);
          }
    }

    //ok
    public actionMatch(action, coords) {
        let currenWorlmapId = this.wGame.gui.playerData.position.worldmapId;
        return action.info.coords.posX == coords.posX && action.info.coords.posY == coords.posY && action.info.worldmapId == currenWorlmapId;
    }
    
    //ok
    get contextualMapMenu() {
        return this.api.mover.finder.getSingletonObjectWithKey('getContextMenu')[0].getContextMenu('map')
        //return window?.mirage?.findSingleton('getContextMenu')?.getContextMenu('map');
    }

    get worldMapWin() {
      return this.windowManager.getWindow('worldMap');
    }
    //ok
    public getMoverManager() {
        return this.fauxGpsBase.moveManager;
    }
    
    //ok
    public log(msg, force = false) {
        if (force || this.Debug) {
          console.log(msg);
        }
    }

    //ok
    public loadPathManager() {
        try {
          this.initPathManager();
        } catch (ex) {
          console.error(ex);
        }
    }

    public removeContextMenu() {
        
    }

    public clearAfterConnect() {
      if (this.menuInitialized) {
        this.menuInitialized = false;
        this.contextualMapMenu.removeListener('open', this.evMenuOpen);
        if(this.btnGoTo)
          this.btnGoTo._removeDom();
        if(this.btnRemove)
          this.btnRemove._removeDom();
        if(this.btnCancel)
          this.btnCancel._removeDom();
        delete this.btnGoTo;
        delete this.btnRemove;
        delete this.btnCancel;
  
        const worldMap = this.worldMapWin;
        if (this.evWorldMapInit && worldMap) worldMap.removeListener('open', this.evWorldMapInit);
  
      }
    }

    //ok
    public reset() {
        super.reset()
        this.checkSiMort = true
        Logger.info(' - autopilote deactiver')
        
        this.clearAfterConnect();
        if (this.getMoverManager().moveStackAdjust)
          this.getMoverManager().moveStackAdjust = 0;

        this.initialized = false;
        this.log("Disabled");
    }

    //ok mais pas besoin
    //getPathManager() {
    //  return this.pathManager
    //}

    //ok?
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