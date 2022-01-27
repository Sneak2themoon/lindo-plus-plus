import {
  Mod
} from "../mod"
//import {API} from "./api"

import {
  SettingsService
} from "@services/settings.service"
import {
  TranslateService
} from "@ngx-translate/core"
import {
  API
} from ".."
import {
  FauxGPSBase
} from "./fauxgps/fauxGpsBase"

export class AntiAggro extends Mod {

  private api: API
  public checkSiMort: boolean

  private Debug = true;
  private ShowPath = true;
  private isEnabled = false;

  private MAX_SAFE_AREA = 3;
  private MIN_SAFE_AREA = 0;
  private PATH_COLOR_SAFE = {
    r: 238,
    g: 105,
    b: 0,
    a: 0.5
  };
  private PATH_COLOR_NORMAL = {
    r: 21,
    g: 117,
    b: 19,
    a: 0.5
  };
  private PATH_COLOR_LOCKED = {
    r: 0,
    g: 0,
    b: 0,
    a: 0.5
  };
  private PATH_COLOR_SUBSAFE = {
    r: 0,
    g: 62,
    b: 172,
    a: 0.6
  };
  private AREA_COLOR = {
    r: 250,
    g: 0,
    b: 0,
    a: 0.5
  };
  private MAX_RETRY = 1;
  private AGRO_MOB_IDS

  private initialized
  private agressivCells
  private agressivInfos
  private stdMovePlayerOnMap

  private pathFinder
  private queue
  private moveInProgress
  private skipCancelAction
  private stdCancelMovement
  private stdCancelUserActorMovement
  private stdRoleplayUserActorMovement
  private isMovementWaitingForConfirmation

  public fauxGpsBase: FauxGPSBase

  private evMapMovement
  private evRefresh
  private evNoMove

  startMod(): void {

  }

  constructor(wGame: any, settings: SettingsService, translate: TranslateService, api: API) {
    super(wGame, settings, translate);
    this.api = api
    this.checkSiMort = false
    Logger.info("- AntiAggro active");

    this.fauxGpsBase = new FauxGPSBase(wGame, settings, translate, this.api)
    this.initialized = false;
    this.isEnabled = false;
    this.agressivCells = [];
    this.agressivInfos = [];
    this.pathFinder = this.api.mover.getPath //window.mirage.finder.singleton("getPath");
    this.loadAgroData();
    this.constructTimeout();

    this.initTimeout();
  }

  private initTimeout() {
    setTimeout(() => this.init(), 1000);
  }


  private init() {
    if (!this.initialized && this.canInit()) {

      this.evMapMovement = (msg) => {
        const isFightChange = msg._messageType == 'MapFightCountMessage';
        if (msg.actorId < 0 || isFightChange) {
          const oldAgressivCells = this.agressivCells;
          this.agressivInfos = [];
          if (this.Debug) this.wGame.isoEngine.mapRenderer.deleteCellHighlight("elyArea");
          const lastCell = !isFightChange ? msg.keyMovements[msg.keyMovements.length - 1] : 0;
          const groupeMobs = this.getMobs();
          for (const mobs of groupeMobs) {
            const agroArea = this.getAgressivArea(mobs);
            if (agroArea > 0) {
              const pos = !isFightChange && msg.actorId == mobs.actorId ? this.getXY(lastCell) : this.getXY(mobs.position);
              this.agressivInfos.push({
                cell: msg.actorId == mobs.actorId ? lastCell : mobs.position,
                pos,
                agroArea
              });
            }
          }
          this.agressivCells = this.buildAgressivCells();
          if (this.Debug) this.wGame.isoEngine.mapRenderer.addCellHighlight("elyArea", this.agressivCells, this.AREA_COLOR);
          this.logObj("Map movement logged", this.agressivCells);
          if (this.arrayChanged(this.agressivCells, oldAgressivCells)) this.retryMovement();
        }
      }

      this.evRefresh = () => {
        this.resetMove();
        this.agressivInfos = [];
        if (this.Debug) this.wGame.isoEngine.mapRenderer.deleteCellHighlight("elyArea");
        const groupeMobs = this.getMobs();
        for (const mobs of groupeMobs) {
          const agroArea = this.getAgressivArea(mobs);
          if (agroArea > 0) {
            const pos = this.getXY(mobs.position);
            this.agressivInfos.push({
              cell: mobs.position,
              pos,
              agroArea
            });
          }
        }

        this.agressivCells = this.buildAgressivCells();
        if (this.Debug) this.wGame.isoEngine.mapRenderer.addCellHighlight("elyArea", this.agressivCells, this.AREA_COLOR);
        this.logObj("Map refresh logged", this.agressivCells);
      }

      this.evNoMove = () => {
        if (this.moveInProgress) {
          this.moveInProgress.retryCnt++;
          this.logObj("No mouvement message logged - Retry check", this.moveInProgress);
          if (this.moveInProgress.retryCnt <= this.MAX_RETRY) {
            this.retryMovement(300);
          }
        }
      };

      this.isEnabled = true;
      this.on(this.wGame.dofus.connectionManager, 'GameMapMovementMessage', async (e: any) => {
        //window.dofus.connectionManager.on("GameMapMovementMessage", this.evMapMovement);
        this.evMapMovement(e)
      })

      this.on(this.wGame.dofus.connectionManager, 'MapFightCountMessage', async (e: any) => {
        //window.dofus.connectionManager.on("MapFightCountMessage", this.evMapMovement);
        this.evMapMovement(e)
      })

      this.wGame.isoEngine.mapRenderer.on("ready", this.evRefresh);

      this.on(this.wGame.dofus.connectionManager, 'MapComplementaryInformationsDataMessage', async (e: any) => {
        //window.dofus.connectionManager.on("MapComplementaryInformationsDataMessage", this.evRefresh);
        this.evRefresh()
      })


      this.on(this.wGame.dofus.connectionManager, 'GameFightStartingMessage', async (e: any) => {
        //window.dofus.connectionManager.on("GameFightStartingMessage", this.evRefresh);
        this.evRefresh()
      })


      this.on(this.wGame.dofus.connectionManager, 'GameMapNoMovementMessage', async (e: any) => {
        //window.dofus.connectionManager.on("GameMapNoMovementMessage", this.evNoMove);
        this.evNoMove()
      })


      this.initialized = true;

      if (this.wGame.isoEngine.mapRenderer.isReady) this.evRefresh();
      this.log("Enabled");
    }else{
      Logger.info('init nok')
    }
  }

  private retryMovement(wait = 1500) {
    if (this.moveInProgress) {
      const tmpCurMouvement = this.moveInProgress;
      this.clearCurrentMovement();
      setTimeout(() => {
        this.moveInProgress = tmpCurMouvement;
        this.processMoveInProgress();
      }, wait);
    }
  }

  private processMoveInProgress() {
    const move = this.moveInProgress;
    if (move) {
      this.wGame.isoEngine._movePlayerOnMap(move.requestedDest, move.stopNextToTarget, move.cb);
    }
  }

  private canInit() {
    return this.moverManager != undefined && this.moveModule != undefined;
  }

  private constructTimeout() {
    setTimeout(() => this.injectCode(), 1000);
  }

  private resetMove(clearQueue = true) {
    if (clearQueue) this.wGame.isoEngine.actionQueue.clear();
    if (this.queue != undefined) {
      this.queue.clear();
      this.queue.setCanceled();
      delete this.queue;
    }
    delete this.moveInProgress;
    if (this.ShowPath) this.wGame.isoEngine.mapRenderer.deleteCellHighlight("elyPath");
  }

  private injectCode() {
    const module = this;
    if (!this.stdMovePlayerOnMap) {
      this.stdMovePlayerOnMap = this.wGame.isoEngine._movePlayerOnMap.bind(this.wGame.isoEngine);
      this.wGame.isoEngine._movePlayerOnMap = (...args) => {
        const [cellId, stopNextToTarget, cb] = args;
        // @ts-ignore
        const self = this.wGame.isoEngine;
        if (module.ShowPath) self.mapRenderer.deleteCellHighlight("elyPath");
        if (!module.agressivCells || !module.canProcessNoAgro || module.agressivCells.length == 0) return module.stdMovePlayerOnMap(...args);

        const source = this.wGame.actorManager.userActor.cellId;
        if (source === cellId) {
          module.resetMove(false);
          if (cb && typeof cb == 'function') cb(null, cellId);
          return cellId;
        }

        return module.movePlayerOnMap(...args);
      };
    }

    if (!this.stdCancelMovement) {
      this.stdCancelMovement = this.wGame.isoEngine.actorManager.userActor.cancelMovement.bind(this.wGame.isoEngine.actorManager.userActor);
      this.wGame.isoEngine.actorManager.userActor.cancelMovement = (...args) => {
        if (!module.skipCancelAction && module.moveInProgress) {
          module.clearCurrentMovement(true);
        }
        return module.stdCancelMovement(...args);
      }
    }

    if (!this.stdCancelUserActorMovement) {
      this.stdCancelUserActorMovement = this.wGame.isoEngine.cancelUserActorMovement.bind(this.wGame.isoEngine);
      this.wGame.isoEngine.cancelUserActorMovement = (...args) => {
        if (!module.skipCancelAction && module.moveInProgress) {
          module.log("Reset current movement");
          module.resetMove();
        }
        return module.stdCancelUserActorMovement(...args);
      }
    }

    if (!this.stdRoleplayUserActorMovement) {
      this.stdRoleplayUserActorMovement = this.wGame.isoEngine.roleplayUserActorMovement.bind(this.wGame.isoEngine);
      this.wGame.isoEngine.roleplayUserActorMovement = (keyMovements) => {
        if (!module.canProcessNoAgro) return module.stdRoleplayUserActorMovement(keyMovements);

        if (module.moveInProgress && !module.moveInProgress.attack) {
          if (module.Debug) this.wGame.isoEngine.mapRenderer.addCellHighlight("elyPath", keyMovements, module.PATH_COLOR_SUBSAFE);
          const serverDest = keyMovements[keyMovements.length - 1];
          const firstCell = keyMovements[0];
          module.logObj("Server path answer", {
            keyMovements,
            serverDest,
            requestedDest: module.moveInProgress.allSwitch
          });
          if ((module.moveInProgress.allSwitch && !module.moveInProgress.allSwitch.includes(serverDest)) || module.walkOnAgressivCell(module.moveInProgress.cautionCells, keyMovements)) {

            module.log("Stop the move, the server try to walk on agressive cell, go back to first cell : " + firstCell);
            this.wGame.gui.chat.logMsg("Le serveur nous impose un chemin passant par une zone d'agro. Choisi une autre destination ou attend qu'un groupe bouge pour ne pas te faire agro.");
            module.skipCancelAction = true;

            this.isMovementWaitingForConfirmation = false;
            this.wGame.gui.connectionSplashScreen.onStateChange('CONNECTED');
            this.wGame.gui.emit('checkServerLag', 'roleplayUserActorMovement', 'stop');

            this.wGame.dofus.sendMessage('GameMapMovementCancelMessage', {
              cellId: firstCell
            });

            this.wGame.isoEngine.clearHighlights();
            module.clearCurrentMovement(true);

            const actor = this.wGame.actorManager.userActor;
            actor.setDisposition(firstCell);

            this.wGame.isoEngine.clearPendingMovement();
            this.wGame.isoEngine.isMovementCanceled = true;
            module.skipCancelAction = false;

            //We check if the move have not been changed during cancelation process
            if (module.moveInProgress) {
              if (module.ShowPath) this.wGame.isoEngine.mapRenderer.deleteCellHighlight("elyPath");
              if (module.ShowPath) this.wGame.isoEngine.mapRenderer.addCellHighlight("elyPath", module.moveInProgress.path, module.PATH_COLOR_LOCKED);
              this.wGame.isoEngine.mapRenderer.addMovementFeedback(module.moveInProgress.destination);
            }
            return;
          }
        }

        return module.stdRoleplayUserActorMovement(keyMovements);
      };
    }
  }

  private clearCurrentMovement(skipCancel = false) {
    if(this.queue != undefined)
      if (this.moveInProgress && this.queue.inProgress) {
        if (this.wGame.isoEngine.actorManager.userActor.moving && !skipCancel) {
          this.skipCancelAction = true;
          this.wGame.isoEngine.cancelUserActorMovement(() => {
            this.skipCancelAction = false;
            this.queue.clear();
            this.queue.setCanceled();
            delete this.queue;
            this.wGame.isoEngine.actionQueue.clear();
            this.log("Current move canceled");
          });
        } else {
          this.queue.clear();
          this.queue.setCanceled();
          delete this.queue;
          this.wGame.isoEngine.actionQueue.clear();
          this.log("Current move canceled");
        }
      }
  }

  private getText(id) {
    return this.api.mover.finder.getSingletonObjectWithKey < any > ("getText")[1].getText(id);
    //return mirage?.finder.singleton('getText')?.[1]?.getText(id);
  }

  private convertCellArrayToMap(cellArray) {
    return cellArray.reduce((acc, curr) => {
      acc[curr] = null;
      return acc;
    }, {});
  }

  private getAgressivAreaByCell(cellId) {
    const mobs = this.getMobs().find(g => +g.position == +cellId);
    if (mobs != undefined) {
      if (mobs.mobInfo) return this.getAgressivArea(mobs);
    }
    return 0;
  }

  private getAgressivArea(mobs) {
    let maxArea = 0;
    if (mobs.mobInfo) {
      for (const id of mobs.mobInfo) {
        const area = this.AGRO_MOB_IDS[id];
        if (area && area > maxArea) maxArea = area;
      }
    }
    return maxArea;
  }

  private getMobs() {
    return this.wGame.isoEngine._getAllInteractives().filter(e => e.actorId < 0).filter(e => e.data.staticInfos).map(e => {
      return {
        "actorId": e.actorId,
        "position": e.position,
        "mobInfo": [e.data.staticInfos.mainCreatureLightInfos, ...e.data.staticInfos.underlings].map(e => e.creatureGenericId)
      }
    });
  }

  private getCellId(x, y) {
    if (x + y < 0) return undefined;
    if (x + y > 27) return undefined;
    const result = Math.floor(14.5 * x - 13.5 * y);
    if (result >= 0 && result <= 559) return result
    return undefined;
  }

  private shapeRing(x, y, radiusMin, radiusMax) {
    var range = [];
    if (radiusMin === 0) {
      range.push(this.getCellId(x, y));
    }
    for (var radius = radiusMin || 1; radius <= radiusMax; radius++) {
      for (var i = 0; i < radius; i++) {
        var r = radius - i;
        range.push(this.getCellId(x + i, y - r));
        range.push(this.getCellId(x + r, y + i));
        range.push(this.getCellId(x - i, y + r));
        range.push(this.getCellId(x - r, y - i));
      }
    }
    range = range.filter((e) => {
      if ((e <= 559) && (e >= 0))
        return true;
    });
    return range;
  }

  private shapeSquare(x, y, radiusMin, radiusMax) {
    var range = [];
    if (radiusMin === 0) {
      range.push(this.getCellId(x, y));
    }
    for (var radius = radiusMin || 1; radius <= radiusMax; radius++) {
      // segment middles
      range.push(this.getCellId(x - radius, y));
      range.push(this.getCellId(x + radius, y));
      range.push(this.getCellId(x, y - radius));
      range.push(this.getCellId(x, y + radius));
      // segment corners
      range.push(this.getCellId(x - radius, y - radius));
      range.push(this.getCellId(x - radius, y + radius));
      range.push(this.getCellId(x + radius, y - radius));
      range.push(this.getCellId(x + radius, y + radius));
      // segment remaining
      for (var i = 1; i < radius; i++) {
        range.push(this.getCellId(x + radius, y + i));
        range.push(this.getCellId(x + radius, y - i));
        range.push(this.getCellId(x - radius, y + i));
        range.push(this.getCellId(x - radius, y - i));
        range.push(this.getCellId(x + i, y + radius));
        range.push(this.getCellId(x - i, y + radius));
        range.push(this.getCellId(x + i, y - radius));
        range.push(this.getCellId(x - i, y - radius));
      }
    }
    range = range.filter((e) => {
      if ((e <= 559) && (e >= 0))
        return true;
    });
    return range;
  }

  private getXY(cellid) {
    const i = Math.floor(cellid / 28);
    let order = cellid - i * 28;
    let x = 0,
      y = 0;
    if (order < 14) {
      x = order;
      y = order;
    } else {
      order -= 13;
      x = order;
      y = order - 1;
    }
    x += i;
    y -= i;
    return {
      x,
      y
    };
  }

  private walkOnAgressivCell(blacklist, path) {
    const subPath = [];
    const walkPath = path.slice().splice(1);
    const blockListCells = Array.isArray(blacklist) ?
      blacklist.map(c => +c) :
      Object.keys(blacklist).map(c => +c);
    for (let index = 0; index < walkPath.length; index++) {
      const cell = walkPath[index];
      if (blockListCells.includes(+cell)) {
        return subPath;
      }
      subPath.push(cell);
    }
    return false;
  }

  private buildAgressivCells(secureRing = 0, excludedCells = []) {
    let res = [];
    this.agressivInfos
      .filter(info => !excludedCells.includes(info.cell))
      .forEach(info => {
        const area = info.agroArea + secureRing;
        const ringCells = area == 1 ? this.shapeSquare(info.pos.x, info.pos.y, 0, 1) : this.shapeRing(info.pos.x, info.pos.y, 0, area);
        res = [...res, ...ringCells];
      });
    return res;
  }


  private findSafePath(source, dest, cautionCells, canMoveDiagonally, stopNextToTarget, excludeDest, safeArea) {
    if (!safeArea || safeArea <= this.MIN_SAFE_AREA) safeArea = this.MIN_SAFE_AREA;
    const blacklistCells = this.convertCellArrayToMap(
      this.buildAgressivCells(safeArea, (excludeDest ? [dest] : [])));
    const path = this.pathFinder(source, dest, blacklistCells, canMoveDiagonally, stopNextToTarget);

    if (safeArea > this.MIN_SAFE_AREA && (path.length <= 1 || this.walkOnAgressivCell(blacklistCells, path))) {
      return this.findSafePath(source, dest, cautionCells, canMoveDiagonally, stopNextToTarget, excludeDest, (safeArea - 1));
    }

    return [path, blacklistCells];
  }

  private movePlayerOnMap(...args) {
    let [cellId, stopNextToTarget, cb] = args;

    if (!cb || typeof cb !== 'function') {
      cb = function () {};
    }
    if (this.wGame.gui.playerData.inventory.isOverloaded() && !this.wGame.gui.playerData.isMutant()) {
      this.wGame.gui.chat.logMsg(this.getText('tablet.inventoryFullCannotMove'));
      return;
    }

    this.skipCancelAction = false;

    stopNextToTarget = stopNextToTarget || false;
    const self = this.wGame.isoEngine;
    const userActor = self.actorManager.userActor;
    const source = userActor.cellId;

    const occupiedCells = self.actorManager._occupiedCells;

    const canMoveDiagonally = userActor.canMoveDiagonally;
    const normalPath = this.pathFinder(source, cellId, occupiedCells, canMoveDiagonally, stopNextToTarget);
    let destination = normalPath[normalPath.length - 1];
    let safeDest = stopNextToTarget ? destination : cellId;

    const cautionCells = this.convertCellArrayToMap(this.agressivCells);

    //If the destination cell is a mob, then disable the agressiv shield on the destination
    const destCellArea = this.getAgressivAreaByCell(safeDest);
    if (destCellArea > 0) {
      const pos = this.getXY(safeDest);
      const ringCells = destCellArea == 1 ? this.shapeSquare(pos.x, pos.y, 0, 1) : this.shapeRing(pos.x, pos.y, 0, destCellArea);
      [...ringCells, safeDest].forEach(e => {
        delete cautionCells[e];
      });
    }

    const [path, blacklistCells] = this.findSafePath(source, safeDest, cautionCells, canMoveDiagonally, false, destCellArea > 0, this.MAX_SAFE_AREA);
    destination = path[path.length - 1];
    const moveId = new Date();

    let retryCnt = 0
    if (this.moveInProgress != undefined)
      if (this.moveInProgress.retryCnt == null) {
        retryCnt = 0
      } else {
        retryCnt = this.moveInProgress.retryCnt
      }
    const mapId = this.wGame.gui.playerData.position.mapId;
    this.moveInProgress = {
      mapId,
      moveId,
      destination,
      requestedDest: cellId,
      stopNextToTarget,
      cb,
      cautionCells,
      blacklistCells,
      path,
      attack: destCellArea > 0,
      retryCnt
    };

    const callBack = (error, target) => {
      this.logObj("End custom mouvement", {
        move: this.moveInProgress,
        param: {
          error,
          target
        }
      });
      const endAction = this.moveInProgress.cb;
      if (!error && this.moveInProgress && this.moveInProgress.moveId == moveId) {
        this.resetMove(false);
      }
      return endAction(error, target);
    }
    args[2] = callBack;

    //If we walk on a agressiv cell, then we wait map movement or an user action
    if (this.walkOnAgressivCell(blacklistCells, path)) {
      this.wGame.gui.chat.logMsg("En attente du mouvement d'un monstre pour se déplacer ici sans se faire agresser.");
      self.clearHighlights();
      self.actionQueue.clear();
      if (this.ShowPath) self.mapRenderer.addCellHighlight("elyPath", path, this.PATH_COLOR_LOCKED);
      self.mapRenderer.addMovementFeedback(destination);
      return;
    }

    this.queue = this.moverManager.createActionQueue;
    this.queue.moveFollowed = () => false;

    let allSwitch = this.getAllSwitch(path);
    const map = self.mapRenderer.map;

    if (allSwitch.length <= 1 || !this.arrayChanged(path, normalPath)) {
      if (this.ShowPath) self.mapRenderer.addCellHighlight("elyPath", path, this.PATH_COLOR_NORMAL);
      return this.stdMovePlayerOnMap(...args);
    }

    this.logObj("Go custom cell with safe path " + cellId, allSwitch);
    allSwitch = this.normalizeSwitchs(allSwitch, path, blacklistCells, occupiedCells, canMoveDiagonally);
    const nb = allSwitch.length;

    this.moveInProgress.allSwitch = allSwitch;

    for (let i = 0; i < nb; i++) {
      const delay = this.getRandomInt(0, 100);
      const latest = (i + 1) == nb;
      const parmTarget = stopNextToTarget && latest;
      const cell = allSwitch[i];
      const info = {
        coords: this.moveModule.getCurrentCoords(),
        mapId: map.id,
        worldmapId: this.wGame.gui.playerData.position.worldmapId,
        cellId: cell,
        randomMove: false,
        actionType: 'cell',
        neighbourCell: false
      }
      const action = latest ? this.createAction(cell, parmTarget, callBack) : this.createAction(cell, parmTarget);
      this.queue.enqueue({
        info,
        delay,
        action
      });
    }
    this.logObj("Moves queued :" + this.queue.queue.length, this.queue);

    return destination;
  }

  private createAction(cellId, stopNextToTarget, cb = null) {
    const action = () => {
      return new Promise((success, fail) => {
        this.moveToCellAction(cellId, stopNextToTarget)
          .then(([error, target]) => {
            if (cb) cb(error, target);
            //TODO fix erreur
            // @ts-ignore
            success(error, target);
          })
          .catch((reason) => {
            if (cb) cb(reason);
            fail(reason);
          });
      });
    };
    return action;
  }

  private moveToCellAction(cellId, stopNextToTarget = false) {
    return new Promise((success, fail) => {
      let moveSuccess = false;
      let checkMovement = () => {
        if (this.wGame.isoEngine.actorManager.userActor.moving) {
          setTimeout(checkMovement, 1000);
        } else if (!moveSuccess) fail(this.fauxGpsBase.moveManager.failReasons.ACTION_TIMEOUT);
      };
      setTimeout(checkMovement, 3000);
      let move = () => {
        this.stdMovePlayerOnMap(cellId, stopNextToTarget, (error, target) => {
          moveSuccess = true;
          if (!error) success([error, target]);
          else fail(error);
        });
      };
      if (this.wGame.isoEngine.actorManager.userActor.moving) this.wGame.isoEngine.cancelUserActorMovement(move);
      else move();
    });
  }

  get moveModule() {
    return this.fauxGpsBase
    //return window?.mirage?.modules.find((m) => m.ID == "ElyMoverBase");
  }

  private getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private normalizeSwitchs(switchs, origPath, cautionCells, occupiedCells, canMoveDiagonally) {
    this.logObj("Path before normalize", switchs.slice(0));
    const normalizedSwitchs = [];
    if (switchs.length > 0) {
      const lng = switchs.length;
      let oldSafePath = undefined;

      for (let index = 0; index < lng; index++) {
        const source = normalizedSwitchs.length == 0 ? origPath[0] : normalizedSwitchs[normalizedSwitchs.length - 1];
        const dest = switchs[index];

        const normalPath = this.pathFinder(source, dest, occupiedCells, canMoveDiagonally, false);
        if (!this.walkOnAgressivCell(cautionCells, normalPath)) oldSafePath = normalPath;
        else {
          if (!oldSafePath) {
            const optiPath = origPath.slice(origPath.indexOf(source), origPath.indexOf(dest) + 1);
            if (this.ShowPath) this.wGame.isoEngine.mapRenderer.addCellHighlight("elyPath", (source == origPath[0] ? optiPath : optiPath.slice(1)), this.PATH_COLOR_SAFE);
            normalizedSwitchs.push(dest);
          } else {
            if (this.ShowPath) this.wGame.isoEngine.mapRenderer.addCellHighlight("elyPath", (source == origPath[0] ? oldSafePath : oldSafePath.slice(1)), this.PATH_COLOR_NORMAL);
            const subDest = oldSafePath[oldSafePath.length - 1];
            normalizedSwitchs.push(subDest);

            const optiPath = origPath.slice(origPath.indexOf(subDest), origPath.indexOf(dest) + 1);
            if (this.ShowPath) this.wGame.isoEngine.mapRenderer.addCellHighlight("elyPath", optiPath.slice(1), this.PATH_COLOR_SAFE);
            normalizedSwitchs.push(dest);

            oldSafePath = undefined;
          }
        }
      }
      if (normalizedSwitchs.length == 0) normalizedSwitchs.push(switchs[0]);

      const lastSource = normalizedSwitchs.length == 0 ? origPath[0] : normalizedSwitchs[normalizedSwitchs.length - 1];
      const lastDest = switchs[lng - 1];
      if (lastSource != lastDest) {
        if (!oldSafePath) {
          const optiPath = origPath.slice(origPath.indexOf(lastSource), origPath.indexOf(lastDest) + 1);
          if (this.ShowPath) this.wGame.isoEngine.mapRenderer.addCellHighlight("elyPath", (lastSource == origPath[0] ? optiPath : optiPath.slice(1)), this.PATH_COLOR_SAFE);
          normalizedSwitchs.push(lastDest);
        } else {
          if (this.ShowPath) this.wGame.isoEngine.mapRenderer.addCellHighlight("elyPath", (lastSource == origPath[0] ? oldSafePath : oldSafePath.slice(1)), this.PATH_COLOR_NORMAL);
          const subDest = oldSafePath[oldSafePath.length - 1];
          normalizedSwitchs.push(subDest);

          const optiPath = origPath.slice(origPath.indexOf(subDest), origPath.indexOf(lastDest) + 1);
          if (this.ShowPath) this.wGame.isoEngine.mapRenderer.addCellHighlight("elyPath", optiPath.slice(1), this.PATH_COLOR_SAFE);
          normalizedSwitchs.push(lastDest);
        }
      }
    }
    this.logObj("Path after normalize", normalizedSwitchs);
    return normalizedSwitchs;
  }

  private arrayChanged(arrayA, arrayB) {
    let ret = false;

    if (!ret && (!arrayA || !arrayB)) ret = true;
    if (!ret && arrayA.length != arrayB.length) ret = true;
    if (!ret) {
      for (let index = 0; index < arrayA.length; index++) {
        if (JSON.stringify(arrayA[index]) != JSON.stringify(arrayB[index])) {
          ret = true;
          break;
        };
      }
    }

    return ret;
  }

  private getAllSwitch(path) {
    if (path.length == 1) {
      return [];
    }
    let buffircationArray = [];
    let i = 0;
    let k = 0;
    while (i < path.length - 1 && k < 50) {
      k++
      const cellAndIndex = this.getFirstCellBeforeDirectionSwitch(path.slice(i));
      i += cellAndIndex[1];
      buffircationArray.push(cellAndIndex[0]);
    }
    return buffircationArray;
  }

  private getFirstCellBeforeDirectionSwitch(cellArray) {
    const xyArray = [];
    for (const cell of cellArray) {
      xyArray.push(this.getXY(cell));
    }
    const dx = xyArray[1].x - xyArray[0].x;
    const dy = xyArray[1].y - xyArray[0].y;
    for (let i = 2; i < xyArray.length; i++) {
      const currentDx = xyArray[i].x - xyArray[i - 1].x;
      const currentDy = xyArray[i].y - xyArray[i - 1].y;
      if ((currentDx != dx) || (currentDy != dy)) {
        return [cellArray[i - 1], i - 1];
      }
    }
    return [cellArray[cellArray.length - 1], cellArray.length - 1];
  }

  private loadAgroData() {
    this.AGRO_MOB_IDS = {
      "44": 1,
      "53": 1,
      "54": 1,
      "64": 1,
      "65": 1,
      "68": 1,
      "72": 1,
      "74": 1,
      "75": 2,
      "76": 2,
      "82": 2,
      "87": 2,
      "88": 2,
      "89": 2,
      "90": 2,
      "91": 2,
      "93": 2,
      "94": 2,
      "95": 2,
      "96": 1,
      "97": 1,
      "99": 1,
      "107": 1,
      "108": 1,
      "110": 1,
      "111": 1,
      "113": 1,
      "118": 1,
      "150": 1,
      "155": 1,
      "157": 1,
      "170": 1,
      "173": 1,
      "179": 1,
      "180": 1,
      "181": 1,
      "182": 1,
      "207": 1,
      "211": 3,
      "212": 3,
      "213": 3,
      "214": 3,
      "216": 3,
      "226": 1,
      "228": 1,
      "229": 1,
      "230": 1,
      "231": 1,
      "249": 1,
      "252": 1,
      "253": 2,
      "254": 2,
      "257": 1,
      "289": 1,
      "290": 3,
      "291": 2,
      "292": 3,
      "378": 1,
      "379": 1,
      "380": 1,
      "396": 1,
      "423": 1,
      "442": 1,
      "446": 1,
      "447": 1,
      "449": 1,
      "450": 1,
      "464": 1,
      "478": 1,
      "479": 5,
      "481": 1,
      "484": 2,
      "485": 2,
      "486": 2,
      "487": 2,
      "488": 1,
      "536": 1,
      "583": 2,
      "584": 2,
      "585": 2,
      "586": 2,
      "587": 2,
      "588": 2,
      "589": 2,
      "590": 2,
      "594": 2,
      "595": 2,
      "596": 2,
      "597": 2,
      "598": 2,
      "600": 2,
      "601": 2,
      "651": 2,
      "670": 1,
      "671": 1,
      "672": 1,
      "673": 1,
      "744": 1,
      "745": 1,
      "746": 1,
      "747": 1,
      "748": 1,
      "749": 1,
      "751": 1,
      "752": 1,
      "753": 1,
      "754": 1,
      "755": 1,
      "756": 1,
      "758": 1,
      "759": 1,
      "760": 1,
      "761": 1,
      "762": 1,
      "763": 1,
      "780": 1,
      "783": 1,
      "784": 1,
      "785": 1,
      "786": 1,
      "789": 1,
      "790": 1,
      "792": 5,
      "796": 2,
      "827": 1,
      "848": 1,
      "853": 1,
      "855": 1,
      "858": 1,
      "862": 1,
      "876": 1,
      "877": 1,
      "878": 1,
      "879": 1,
      "884": 1,
      "885": 1,
      "886": 1,
      "891": 1,
      "892": 1,
      "893": 1,
      "894": 1,
      "895": 1,
      "902": 1,
      "903": 1,
      "904": 1,
      "905": 1,
      "932": 1,
      "935": 1,
      "936": 1,
      "937": 1,
      "938": 1,
      "939": 1,
      "940": 1,
      "941": 1,
      "942": 1,
      "943": 1,
      "1015": 1,
      "1018": 1,
      "1029": 1,
      "1041": 1,
      "1051": 1,
      "1057": 1,
      "1058": 1,
      "1059": 1,
      "1073": 1,
      "1074": 1,
      "1075": 1,
      "1076": 1,
      "1077": 1,
      "1080": 1,
      "1082": 1,
      "1084": 1,
      "1096": 1,
      "1108": 1,
      "1153": 1,
      "1154": 1,
      "1155": 1,
      "1156": 1,
      "1157": 1,
      "1158": 1,
      "1159": 1,
      "2793": 1,
      "2795": 1,
      "2796": 1,
      "2861": 1,
      "2862": 1,
      "2863": 1,
      "2865": 1,
      "2866": 1,
      "2869": 1,
      "2874": 1,
      "2875": 1,
      "2876": 1,
      "2878": 1,
      "2880": 1,
      "2881": 1,
      "2883": 1,
      "2885": 1,
      "2886": 1,
      "2888": 1,
      "2889": 1,
      "2890": 1,
      "2891": 1,
      "2895": 1,
      "2896": 1,
      "2897": 1,
      "2898": 1,
      "2908": 1,
      "2909": 1,
      "2932": 1,
      "2933": 1,
      "2934": 1,
      "2935": 1,
      "2936": 1,
      "2937": 1,
      "2941": 1,
      "2942": 1,
      "2965": 1,
      "2966": 1,
      "2967": 1,
      "3205": 1,
      "3239": 2,
      "3379": 1,
      "3380": 1,
      "3382": 1,
      "3383": 1,
      "3385": 1,
      "3386": 1,
      "3387": 1,
      "3389": 1,
      "3392": 1,
      "3393": 1,
      "3394": 1,
      "3396": 1,
      "3401": 1,
      "3404": 1,
      "3406": 1,
      "3407": 1,
      "3408": 1,
      "3410": 1,
      "3412": 1,
      "3414": 1,
      "3415": 1,
      "3469": 1,
      "3754": 1,
      "3756": 1,
      "3758": 1,
      "3760": 1,
      "3764": 1,
      "3766": 1,
      "3768": 1,
      "3770": 1
    }
    /*fetch("https://elyd0wn.github.io/MirageAdditionalContent/src/data/AgroMobList.json", {cache: "no-cache"})
      .then(response => response.json())
      .then(data => {
        this.AGRO_MOB_IDS = [];
        Object.entries(data).forEach(([id, val]) => this.AGRO_MOB_IDS[id] = val.area);
      });/** */
  }

  get canProcessNoAgro() {
    return this.isEnabled && this.wGame.gui.playerData.isAlive();
  }

  private log(msg) {
    if (this.Debug) {
      //console.log("- " + msg);
    }
  }

  get moverManager() {
    return this.fauxGpsBase.moveManager;
  }

  private logObj(msg, obj) {
    if (this.Debug) {
      //console.log({log: " - " + msg,obj});
    }
  }

  public reset() {
    super.reset()
    this.checkSiMort = true
    Logger.info(' - AntiAggro deactiver')

    this.fauxGpsBase.reset()

    this.resetMove();
    this.isEnabled = false;
    this.agressivCells = [];
    this.agressivInfos = [];
    if (this.Debug) this.wGame.isoEngine.mapRenderer.deleteCellHighlight("elyArea");
    if (this.ShowPath) this.wGame.isoEngine.mapRenderer.deleteCellHighlight("elyPath");

    //this.wGame.isoEngine.mapRenderer.on("ready", this.evRefresh);
    if (this.evRefresh) this.wGame.isoEngine.mapRenderer.removeListener("ready", this.evRefresh);

    this.initialized = false;

    if (this.stdMovePlayerOnMap) {
      this.wGame.isoEngine._movePlayerOnMap = this.stdMovePlayerOnMap;
      delete this.stdMovePlayerOnMap;
    }
    if (this.stdCancelMovement) {
      this.wGame.isoEngine.actorManager.userActor.cancelMovement = this.stdCancelMovement;
      delete this.stdCancelMovement;
    }
    if (!this.stdRoleplayUserActorMovement) {
      this.wGame.isoEngine.roleplayUserActorMovement = this.stdRoleplayUserActorMovement;
      delete this.stdRoleplayUserActorMovement;
    }
    if (this.stdCancelUserActorMovement) {
      this.wGame.isoEngine.cancelUserActorMovement = this.stdCancelUserActorMovement;
      delete this.stdCancelUserActorMovement;
    }
  }
}