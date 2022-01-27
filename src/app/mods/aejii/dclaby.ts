import { Mod } from "../mod"

import {ShortcutsHelper} from "@helpers/shortcuts.helper"
import {API} from "./api"

import * as util from 'util'
import { inspect } from 'util'
import { isDevMode } from "@angular/core"
import { TranslateService } from "@ngx-translate/core"
import {SettingsService} from "@services/settings.service"

const crypto = cryptoLib

export class DcLaby extends Mod{

    private api: API
    public checkSiMort:boolean
    private haveStart:boolean

    private intervalCheck

    private debut
    private resetTimer

    startMod(): void {
        return
    }
    
    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api = api
        this.checkSiMort = false
        this.haveStart = false
        this.resetTimer = true
        Logger.info("- dclaby active")
        this.wGame.gui.npcDialogUi.on("opened",this.talkToNpc);
        this.wGame.isoEngine.on("mapLoaded", this.mapLoaded);
    }

    private talkToNpc = () => {
        setTimeout(() => {//on est pas des machines quand meme
            switch (this.wGame.gui.npcDialogHandler.replyIds[0]) {
                case 2853:
                    this.wGame.gui.npcDialogUi._sendReply(0);
                  break;
                default:
                  break;
              }
        }, this.api.randomIntFromInterval(100,500));
    }

    private mapLoaded = () => {
        setTimeout(async () => {
            let bool = this.checkStartup()
            if(bool){
                switch (this.wGame.isoEngine.mapRenderer.mapId) {
                    case 72089600:
                        //if(!this.haveStart){
                            this.haveStart = true
                            if(this.resetTimer){
                                this.resetTimer = false
                                this.debut = new Date().getTime()
                            }
                            await this.prendreDalle()
                            await this.bougerDansLaby()
                            this.haveStart = false
                        //}
                        break;
                
                    default:
                        break;
                }
            }
        }, 50);
        
    }

    private bougerDansLaby() {
        return new Promise(async (resolve, reject) => {
            //le dj est 4,35, la "carte est" de 2,33 a 6,37
            let xPlayer = this.wGame.gui.playerData.position.mapPosition.posX
            let yPlayer = this.wGame.gui.playerData.position.mapPosition.posY
            
            //vérifier quelle porte ouverte
            let listePorte = {
                'top': false,
                'bottom': false,
                'left': false,
                'right': false,
            }
            let key = Object.keys(this.wGame.isoEngine.mapRenderer.identifiedElements)
            for (let index = 0; index < key.length; index++) {
                const obj = this.wGame.isoEngine.mapRenderer.identifiedElements[key[index]];
                switch (obj._position) {
                    case 201://top
                        if(obj.state == 1){//ouverte
                            listePorte['top'] = true
                        }
                        break;
                    case 177://right
                        if(obj.state == 1){
                            listePorte['right'] = true
                        }
                        break;
                    case 353://left
                        if(obj.state == 1){
                            listePorte['left'] = true
                        }
                        break;
                    case 387://bottom
                        if(obj.state == 1){
                            listePorte['bottom'] = true
                        }
                        break;
                    default:
                        break;
                }
            }

            if(listePorte['top'] || listePorte['bottom'] || listePorte['left'] || listePorte['right']){
                //le but c'est de ce rapprocher en x et y du dc, si pas possible et porte fermé, "priorité" pour s'eloigner le moins possible
                if(xPlayer>4){//droite du laby
                    if(listePorte['left']){
                        await this.changerDeSalle('left')
                    }else if(listePorte['top'] || listePorte['bottom']){
                        if(listePorte['top'] && !listePorte['bottom']){
                            await this.changerDeSalle('top')
                        }else if(!listePorte['top'] && listePorte['bottom']){
                            await this.changerDeSalle('bottom')
                        }else{
                            if(yPlayer>35){
                                if(listePorte['top']){//prio top
                                    await this.changerDeSalle('top')
                                }else{
                                    await this.changerDeSalle('bottom')
                                }
                            }else if(yPlayer<35){
                                if(listePorte['bottom']){//prio bottom
                                    await this.changerDeSalle('bottom')
                                }else{
                                    await this.changerDeSalle('top')
                                }
                            }else{
                                //on ne peut pas aller dans la direction opti ni opposer et on est "aligner avec le dj et 2 porte "non alligné" ouverte "
                                let rng = this.api.randomIntFromInterval(0,1)
                                if(rng == 1){
                                    await this.changerDeSalle('top')
                                }else{
                                    await this.changerDeSalle('bottom')
                                }
                            }
                        }
                    }else{//aie aie aie on va a "contre directino"
                        await this.changerDeSalle('right')
                    }
                }else if(xPlayer<4){//gauche du laby
                    if(listePorte['right']){
                        await this.changerDeSalle('right')
                    }else if(listePorte['top'] || listePorte['bottom']){
                        if(listePorte['top'] && !listePorte['bottom']){
                            await this.changerDeSalle('top')
                        }else if(!listePorte['top'] && listePorte['bottom']){
                            await this.changerDeSalle('bottom')
                        }else{
                            if(yPlayer>35){
                                if(listePorte['top']){//prio top
                                    await this.changerDeSalle('top')
                                }else{
                                    await this.changerDeSalle('bottom')
                                }
                            }else if(yPlayer<35){
                                if(listePorte['bottom']){//prio bottom
                                    await this.changerDeSalle('bottom')
                                }else{
                                    await this.changerDeSalle('top')
                                }
                            }else{
                                //on ne peut pas aller dans la direction opti ni opposer et on est "aligner avec le dj et 2 porte "non alligné" ouverte "
                                let rng = this.api.randomIntFromInterval(0,1)
                                if(rng == 1){
                                    await this.changerDeSalle('top')
                                }else{
                                    await this.changerDeSalle('bottom')
                                }
                            }
                        }
                    }else{//aie aie aie on va a "contre directino"
                        await this.changerDeSalle('left')
                    }
                }else if(yPlayer>35){//bas du laby
                    if(listePorte['top']){
                        await this.changerDeSalle('top')
                    }else if(listePorte['left'] || listePorte['right']){
                        if(listePorte['left'] && !listePorte['right']){
                            await this.changerDeSalle('left')
                        }else if(!listePorte['left'] && listePorte['right']){
                            await this.changerDeSalle('right')
                        }else{
                            if(xPlayer>4){
                                if(listePorte['left']){//prio left
                                    await this.changerDeSalle('left')
                                }else{
                                    await this.changerDeSalle('right')
                                }
                            }else if(xPlayer<4){
                                if(listePorte['right']){//prio right
                                    await this.changerDeSalle('right')
                                }else{
                                    await this.changerDeSalle('left')
                                }
                            }else{
                                //on ne peut pas aller dans la direction opti ni opposer et on est "aligner avec le dj et 2 porte "non alligné" ouverte "
                                let rng = this.api.randomIntFromInterval(0,1)
                                if(rng == 1){
                                    await this.changerDeSalle('left')
                                }else{
                                    await this.changerDeSalle('right')
                                }
                            }
                        }
                    }else{//aie aie aie on va a "contre directino"
                        await this.changerDeSalle('bottom')
                    }
                }else if(yPlayer<35){//haut du laby
                    if(listePorte['bottom']){
                        await this.changerDeSalle('bottom')
                    }else if(listePorte['left'] || listePorte['right']){
                        if(listePorte['left'] && !listePorte['right']){
                            await this.changerDeSalle('left')
                        }else if(!listePorte['left'] && listePorte['right']){
                            await this.changerDeSalle('right')
                        }else{
                            if(xPlayer>4){
                                if(listePorte['left']){//prio gauche
                                    await this.changerDeSalle('left')
                                }else{
                                    await this.changerDeSalle('right')
                                }
                            }else if(xPlayer<4){
                                if(listePorte['right']){//prio droite
                                    await this.changerDeSalle('right')
                                }else{
                                    await this.changerDeSalle('left')
                                }
                            }else{
                                //on ne peut pas aller dans la direction opti ni opposer et on est "aligner avec le dj et 2 porte "non alligné" ouverte "
                                let rng = this.api.randomIntFromInterval(0,1)
                                if(rng == 1){
                                    await this.changerDeSalle('left')
                                }else{
                                    await this.changerDeSalle('right')
                                }
                            }
                        }
                    }else{//aie aie aie on va a "contre directino"
                        await this.changerDeSalle('top')
                    }
                }else{
                    //on est arrivé, on ne fais rien
                    Logger.info('on est arrivé')
                    let fin = new Date().getTime()
                    this.resetTimer = true
                    Logger.info((fin-this.debut)+ " ms")
                    this.saveMs(fin-this.debut)
                }
            }else{
                await this.revenirSalleDalle()
            }
            resolve(1)
        })
    }

    private changerDeSalle(direction){
        return new Promise(async (resolve, reject) => {
            let listePorte = {
                'top': false,
                'bottom': false,
                'left': false,
                'right': false,
            }
            let key = Object.keys(this.wGame.isoEngine.mapRenderer.identifiedElements)
            for (let index = 0; index < key.length; index++) {
                const obj = this.wGame.isoEngine.mapRenderer.identifiedElements[key[index]];
                switch (obj._position) {
                    case 201://top
                        if(obj.state == 1){//ouverte
                            listePorte['top'] = true
                        }
                        break;
                    case 177://right
                        if(obj.state == 1){
                            listePorte['right'] = true
                        }
                        break;
                    case 353://left
                        if(obj.state == 1){
                            listePorte['left'] = true
                        }
                        break;
                    case 387://bottom
                        if(obj.state == 1){
                            listePorte['bottom'] = true
                        }
                        break;
                    default:
                        break;
                }
            }
            //on recupere si porte ouverte ou pas (et qu'on a pas été volé :()
            if(listePorte[direction]){
                let cellIdDestination
                switch (direction) {
                    case 'top':
                        cellIdDestination = 186
                        break;
                    case 'bottom':
                        cellIdDestination = 402
                        break;
                    case 'left':
                        cellIdDestination = 380
                        break;
                    case 'right':
                        cellIdDestination = 178
                        break;
                    default:
                        break;
                }
                this.api.pathfinder.resetPath()
                this.api.pathfinder.fillPathGrid(this.wGame.isoEngine.mapRenderer.map)
                let path = this.api.pathfinder.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, cellIdDestination, 
                    this.api.getOccupiedCellNotToBeAggressed(), false, false)
                if(this.api.mover.isAggressiveOnMap()){
                    //check si monstre a coté de nous
                    let notreCell = this.wGame.isoEngine.actorManager.userActor.cellId
                    let cellAggro = this.getCellAggro()
                    let onEstNikéOuPas = false
                    for (let index = 0; index < cellAggro.length; index++) {
                        if(cellAggro[index] == notreCell){
                            onEstNikéOuPas = true
                        }
                    }
                    if(onEstNikéOuPas){
                        await this.revenirSalleDalle()
                    }else{
                        await this.moveTo(path)
                        await this.bougerDansLaby()
                    }
                }else{
                    await this.api.mover.changeMapCell(path[path.length-1])
                    await this.bougerDansLaby()
                }
            }else{
                //Logger.info('on nous a voler notre porte :(')
                await this.bougerDansLaby()
            }
            resolve(1)
        })
    }

    private moveTo(path) {
        return new Promise(async (resolve, reject) => {
            //pour aller plus vite si on n'esquive pas les mob
            let fini = false
            let timeoutVole = setTimeout(() => {//si jamais un mec arrive a nous voler notre porte
                fini = true
                resolve(1)
            }, 20000)
            //let pathNormal = this.api.pathfinder.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, path[path.length-1], 
            //    this.wGame.isoEngine.actorManager._occupiedCells, false, false)
            //if(path.every(v1 => pathNormal.includes(v1))){

            //avec mise a jour anti aggro plus de pb (normalement lul)
            await this.api.mover.changeMapCell(path[path.length-1])
            //}else{
            //    for (let index = 0; index < path.length-2; index++) {//on ne click pas les 2 dernieres case du path
            //        await this.click(path[index])
            //    }
            //    await this.api.mover.changeMapCell(path[path.length-1])//pour avoir le "chargement" de la map
            //}
            if(!fini){
                clearTimeout(timeoutVole)
                resolve(1)
            }
        })
    }

    private click(cellId) {
        return new Promise(async (resolve, reject) => {
            this.wGame.isoEngine._movePlayerOnMap(cellId, true, () => {
                resolve(1)
            })
        })
    }

    private saveMs(ms) {
        /*var k = new XMLHttpRequest()
        const gdgr = 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF4bWVkSjd6ZmxkZnJtVjBKY2FxZ01PSFJZNHR2a245KzJ4U2dLMXVxMFkyRnZGU1NHR1F5eE9GM1BVdS9OQ1ptSldpWXRqOGo3NWE2RHlQZUk2eTU0NmxqcnpwRFlTZ1hpbWJ5dWNTbUpBbHp0Z1JyYVhJV2YzUWtBemVTNFcweGZSeWMwelVNd2VrOXpjY2tXYUs0Sm1yWXBCMkhwOHltRkRZL0N1ZExHUWErUTNQU09sc3VVL3NrZmM1aWFNdEk2cXhlSkR1L291WkpZOW1FVEVOd041ZDdiVVdNMzZhUmx0eXlhVjlFSnhGYUE1Y3QxRHVNU0FGVHMrbERCdjUzY0Z2dWtxOVU3NzFtOTE3ZjArc2I2eUlkOVBzaDFDbTVubStNQ2N2aS9UM3ZWNGRzYWh0Wk5aNHdUYjV0d3BTTG9EUHIxc3pkMFMrbkNtZlY4QjY5M3dJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t'

        var q = (ohoh) => {
            var g = Buffer.from(ohoh);
            var y = crypto.publicEncrypt(Buffer.from(gdgr, 'base64').toString('ascii'), g)
            return y.toString("base64")
        };
        let data = q('labydc!' + ms + '!' + this.wGame.gui.playerData.loginName)
        var param = 'data='+data
        var req
        if(isDevMode()){
            req = 'aHR0cDovLzEyNy4wLjAuMTo4MDgxL3N0YXRzTXM=';
        }else{
            req = 'aHR0cHM6Ly9hZWppaS5tZS9zdGF0c01z'
        }
    
        k.open('POST', Buffer.from(req, 'base64').toString('ascii'), true)//cheh le mitm
        k.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
        k.send(param);*/
    }

    private getCellAggro() {
        let cellAggro = []
        let cellIdsAGGRESSIVEetVOISINE = []
        for (let bvbvbvbvb = 0; bvbvbvbvb < this.wGame.isoEngine._getAllInteractives().length; bvbvbvbvb++) {
            let aggressive = false
            let mob = null
            var c = this.wGame.isoEngine._getAllInteractives()[bvbvbvbvb];
            if (c.data && c.data.type == "GameRolePlayGroupMonsterInformations") {
                mob = c
            }
            if(mob){
                aggressive = this.api.mover.agressives.indexOf(mob.data.staticInfos.mainCreatureLightInfos.creatureGenericId) != -1
                var mobs = mob.data.staticInfos.underlings
                for (var k = 0; k < mobs.length; k++) {
                    if (this.api.mover.agressives.indexOf(mobs[k].creatureGenericId) != -1) {
                        aggressive = true
                    }
                }
            }
            if (aggressive) {
                cellAggro.push(mob.cellId)
            }
        }
        //on récup les cases voisines du monstre (radius 1?)
        for (var r = 0; r < cellAggro.length; r++) {
			var cells = this.api.getCellsNotToBeAggressed(cellAggro[r]);
			for (var m = 0; m < cells.length; m++) {
				if (cells[m] > 0) {
					cellIdsAGGRESSIVEetVOISINE.push(cells[m]);
				}
			}
        }
        //on récup les cases voisines du monstre (radius 2?)
        var tmp = cellIdsAGGRESSIVEetVOISINE.slice(0);
		for (var i = 0; i < tmp.length; i++) {
			var cells = this.api.getCellsNotToBeAggressed(tmp[i], false);
			for (var m = 0; m < cells.length; m++) {
				if (cells[m] > 0) {
					cellIdsAGGRESSIVEetVOISINE.push(cells[m]);
				}
			}
        }
        cellIdsAGGRESSIVEetVOISINE.filter(function (item, index, inputArray) {
			return inputArray.indexOf(item) == index;
        })
        return cellIdsAGGRESSIVEetVOISINE
    }

    private prendreDalle() {
        return new Promise(async (resolve, reject) => {
            let rng = this.api.randomIntFromInterval(1,16)
            let tableauAssociatif = {//l'ordre n'est pas ordonnée (du random dans du random :))
                '1': 327,
                '2': 314,
                '3': 300,
                '4': 287,
                '5': 273,
                '6': 342,
                '7': 356,
                '8': 371,
                '9': 385,
                '10': 288,
                '11': 372,
                '12': 358,
                '13': 345,
                '14': 331,
                '15': 317,
                '16': 302,
            }
            let cibleDalleCellId = tableauAssociatif[rng]
            await this.api.mover.changeMapCell(cibleDalleCellId)
            resolve(1)
        })
    }

    private async revenirSalleDalle() {
        return new Promise(async (resolve, reject) => {
            await this.parlerPnJ(-1,3)
        })
    }

    private parlerPnJ(npcId,npcActionId){
        return new Promise(async (resolve, reject) => {
            setTimeout(() => {
                this.wGame.isoEngine.actorManager.actors[npcId].openNpcContextualMenu();
                setTimeout(() => {
                    resolve(1)
                }, 500)
            }, 500)
        })
    }

    private checkStartup() {
        if(this.wGame.isoEngine != undefined)
            if(this.wGame.isoEngine.mapRenderer != undefined)
                if(this.wGame.isoEngine.mapRenderer.map != undefined){
                    //if(this.wGame.isoEngine.mapRenderer.map.id == 72089600){
                        return true
                    }else{
                        //this.saySomethingInLogChat('on est pas a la salle des dalles, stop')
                        //this.reset()
                        return false
                    }
    }

    private saySomethingInLogChat(text) {
        this.wGame.gui.chat.logMsg(text)
    }
    
    public reset() {
        super.reset()
        clearInterval(this.intervalCheck)
        this.checkSiMort = true
        Logger.info(' - dclaby deactiver')
        
        this.wGame.isoEngine.removeListener("mapLoaded", this.mapLoaded);
        this.wGame.gui.npcDialogUi.removeListener("opened",this.talkToNpc);
    }
}