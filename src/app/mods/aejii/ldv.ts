import { Mod } from "../mod"
import {SettingsService} from "@services/settings.service"
import { TranslateService } from "@ngx-translate/core"
import { API } from ".."
import { ShortcutsHelper } from "@helpers/shortcuts.helper"

export class Ldv extends Mod{

    public checkSiMort:boolean
    private api:API
    private shortcutsHelper

    private gridManager
    private spellManager
    private dofus1Line
    private lastCellId
    private keyPressed
    private mouseInfo

    private COLOR_CELL = "AejLosCell";
    private COLOR_LOS = "AejColorIn";

    private evMouse

    private REFRESH_INTERVAL = 50;

    private SPELL_TEST = {
        castTestLos: true,
        minRange: 1,
        range: 30,
        needFreeCell: false
      };

    startMod(): void {
        this.checkSiMort = false
    }

    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api = api
        this.gridManager = this.api.mover.finder.getSingletonObjectWithKey("getMapPointFromCellId")[0]
        this.spellManager = this.api.mover.finder.getSingletonObjectWithKey("getSpellRange")[0]
        this.dofus1Line = this.api.mover.finder.getSingletonObjectWithKey("getLine")[0]
        this.lastCellId = undefined;
        this.keyPressed = false;
        this.mouseInfo = { x: 0, y: 0 };

        this.shortcutsHelper = new ShortcutsHelper(this.wGame);
        this.shortcutsHelper.bind('y', () => {
            if(this.keyPressed){
                this.keyPressed = false;
                this.lastCellId = undefined;
                this.wGame.isoEngine.mapRenderer.deleteCellHighlight(this.COLOR_CELL);
                this.wGame.isoEngine.mapRenderer.deleteCellHighlight(this.COLOR_LOS);
            }else{
                this.keyPressed = true;
                this.lastCellId = undefined;
                this.los();
            }
        })
        
        this.evMouse = (e) => {
            const react = e.target.getBoundingClientRect();
            const offsetCoords = { x: e.clientX - react.left, y: e.clientY - react.top };
            this.mouseInfo = offsetCoords;
            this.los();
        };
        setTimeout(() => {
            this.wGame.document.querySelector(".foreground").addEventListener('mousemove', this.evMouse);
        }, 2000);
    }

    private currentCellId() {
        const sceneCoords = this.wGame.isoEngine.mapScene.convertCanvasToSceneCoordinate(this.mouseInfo.x, this.mouseInfo.y);
        return this.wGame.isoEngine.mapRenderer.getCellId(sceneCoords.x, sceneCoords.y).cell;
    }

    private los() {
        if (this.keyPressed && this.lastCellId != this.currentCellId()) {
          this.lastCellId = this.currentCellId();
  
          if (this.lastCellId) {
            this.wGame.isoEngine.mapRenderer.deleteCellHighlight(this.COLOR_CELL);
            this.wGame.isoEngine.mapRenderer.addCellHighlight(this.COLOR_CELL, [this.lastCellId], { r: 255, g: 0, b: 0, a: 0.5 }, { r: 255, g: 0, b: 0, a: 0.8 });
          }
  
          const tmpCellId = this.lastCellId;
          setTimeout(() => {
            if (tmpCellId == this.lastCellId) {
                this.wGame.isoEngine.mapRenderer.deleteCellHighlight(this.COLOR_LOS);
              if (tmpCellId) {
                let cellIN = Object.entries(this.drawSpellRange(this.lastCellId))
                  .filter(([key, value]) => value == 'in')
                  .map(([key]) => key);
                  this.wGame.isoEngine.mapRenderer.addCellHighlight(this.COLOR_LOS, cellIN, { r: 31, g: 181, b: 172, a: 0.5 }, { r: 31, g: 181, b: 172, a: 0.8 });
              }
            }
          }, this.REFRESH_INTERVAL);
        }
    }

    private drawSpellRange(cellIdCustom) {
        let visibleActors = this.wGame.actorManager.getIndexedVisibleActors();
        let rangeCoords = this.spellManager.getSpellRange(this.wGame.isoEngine.mapRenderer.map.cells, cellIdCustom, this.SPELL_TEST);
        let cellInfos = {};
    
        let cells = this.wGame.isoEngine.mapRenderer.map.cells;
        let rangeById = {};
        for (let i = 0; i < rangeCoords.length; i++) {
          let cellId = this.gridManager.getCellIdFromMapPoint(rangeCoords[i][0], rangeCoords[i][1]);
          if (cellId === undefined) { continue; }
          if (cellInfos[cellId]) { continue; }
          if (this.SPELL_TEST.needFreeCell && visibleActors[cellId]) {
            rangeById[cellId] = rangeCoords[i][2];
            cellInfos[cellId] = 'out';
            continue;
          }
          let loss = cells[cellId].l || 0;
          if ((loss & 7) === 3) {
            cellInfos[cellId] = 'in';
            rangeById[cellId] = rangeCoords[i][2];
          }
        }
        if (this.SPELL_TEST.castTestLos) {
          this.getCell(cells, cellInfos, cellIdCustom, visibleActors);
        }
    
        return cellInfos;
    }

    private getCell(mapCells, cellInfos, source, indexedActors) {
        let sourcePosition = this.gridManager.getMapPointFromCellId(source);
        let keys = Object.keys(cellInfos);
        for (let i = 0; i < keys.length; i++) {
          let targetCellId = keys[i];
          let targetPosition = this.gridManager.getMapPointFromCellId(targetCellId);
          let line = this.dofus1Line.getLine(sourcePosition.x, sourcePosition.y, targetPosition.x, targetPosition.y);
          let obstructed = false;
          for (let j = 0, lenJ = line.length; j < lenJ; j++) {
            let lineCell = this.gridManager.getCellIdFromMapPoint(line[j].x, line[j].y);
            let cell = mapCells[lineCell];
            if ((indexedActors[lineCell] && j < lenJ - 1) || ((cell.l & 2) !== 2)) {
              obstructed = true;
              break;
            }
          }
          if (obstructed) {
            cellInfos[targetCellId] = 'out';
          }
        }
        return cellInfos;
    }

    public reset() {
        super.reset()
        this.shortcutsHelper.unBindAll()
        this.wGame.document.querySelector(".foreground").removeEventListener('mousemove', this.evMouse);
        this.checkSiMort = true
    }
}