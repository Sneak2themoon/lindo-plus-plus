import { Mod } from "../../mod"

import {ShortcutsHelper} from "@helpers/shortcuts.helper"
//import {API} from "./api"

import * as util from 'util'
import { inspect } from 'util'
import {SettingsService} from "@services/settings.service"
import { TranslateService } from "@ngx-translate/core"
import { PathFinderFauxGps } from "./PathFinderFauxGps"

export class MoverFauxGPS extends Mod{

    //public api: API
    public checkSiMort:boolean
    public pathFinder
    public moveManager

    startMod(): void {
        //this.api = api
        this.checkSiMort = false
        Logger.info("- MoverFauxGPS active");
    }

    constructor(wGame: any,settings: SettingsService,translate: TranslateService, moveManager){
        super(wGame, settings, translate);
        this.moveManager = moveManager
        this.pathFinder = new PathFinderFauxGps(this.wGame, this.settings, this.translate)
    }

    private timeoutResolveV2(ms) {
        return new Promise(async (resolve, reject) => {
            setTimeout(() => {
                resolve(1)
                return 1;
            }, ms)
        })
    }

    /**
     * Move to another map just with direction indication 
     * @param {*} direction (top | bottom | left | right)
     */
    public moveToDirection(direction) {
        return new Promise(async (success, fail) => {
            try {
            if (this.wGame.gui.fightManager.fightState < 0) {
                await this.timeoutResolveV2(400)
                let cells = null;
                switch (direction) {
                case "top":
                    cells = this.getTopCells();
                    break;
                case "bottom":
                    cells = this.getBottomCells();
                    break;
                case "left":
                    cells = this.getLeftCells();
                    break;
                case "right":
                    cells = this.getRightCells();
                    break;
                default:
                    fail(this.moveManager.failReasons.WRONG_DIR);
                    return;
                }

                let cell = this.getClosestCellToChangeMapRandomised(cells, direction);

                if (cell == -1) {
                fail(this.moveManager.failReasons.NO_CELL_FOUND);
                return;
                }

                this.moveToMap(cell, false).then(success).catch(fail);
            } else {
                fail(this.moveManager.failReasons.IN_FIGHT);
            }
            } catch (ex) {
            fail(ex.message);
            }
            
        });
    }

    /**
     * Process map change based on a cell in the border
     * @param {*} cellId cell in the border, mandatory to determine the direction
     * @param {*} randomMove true=select a cell randomly
     */
    public moveToMap(cellId, randomMove = true) {
        return new Promise((success, fail) => {
            try {
            let cell = cellId;
            let dir = this.isBorder(cellId);
            if (randomMove) {
                let cells = null;
                switch (dir) {
                case "top":
                    cells = this.getTopCells();
                    break;
                case "bottom":
                    cells = this.getBottomCells();
                    break;
                case "left":
                    cells = this.getLeftCells();
                    break;
                case "right":
                    cells = this.getRightCells();
                    break;
                default:
                    fail(this.moveManager.failReasons.NOT_BORDER_CELL);
                    return;
                }
                cell = this.getClosestCellToChangeMapRandomised(cells, dir);
            }
            let move = () => {
                let scenePos = this.wGame.isoEngine.mapRenderer.getCellSceneCoordinate(cell);
                let pos = this.wGame.isoEngine.mapScene.convertSceneToCanvasCoordinate(scenePos.x, scenePos.y);
                this.wGame.isoEngine.gotoNeighbourMap(dir, cell, Math.floor(pos.x), Math.floor(pos.y));
            };
            this.onMapChange().then(success).catch(fail);
            if (this.wGame.isoEngine.actorManager.userActor.moving) {
                this.wGame.isoEngine.actorManager.userActor.cancelMovement(move);
            }
            else move();
            } catch (ex) {
            fail(ex.message);
            }
        });
    }

    /**
     * Process a move in the current map, commonly not in the border
     * @param {*} cellId target cell
     * @param {*} neighbourCell true= we select a cell around the target cell
     */
    public moveToCell(cellId, neighbourCell = false) {
        return new Promise((success, fail) => {
            let cell = neighbourCell ? this.pickNeighbourCell(cellId) : cellId;
            let moveSuccess = false;
            let checkMovement = () => {
            if (this.wGame.isoEngine.actorManager.userActor.moving) {
                setTimeout(checkMovement, 1000);
            }
            else if (!moveSuccess) fail(this.moveManager.failReasons.ACTION_TIMEOUT);
            };
            setTimeout(checkMovement, 3000);
            let move = () => {
            this.wGame.isoEngine._movePlayerOnMap(cell, false, () => {
                moveSuccess = true;
                success(1);
            });
            };
            if (this.wGame.isoEngine.actorManager.userActor.moving) this.wGame.isoEngine.actorManager.userActor.cancelMovement(move);
            else move();
        });
    }

    /**
     * (same as moveToCell but) Move the player to a specific cell and wait the map change. Used to go to the change map indicator (sun on the map, or door)
     * @param {*} cellId target cell
     */
    public moveToSun(cellId) {
        return new Promise((success, fail) => {
            let cell = cellId;
            let moveSuccess = false;
            let checkMovement = () => {
            if (this.wGame.isoEngine.actorManager.userActor.moving) {
                setTimeout(checkMovement, 300);
            }
            else if (!moveSuccess) fail(this.moveManager.failReasons.ACTION_TIMEOUT);
            };
            setTimeout(checkMovement, 1000);
            let move = () => {
            this.wGame.isoEngine._movePlayerOnMap(cell, false, () => {
                moveSuccess = true;
                this.onMapChange().then(success).catch(fail);
            });
            };
            if (this.wGame.isoEngine.actorManager.userActor.moving) this.wGame.isoEngine.actorManager.userActor.cancelMovement(move);
            else move();
        });
    }

    /**
     * Execute an interaction, commonly called after a move to a door for example
     * @param {*} elemId Element id on the map to interact
     * @param {*} skillInstanceUid The skill used to interact with this element
     */
    public moveToInteraction(elemId, skillInstanceUid) {
        return new Promise((success, fail) => {
            let moveSuccess = false;
            let checkMovement = () => {
            if (this.wGame.isoEngine.actorManager.userActor.moving) {
                setTimeout(checkMovement, 300);
            }
            else if (!moveSuccess) fail(this.moveManager.failReasons.ACTION_TIMEOUT);
            };
            setTimeout(checkMovement, 1000);
            this.wGame.dofus.connectionManager.once('InteractiveUsedMessage', (msg) => {
            if (msg.elemId == elemId && msg.entityId == this.wGame.gui.playerData.id) {
                moveSuccess = true;
                this.onMapChange().then(success).catch(fail);
            }
            });
            this.wGame.isoEngine.useInteractive(elemId, skillInstanceUid);
        });
    }

    /**
     * followInstruction :
     * {
     *      actionType: 'interactive',
     *      mapId: this.wGame.isoEngine.mapRenderer.mapId,
     *      coords {posX, posY}: Map coordonate
     *      elemId: msg.elemId,
     *      skillInstanceUid: skillInstanceUid
     *  }
     *  {
     *      actionType: 'cell', Move the player to a specific cell and not in the border
     *      mapId: this.wGame.isoEngine.mapRenderer.mapId,
     *      coords {posX, posY}: Map coordonate
     *      cellId: cellId
     *      neighbourCell: false
     *  }
     *  {
     *      actionType: 'map',
     *      mapId: this.wGame.isoEngine.mapRenderer.mapId,
     *      coords {posX, posY}: Map dest coordonate
     *      cellId: this.wGame.isoEngine.actorManager.userActor.cellId,
     *      randomMove: true
     *  }
     *  {
     *      actionType: 'dir',
     *      mapId: this.wGame.isoEngine.mapRenderer.mapId, //If undefined, no map check will be done before the action execution
     *      coords {posX, posY}: Map dest coordonate
     *      dir: (top | bottom | left | right)
     *  }
     *  {
     *      actionType: 'sun', //(same as cell but) Move the player to a specific cell and make an action (to enter in a door, go to special map with sun, all change maps without border cell)
     *      mapId: this.wGame.isoEngine.mapRenderer.mapId,
     *      coords {posX, posY}: Map dest coordonate
     *      cellId: this.wGame.isoEngine.actorManager.userActor.cellId
     *  }
     */
    public async processAction(followInstruction) {
        if (this.wGame.gui.fightManager.fightState >= 0) {
            throw new Error(this.moveManager.failReasons.IN_FIGHT);
        }
        //We wait that the previous move is fully finished before checking the mapId to not have a wrong map id
        await this.onForegroundAvailable();
        if (followInstruction.mapId !== undefined && followInstruction.mapId !== this.wGame.isoEngine.mapRenderer.mapId) {
            throw new Error(this.moveManager.failReasons.NOT_CORRECT_MAP);
        }
        else {
            switch (followInstruction.actionType) {
            case 'dir':
                await this.moveToDirection(followInstruction.dir);
                break;
            case 'map':
                await this.moveToMap(followInstruction.cellId, followInstruction.randomMove);
                break;
            case 'cell':
                await this.moveToCell(followInstruction.cellId, followInstruction.neighbourCell);
                break;
            case 'sun':
                await this.moveToSun(followInstruction.cellId);
                break;
            case 'interactive':
                await this.moveToInteraction(followInstruction.elemId, followInstruction.skillInstanceUid);
                break;
            default:
                throw new Error(this.moveManager.failReasons.UNKNOWN_ACTION);
            }
        }
    }

    public getClosestCellToChangeMapRandomised(cells, direc) {
        var occupiedCells = this.wGame.isoEngine.actorManager._occupiedCells;
        var currentCellId = this.wGame.isoEngine.actorManager.userActor.cellId;
        if (occupiedCells == {} || currentCellId === null) {
            return {
            cellId: null,
            direction: null
            }
        }
        var canMoveDiagonally = this.wGame.isoEngine.actorManager.userActor.canMoveDiagonally;

        let tableau = [];

        for (var i = 0; i < cells.length; i++) {
            var cellId = cells[i];
            if (!this.wGame.isoEngine.mapRenderer.getChangeMapFlags(cellId)[direc]) {
            continue;
            }
            if (this.isMobOnCell(cellId) || !this.isCellOnMap(cellId) || !this.isCellWalkable(cellId)) {
            continue;
            }
            this.pathFinder.resetPath();
            this.pathFinder.fillPathGrid(this.wGame.isoEngine.mapRenderer.map);
            var path = this.pathFinder.getPath(currentCellId, cellId, occupiedCells, canMoveDiagonally, false);

            if (path[path.length - 1] == cellId) {
            tableau.push([path, path[path.length - 1]]);
            }
        }
        if (tableau.length == 0) {
            throw new Error(this.moveManager.failReasons.NO_WAY);
        }
        tableau.sort(function (a, b) {
            let aa = a[0].length;
            let bb = b[0].length;
            return (aa - bb);
        })
        if (tableau.length > 5) {
            return tableau[this.getRandomInt(0, 5)][1];
        } else {
            return tableau[this.getRandomInt(0, tableau.length - 1)][1];
        }
    }

    public pickNeighbourCell(cellId) {
        let pickedCell = null;
        let steps = [-15, -1, 13, 28, 14, 1, -14, -28];
        let step = null;
        let occupiedCells = this.getMonsterGroupBossCells();
        do {
            if (pickedCell && step) steps.splice(steps.indexOf(step), 1);
            step = (steps.length > 0) ? steps[this.getRandomInt(0, steps.length - 1)] : null;
            pickedCell = (steps.length > 0) ? cellId + steps[this.getRandomInt(0, steps.length - 1)] : null;
        } while (steps.length > 0 && (!this.wGame.isoEngine.mapRenderer.map.cells[pickedCell] || !this.wGame.isoEngine.mapRenderer.isWalkable(pickedCell) || occupiedCells.indexOf(pickedCell) !== -1))
        return (pickedCell !== null) ? pickedCell : cellId;
    }

    public getMonsterGroupBossCells() {
        let cells = [];
        let actors = this.wGame.isoEngine.actorManager.getIndexedVisibleActors();
        for (var id in actors) {
            if (actors[id].data.type == "GameRolePlayGroupMonsterInformations" && actors[id].groupBoss == null) {
            cells.push(actors[id].cellId);
            }
        }
        return cells;
    }

    public getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public isMobOnCell(cellId) {
        var occupiedCells = this.wGame.isoEngine.actorManager._occupiedCells;
        if (occupiedCells[cellId]) {
            for (var j = 0; j < occupiedCells[cellId].length; j++) {
            if (occupiedCells[cellId][j].actorId < 0) {
                return true;
            }
            }
        }
        return false;
    }

    public isBorder(cellId) {
        if (1 <= cellId && cellId <= 13 ||
            15 <= cellId && cellId <= 26) {
            return "top";
        }

        if (547 <= cellId && cellId <= 559 ||
            533 <= cellId && cellId <= 545) {
            return "bottom";
        }

        if (cellId % 28 == 0 ||
            cellId % 28 == 14) {
            return "left";
        }
        if (cellId % 28 == 27 ||
            cellId % 28 == 13) {
            return "right"
        }

        return false;
    }

    public onMapChange(timeout = 15000) {
        return new Promise((success, fail) => {
            let previousMap = this.wGame.isoEngine.mapRenderer.mapId;
            let changeTimeout = null;
            let onChange = (e) => {
            this.wGame.dofus.connectionManager.removeListener("MapComplementaryInformationsWithCoordsMessage", onChange);
            this.wGame.dofus.connectionManager.removeListener("MapComplementaryInformationsDataMessage", onChange);
            clearTimeout(changeTimeout);
            let maxLoop = 16;
            let changeMapRetry = () => {
                if (maxLoop <= 0) {
                fail(this.moveManager.failReasons.NO_MOVE);
                return;
                }
                maxLoop--;
                if (this.wGame.isoEngine.actorManager.getActor(this.wGame.isoEngine.actorManager.userId).moving || previousMap == this.wGame.isoEngine.mapRenderer.mapId) {
                setTimeout(changeMapRetry, 300);
                }
                else {
                setTimeout(success, 300);
                }
            }
            setTimeout(changeMapRetry, 1200);
            };
            changeTimeout = setTimeout(() => {
            this.wGame.dofus.connectionManager.removeListener("MapComplementaryInformationsWithCoordsMessage", onChange);
            this.wGame.dofus.connectionManager.removeListener("MapComplementaryInformationsDataMessage", onChange);
            fail(this.moveManager.failReasons.ACTION_TIMEOUT);
            }, timeout);
            this.wGame.dofus.connectionManager.once("MapComplementaryInformationsWithCoordsMessage", onChange);
            this.wGame.dofus.connectionManager.once("MapComplementaryInformationsDataMessage", onChange);
        });
    }

    public async onForegroundAvailable() {
        try {
            await this.waitSomething(() => !this.wGame.foreground.locked, 5000);
        } catch (ex) {
            throw new Error(this.moveManager.failReasons.FOREGROUND_LOCKED);
        }
    }

    public waitSomething(condition, timeout, interval = 300) {
        return new Promise((success, fail) => {
            let time = timeout;
            let loop = setInterval(() => {
            if (condition()) {
                clearInterval(loop);
                success(1);
            }
            else if (time < 0) {
                clearInterval(loop);
                fail(this.moveManager.failReasons.ACTION_TIMEOUT);
            }
            else {
                console.log("Loop");
                time -= interval;
            }
            }, interval);
        });
    }

    public getInitialCoords(coords, dir) {
        return this.getNextCoords(coords, this.getReverseDir(dir));
    }
    
    public getReverseDir(dir) {
        let ret = 'false';
        switch (dir) {
            case "top":
            ret = "bottom";
            break;
            case "bottom":
            ret = "top";
            break;
            case "left":
            ret = "right";
            break;
            case "right":
            ret = "left";
            break;
        }
        return ret;
    }

    public getNextCoords(coords, dir) {
        let ret = coords;
        let x = parseInt(ret.posX), y = parseInt(ret.posY);
        switch (dir) {
            case "top":
            y--;
            break;
            case "bottom":
            y++;
            break;
            case "left":
            x--;
            break;
            case "right":
            x++;
            break;
        }
        ret = {posX:x, posY:y}
        return ret;
    }

    public getTopCells() {
        return [1, 15, 2, 16, 3, 17, 4, 18, 5, 19, 6, 20, 7, 21, 8, 22, 9, 23, 10, 24, 11, 25, 12, 26/*, 13*/];
    }

    public getBottomCells() {
        return [/*533, */547, 534, 548, 535, 549, 536, 550, 537, 551, 538, 552, 539, 553, 540, 554, 541, 555, 542, 556, 543, 557, 544, 558, 545/*, 559*/];
    }

    public getLeftCells() {
        return [/*0, 14, */28, 42, 56, 70, 84, 98, 112, 126, 140, 154, 168, 182, 196, 210, 224, 238, 252, 266, 280, 294, 308, 322, 336, 350, 364, 378, 392, 406, 420, 434, 448, 462, 476, 490, 504, 518/*, 532, 546*/];
    }

    public getRightCells() {
        return [/*13, 27, */41, 55, 69, 83, 97, 111, 125, 139, 153, 167, 181, 195, 209, 223, 251, 279, 307, 321, 335, 349, 363, 377, 391, 405, 419, 433, 447, 475, 489, 503, 517, 531/*, 545, 559*/];
    }

    public isCellOnMap(cell) {
        return this.wGame.isoEngine.mapRenderer.map.cells[cell];
    }

    public isCellWalkable(cell) {
        return this.wGame.isoEngine.mapRenderer.isWalkable(cell);
    }

    public reset() {
        super.reset()
        this.checkSiMort = true
        Logger.info(' - MoverFauxGPS deactiver')
    }
}