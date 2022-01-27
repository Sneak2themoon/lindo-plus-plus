/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
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
import {SettingsService} from "@services/settings.service"

import {API} from "../api"

import { Finder } from "./finder"
import { TranslateService } from "@ngx-translate/core"

export class BestMover extends Mod{
    startMod(): void {
        return
    }

    private api: API

    public finder:Finder
    public getPath

    private canChangeMap:boolean
    private direction
    public inverseDirection
    public agressives
    public delay:number
    private randomMove

    private subscriptions
    private subscriptionsIso
    private subscriptionsGui

    private lastAskInterRes = null
    private lastChangeMap

    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api = api
        this.delay = 900
        this.randomMove = 0

        this.subscriptions = []
        this.subscriptionsIso = []
        this.subscriptionsGui = []
        this.lastAskInterRes = new Date().getTime()

        this.lastChangeMap = null

        this.inverseDirection = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right'
        }

        /*this.direction = {
            top: [2, 3, 4, 5, 6, 7, 8, 9, 14, 15, 16, 17, 18, 19, 20, 21, 22],
            right: [55, 83, 111, 139, 167, 195, 223, 251, 279, 307, 335, 363, 391, 419, 447, 475, 503, 531, 559, 41, 69, 97, 125, 153, 181, 209, 237, 265, 293, 321, 349, 377, 405, 433, 461, 489],
            bottom: [547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542],
            left: [28, 56, 84, 112, 140, 168, 196, 224, 252, 280, 308, 336, 364, 392, 420, 448, 14, 42, 70, 98, 126, 154, 182, 210, 238, 266, 294, 322, 350, 378, 406, 434]
        }*/

        this.direction = {
            top: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
        right: [27, 55, 83, 111, 139, 167, 195, 223, 251, 279, 307, 335, 363, 391, 419, 447, 475, 503, 531, 559, 41, 69, 97, 125, 153, 181, 209, 237, 265, 293, 321, 349, 377/*, 405, 433, 461, 489, 517, 545*/],
            bottom: [545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 558, 559, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 544],
            left: [0, 28, 56, 84, 112, 140, 168, 196, 224, 252, 280, 308, 336, 364, 392, 420, 448, 476, 504, 532, 14, 42, 70, 98, 126, 154, 182, 210, 238, 266, 294, 322, 350, 378, 406, 434, 462, 490, 518]
        }

        this.agressives = [
            54, 64, 65, 68, 72, 74, 75, 76, 82, 87, 88, 89, 90, 91, 93, 94, 95, 96, 97, 99, 102, 107, 108, 110, 111, 113, 123, 124, 127, 155, 157, 170, 171, 173, 178, 179, 180, 181, 182,
            211, 212, 213, 214, 216, 226, 228, 229, 230, 231, 249, 252, 253, 255, 257, 261, 263, 289, 290, 291, 292, 296, 372, 378, 379, 380, 396, 423, 442, 446, 447, 449, 450,
            457, 464, 465, 466, 475, 478, 479, 481, 488, 525, 527, 528, 529, 535, 536, 537, 568, 583, 584, 585, 586, 587, 588, 589, 590, 594, 595, 596, 597, 598, 600, 601, 603, 612, 651, 744,
            746, 747, 748, 749, 751, 752, 753, 754, 755, 756, 758, 759, 760, 761, 762, 763, 780, 783, 784, 785, 786, 789, 790, 792, 827, 876, 891, 932, 935, 936, 937, 938, 939, 940, 941,
            942, 943, 1015, 1018, 1029, 1048, 1049, 1050, 1051, 1052, 1053, 1054, 1055, 1056, 1057, 1071, 1072, 1073, 1074, 1075, 1077, 1080, 1082, 1084, 1085, 1086, 1087, 1108,
            1153, 1154, 1155, 1156, 1157, 1158, 1159, 2869, 2865,2889,2888,2890,2891,2967, 672, 671, 670, 673
        ]
        
        Logger.info("- BestMover active")

        
        this.finder = new Finder(this.wGame,settings,translate)
        this.getPath = this.finder.getSingletonObjectWithKey<any>("getPath")[0].getPath

        this.on(this.wGame.dofus.connectionManager, 'MapComplementaryInformationsDataMessage', (e: any) => {
            setTimeout(() => {
                this.canChangeMap = true;
            }, this.delay)
        })
        this.on(this.wGame.dofus.connectionManager, 'CurrentMapMessage', (e: any) => {
            this.canChangeMap = false;
        })
    }

    /**
     * 
     * @param chemin ['map:right','interra:476573','interranok:509195',soleil:367','potion:548', 'zaap:84806401','zaapi:84806401',]
     * 
     * exemple de chemin :
     * chemin = {
            'zaapAstrubToMapMaisonKeru': ['map:right', 'map:right', 'map:bottom', 'map:bottom', 'map:bottom'],
            'mapMaisonToKeru': ['interra:476573', 'interra:476493'],
            'keruToAlembic': ['interra:476492', 'soleil:361', 'map:top', 'map:top', 'map:top', 'map:top', 'map:left', 'map:left', 'map:left', 'map:left', 'map:left', 'interra:465424','interra:464126','interranok:509192'],
            'alembicToKeru': ['interra:464127', 'soleil:367', 'map:right', 'map:right', 'map:right', 'map:right', 'map:right', 'map:bottom', 'map:bottom', 'map:bottom', 'map:bottom','interra:476573'],
            'clickInteraKeru': ['interranok:509194', 'interranok:509195', 'interra:476493', 'interranok:509196', 'interranok:509197', 'interranok:509198'],
            'goto4-22': ['interra:476492', 'soleil:361', 'map:top', 'map:top', 'map:top', 'map:top', 'map:left', 'map:left', 'map:top', 'map:top'],
            'goto-3-24': ['potion:548', 'zaap:84806401', 'map:right', 'map:right', 'map:top'],
            'goto31': ['potion:548', 'zaap:88213271', 'map:right', 'map:right', 'map:right', 'map:right', 'map:right', 'map:bottom'],
            'zaapAstrub': ['potion:548', 'zaap:84674563']
        }
     * @returns 
     */
    public execchemin(chemin) {
        return new Promise(async (resolve, reject) => {
            for (let index = 0; index < chemin.length; index++) {
                await this.timeoutResolveV2(this.api.randomIntFromInterval(700,1000))
                const element = chemin[index];
                const data = element.split(':')
                switch (data[0]) {
                    case 'map':
                        await this.changeMapAsync(data[1])
                        break;
                    case 'soleil':
                        await this.changeMapCell(data[1])
                        break;
                    case 'zaap':
                        await this.prendreZaap(data[1])
                        break;
                    case 'zaapi':
                        await this.prendreZaapi(data[1])
                        break;
                    case 'potion':
                        await this.changeMapItem(data[1])
                        break;
                    case 'interra':
                        await this.useInteractiveChangeMap(data[1])
                        break
                    case 'interranok'://use interra pas changement de map (exemple : keru)
                        await this.useInteractive(data[1])
                        break
                    default:
                        break;
                }
            }
            await this.timeoutResolveV2(1000)
            resolve(1)
        })
    }

    /**
     * checkSiAggressivesOnMap
     */
    public checkSiAggressivesOnMap(debug:boolean = false):boolean {
        let actors = this.wGame.actorManager.actors
        let trouver = false
        for (let sdsdsdsd = 0; sdsdsdsd < Object.keys(actors).length; sdsdsdsd++) {
            let actor = actors[Object.keys(actors)[sdsdsdsd]]
            if(actor.data.type == "GameRolePlayGroupMonsterInformations"){
                if(debug)
                    Logger.info(actor.data.staticInfos.mainCreatureLightInfos.creatureGenericId)
                for (let index = 0; index < this.agressives.length; index++) {
                    if(actor.data.staticInfos.mainCreatureLightInfos.creatureGenericId == this.agressives[index]){
                        trouver = true
                    }
                }
            }
        }
        if(trouver){
            if(debug)
                Logger.info('Attention ça aggro')
        }else{
            if(debug)
                Logger.info('ça aggro pas')
        }
        return(trouver)
    }

    public timeoutResolve(resolve, ms) {
        setTimeout(() => {
            return resolve();
        }, ms)
    }

    public isAggressiveOnMap(): boolean{
        let aggressiveBo = false
        let allInteractive = this.wGame.isoEngine._getAllInteractives()
        for (let bvbvbvbvb = 0; bvbvbvbvb < allInteractive.length; bvbvbvbvb++) {
            let aggressive = false
            let mob = null
            var c = allInteractive[bvbvbvbvb];
            if (c.data && c.data.type == "GameRolePlayGroupMonsterInformations") {
                mob = c
            }
            if(mob){
                aggressive = this.agressives.indexOf(mob.data.staticInfos.mainCreatureLightInfos.creatureGenericId) != -1
                var mobs = mob.data.staticInfos.underlings
                for (var k = 0; k < mobs.length; k++) {
                    if (this.agressives.indexOf(mobs[k].creatureGenericId) != -1) {
                        aggressive = true
                    }
                }
            }
            if (aggressive) {
                aggressiveBo = true
            }
        }
        return aggressiveBo
    }

    public timeoutResolveV2(ms) {
        return new Promise(async (resolve, reject) => {
            setTimeout(() => {
                resolve(1)
                return 1;
            }, ms)
        })
    }

    private dofusSubscribe(packet, msg) {
        this.subscriptions.unshift(
            [packet, msg]
        )
        this.wGame.dofus.connectionManager.on(packet, msg);
    }

    private unsubscribeLast() {
        this.wGame.dofus.connectionManager.removeListener(this.subscriptions[0][0], this.subscriptions[0][1]);
        this.subscriptions.splice(0, 1);
    }

    public isoEngineSubscribe(packet, msg) {
        this.subscriptionsIso.unshift(
            [packet, msg]
        )
        this.wGame.isoEngine.on(packet, msg);
    }

    public unsubscribeLastIso() {
        try {
            if(this.subscriptionsIso.length>0){
                this.wGame.isoEngine.removeListener(this.subscriptionsIso[0][0], this.subscriptionsIso[0][1]);
                this.subscriptionsIso.splice(0 , 1);
            }
        } catch (error) {
            console.error(error);
        }
    }

    private reverseChangeMap() {
        return new Promise(async (resolve, reject) => {
            await this.changeMapAsync(this.inverseDirection[this.lastChangeMap])
            await this.changeMapAsync(this.inverseDirection[this.lastChangeMap], true)//il faut reinverser vu que le changement de map précédent réinverse
            return this.timeoutResolve(resolve,this.delay)
        })
    }

    public changeMapAsync(dir = null,rng = false, recursive = false) {
        return new Promise(async (resolve, reject) => {
            if (this.wGame.gui.playerData.inventory.isOverloaded()) {
                this.api.sendMessagePartyOverload()
                return reject("overload");
            }else{
                let direc;
                if (dir) {
                    direc = dir;
                } else {
                    direc = Object.keys(this.direction)[this.api.randomIntFromInterval(0,3)];
                }
    
                //let cellToChange = this.getClosestCellToChangeMap(direc)
                let cellToChange = this.getClosestCellToChangeMapRandomised(direc,false, rng)
    
                if (cellToChange.direction != null) {
                    this.lastChangeMap = cellToChange.direction
                    const timeout = setTimeout(() => {
                        this.unsubscribeLastIso();
                        return reject("TIMEOUT CHANGE MAP");
                    }, 20000);
    
                    this.isoEngineSubscribe('mapLoaded', async (packet) => {
                        this.unsubscribeLastIso();
                        clearTimeout(timeout);
                        await this.timeoutResolveV2(this.delay)
                        resolve(1)
                        return 1
    
                    })
                    let scenePos = this.wGame.isoEngine.mapRenderer.getCellSceneCoordinate(cellToChange.cellId)
                    let pos = this.wGame.isoEngine.mapScene.convertSceneToCanvasCoordinate(scenePos.x, scenePos.y)
    
                    this.wGame.isoEngine.gotoNeighbourMap(cellToChange.direction, cellToChange.cellId, Math.floor(pos.x), Math.floor(pos.y))
                } else {
                    if(this.lastChangeMap == null || recursive){
                        setTimeout(() => {
                            return reject("NO PATH TO CHANGE MAP TO : " + direc);
                        }, 1000)
                    }else{
                        //on tente de revenir en arriere pour revenir via une autre case
                        await this.reverseChangeMap()
                        await this.changeMapAsync(dir,false,true)
                        return this.timeoutResolve(resolve,this.delay)
                    }
                }
            }
        })
    }

    private getActorPos() {
        let monster = {}
        let key = Object.keys(this.wGame.actorManager.actors)
        for (let index = 0; index < key.length; index++) {
            if(parseInt(key[index]) < 0 && this.wGame.actorManager.actors[key[index]].data.guild == undefined){
                monster[key[index]] = this.wGame.actorManager.actors[key[index]]._position
            }
        }
        return monster
    }

    private checkBadGuyOnPath(path, actor) {
        let cellASafe = []
        //radius 1
        for (let pagfgfg = 0; pagfgfg < path.length; pagfgfg++) {
            let voisine = this.api.getNeighbourCells(path[pagfgfg],true)
            for (var m = 0; m < voisine.length; m++) {
                if(voisine[m] != undefined){
                    cellASafe.push(voisine[m]);
                }
            }
        }
        
        cellASafe.filter(function (item, index, inputArray) {
            return inputArray.indexOf(item) == index;
        })

        //radius 2
        let tmp = cellASafe.length
        for (let pagfgfg = 0; pagfgfg < tmp; pagfgfg++) {
            let voisine = this.api.getNeighbourCells(cellASafe[pagfgfg],true)
            for (var m = 0; m < voisine.length; m++) {
                if(voisine[m] != undefined){
                    cellASafe.push(voisine[m]);
                }
            }
        }

        cellASafe.filter(function (item, index, inputArray) {
            return inputArray.indexOf(item) == index;
        })

        let retour = false
        //TODO on check qu'il n'y ai pas d'actor sur l'un des cell ?
        for (let index = 0; index < cellASafe.length; index++) {
            if(!retour)
            for (let sds = 0; sds < Object.keys(actor).length; sds++) {
                if(cellASafe[index] == actor[Object.keys(actor)[sds]]){
                    retour = true
                }
            }
        }
        return retour
    }

    public changeMapEsquiveAsync(dir = null,rng = false, recursive = false, timeoutChangeMap = 30000) {
        return new Promise(async (resolve, reject) => {
            let mapActuelle = this.wGame.isoEngine.mapRenderer.map.id
            //Logger.info('change map esquive :'+mapActuelle+ ', dir:'+dir)
            //Logger.info('changeMapEsquiveAsync :'+this.wGame.isoEngine.mapRenderer.map.id)
            if(!this.wGame.isoEngine.actorManager.getActor(this.wGame.isoEngine.actorManager.userId).moving && !this.wGame.isoEngine.actorManager.userActor.animated){
                if (this.wGame.gui.playerData.inventory.isOverloaded() && !this.wGame.gui.playerData.isMutant()) {
                    this.api.sendMessagePartyOverload()
                    return reject("overload");
                }else{
                    let direc;
                    let cells = null
                    if (dir) {
                        direc = dir;
                    } else {
                        direc = Object.keys(this.direction)[this.api.randomIntFromInterval(0,3)];
                    }
    
                    switch(direc) {
                        case "top":
                            cells = this.api.getTopCells()
                            break;
                        case "bottom":
                            cells = this.api.getBottomCells()
                            break;
                        case "left":
                            cells = this.api.getLeftCells()
                            break;
                        case "right":
                            cells = this.api.getRightCells()
                            break;
                        default:
                            Logger.info('wtf la direction est fausse.');
                            resolve(-1)
                    }
                    
                    let cellToChange = this.getClosestCellToChangeMapRandomised(direc,true, rng)
                    if (cellToChange.direction != null) {
                        this.lastChangeMap = cellToChange.direction
                        let timeout = setTimeout(() => {
                            this.unsubscribeLastIso();
                            return reject("TIMEOUT CHANGE MAP");
                        }, timeoutChangeMap);
        
                        this.isoEngineSubscribe('mapLoaded', (packet) => {
                            this.unsubscribeLastIso();
                            clearTimeout(timeout);
                            return this.timeoutResolve(resolve,this.delay);
                        })

                        //avec l'anti aggro d'ely le _movePlayerOnMap est redéfini, et gotoNeighbourMap l'appele
                        let scenePos = this.wGame.isoEngine.mapRenderer.getCellSceneCoordinate(cellToChange.cellId)
                        let pos = this.wGame.isoEngine.mapScene.convertSceneToCanvasCoordinate(scenePos.x, scenePos.y)
                        this.wGame.isoEngine.gotoNeighbourMap(cellToChange.direction, cellToChange.cellId, Math.floor(pos.x), Math.floor(pos.y))
                    } else {
                        if(this.lastChangeMap == null || recursive){
                            setTimeout(() => {
                                return reject("NO PATH TO CHANGE MAP TO : " + direc);
                            }, 1000)
                        }else{
                            //on tente de revenir en arriere pour revenir via une autre case
                            await this.reverseChangeMap()
                            await this.changeMapEsquiveAsync(dir,false,true)
                            return this.timeoutResolve(resolve,this.delay)
                        }
                    }
                }
            }else{
                //TODO cancel déplacement puis bouger la ou on veut aller ?
                setTimeout(() => {
                    Logger.error('on bouge/anim deja')
                    resolve(1)
                }, 2000)
            }
            
        })
    }

    public changeMapEsquiveAsyncOld(dir = null,rng = false, recursive = false, timeoutChangeMap = 30000) {
        return new Promise(async (resolve, reject) => {
            let mapActuelle = this.wGame.isoEngine.mapRenderer.map.id
            Logger.info('change map esquive :'+mapActuelle+ ', dir:'+dir)
            //Logger.info('changeMapEsquiveAsync :'+this.wGame.isoEngine.mapRenderer.map.id)
            if(!this.wGame.isoEngine.actorManager.getActor(this.wGame.isoEngine.actorManager.userId).moving && !this.wGame.isoEngine.actorManager.userActor.animated){
                if (this.wGame.gui.playerData.inventory.isOverloaded() && !this.wGame.gui.playerData.isMutant()) {
                    this.api.sendMessagePartyOverload()
                    return reject("overload");
                }else{
                    let direc;
                    let cells = null
                    if (dir) {
                        direc = dir;
                    } else {
                        direc = Object.keys(this.direction)[this.api.randomIntFromInterval(0,3)];
                    }
    
                    switch(direc) {
                        case "top":
                            cells = this.api.getTopCells()
                            break;
                        case "bottom":
                            cells = this.api.getBottomCells()
                            break;
                        case "left":
                            cells = this.api.getLeftCells()
                            break;
                        case "right":
                            cells = this.api.getRightCells()
                            break;
                        default:
                            Logger.info('wtf la direction est fausse.');
                            resolve(-1)
                    }
                    
                    let cellToChange = this.getClosestCellToChangeMapRandomised(direc,true, rng)
                    if (cellToChange.direction != null) {
                        this.lastChangeMap = cellToChange.direction
                        let timeout = setTimeout(() => {
                            this.unsubscribeLastIso();
                            return reject("TIMEOUT CHANGE MAP");
                        }, timeoutChangeMap);
        
                        this.isoEngineSubscribe('mapLoaded', (packet) => {
                            this.unsubscribeLastIso();
                            clearTimeout(timeout);
                            return this.timeoutResolve(resolve,this.delay);
                        })



                        //let pathNormal = this.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, cellToChange.cellId, this.wGame.isoEngine.actorManager._occupiedCells, this.wGame.isoEngine.actorManager.userActor.canMoveDiagonally, false)
                        let path = this.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, cellToChange.cellId, this.api.getOccupiedCellNotToBeAggressed(), this.wGame.isoEngine.actorManager.userActor.canMoveDiagonally, false)
                        
                        /**
                         * if(JSON.stringify(pathNormal) == JSON.stringify(path)){
                                
                            }else{
                                
                            }
                         */
                        if(this.isAggressiveOnMap()){
                            //this.api.betterLogger('mob sur la map, on click pour path custom')
                            
                            if(!this.wGame.isoEngine.actorManager.isCreatureModeOn)
                                this.wGame.gui.mainControls.buttonBox._childrenList.filter((btn) => btn.rootElement.classList.contains('creatureModeButton'))[0].tap();

                            let saveActor = this.getActorPos()

                            let checkedPath = this.checkBadGuyOnPath(path,saveActor)

                            let needMove = false

                            for (let sdsdsdsqq = 0; sdsdsdsqq < path.length; sdsdsdsqq++) {
                                if(mapActuelle == this.wGame.isoEngine.mapRenderer.map.id){
                                    //console.log('check path :'+sdsdsdsqq)
                                    let customPath = [path[sdsdsdsqq]]

                                    let newActor = this.getActorPos()
                                    if(JSON.stringify(saveActor) != JSON.stringify(newActor)){
                                        needMove = false
                                        if (this.wGame.isoEngine.actorManager.userActor.moving) {
                                            this.wGame.isoEngine.actorManager.userActor.cancelMovement(() => {
                                            });
                                        }
                                        saveActor = newActor
                                        checkedPath = this.checkBadGuyOnPath(path,newActor)
                                        sdsdsdsqq = 0
                                        path = this.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, cellToChange.cellId, this.api.getOccupiedCellNotToBeAggressed(), this.wGame.isoEngine.actorManager.userActor.canMoveDiagonally, false)
                                    }else{
                                        if(Object.keys(this.wGame.isoEngine.mapRenderer.getChangeMapFlags(path[sdsdsdsqq])).length == 0 || sdsdsdsqq>path.length-3){
                                            if(checkedPath && !needMove){
                                                if (this.wGame.isoEngine.actorManager.userActor.moving) {
                                                    this.wGame.isoEngine.actorManager.userActor.cancelMovement(() => {
                                                    });
                                                }
                                                clearTimeout(timeout)
                                                timeout = setTimeout(() => {
                                                    this.unsubscribeLastIso();
                                                    return reject("TIMEOUT CHANGE MAP");
                                                }, timeoutChangeMap);
                                                needMove = true
                                                //this.api.betterLogger('mob sur le chemin (sécu), on attend qu"un mob bouge (5sec)')
                                                await this.timeoutResolveV2(5000)
                                                sdsdsdsqq = 0
                                                path = this.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, cellToChange.cellId, this.api.getOccupiedCellNotToBeAggressed(), this.wGame.isoEngine.actorManager.userActor.canMoveDiagonally, false)
                                            }else{
                                                if(!checkedPath){
                                                    //Logger.info('clique '+path[sdsdsdsqq])
                                                    let cell = path[sdsdsdsqq]
                                                    if(this.wGame.isoEngine.mapRenderer.getChangeMapFlags(cell)[direc]){
                                                        let scenePos = this.wGame.isoEngine.mapRenderer.getCellSceneCoordinate(cell);
                                                        let pos = this.wGame.isoEngine.mapScene.convertSceneToCanvasCoordinate(scenePos.x, scenePos.y);
                                                        this.wGame.isoEngine.gotoNeighbourMap(dir, cell, Math.floor(pos.x), Math.floor(pos.y));
                                                    }else{
                                                        await this.api.seDeplacerOffi(cell) //risque de bug si serveur lag ou co lente :(
                                                        //await this.api.seDeplacer(path[sdsdsdsqq],customPath)//on ce deplace que de 1 a chaque fois
                                                    }

                                                    await this.timeoutResolveV2(200)
                                                    if(this.api.isCellChangesMapToDirection(path[sdsdsdsqq],direc)){
                                                        //on change de map, on ne reclique pas apres
                                                        sdsdsdsqq = 1000
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }else{
                                    //on a changé de map ???
                                    sdsdsdsqq = 10000//on sort de la boucle for
                                }
                            }
                            setTimeout(() => {
                                resolve(1)
                            }, 1000)
                        }else{
                            //on est sur une map aggro mais il n'y a pas de mob sur notre "chemin"
                            let scenePos = this.wGame.isoEngine.mapRenderer.getCellSceneCoordinate(cellToChange.cellId)
                            let pos = this.wGame.isoEngine.mapScene.convertSceneToCanvasCoordinate(scenePos.x, scenePos.y)
                            //this.api.betterLogger('pas de mob sur la map')
                            this.wGame.isoEngine.gotoNeighbourMap(cellToChange.direction, cellToChange.cellId, Math.floor(pos.x), Math.floor(pos.y))
                        }
                    } else {
                        if(this.lastChangeMap == null || recursive){
                            setTimeout(() => {
                                return reject("NO PATH TO CHANGE MAP TO : " + direc);
                            }, 1000)
                        }else{
                            //on tente de revenir en arriere pour revenir via une autre case
                            await this.reverseChangeMap()
                            await this.changeMapEsquiveAsync(dir,false,true)
                            return this.timeoutResolve(resolve,this.delay)
                        }
                    }
                }
            }else{
                setTimeout(() => {
                    Logger.error('on bouge/anim deja')
                    resolve(1)
                }, 2000)
            }
            
        })
    }

    public getClosestCellToChangeMapRandomised(direc, hostile = false, rng = false) {
        var occupiedCells = this.wGame.isoEngine.actorManager._occupiedCells;
        var currentCellId = this.wGame.isoEngine.actorManager.userActor.cellId;
        if (occupiedCells == {} || currentCellId == null) {
            return {
                cellId: null,
                direction: null
            }
        }
        var canMoveDiagonally = this.wGame.isoEngine.actorManager.userActor.canMoveDiagonally;

        let tableau = []

        for (var i = 0; i < this.direction[direc].length; i++) {
            var cellId = this.direction[direc][i];
            if (!this.wGame.isoEngine.mapRenderer.getChangeMapFlags(cellId)[direc]) {
                continue;
            }
            if (this.isMobOnCell(cellId)) {
                //console.debug("Not moving on " + cellId + ": there's a mob.");
                continue;
            }
            if(hostile){
                occupiedCells = this.api.getOccupiedCellNotToBeAggressed()
            }
            var path = this.getPath(currentCellId, cellId, occupiedCells, canMoveDiagonally, false);

            if (path[path.length - 1] == cellId /*&& (!finalPath || (path.length < finalPath.length && path.length > 1))*/) {
                tableau.push([path,path[path.length - 1]])
            }
        }
        if (tableau.length==0) {
            console.log("No way, I can't go there");
            return {
                cellId: null,
                direction: null
            }
        }
        tableau.sort(function(a,b) {
            let aa = a[0].length
            let bb = b[0].length
            return(aa-bb)
        })
        if(!rng){
            if(tableau.length>5){
                return {
                    cellId: tableau[this.api.randomIntFromInterval(0, 5)][1],
                    direction: direc
                }
            }else{
                return {
                    cellId: tableau[this.api.randomIntFromInterval(0, tableau.length-1)][1],
                    direction: direc
                }
            }
        }else{
            return {
                cellId: tableau[this.api.randomIntFromInterval(0, tableau.length-1)][1],
                direction: direc
            }
        }
    }

    private getClosestCellToChangeMap(direc) {
        var occupiedCells = this.wGame.isoEngine.actorManager._occupiedCells;
        var currentCellId = this.wGame.isoEngine.actorManager.userActor.cellId;
        if (occupiedCells == {} || currentCellId == null) {
            return {
                cellId: null,
                direction: null
            }
        }
        var canMoveDiagonally = this.wGame.isoEngine.actorManager.userActor.canMoveDiagonally;
        var finalPath = null;
        var finalCellId = null;

        for (var i = 0; i < this.direction[direc].length; i++) {
            var cellId = this.direction[direc][i];
            if (!this.wGame.isoEngine.mapRenderer.getChangeMapFlags(cellId)[direc]) {
                continue;
            }
            if (this.isMobOnCell(cellId)) {
                console.debug("Not moving on " + cellId + ": there's a mob.");
                continue;
            }
            var path = this.getPath(currentCellId, cellId, occupiedCells, canMoveDiagonally, false);

            if (path[path.length - 1] == cellId && (!finalPath || (path.length < finalPath.length && path.length > 1))) {
                finalPath = path;
                finalCellId = finalPath[finalPath.length - 1];
            }
        }
        if (!finalPath && this.randomMove) {
            console.log("No path to closest cell in direction: " + direc);
            return this.getClosestCellInRandomDirectionToChangeMap();
        } else if (!finalPath) {
            console.log("No way, I can't go there");
            return {
                cellId: null,
                direction: null
            }
        }
        return {
            cellId: finalCellId,
            direction: direc
        };
    }

    private isMobOnCell(cellId) {
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

    private getClosestCellInRandomDirectionToChangeMap() {
        var directions = Object.keys(this.direction);
        var direction = directions[this.api.randomIntFromInterval(0, 3)];
        var cell;
        var tries = 4;
        do {
            tries -= 1;
            cell = this.getClosestCellToChangeMap(direction);
        } while (cell.cellId === null && tries > 0);
        return cell;
    }

    public getOccupiedCellsNotToBeAgressed() {
        var cellIds = [];
        var occupiedCells = [];
        var i = this.wGame.isoEngine.mapRenderer.interactiveElements;
        var interactives = this.wGame.isoEngine._getAllInteractives();
        for (var l = 0; l < interactives.length; l++) {
            var aggressive = false;
            var mob = null;
            var c = interactives[l];
            if (c.data && c.data.type == "GameRolePlayGroupMonsterInformations") {
                mob = c;
            }
            if (mob) {
                aggressive = this.agressives.indexOf(mob.data.staticInfos.mainCreatureLightInfos.creatureGenericId) != -1;
                var mobs = mob.data.staticInfos.underlings;
                for (var k = 0; k < mobs.length; k++) {
                    if (this.agressives.indexOf(mobs[k].creatureGenericId) != -1) {
                        aggressive = true;
                    }
                }
            }
            if (aggressive) {
                cellIds.push(mob.cellId);
            }
        }
        for (var r = 0; r < cellIds.length; r++) {
            var cells = this.getCellsNotToBeAggressed(cellIds[r]);
            for (var m = 0; m < cells.length; m++) {
                if (cells[m] > 0) {
                    occupiedCells.push(cells[m]);
                }
            }
        }
        var tmp = occupiedCells.slice(0);
        for (let i = 0; i < tmp.length; i++) {
            var cells = this.getCellsNotToBeAggressed(tmp[i]);
            for (var m = 0; m < cells.length; m++) {
                if (cells[m] > 0) {
                    occupiedCells.push(cells[m]);
                }
            }
        }
        occupiedCells.filter(function (item, index, inputArray) {
            return inputArray.indexOf(item) == index;
        });
        var realOccupied = this.wGame.isoEngine.actorManager._occupiedCells;
        for (let i = 0; i < occupiedCells.length; i++) {
            if (realOccupied[occupiedCells[i]]) {
                realOccupied[occupiedCells[i]].push({
                    id: 0
                });
            } else {
                realOccupied[occupiedCells[i]] = [{
                    id: 0
                }];
            }
        }
        return realOccupied;
    }

    private getCellsNotToBeAggressed(cellId) {
        return this.finder.getSingletonObjectWithKey<any>("getNeighbourCells")[0].getNeighbourCells(cellId, true);
    }

    public async useInteractive(elemId, posSave = -1,posSaveReal = -1) {
        return new Promise(async (resolve, reject) => {
            await this.timeoutResolveV2(1000)//le temps que la map charge un minimum
            //pour eviter le bug de l'interactive
            await this.api.seDeplacer(this.api.getClosestAvailableCellOnMap())
            await this.api.patienter(750)

            if(!this.wGame.isoEngine.mapRenderer.interactiveElements[elemId]){
                return reject("THERE IS NO INTERACTIVE WITH THIS ID ON THIS MAP");
            }

            let skillInstanceUid = this.wGame.isoEngine.mapRenderer.interactiveElements[elemId].enabledSkills[0].skillInstanceUid;

            const timeout = setTimeout(async() => {
                this.unsubscribeLast()
                //on essaye de cliquer "a la main" sur la cell
                if(posSave == -1 || posSaveReal == -1){
                    Logger.info('error TIMEOUT')
                    return reject("TIMEOUT USE INTERACTIVE")
                }
                await this.api.seDeplacer(posSave)
                await this.api.patienter(2000)
                await this.api.seDeplacer(posSaveReal)
                await this.api.patienter(4000)
                return this.timeoutResolve(resolve,this.delay)
            }, 10000)

            this.dofusSubscribe('InteractiveUsedMessage', (packet) => {
                this.unsubscribeLast();
                clearTimeout(timeout);
                return this.timeoutResolve(resolve,this.delay)
            })
            
            this.wGame.isoEngine._useInteractive(elemId,skillInstanceUid);
        })
    }

    public async useInteractiveRes(elemId, posSave = -1,posSaveReal = -1) {
        return new Promise((resolve, reject) => {

            if(!this.wGame.isoEngine.mapRenderer.interactiveElements[elemId]){
                return reject("THERE IS NO INTERACTIVE WITH THIS ID ON THIS MAP");
            }

            let skillInstanceUid = this.wGame.isoEngine.mapRenderer.interactiveElements[elemId].enabledSkills[0].skillInstanceUid;

            let onAnnuleTout = false
            let timeout2
            let timeout = setTimeout(async() => {
                //on essaye de cliquer "a la main" sur la cell
                if(posSave == -1 || posSaveReal == -1){
                    return reject("TIMEOUT USE INTERACTIVE")
                }
                await this.api.seDeplacer(posSave)
                await this.api.patienter(2000)
                await this.api.seDeplacer(posSaveReal)
                timeout2 = setTimeout(async() => {
                    Logger.info('on a loupé la res 2 fois')
                    onAnnuleTout = true
                    return this.timeoutResolve(resolve,this.delay)
                }, 10000)
            }, 5000)

            let registerUsedMessage = () => {
                this.once(this.wGame.dofus.connectionManager, 'InteractiveUsedMessage', async (e: any) => {
                    if(e.entityId == this.wGame.isoEngine.actorManager.userId && !onAnnuleTout){
                        clearTimeout(timeout)
                        clearTimeout(timeout2)
                        Logger.info('on commence reelement la res')
                        const timeoutEnd = setTimeout(async() => {
                            Logger.info('hmmm on est cencé avoir fini')
                            return this.timeoutResolve(resolve,this.delay)
                        }, 20000)

                        //once res fini
                        this.once(this.wGame.dofus.connectionManager, 'InteractiveUseEndedMessage', async (e: any) => {
                            clearTimeout(timeout)
                            clearTimeout(timeout2)
                            clearTimeout(timeoutEnd)
                            Logger.info('on fini la res')
                            return this.timeoutResolve(resolve,this.delay)
                        })
                    }else{
                        if(e.elemId == elemId){
                            //on viens de ce faire voler notre res :(
                            Logger.info('on nous a voler la res')
                            clearTimeout(timeout)
                            clearTimeout(timeout2)
                            return this.timeoutResolve(resolve,this.delay)
                        }else{
                            Logger.info('quelqu un a fini une res sur notre map (il y a un autre mec qui farm)')
                            registerUsedMessage()
                        }
                    }
                })
            }

            if(new Date().getTime()-this.lastAskInterRes>1000){//quand on nous vole la res on relance directe (faux positif ?)
                registerUsedMessage()
                this.lastAskInterRes = new Date().getTime()
                this.wGame.isoEngine._useInteractive(elemId,skillInstanceUid)
            }else{
                Logger.info('hmmm il semblerai qu il ai un doublon _useInteractive')
                clearTimeout(timeout)
                clearTimeout(timeout2)
            }
        })
    }

    public async changeMapCell(cellId, timeoutattente = 500) {
        return new Promise(async (resolve, reject) => {
            if (this.wGame.gui.playerData.inventory.isOverloaded()) {
                this.api.sendMessagePartyOverload()
                return reject("overload");
            }else{
                await this.timeoutResolveV2(timeoutattente)
                const timeout = setTimeout(() => {
                    this.unsubscribeLastIso()
                    Logger.info('change map cell timeout')
                    //TODO es ce que ça pose un pb ?
                    return this.timeoutResolve(resolve,this.delay)
                    //return reject("TIMEOUT USE INTERACTIVE")
                }, 10000);
                this.isoEngineSubscribe('mapLoaded', (packet) => {
                    this.unsubscribeLastIso();
                    clearTimeout(timeout);
                    return this.timeoutResolve(resolve,this.delay)

                });
                //this.wGame.isoEngine._movePlayerOnMap(cellId);
                await this.api.seDeplacer(cellId)
            }
        })
    }

    public async changeMapItem(idemId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.unsubscribeLastIso();
                resolve(-1)
                //return reject("TIMEOUT USE INTERACTIVE")
            }, 10000);
            let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
            for (let index = 0; index < keys.length; index++) {
                if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == idemId){
                    this.isoEngineSubscribe('mapLoaded', (packet) => {
                        this.unsubscribeLastIso();
                        clearTimeout(timeout);
                        resolve(1)
                    });
                    this.api.utiliserItem(idemId)
                }
            }
        })
    }

    public prendreZaapi(mapid) {
        return new Promise((resolve, reject) => {
            if (this.wGame.gui.playerData.inventory.isOverloaded() && !this.wGame.gui.playerData.isMutant()) {
                this.api.sendMessagePartyOverload()
                resolve(-1)
            }
            let allInteractive = this.wGame.isoEngine._getAllInteractives()
            let interas = this.wGame.isoEngine.mapRenderer.interactiveElements
            let trouver = false
            for (const elem of allInteractive) {
                if(interas[elem.id] != undefined)
                    if(interas[elem.id]._name == 'Zaapi'){
                        if(interas[elem.id].enabledSkills.length>0){
                            if(interas[elem.id].enabledSkills[0]._name == 'Se faire transporter'){
                                trouver = true
                                this.wGame.isoEngine._useInteractive(interas[elem.id].elementId,interas[elem.id].enabledSkills[0].skillInstanceUid)
                                let moveToZaapiTimeout = setTimeout(() => {
                                    resolve(-1)
                                }, 15000)
                                this.once(this.wGame.dofus.connectionManager, 'TeleportDestinationsListMessage', (e: any) => {// zaapi ouvert
                                    //4{"_messageType":"TeleportDestinationsListMessage","teleporterType":1,"mapIds":[141864,142884,147493,13631488,143397,143400,144930,141347,142367,142880,141863,142376,143396,143906,144419,144932,145952,144425,144935,145445,145447,140839,141859,143392,142375,142885,143395,142888,144418,144928,144931,144934,145444,145954,141858,142368,146467,141351,141346],"subAreaIds":[502,507,535,511,507,531,511,508,505,505,502,502,507,511,511,511,503,506,506,511,506,534,508,505,502,507,507,531,511,503,511,511,511,509,508,505,509,534,508],"costs":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"destTeleporterType":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"_isInitialized":true,"_subAreas":[{"id":502,"name":"Quartier des Bûcherons","areaId":11,"areaName":"Brâkmar"},{"id":507,"name":"Quartier des Tailleurs","areaId":11,"areaName":"Brâkmar"},{"id":535,"name":"Quartier des Éleveurs","areaId":11,"areaName":"Brâkmar"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":507,"name":"Quartier des Tailleurs","areaId":11,"areaName":"Brâkmar"},{"id":531,"name":"Quartier des Alchimistes","areaId":11,"areaName":"Brâkmar"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":508,"name":"Quartier des Forgerons","areaId":11,"areaName":"Brâkmar"},{"id":505,"name":"Quartier des Boulangers","areaId":11,"areaName":"Brâkmar"},{"id":505,"name":"Quartier des Boulangers","areaId":11,"areaName":"Brâkmar"},{"id":502,"name":"Quartier des Bûcherons","areaId":11,"areaName":"Brâkmar"},{"id":502,"name":"Quartier des Bûcherons","areaId":11,"areaName":"Brâkmar"},{"id":507,"name":"Quartier des Tailleurs","areaId":11,"areaName":"Brâkmar"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":503,"name":"Quartier des Bouchers","areaId":11,"areaName":"Brâkmar"},{"id":506,"name":"Quartier des Bijoutiers","areaId":11,"areaName":"Brâkmar"},{"id":506,"name":"Quartier des Bijoutiers","areaId":11,"areaName":"Brâkmar"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":506,"name":"Quartier des Bijoutiers","areaId":11,"areaName":"Brâkmar"},{"id":534,"name":"Quartier des Pêcheurs","areaId":11,"areaName":"Brâkmar"},{"id":508,"name":"Quartier des Forgerons","areaId":11,"areaName":"Brâkmar"},{"id":505,"name":"Quartier des Boulangers","areaId":11,"areaName":"Brâkmar"},{"id":502,"name":"Quartier des Bûcherons","areaId":11,"areaName":"Brâkmar"},{"id":507,"name":"Quartier des Tailleurs","areaId":11,"areaName":"Brâkmar"},{"id":507,"name":"Quartier des Tailleurs","areaId":11,"areaName":"Brâkmar"},{"id":531,"name":"Quartier des Alchimistes","areaId":11,"areaName":"Brâkmar"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":503,"name":"Quartier des Bouchers","areaId":11,"areaName":"Brâkmar"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":509,"name":"Quartier des Bricoleurs","areaId":11,"areaName":"Brâkmar"},{"id":508,"name":"Quartier des Forgerons","areaId":11,"areaName":"Brâkmar"},{"id":505,"name":"Quartier des Boulangers","areaId":11,"areaName":"Brâkmar"},{"id":509,"name":"Quartier des Bricoleurs","areaId":11,"areaName":"Brâkmar"},{"id":534,"name":"Quartier des Pêcheurs","areaId":11,"areaName":"Brâkmar"},{"id":508,"name":"Quartier des Forgerons","areaId":11,"areaName":"Brâkmar"}],"_maps":[{"id":141864,"posX":-21,"posY":40},{"id":142884,"posX":-23,"posY":36},{"id":147493,"posX":-32,"posY":37},{"id":13631488,"posX":-26,"posY":36},{"id":143397,"posX":-24,"posY":37},{"id":143400,"posX":-24,"posY":40},{"id":144930,"posX":-27,"posY":34},{"id":141347,"posX":-20,"posY":35},{"id":142367,"posX":-22,"posY":31},{"id":142880,"posX":-23,"posY":32},{"id":141863,"posX":-21,"posY":39},{"id":142376,"posX":-22,"posY":40},{"id":143396,"posX":-24,"posY":36},{"id":143906,"posX":-25,"posY":34},{"id":144419,"posX":-26,"posY":35},{"id":144932,"posX":-27,"posY":36},{"id":145952,"posX":-29,"posY":32},{"id":144425,"posX":-26,"posY":41},{"id":144935,"posX":-27,"posY":39},{"id":145445,"posX":-28,"posY":37},{"id":145447,"posX":-28,"posY":39},{"id":140839,"posX":-19,"posY":39},{"id":141859,"posX":-21,"posY":35},{"id":143392,"posX":-24,"posY":32},{"id":142375,"posX":-22,"posY":39},{"id":142885,"posX":-23,"posY":37},{"id":143395,"posX":-24,"posY":35},{"id":142888,"posX":-23,"posY":40},{"id":144418,"posX":-26,"posY":34},{"id":144928,"posX":-27,"posY":32},{"id":144931,"posX":-27,"posY":35},{"id":144934,"posX":-27,"posY":38},{"id":145444,"posX":-28,"posY":36},{"id":145954,"posX":-29,"posY":34},{"id":141858,"posX":-21,"posY":34},{"id":142368,"posX":-22,"posY":32},{"id":146467,"posX":-30,"posY":35},{"id":141351,"posX":-20,"posY":39},{"id":141346,"posX":-20,"posY":34}],"_hints":[{"id":2778,"categoryId":3,"gfx":314,"nameId":"Atelier des sculpteurs","mapId":141864,"realMapId":0,"x":-21,"y":40,"outdoor":true,"subareaId":502,"worldMapId":1,"teleporterCost":20},{"id":2998,"categoryId":3,"gfx":307,"nameId":"Atelier des cordonniers","mapId":142884,"realMapId":0,"x":-23,"y":36,"outdoor":true,"subareaId":507,"worldMapId":1,"teleporterCost":20},{"id":2986,"categoryId":2,"gfx":218,"nameId":"Hôtel de vente des animaux","mapId":147493,"realMapId":0,"x":-32,"y":37,"outdoor":true,"subareaId":535,"worldMapId":1,"teleporterCost":20},{"id":2993,"categoryId":4,"gfx":419,"nameId":"Enclos public","mapId":147493,"realMapId":0,"x":-32,"y":37,"outdoor":true,"subareaId":535,"worldMapId":1,"teleporterCost":20},{"id":2922,"categoryId":2,"gfx":219,"nameId":"Hôtel de vente des parchemins liés","mapId":144420,"realMapId":13631488,"x":-26,"y":36,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":3017,"categoryId":4,"gfx":407,"nameId":"Milice","mapId":144420,"realMapId":13631488,"x":-26,"y":36,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":3013,"categoryId":2,"gfx":215,"nameId":"Hôtel de vente des tailleurs","mapId":143397,"realMapId":0,"x":-24,"y":37,"outdoor":true,"subareaId":507,"worldMapId":1,"teleporterCost":20},{"id":3002,"categoryId":2,"gfx":201,"nameId":"Hôtel de vente des alchimistes","mapId":143400,"realMapId":0,"x":-24,"y":40,"outdoor":true,"subareaId":531,"worldMapId":1,"teleporterCost":20},{"id":3014,"categoryId":4,"gfx":418,"nameId":"Hôtel des métiers","mapId":144930,"realMapId":0,"x":-27,"y":34,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":2961,"categoryId":2,"gfx":209,"nameId":"Hôtel de vente des mineurs","mapId":141347,"realMapId":0,"x":-20,"y":35,"outdoor":true,"subareaId":508,"worldMapId":1,"teleporterCost":20},{"id":3021,"categoryId":4,"gfx":408,"nameId":"Taverne du Bwork","mapId":142367,"realMapId":0,"x":-22,"y":31,"outdoor":true,"subareaId":505,"worldMapId":1,"teleporterCost":20},{"id":2772,"categoryId":3,"gfx":304,"nameId":"Atelier des boulangers","mapId":142880,"realMapId":0,"x":-23,"y":32,"outdoor":true,"subareaId":505,"worldMapId":1,"teleporterCost":20},{"id":2921,"categoryId":2,"gfx":214,"nameId":"Hôtel de vente des sculpteurs","mapId":141863,"realMapId":0,"x":-21,"y":39,"outdoor":true,"subareaId":502,"worldMapId":1,"teleporterCost":20},{"id":2917,"categoryId":2,"gfx":205,"nameId":"Hôtel de vente des bûcherons","mapId":142376,"realMapId":0,"x":-22,"y":40,"outdoor":true,"subareaId":502,"worldMapId":1,"teleporterCost":20},{"id":2946,"categoryId":3,"gfx":315,"nameId":"Atelier des tailleurs","mapId":143396,"realMapId":0,"x":-24,"y":36,"outdoor":true,"subareaId":507,"worldMapId":1,"teleporterCost":20},{"id":2924,"categoryId":2,"gfx":213,"nameId":"Hôtel de vente des ressources","mapId":143906,"realMapId":0,"x":-25,"y":34,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":3030,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":144419,"realMapId":0,"x":-26,"y":35,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":3019,"categoryId":4,"gfx":415,"nameId":"Place Marchande","mapId":144932,"realMapId":0,"x":-27,"y":36,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":2776,"categoryId":3,"gfx":303,"nameId":"Atelier des bouchers et des chasseurs","mapId":145952,"realMapId":0,"x":-29,"y":32,"outdoor":true,"subareaId":503,"worldMapId":1,"teleporterCost":20},{"id":2937,"categoryId":4,"gfx":408,"nameId":"Taverne Atolmond","mapId":145952,"realMapId":0,"x":-29,"y":32,"outdoor":true,"subareaId":503,"worldMapId":1,"teleporterCost":20},{"id":3024,"categoryId":4,"gfx":408,"nameId":"Taverne du Chabrulé","mapId":144425,"realMapId":0,"x":-26,"y":41,"outdoor":true,"subareaId":506,"worldMapId":1,"teleporterCost":20},{"id":2866,"categoryId":2,"gfx":202,"nameId":"Hôtel de vente des bijoutiers","mapId":144935,"realMapId":0,"x":-27,"y":39,"outdoor":true,"subareaId":506,"worldMapId":1,"teleporterCost":20},{"id":2799,"categoryId":4,"gfx":417,"nameId":"Bibliothèque","mapId":145445,"realMapId":0,"x":-28,"y":37,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":2989,"categoryId":2,"gfx":221,"nameId":"Hôtel de vente des documents","mapId":145445,"realMapId":0,"x":-28,"y":37,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":2823,"categoryId":3,"gfx":302,"nameId":"Atelier des bijoutiers","mapId":145447,"realMapId":0,"x":-28,"y":39,"outdoor":true,"subareaId":506,"worldMapId":1,"teleporterCost":20},{"id":2743,"categoryId":2,"gfx":212,"nameId":"Hôtel de vente des poissonniers et des pêcheurs","mapId":140839,"realMapId":0,"x":-19,"y":39,"outdoor":true,"subareaId":534,"worldMapId":1,"teleporterCost":20},{"id":3005,"categoryId":2,"gfx":208,"nameId":"Hôtel de vente des forgerons","mapId":141859,"realMapId":0,"x":-21,"y":35,"outdoor":true,"subareaId":508,"worldMapId":1,"teleporterCost":20},{"id":2741,"categoryId":2,"gfx":210,"nameId":"Hôtel de vente des paysans","mapId":143392,"realMapId":0,"x":-24,"y":32,"outdoor":true,"subareaId":505,"worldMapId":1,"teleporterCost":20},{"id":2942,"categoryId":4,"gfx":408,"nameId":"Taverne de la Misère","mapId":142375,"realMapId":0,"x":-22,"y":39,"outdoor":true,"subareaId":502,"worldMapId":1,"teleporterCost":20},{"id":2894,"categoryId":2,"gfx":207,"nameId":"Hôtel de vente des cordonniers","mapId":142885,"realMapId":0,"x":-23,"y":37,"outdoor":true,"subareaId":507,"worldMapId":1,"teleporterCost":20},{"id":2941,"categoryId":4,"gfx":408,"nameId":"Taverne de Djaul","mapId":143395,"realMapId":0,"x":-24,"y":35,"outdoor":true,"subareaId":507,"worldMapId":1,"teleporterCost":20},{"id":2766,"categoryId":3,"gfx":301,"nameId":"Atelier des alchimistes","mapId":142888,"realMapId":0,"x":-23,"y":40,"outdoor":true,"subareaId":531,"worldMapId":1,"teleporterCost":20},{"id":2957,"categoryId":4,"gfx":416,"nameId":"Tour de Brâkmar","mapId":144418,"realMapId":0,"x":-26,"y":34,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":2912,"categoryId":2,"gfx":203,"nameId":"Hôtel de vente des bouchers et des chasseurs","mapId":144928,"realMapId":0,"x":-27,"y":32,"outdoor":true,"subareaId":503,"worldMapId":1,"teleporterCost":20},{"id":3004,"categoryId":4,"gfx":401,"nameId":"Banque","mapId":144931,"realMapId":0,"x":-27,"y":35,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":2737,"categoryId":4,"gfx":411,"nameId":"Arène","mapId":144934,"realMapId":0,"x":-27,"y":38,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":3011,"categoryId":2,"gfx":217,"nameId":"Hôtel des ventes d'âmes","mapId":144934,"realMapId":0,"x":-27,"y":38,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":2925,"categoryId":2,"gfx":220,"nameId":"Hôtel de vente des runes","mapId":145444,"realMapId":0,"x":-28,"y":36,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":3344,"categoryId":3,"gfx":308,"nameId":"Atelier des forgemages","mapId":145444,"realMapId":0,"x":-28,"y":36,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":20},{"id":2913,"categoryId":2,"gfx":222,"nameId":"Hôtel de vente des bricoleurs","mapId":145954,"realMapId":0,"x":-29,"y":34,"outdoor":true,"subareaId":509,"worldMapId":1,"teleporterCost":20},{"id":2907,"categoryId":3,"gfx":309,"nameId":"Atelier des forgerons","mapId":141858,"realMapId":0,"x":-21,"y":34,"outdoor":true,"subareaId":508,"worldMapId":1,"teleporterCost":20},{"id":2909,"categoryId":2,"gfx":204,"nameId":"Hôtel de vente des boulangers","mapId":142368,"realMapId":0,"x":-22,"y":32,"outdoor":true,"subareaId":505,"worldMapId":1,"teleporterCost":20},{"id":2810,"categoryId":3,"gfx":317,"nameId":"Atelier des bricoleurs","mapId":146467,"realMapId":0,"x":-30,"y":35,"outdoor":true,"subareaId":509,"worldMapId":1,"teleporterCost":20},{"id":2793,"categoryId":3,"gfx":312,"nameId":"Atelier des poissonniers et des pêcheurs","mapId":141351,"realMapId":0,"x":-20,"y":39,"outdoor":true,"subareaId":534,"worldMapId":1,"teleporterCost":20},{"id":2873,"categoryId":3,"gfx":310,"nameId":"Atelier des mineurs","mapId":141346,"realMapId":0,"x":-20,"y":34,"outdoor":true,"subareaId":508,"worldMapId":1,"teleporterCost":20}]}
                                    clearTimeout(moveToZaapiTimeout)
                                    let mapidok = false
                                    for (let xcxc = 0; xcxc < e.mapIds.length; xcxc++) {
                                        if(mapid == e.mapIds[xcxc]){
                                            mapidok = true
                                        }
                                    }

                                    if(mapidok){
                                        let subscriptionsIso = []
            
                                        let isoengineSubscribe = (packet, msg) => {
                                            subscriptionsIso.unshift(
                                                [packet, msg]
                                            )
                                            this.wGame.isoEngine.on(packet, msg);
                                        }
                                        isoengineSubscribe('mapLoaded',(packet) =>{
                                            this.wGame.isoEngine.removeListener(subscriptionsIso[0][0], subscriptionsIso[0][1])
                                            setTimeout(() => {
                                                resolve(1)
                                            }, this.api.randomIntFromInterval(500,1000))
                                        })
                                        setTimeout(() => {
                                            this.wGame.dofus.sendMessage("TeleportRequestMessage", {
                                                teleporterType: e.teleporterType,
                                                mapId:mapid
                                            })
                                        }, this.api.randomIntFromInterval(500,1000))
                                    }else{
                                        resolve(-2)
                                    }
                                })
                            }
                        }
                    }
            }
            if(!trouver)
                resolve(-1)
        })
    }

    public async prendreZaap(mapid){
        return new Promise(async (resolve, reject) => {
            await this.timeoutResolveV2(800)
            if(mapid == this.wGame.isoEngine.mapRenderer.mapId){
                //deja sur la map du zaap
                setTimeout(() => {
                    resolve(1)
                }, this.api.randomIntFromInterval(500,1000))
            }else{
                let allInteractive = this.wGame.isoEngine._getAllInteractives()
                let interas = this.wGame.isoEngine.mapRenderer.interactiveElements
                let trouver = false
                for (const elem of allInteractive) {
                    if(interas[elem.id] != undefined)
                        if(interas[elem.id]._name == 'Zaap'){
                            if(interas[elem.id].enabledSkills.length>0){
                                if(interas[elem.id].enabledSkills[0]._name == 'Utiliser'){
                                    trouver = true
                                    this.wGame.isoEngine._useInteractive(interas[elem.id].elementId,interas[elem.id].enabledSkills[0].skillInstanceUid)
                                    let moveToZaapTimeout = setTimeout(() => {
                                        resolve(-1)
                                    }, 15000)
                                    this.once(this.wGame.dofus.connectionManager, 'ZaapListMessage', (e: any) => {// zaap ouvert
                                        //4{"_messageType":"ZaapListMessage","teleporterType":0,"mapIds":[54172489,123994624,68552706,800,147768,129894405,88212481,125961474,141588,84674563,144419,73400320,88082704,143372,138012,120587009,20973313,115083777,133896,99615238,88085249,68419587,108789760,54172969,154642,95422468,88213271,84806401,88212746,73400325,54161193],"subAreaIds":[603,812,180,30,513,823,170,815,524,95,511,182,5,526,54,808,469,797,2,161,490,1,616,601,466,32,10,178,22,235,651],"costs":[870,710,190,100,420,330,470,680,150,90,610,260,310,390,90,180,620,600,150,350,470,220,800,750,570,520,230,0,360,310,530],"destTeleporterType":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],"spawnMapId":84806401,"_isInitialized":true,"_subAreas":[{"id":603,"name":"Le village enseveli","areaId":48,"areaName":"Île de Frigost"},{"id":812,"name":"Bayou d'Orado","areaId":53,"areaName":"Île d'Orado"},{"id":180,"name":"Le château d'Amakna","areaId":0,"areaName":"Amakna"},{"id":30,"name":"Le berceau","areaId":4,"areaName":"Tainéla"},{"id":513,"name":"Centre-ville","areaId":7,"areaName":"Bonta"},{"id":823,"name":"Cimetière de Bonta","areaId":8,"areaName":"Plaine de Cania"},{"id":170,"name":"Plaine des Scarafeuilles","areaId":0,"areaName":"Amakna"},{"id":815,"name":"Temple de l'Ascension","areaId":53,"areaName":"Île d'Orado"},{"id":524,"name":"Route de la Roche","areaId":8,"areaName":"Plaine de Cania"},{"id":95,"name":"Cité d'Astrub","areaId":18,"areaName":"Astrub"},{"id":511,"name":"Centre-ville","areaId":11,"areaName":"Brâkmar"},{"id":182,"name":"Village des Eleveurs","areaId":28,"areaName":"Montagne des Koalaks"},{"id":5,"name":"Le coin des Bouftous","areaId":0,"areaName":"Amakna"},{"id":526,"name":"Route Sombre","areaId":12,"areaName":"Landes de Sidimote"},{"id":54,"name":"Massif de Cania","areaId":8,"areaName":"Plaine de Cania"},{"id":808,"name":"Mont Nésélite","areaId":8,"areaName":"Plaine de Cania"},{"id":469,"name":"Village de la Canopée","areaId":46,"areaName":"Île d'Otomaï"},{"id":797,"name":"Temple des alliances","areaId":5,"areaName":"Sufokia"},{"id":2,"name":"La montagne des Craqueleurs","areaId":0,"areaName":"Amakna"},{"id":161,"name":"Île de la Cawotte","areaId":1,"areaName":"L'île des Wabbits"},{"id":490,"name":"Rivage du golfe sufokien","areaId":0,"areaName":"Amakna"},{"id":1,"name":"Port de Madrestam","areaId":0,"areaName":"Amakna"},{"id":616,"name":"Entrée du château de Harebourg","areaId":48,"areaName":"Île de Frigost"},{"id":601,"name":"La bourgade","areaId":48,"areaName":"Île de Frigost"},{"id":466,"name":"Le village côtier","areaId":46,"areaName":"Île d'Otomaï"},{"id":32,"name":"Sufokia","areaId":5,"areaName":"Sufokia"},{"id":10,"name":"Le village","areaId":0,"areaName":"Amakna"},{"id":178,"name":"Plaine des Porkass","areaId":8,"areaName":"Plaine de Cania"},{"id":22,"name":"Bord de la forêt maléfique","areaId":0,"areaName":"Amakna"},{"id":235,"name":"Territoire des Dragodindes Sauvages","areaId":28,"areaName":"Montagne des Koalaks"},{"id":651,"name":"Plaine de Sakaï","areaId":49,"areaName":"Île de Sakaï"}],"_maps":[{"id":54172489,"posX":-77,"posY":-73},{"id":123994624,"posX":-75,"posY":-9},{"id":68552706,"posX":3,"posY":-5},{"id":800,"posX":1,"posY":-32},{"id":147768,"posX":-32,"posY":-56},{"id":129894405,"posX":-19,"posY":-53},{"id":88212481,"posX":-1,"posY":24},{"id":125961474,"posX":-73,"posY":-17},{"id":141588,"posX":-20,"posY":-20},{"id":84674563,"posX":4,"posY":-19},{"id":144419,"posX":-26,"posY":35},{"id":73400320,"posX":-16,"posY":1},{"id":88082704,"posX":5,"posY":7},{"id":143372,"posX":-24,"posY":12},{"id":138012,"posX":-13,"posY":-28},{"id":120587009,"posX":-23,"posY":-19},{"id":20973313,"posX":-54,"posY":16},{"id":115083777,"posX":13,"posY":35},{"id":133896,"posX":-5,"posY":-8},{"id":99615238,"posX":25,"posY":-4},{"id":88085249,"posX":10,"posY":22},{"id":68419587,"posX":7,"posY":-4},{"id":108789760,"posX":-67,"posY":-75},{"id":54172969,"posX":-78,"posY":-41},{"id":154642,"posX":-46,"posY":18},{"id":95422468,"posX":13,"posY":26},{"id":88213271,"posX":-2,"posY":0},{"id":84806401,"posX":-5,"posY":-23},{"id":88212746,"posX":-1,"posY":13},{"id":73400325,"posX":-16,"posY":6},{"id":54161193,"posX":-55,"posY":-41}],"_hints":[{"id":3152,"categoryId":4,"gfx":403,"nameId":"Eglise","mapId":54172489,"realMapId":0,"x":-77,"y":-73,"outdoor":true,"subareaId":603,"worldMapId":1,"teleporterCost":870},{"id":3153,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":54172489,"realMapId":0,"x":-77,"y":-73,"outdoor":true,"subareaId":603,"worldMapId":1,"teleporterCost":870},{"id":3291,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":123994624,"realMapId":0,"x":-75,"y":-9,"outdoor":true,"subareaId":812,"worldMapId":1,"teleporterCost":710},{"id":2850,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":800,"realMapId":0,"x":1,"y":-32,"outdoor":true,"subareaId":30,"worldMapId":1,"teleporterCost":100},{"id":3031,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":147768,"realMapId":0,"x":-32,"y":-56,"outdoor":true,"subareaId":513,"worldMapId":1,"teleporterCost":420},{"id":3312,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":129894405,"realMapId":0,"x":-19,"y":-53,"outdoor":true,"subareaId":823,"worldMapId":1,"teleporterCost":330},{"id":3033,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":141588,"realMapId":0,"x":-20,"y":-20,"outdoor":true,"subareaId":524,"worldMapId":1,"teleporterCost":150},{"id":3030,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":144419,"realMapId":0,"x":-26,"y":35,"outdoor":true,"subareaId":511,"worldMapId":1,"teleporterCost":610},{"id":3034,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":143372,"realMapId":0,"x":-24,"y":12,"outdoor":true,"subareaId":526,"worldMapId":1,"teleporterCost":390},{"id":3213,"categoryId":4,"gfx":900,"nameId":"Passage vers Brâkmar","mapId":143372,"realMapId":0,"x":-24,"y":12,"outdoor":true,"subareaId":526,"worldMapId":1,"teleporterCost":390},{"id":3183,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":138012,"realMapId":0,"x":-13,"y":-28,"outdoor":true,"subareaId":54,"worldMapId":1,"teleporterCost":90},{"id":3274,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":120587009,"realMapId":0,"x":-23,"y":-19,"outdoor":true,"subareaId":808,"worldMapId":1,"teleporterCost":180},{"id":3261,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":20973313,"realMapId":0,"x":-54,"y":16,"outdoor":true,"subareaId":469,"worldMapId":10,"teleporterCost":620},{"id":3235,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":115083777,"realMapId":0,"x":13,"y":35,"outdoor":true,"subareaId":797,"worldMapId":1,"teleporterCost":600},{"id":2842,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":133896,"realMapId":0,"x":-5,"y":-8,"outdoor":true,"subareaId":2,"worldMapId":1,"teleporterCost":150},{"id":3222,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":108789760,"realMapId":0,"x":-67,"y":-75,"outdoor":true,"subareaId":616,"worldMapId":12,"teleporterCost":800},{"id":3101,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":54172969,"realMapId":0,"x":-78,"y":-41,"outdoor":true,"subareaId":601,"worldMapId":1,"teleporterCost":750},{"id":3026,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":154642,"realMapId":0,"x":-46,"y":18,"outdoor":true,"subareaId":466,"worldMapId":1,"teleporterCost":570},{"id":3201,"categoryId":4,"gfx":410,"nameId":"Zaap","mapId":95422468,"realMapId":0,"x":13,"y":26,"outdoor":true,"subareaId":32,"worldMapId":1,"teleporterCost":520},{"id":3336,"categoryId":4,"gfx":433,"nameId":"Diligence - Village des Éleveurs","mapId":73400325,"realMapId":0,"x":-16,"y":6,"outdoor":true,"subareaId":235,"worldMapId":1,"teleporterCost":310},{"id":3232,"categoryId":4,"gfx":412,"nameId":"Transporteur frigostien","mapId":54161193,"realMapId":0,"x":-55,"y":-41,"outdoor":true,"subareaId":651,"worldMapId":1,"teleporterCost":530}]}
                                        clearTimeout(moveToZaapTimeout)
                                        let mapidok = false
                                        for (let xcxc = 0; xcxc < e.mapIds.length; xcxc++) {
                                            if(mapid == e.mapIds[xcxc]){
                                                mapidok = true
                                            }
                                        }
    
                                        if(mapidok){
                                            let subscriptionsIso = []
                
                                            let isoengineSubscribe = (packet, msg) => {
                                                subscriptionsIso.unshift(
                                                    [packet, msg]
                                                )
                                                this.wGame.isoEngine.on(packet, msg);
                                            }
                                            isoengineSubscribe('mapLoaded',(packet) =>{
                                                this.wGame.isoEngine.removeListener(subscriptionsIso[0][0], subscriptionsIso[0][1])
                                                setTimeout(() => {
                                                    resolve(1)
                                                }, this.api.randomIntFromInterval(500,1000))
                                            })
                                            setTimeout(() => {
                                                this.wGame.dofus.sendMessage("TeleportRequestMessage", {
                                                    teleporterType: e.teleporterType,
                                                    mapId:mapid
                                                })
                                            }, this.api.randomIntFromInterval(500,1000))
                                        }else{
                                            this.api.betterLogger('zaap coins des bouftou non découvert')
                                            resolve(-2)
                                        }
                                    })
                                }
                            }
                        }
                }
                if(!trouver)
                    resolve(-1)
            }
        })
    }

    public async useInteractiveChangeMap(elemId, posSave = -1,posSaveReal = -1, timeoutAttente = 2000, timeoutmilieu = 750) {
        return new Promise(async (resolve, reject) => {
            if (this.wGame.gui.playerData.inventory.isOverloaded()) {
                //this.api.sendMessagePartyOverload()
                return reject("overload");
            }else{
                await this.timeoutResolveV2(timeoutAttente)
                await this.api.seDeplacer(this.api.getClosestAvailableCellOnMap())
                await this.api.patienter(timeoutmilieu)
                
                const timeout = setTimeout(async () => {
                    this.unsubscribeLastIso();
                    //on essaye de cliquer "a la main" sur la cell
                    if(posSave == -1 || posSaveReal == -1){
                        return reject("TIMEOUT USE INTERACTIVE");
                    }
                    await this.api.seDeplacer(posSave)
                    await this.api.patienter(2000)
                    await this.api.seDeplacer(posSaveReal)
                    await this.api.patienter(4000)
                    return this.timeoutResolve(resolve,this.delay);
                }, 10000);
        
                this.isoEngineSubscribe('mapLoaded', (packet) => {
                    this.unsubscribeLastIso();
                    clearTimeout(timeout);
                    return this.timeoutResolve(resolve,this.delay)
                });
        
                await this.useInteractive(elemId);
            }
        })
    }

    public reset() {
        super.reset()
        this.finder.reset()
        Logger.info(' - Mover deactiver')
    }
}