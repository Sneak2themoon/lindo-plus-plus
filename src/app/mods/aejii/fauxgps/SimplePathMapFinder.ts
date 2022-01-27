import { Mod } from "../../mod"

import {ShortcutsHelper} from "@helpers/shortcuts.helper"
//import {API} from "./api"

import * as util from 'util'
import { inspect } from 'util'
import {SettingsService} from "@services/settings.service"
import { TranslateService } from "@ngx-translate/core"
import { API } from "../.."

export class SimplePathMapFinder extends Mod{

    //private api: API
    public checkSiMort:boolean

    public OFFSET_POINT_MIN
    public OFFSET_POINT_MAX
    public POINT_MIN
    public POINT_MAX
    public OFFSET_DIFF
    public mover
    public grid
    public finder

    public PF

    startMod(): void {
        //this.api = api
        this.checkSiMort = false
        Logger.info("- base active");
    }

    constructor(wGame: any,settings: SettingsService,translate: TranslateService, movemanager, PF){
        super(wGame, settings, translate);
        this.PF = PF
        this.OFFSET_POINT_MIN = [-93,-99];
        this.OFFSET_POINT_MAX = [49,57];
        this.POINT_MIN = [0, 0];
        this.POINT_MAX = [145,160];
        this.OFFSET_DIFF = [93, 99];
        console.log(movemanager)
        this.mover = movemanager.getMover//window.mirage?.moveManager?.getMover();
    }

    public init() {
        this.grid = new this.PF.Grid(this.POINT_MAX[0], this.POINT_MAX[1]);
        this.finder = new this.PF.BiBestFirstFinder({
          allowDiagonal:false,
          heuristic: this.PF.Heuristic.euclidean
        });
      }
    /**
     * Return a set of movement actions ready to execute to move from source to target coords. Work only on the current worldmapId
     * @param {*} source { posX, posY }
     * @param {*} target { posX, posY }
     */
    public getPath(source, target) {
        let ret = [];
        if (this.mover && !(source.posX == target.posX && source.posY == target.posY)) {
            this.init();
            let pStart = this.coords2Point(source);
            let pEnd = this.coords2Point(target);
            let pathResult = this.finder.findPath(pStart[0], pStart[1], pEnd[0], pEnd[1], this.grid);
            ret = this.pathResult2Actions(pathResult);
        }
        return ret;
    }

    public pathResult2Actions(path) {
        let ret = [];
        if (path.length >= 2) {
            let fromPoint = path[0];
            for (let i = 1, len = path.length; i < len; i += 1) {
            let toPoint = path[i];
            ret.push(this.createNewMovement(
                this.point2Coords(fromPoint), 
                this.point2Coords(toPoint)));
            fromPoint = toPoint;
            }
        }
        return ret;
    }

    public coords2Point(coords) {
        return [this.OFFSET_DIFF[0] + coords.posX, this.OFFSET_DIFF[1] + coords.posY];
    }

    public point2Coords(point) {
        let posX = point[0] - this.OFFSET_DIFF[0];
        let posY = point[1] - this.OFFSET_DIFF[1];
        return { posX, posY };
    }

    public createNewMovement(fromCoords, toCoords) {
        let coords = toCoords;
        let dir = this.getDirection(fromCoords, toCoords);
        let info =  {
            actionType: 'dir',
            coords,
            dir,
            worldmapId: this.wGame.gui.playerData.position.worldmapId
        };
        let action = () => this.mover.processAction(info);
        
        return { info, action }
    }

    public getDirection(fromCoords, toCoords) {
        let ret = 'false';

        if      (fromCoords.posX == (toCoords.posX - 1)) ret = 'right';
        else if (fromCoords.posX == (toCoords.posX + 1)) ret = 'left';
        else if (fromCoords.posY == (toCoords.posY - 1)) ret = 'bottom';
        else if (fromCoords.posY == (toCoords.posY + 1)) ret = 'top';

        return ret;
    }

    public reset() {
        super.reset()
        this.checkSiMort = true
        Logger.info(' - base deactiver')
    }
}