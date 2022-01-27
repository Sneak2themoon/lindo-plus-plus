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

import { Mod } from "../mod";
import {SettingsService} from "@services/settings.service";

import {ShortcutsHelper} from "@helpers/shortcuts.helper";
import {API} from "./api"

import { DcLaby } from "./dclaby";
import { TranslateService } from "@ngx-translate/core";
import { KoulosseAuto } from "./koulosseAuto";
import { AutoPiloteElyReborn } from "./fauxgps/autoPiloteElyReborn";
import { AntiAggro } from "./antiaggro";
import { EleveurUtils } from "./eleveurUtils";
import { FarmingBase } from "./farming";
import { DialogueAuto } from "./dialogueAuto";
import { Ldv } from "./ldv"
import { FastVente } from "./fastvente"
import { Moreui } from "./moreui"

export class Controller extends Mod{
    startMod(): void {
        return
    }

    private shortcutsHelper: ShortcutsHelper
    
    private api: API

    private needToStop: boolean
    private entraindeVendre: boolean

    //farm
    private cheminFarm
    private indexChemin
    private elemIDEnCours:any
    private tableauRessource = []
    private timeoutRecolte:any
    private farmLancer:boolean
    private recolteLancer:boolean
    private repopvente:boolean

    private dialogueAuto:DialogueAuto
    private dclaby:DcLaby
    private kouloss:KoulosseAuto
    private fauxGPS:AutoPiloteElyReborn
    private antiaggro:AntiAggro
    private ldvAff:Ldv
    private fastVente:FastVente
    
    private moreui:Moreui

    private eleveurUtils: EleveurUtils
    private farmingbase: FarmingBase


    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);

        Logger.info('- enable bot controller')
        this.needToStop = false
        this.indexChemin = 0
        this.elemIDEnCours = -1
        this.tableauRessource = []
        this.cheminFarm = []
        this.farmLancer = false
        this.recolteLancer = false
        this.entraindeVendre = false
        this.repopvente = true

        this.api = api

        this.dialogueAuto = new DialogueAuto(wGame, this.settings, this.translate, this.api)

        this.fauxGPS = new AutoPiloteElyReborn(wGame, this.settings, this.translate, this.api)
        this.antiaggro = new AntiAggro(wGame, this.settings, this.translate, this.api)
        this.ldvAff = new Ldv(this.wGame, this.settings, this.translate, this.api)
        this.moreui = new Moreui(this.wGame, this.settings, this.translate, this.api)
        this.eleveurUtils = new EleveurUtils(wGame, this.settings, this.translate, this.api)
        this.farmingbase = new FarmingBase(wGame, this.settings, this.translate, this.api)

        this.dclaby = new DcLaby(this.wGame, this.settings, this.translate, this.api)
        this.kouloss = new KoulosseAuto(this.wGame, this.settings, this.translate, this.api)
        this.fastVente = new FastVente(this.wGame, this.settings, this.translate, this.api)

        this.metierLevelUp()
        this.quelquUnFaitQuelqueChoseALaRessource()
        this.OnFiniLaRessource()
        this.stopOnFightEndCustomFarm()
        this.setFightStartCustomFarm()
        this.repopEvent()
        
        this.shortcutsHelper = new ShortcutsHelper(this.wGame);
        this.shortcutsHelper.bind('o', () => {
            this.touche()
        })

        //auto achivement
        this.on(this.wGame.dofus.connectionManager, 'AchievementFinishedMessage', (e: any) => {
            setTimeout(() => {
                this.wGame.dofus.sendMessage("AchievementRewardRequestMessage", {
                    achievementId: -1
                }) 
            }, this.api.randomIntFromInterval(2000,3000))
        })
    }

    // fonction lié a une touche clavier pour debug
    private async touche(){
        Logger.info("ae-debug")
        this.api.betterLogger(this.wGame.isoEngine.mapRenderer.map.id)

        /*let int = isoEngine._getAllInteractives()
        for (let index = 0; index < int.length; index++) {
            const element = int[index];
            if(element.id != undefined && element._position != undefined){
                console.log('id:'+element.id+', pos:'+element._position)
            }
        }*/

        
        let spells = this.wGame.gui.playerData.characters.mainCharacter.spellData
        let keys = Object.keys(spells.spells)
        for (let index = 0; index < keys.length; index++) {
            //Logger.info(util.inspect(spells.spells[2849]))
            if(spells.spells[keys[index]].spell != undefined){
                //console.log('id:'+spells.spells[keys[index]].id+', nom:'+spells.spells[keys[index]].spell.nameId)
            }
        }
        Logger.info('fin debug')
    }

    private deconnexion() {
        this.wGame.gui.mainControls.buttonBox._childrenList[14].tap()
        setTimeout(() => {
            for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
                let win = this.wGame.gui.windowsContainer._childrenList[i];
                if (win.isVisible() && win.id == 'global') {
                    win.windowContent._childrenList[1]._childrenList[0]._childrenList[2].tap()
                    setTimeout(() => {
                        for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
                            let win = this.wGame.gui.windowsContainer._childrenList[i];
                            if (win.isVisible() && win.id == 'confirm') {
                                win._buttonYes.tap()
                                setTimeout(() => {
                                    this.wGame.needToKill = true//on ferme l'onglet
                                }, 1000);
                            }
                        }
                    }, 1000);
                    break
                }
            }
        }, 500)
    }

    private vendre(id):any {
        return new Promise((resolve, reject) => {
            if(this.entraindeVendre || this.needToStop){
                Logger.error('je peux pas vendre 2 fois, ou je dois m\'arreter')
                resolve(-1)
            }else{
                this.entraindeVendre = true
                this.once(this.wGame.dofus.connectionManager, 'ExchangeBidhouseMinimumItemPriceListMessage', (e: any) => {// fin combat
                    setTimeout(() => {
                        let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
                        for (let index = 0; index < keys.length; index++) {
                            if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == id && this.wGame.gui.playerData.inventory.objects[keys[index]].quantity>=100){//311 = eau
                                if(e.prices[0]>e.prices[1] || e.prices[1]>e.prices[2]){
                                    Logger.error('wtf le prix de vente coutant a 1 est plus eleve qu a 10 ou 10 > 100 VENTE ANNULE')
                                    this.entraindeVendre = false
                                    resolve(0)
                                }else{
                                    setTimeout(async () => {
                                        if(this.wGame.gui.playerData.inventory.kamas>(e.prices[2]*0.03)){
                                            this.api.sessionInfo[6] += 1
                                            this.api.updateSession()
                                            Logger.info('on vend 100 '+this.wGame.gui.playerData.inventory.objects[keys[index]].item.nameId+' a '+e.prices[2])
                                            this.wGame.dofus.sendMessage("ExchangeObjectMovePricedMessage", {
                                                objectUID: this.wGame.gui.playerData.inventory.objects[keys[index]].objectUID,
                                                quantity: 100,
                                                price: (e.prices[2])
                                            })
                                            setTimeout(() => {
                                                Logger.info('la vente est fini')
                                                this.api.fermerFenetre()
                                                this.entraindeVendre = false
                                                resolve(1)
                                            },this.api.randomIntFromInterval(500,1500))
                                        }else{
                                            Logger.info('on a pas assez d argent pour mettre en vente (taxe 3%)')
                                            this.entraindeVendre = false
                                            resolve(0)
                                        }
                                    },this.api.randomIntFromInterval(500,1500))
                                }
                            }
                        }
                    }, this.api.randomIntFromInterval(500,1500));
                })
        
                this.once(this.wGame.dofus.connectionManager, 'ExchangeStartedBidSellerMessage', (e: any) => {// fin combat
                    //Logger.info('max : '+e.sellerDescriptor.maxItemPerAccount)
                    //Logger.info('actuel : '+e.objectsInfos.length)
                    Logger.info('e.sellerDescriptor.maxItemPerAccount:'+e.sellerDescriptor.maxItemPerAccount+', e.objectsInfos.length:'+e.objectsInfos.length)
                    if(e.sellerDescriptor.maxItemPerAccount <= e.objectsInfos.length){
                        Logger.error('trop d item mis en vente')
                        this.entraindeVendre = false
                        resolve(0)
                    }
                })
    
                setTimeout(() => {
                    Logger.info('on lance l echange pour vendre')
                    this.wGame.dofus.sendMessage("NpcGenericActionRequestMessage", {
                        npcId: 0,
                        npcActionId: 5,// 6 = acheter, 5 = vendre
                        npcMapId: this.wGame.gui.playerData.position.mapId
                    })
    
                    setTimeout(() => {
                        this.wGame.dofus.sendMessage("ExchangeBidHouseListMessage", {
                            id: id//311 = eau
                        })
                    }, this.api.randomIntFromInterval(500,1000))
                }, this.api.randomIntFromInterval(500,1000))
            }
        })
    }

    private async OverloadCaseFarm() {
        this.farmLancer = false
        if(this.repopvente){
            setTimeout(async () => {
                if(!this.wGame.isoEngine.actorManager.userActor.moving && this.elemIDEnCours == -1){
                    let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
                    let listeTrucVendable = [400,423,532,289,533,401,405,425, 444, 442, 441, 312, 445, 350, 443, 446, 7032, 313]
                    for (let index = 0; index < keys.length; index++) {//vente
                        let idActu = this.wGame.gui.playerData.inventory.objects[keys[index]].item.id
                        for (let dedeefgfr = 0; dedeefgfr < listeTrucVendable.length; dedeefgfr++) {
                            if(listeTrucVendable[dedeefgfr]==idActu){
                                let quantiteActu = this.wGame.gui.playerData.inventory.objects[keys[index]].quantity
                                let nomActu = this.wGame.gui.playerData.inventory.objects[keys[index]].item.nameId
                                let count = Math.floor(quantiteActu/100)
                                if(count>=1){
                                    for (let frfrgtyhy = 0; frfrgtyhy < count; frfrgtyhy++) {
                                        if(!this.needToStop){
                                            let retourVente = await this.vendre(idActu)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }else{
                }
                
                setTimeout(async () => {//restart farm basic
                    if(this.api.whatIamDoing.startsWith('farm'))
                        this.farm()
                    else if(this.api.whatIamDoing.startsWith('repop')){
                        this.tableauRessource = []
                        clearTimeout(this.timeoutRecolte)
                        this.getAllRessourcesAvailableOnMap()
                        setTimeout(() => {
                            this.laRecolte()
                        }, 2000)
                    }
                }, this.api.randomIntFromInterval(2500,3500))
            }, this.api.randomIntFromInterval(2500,3500))
        }else{
        }
    }

    private async craftFarm(objectUID, count) {
        return new Promise(async (resolve, reject) => {
            setTimeout(() => {
                Logger.info('MOVE OBJECT')
                this.wGame.dofus.sendMessage("ExchangeObjectMoveMessage", {
                    objectUID: objectUID,
                    quantity: 2
                })
                setTimeout(() => {
                    this.wGame.dofus.sendMessage("ExchangeReplayMessage", {
                        count: count
                    })
                    setTimeout(() => {
                        this.wGame.dofus.sendMessage("ExchangeReadyMessage", {
                            ready:true,
                            step:2
                        })
                    }, this.api.randomIntFromInterval(1000,2000));
                }, this.api.randomIntFromInterval(1000,2000));
            }, this.api.randomIntFromInterval(1000,2000));
            
            //event fin craft
            this.once(this.wGame.dofus.connectionManager, 'ExchangeIsReadyMessage', (e: any) => {
                let boolSecu = false
                for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
                    let win = this.wGame.gui.windowsContainer._childrenList[i]
                    if(!boolSecu){
                        if (win.isVisible()) {
                            if(win.windowTitle._currentTextContent == 'Information'){
                                win.close()
                                boolSecu = true
                                setTimeout(() => {
                                    resolve(true)
                                }, 1000);
                            }
                        }
                    }
                }
            })
        })
    }

    private async gpsBasicFarm(x,y) {
        return new Promise(async (resolve, reject) => {
            let check = () => {
                if (this.wGame.gui.playerData.position.mapPosition.posX == x 
                    && this.wGame.gui.playerData.position.mapPosition.posY == y) {
                        resolve(true)
                }else{
                    let direction = 'nop'
                    if(this.wGame.gui.playerData.position.mapPosition.posX>x){
                        direction = 'left'
                    }else if(this.wGame.gui.playerData.position.mapPosition.posX<x){
                        direction = 'right'
                    }else if(this.wGame.gui.playerData.position.mapPosition.posY>y){
                        direction = 'top'
                    }else if(this.wGame.gui.playerData.position.mapPosition.posY<y){
                        direction = 'bottom'
                    }
    
                    if(direction == 'nop'){
                        Logger.error('direction non trouvé gpsBasicFarm(x,y)')
                        resolve(false)
                    }else{
                        //Logger.info('direction:'+direction)
                        this.api.enCourDeChangementDeMap = true;
                        this.changerDeMap(direction, () => {
                            Logger.info('Changement de map vers '+direction+' OK');
                            this.api.enCourDeChangementDeMap = false;
                            setTimeout(() => {
                                check()
                            }, 5000)
                        }, (reason: string = '') => {
                            Logger.error('Changement de map vers '+direction+' Failed... (' + reason + ')');
                            this.api.enCourDeChangementDeMap = false;
                            setTimeout(() => {
                                check()
                            }, 5000)
                        })
                    }
                }
            }
            check()
        })
    }

    private farm() {//ramasser tous sur le chemin
        setTimeout(() => {
            if(this.farmLancer) return
            if(this.needToStop){
                this.needToStop = false
                return
            }else{
                if(this.cheminFarm.length>0){
                    if((this.wGame.gui.playerData.inventory.weight+110) >= this.wGame.gui.playerData.inventory.maxWeight){//Logger.info('inv:'+util.inspect(this.wGame.gui.playerData.inventory))
                        this.OverloadCaseFarm()
                    }else{
                        if(this.verifiOnestSurChemin()){
                            this.tableauRessource = []
                            clearTimeout(this.timeoutRecolte)
                            this.getAllRessourcesAvailableOnMap()
        
                            setTimeout(() => {
                                if(this.farmLancer) return
                                this.farmLancer = true
                                this.laRecolte()
                            }, 2000);
                            
                        }else{
                            this.farmLancer = false
                            this.api.whatIamDoing = ''
                            Logger.error('on est pas sur le chemin wtf')
                            //TODO essayer de retourné sur le chemin ?
                        }
                    }
                }else{
                    Logger.error('pas de chemin spécifié')
                }
            }
        }, 2000)
    }

    private verifiOnestSurChemin():boolean {
        let nextEtape = -1
        for (let index = 0; index < this.cheminFarm.length; index++) {
            if(this.cheminFarm[index][0] == this.wGame.gui.playerData.position.mapPosition.posX && this.cheminFarm[index][1] == this.wGame.gui.playerData.position.mapPosition.posY 
                && this.wGame.gui.playerData.position.mapPosition.outdoor == true){
                this.indexChemin = index
                nextEtape = 22// != -1
            }
        }
        if(nextEtape == -1){
            Logger.error('On est pas sur le chemin du farm')
            Logger.error('farming idle')
            return false//TODO y aller ?
        }
        return true
    }

    private async laRecolte(){
        if(!this.wGame.isoEngine.actorManager.userActor.moving){
            if(!this.wGame.gui.fightManager.isInBattle()){
                if((this.wGame.gui.playerData.inventory.weight+110) >= this.wGame.gui.playerData.inventory.maxWeight){//Logger.info('inv:'+util.inspect(this.wGame.gui.playerData.inventory))
                    this.OverloadCaseFarm()
                }else{
                    if(this.tableauRessource.length>0){
                        if(this.recolteLancer){
                            Logger.info('hmm recolte deja lancé')
                        }else{
                            this.recolteLancer = true
                            //let pos = this.api.randomIntFromInterval(0,this.tableauRessource.length-1)
                            //Logger.info('res:'+this.tableauRessource[0][0]+', :'+this.tableauRessource[0][1])
                            
                            let allInteractive = this.wGame.isoEngine._getAllInteractives()
                            let maPos = this.wGame.isoEngine.actorManager.userActor.cellId
                            let bestDistance = 9999
                            let pos = 0
                            for (let frgyhnnf = 0; frgyhnnf < this.tableauRessource.length; frgyhnnf++) {
                                let distance  = this.api.distanceEntreDeuxCell(this.tableauRessource[frgyhnnf][2],maPos)
                                if(distance<bestDistance){
                                    bestDistance = distance
                                    pos = frgyhnnf
                                }
                            }
                            this.elemIDEnCours = this.tableauRessource[pos][0]

                            for (let index = 0; index < allInteractive.length; index++) {
                                //Logger.info("get:"+util.inspect(allInteractive[index]))
                                
                                if(allInteractive[index].id == this.tableauRessource[pos][0]){
                                    switch (allInteractive[index].state) {
                                        case 0:
                                            clearTimeout(this.timeoutRecolte)
                                            this.api.fermerFenetre()
                                            this.api.sessionInfo[3] += 1
                                            this.api.updateSession()
                                            if(this.tableauRessource[pos][3]){
                                                this.wGame.isoEngine._useInteractive(this.tableauRessource[pos][0],this.tableauRessource[pos][1])
                                            }else{
                                                let retourDeplacement = await this.api.seDeplacer(this.tableauRessource[pos][2])
                                            }
                                            let saveID = this.tableauRessource[pos][0]
                                            this.tableauRessource.splice(pos, 1)
                                            this.timeoutRecolte = setTimeout(async () => {
                                                Logger.error('erreur timeout recolte ressource')
                                                let retourrrr = await this.api.moveToRandomCellOnMap()
                                                this.api.sessionInfo[3] -= 1
                                                this.api.sessionInfo[7] += 1
                                                this.api.updateSession()
                                                this.recolteLancer = false
                                                this.laRecolte()
                                            }, 15000);
                                            return
                                        case 1:
                                            this.tableauRessource.splice(pos, 1)
                                            Logger.info('Ressource deja ramasser')
                                            this.recolteLancer = false
                                            this.laRecolte()
                                            return
                                        case 2:
                                            this.tableauRessource.splice(pos, 1)
                                            Logger.info('Ressource entrain d etre ramasser (pas par nous)')
                                            this.recolteLancer = false
                                            this.laRecolte()
                                            return
                                    
                                        default:
                                            Logger.error('default laRecolte()')
                                            this.recolteLancer = false
                                            this.laRecolte()
                                            return
                                    }
                                }
                            }
                        }
                    }else{
                        this.farmLancer = false
                        if(!this.api.matchStart){
                            if(this.api.whatIamDoing != 'repop' && this.api.whatIamDoing != ''){
                                this.onBouge()
                            }else{
                            }
                        }else{
                            Logger.info('on est en combat, je ne change pas de map')
                        } 
                    }
                }
            }else{
                Logger.info('on est en combat contre "epouventail" ?')
            }
        }else{
            Logger.info('je me deplace deja')
        }
    }

    private onBouge() {
        if(this.api.whatIamDoing != ''){
            if(!this.api.matchStart){
                if(!this.verifiOnestSurChemin()){
                    Logger.error('onBouge(), PAS SUR LE CHEMIN')
                }else{
                    let nextEtape = -1
                    for (let index = 0; index < this.cheminFarm.length; index++) {
                        if(this.cheminFarm[index][0] == this.wGame.gui.playerData.position.mapPosition.posX && this.cheminFarm[index][1] == this.wGame.gui.playerData.position.mapPosition.posY){
                            nextEtape = (index+1)
                        }
                    }

                    if(this.cheminFarm.length == nextEtape){//derniere pos tableau->debut
                        nextEtape = 0
                    }
                    // on recherche la direction, x=<-> y=|
                    let direction = 'nop'
                    if(this.wGame.gui.playerData.position.mapPosition.posX>this.cheminFarm[nextEtape][0]){
                        direction = 'left'
                    }else if(this.wGame.gui.playerData.position.mapPosition.posX<this.cheminFarm[nextEtape][0]){
                        direction = 'right'
                    }else if(this.wGame.gui.playerData.position.mapPosition.posY>this.cheminFarm[nextEtape][1]){
                        direction = 'top'
                    }else if(this.wGame.gui.playerData.position.mapPosition.posY<this.cheminFarm[nextEtape][1]){
                        direction = 'bottom'
                    }

                    if(direction == 'nop'){
                        Logger.error('direction non trouvé :/')
                    }else{
                        //Logger.info('direction:'+direction)
                        this.api.enCourDeChangementDeMap = true;
                        this.changerDeMap(direction, () => {
                            Logger.info('Changement de map vers '+direction+' OK');
                            this.api.enCourDeChangementDeMap = false;
                            setTimeout(() => {
                                this.farm()
                            }, 1000)
                            
                        }, (reason: string = '') => {
                            Logger.error('Changement de map vers '+direction+' Failed... (' + reason + ')');
                            this.api.enCourDeChangementDeMap = false;
                            this.onBouge()
                        });
                    }
                }
            }
        }else{
            Logger.error('on bouge alors que whatIamDoing vide')
        }
    }

    private changerDeMap(direction: string, success: any, fail: any) {

        let cells = null;
        switch(direction) {
            case "top":
                cells = this.api.getTopCellsLeft();//éviter le bloquage du moulin
                break;
            case "bottom":
                cells = this.api.getBottomCells();
                break;
            case "left":
                cells = this.api.getLeftCells();
                break;
            case "right":
                cells = this.api.getRightCells();
                break;
            default:
                //Logger.info('wtf la direction est fausse.');
                fail('wtf la direction est fausse.');
        }
        let cell = this.api.getRandomAvailableCell(cells, direction);

        let doMove = () => {
            let scenePos = this.wGame.isoEngine.mapRenderer.getCellSceneCoordinate(cell);
            let pos = this.wGame.isoEngine.mapScene.convertSceneToCanvasCoordinate(scenePos.x, scenePos.y);
            this.wGame.isoEngine.gotoNeighbourMap(direction, cell, Math.floor(pos.x), Math.floor(pos.y));
        }
        this.onMapChange(success, fail);
        if (this.wGame.isoEngine.actorManager.userActor.moving) 
            this.wGame.isoEngine.actorManager.userActor.cancelMovement(doMove);
        else{
            if(!this.api.matchStart){
                doMove();
            }else{
                fail('match commencer, pas de deplacement')
            }
        }
    }

    // vérifier si le changement de map a reussi ou non
    private onMapChange(callback: any, fail: any = null): void {
        let previousMap = this.wGame.isoEngine.mapRenderer.mapId;
        let changeTimeout = setTimeout(() => {
            if (fail) fail('Map change timeout');
        }, 15000);
        let onChange = (e: any) => {
            this.wGame.dofus.connectionManager.removeListener("MapComplementaryInformationsWithCoordsMessage", onChange);
            this.wGame.dofus.connectionManager.removeListener("MapComplementaryInformationsDataMessage", onChange);
            clearTimeout(changeTimeout);
            let changeMapRetry = () => {
                if (this.wGame.isoEngine.actorManager.getActor(this.wGame.isoEngine.actorManager.userId).moving || previousMap == this.wGame.isoEngine.mapRenderer.mapId) {
                    setTimeout(changeMapRetry, 300);
                }
                else {
                    setTimeout(callback, 100 + Math.random() * 700);
                }
            }
            setTimeout(changeMapRetry, 1200);
        };
        this.once(this.wGame.dofus.connectionManager, "MapComplementaryInformationsWithCoordsMessage", onChange);
        this.once(this.wGame.dofus.connectionManager, "MapComplementaryInformationsDataMessage", onChange);
    }

    private setFightStartCustomFarm(): void {
        this.on(this.wGame.dofus.connectionManager, 'GameFightStartingMessage', (e: any) => {
            this.farmLancer = false
            this.api.sessionInfo[4] += 1
            this.api.updateSession()
            this.tableauRessource = []
            clearTimeout(this.timeoutRecolte)
        })
    }

    private stopOnFightEndCustomFarm() {
        this.on(this.wGame.dofus.connectionManager, 'GameFightEndMessage', async (e: any) => {// fin combat
            //util.inspect(e.results[0].rewards.objects)
            setTimeout(async () => {
                for (let index = 0; index < e.results[0].rewards.objects.length; index++) {
                    if(index%2==0){
                        let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
                        for (let index = 0; index < keys.length; index++) {
                            let idActu = this.wGame.gui.playerData.inventory.objects[keys[index]].item.id
                            let nomActu = this.wGame.gui.playerData.inventory.objects[keys[index]].item.nameId
                            if(nomActu.startsWith('Sac d') && this.wGame.gui.playerData.inventory.objects[keys[index]].item.usable){
                                //Logger.info('sav:'+nomActu+': '+util.inspect(this.wGame.gui.playerData.inventory.objects[keys[index]]))
                                let retour = await this.api.utiliserItem(idActu)
                            }
                        }
                    }
                }
                setTimeout(() => {
                    if(this.api.whatIamDoing.startsWith('farm')){
                        this.farm()
                    }else if(this.api.whatIamDoing.startsWith('repop')){
                        this.tableauRessource = []
                        clearTimeout(this.timeoutRecolte)
                        this.getAllRessourcesAvailableOnMap()
                        setTimeout(() => {
                            this.laRecolte()
                        }, 2000)
                    }
                }, 2000)
            },1000)
        });
    }

    private OnFiniLaRessource(){ //juste nous
        this.on(this.wGame.dofus.connectionManager, 'InteractiveUseEndedMessage', (e: any) => {//ressources pop/ quelqu'un la collecte
            //this.repondreSocketFct('je viens de finir de recolter une ressource')
            this.recolteLancer = false
            clearTimeout(this.timeoutRecolte)
            this.elemIDEnCours = -1
            setTimeout(() => {// timer pour check si combat "epouventail"
                if(this.api.whatIamDoing.startsWith('farm') || this.api.whatIamDoing.startsWith('repop')){
                    this.laRecolte() // on chope la ressource d'apres
                }
            },1000)
        })
    }

    private quelquUnFaitQuelqueChoseALaRessource(){
        this.on(this.wGame.dofus.connectionManager, 'InteractiveUsedMessage', (e: any) => {//ressources pop/ quelqu'un la collecte
            if(e.entityId == this.wGame.isoEngine.actorManager.userId){
                //Logger.info('nous avons commencez a recolter')
                clearTimeout(this.timeoutRecolte)
            }else if(this.elemIDEnCours == e.elemId){
                clearTimeout(this.timeoutRecolte)
                this.elemIDEnCours = -1
                Logger.info('quelqu un a voler notre ressource :(')
                setTimeout(() => {
                    this.recolteLancer = false
                    if(this.api.whatIamDoing.startsWith('farm') || this.api.whatIamDoing.startsWith('repop')){
                        this.laRecolte() // on chope la ressource d'apres
                    }
                }, 3000)
            }
        });
    }

    private repopEvent(): void {
        this.on(this.wGame.dofus.connectionManager, 'InteractiveElementUpdatedMessage', (e: any) => {//ressources pop/ quelqu'un la collecte
            if(this.api.whatIamDoing == 'repop'){
                setTimeout(() => {
                    if(!this.wGame.isoEngine.actorManager.userActor.animated && !this.wGame.isoEngine.actorManager.userActor.moving && !this.entraindeVendre){
                        if(e.interactiveElement.enabledSkills.length>0){// ça viens de pop
                            //Logger.info(e.interactiveElement._name + ' viens d apparaitre');
                            if(e.interactiveElement._name == 'Puits'){
                                // on puise
                                //this.wGame.isoEngine._useInteractive(e.interactiveElement.elementId,e.interactiveElement.enabledSkills[0].skillInstanceUid)
                                //this.tableauRessource.push([e.interactiveElement.elementId,e.interactiveElement.enabledSkills[0].skillInstanceUi])
                                let allInteractive = this.wGame.isoEngine._getAllInteractives()
                                for (const elem of allInteractive) {
                                    if(elem.id == e.interactiveElement.elementId){
                                        this.tableauRessource.push([e.interactiveElement.elementId,e.interactiveElement.enabledSkills[0].skillInstanceUi, elem._position])
                                    }
                                }
                                if(this.tableauRessource.length==1){
                                    this.laRecolte()
                                }
                            }else{
                                this.getAllRessourcesAvailableOnMap()
                                if(this.tableauRessource.length>0){
                                    this.laRecolte()//on relance que si il n'y avais rien dans le tableau avant le repop
                                }
                                
                            }
                        }
                    }else{
                        Logger.info('repop mais on bouge/animation')
                    }
                    
                }, this.api.randomIntFromInterval(3000,4000))
            }
            /* update resources ?{ _messageType: 'InteractiveElementUpdatedMessage',interactiveElement:{ _type: 'InteractiveElement',elementId: 465036,elementTypeId: 84,enabledSkills: [ [Object] ],disabledSkills: [],_name: 'Puits' },_isInitialized: true }info: nom:Puits*/
            /*{"_messageType":"InteractiveElementUpdatedMessage","interactiveElement":{"_type":"InteractiveElement","elementId":465036,"elementTypeId":84,"enabledSkills":[{"_type":"InteractiveElementSkill","skillId":102,"skillInstanceUid":22227879,"_cursor":0,"_name":"Puiser","_parentJobId":1,"_levelMin":1,"_parentJobName":"Base"}],"disabledSkills":[],"_name":"Puits"},"_isInitialized":true}*/
        });
    }

    private getAllRessourcesAvailableOnMap():any {
        // let lesPetitPoissons = this.wGame.isoEngine.mapRenderer.interactiveElements //Logger.info("interactive:"+util.inspect(this.wGame.isoEngine.mapRenderer.interactiveElements)); 

        // Logger.info('elem:'+util.inspect(lesPetitPoissons[id].enabledSkills))
        // {_type: 'InteractiveElementSkill',skillId: 130,skillInstanceUid: 22232700,_cursor: 6,_name: 'Pêcher',_parentJobId: 36,_levelMin: 50,_parentJobName: 'Pêcheur' }    

        let allInteractive = this.wGame.isoEngine._getAllInteractives() //Logger.info("get:"+util.inspect(allInteractive))
        let lesPetitPoissons = this.wGame.isoEngine.mapRenderer.interactiveElements
        let jobs = this.wGame.gui.playerData.jobs.list
        // on parcourt les métiers pour savoir si on peux récolter
        for (var id in jobs) {
            // Logger.info('parcourt pour metier:'+this.wGame.gui.playerData.jobs.list[id].info.nameId) 
            for (const elem of allInteractive) { //Logger.info("all:"+util.inspect(elem))
                if(elem.state == 0){ // non récolter
                    if(lesPetitPoissons[elem.id].enabledSkills.length>0){
                        let boolChekPlusieursMetier = false
                        if(lesPetitPoissons[elem.id].enabledSkills.length>1)
                            boolChekPlusieursMetier=true
                        if(lesPetitPoissons[elem.id].enabledSkills[0]._parentJobId == id){ // 36=pecheur
                            //Logger.info('metier dispo:'+this.wGame.gui.playerData.jobs.list[id].info.nameId) 
                            if(this.wGame.gui.playerData.jobs.list[id].experience.jobLevel<lesPetitPoissons[elem.id].enabledSkills[0]._levelMin){//disabledSkills[0]
                                Logger.info('niveau trop faible ('+this.wGame.gui.playerData.jobs.list[id].experience.jobLevel+'<'+lesPetitPoissons[elem.id].enabledSkills._levelMin+')')
                            }else{
                                //Logger.info('nom:'+lesPetitPoissons[elem.id]._name)
                                //Logger.info('pos:'+elem._position)
                                //Logger.info('on recolte besoin d outil')
                                //this.elemIDEnCours = elem.id
                                //this.wGame.isoEngine._useInteractive(elem.id,lesPetitPoissons[elem.id].enabledSkills[0].skillInstanceUid)
                                this.tableauRessource.push([elem.id,lesPetitPoissons[elem.id].enabledSkills[0].skillInstanceUid, elem._position, boolChekPlusieursMetier])
                            }
                        }
                    }else{
                        //Logger.info('cheh on peux pas recolter')
                    }
                }
            }
        }
    }

    private metierLevelUp(): void {
        this.on(this.wGame.dofus.connectionManager, 'JobLevelUpMessage', (e: any) => {
            try {
                Logger.info('metier lvl up');
                this.api.fermerFenetre()
            } catch (ex) {
                Logger.info(ex);
            }
        })
    }

    public reset() {
        super.reset()
        this.dclaby.reset()
        //this.darkvlad.reset()
        this.fastVente.reset()
        this.kouloss.reset()
        this.ldvAff.reset()
        this.moreui.reset()
        this.farmingbase.reset()
        if(this.fauxGPS != undefined)
            this.fauxGPS.reset()

        if(this.antiaggro != undefined)
            this.antiaggro.reset()
        this.wGame.dofus.sendMessage = this.wGame.savedSendMessage
        this.api.destroy()
        this.shortcutsHelper.unBindAll()
        if(this.dialogueAuto != undefined)
            this.dialogueAuto.reset()
        if(this.eleveurUtils)
            this.eleveurUtils.reset()
        Logger.info('bot controler reset')
    }
}
