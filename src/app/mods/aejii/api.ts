/* eslint-disable @typescript-eslint/no-var-requires */
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

import {SettingsService} from "@services/settings.service";
import { Mod } from "../mod"
import { BestMover } from "./mover/bestMover";
import {PathFinder} from "./pathfinder/index";

import { TranslateService } from "@ngx-translate/core";

export class API extends Mod {
    
    startMod(): void {
        return;
    }

    public sessionInfo = []
    public matchStart: boolean
    public notreTour: boolean
    public intervalCancelInactivite:any
    public enCourDeChangementDeMap:boolean
    public sessionStartTime

    public whatIamDoing:string
    public entraindeVendre

    public mover:BestMover
    private oldZoom

    public socket

    public pathfinder
    public dummy
    public getReachableZoneSing
    public getwindowSing
    public inheritSing
    public startWaitingForContentSing

    public typeIdMarket:number
    public combat

    //savoir si on est dans l'api du "controller" ou pas (ex : moreUi)
    public socketActiver:boolean


    constructor(wGame: any,settings: SettingsService,translate: TranslateService){
        super(wGame, settings, translate);

        Logger.info('api charger')

        this.whatIamDoing = ''
        this.typeIdMarket = -1

        //fast dialoge
        this.oldZoom = this.wGame.gui.npcDialogUi._zoomOnActor.bind(this.wGame.gui.npcDialogUi)
        this.wGame.gui.npcDialogUi._zoomOnActor = () =>{};

        this.mover = new BestMover(this.wGame, settings, translate, this)
        this.dummy = this.mover.finder.getSingletonObjectWithKey('newDummyRecord')[0]
        this.getReachableZoneSing = this.mover.finder.getSingletonObjectWithKey("getReachableZone")[0]
        this.getwindowSing = this.mover.finder.getSingletonObjectWithKey("getWindow")[0]
        this.inheritSing = this.mover.finder.getSingletonObjectWithKey("inherits")[0].inherits
        this.startWaitingForContentSing = this.mover.finder.searchForSingletonConstructorWithKey("startWaitingForContent")[0][1]

        this.sessionInfo = []

        
        this.entraindeVendre = false

        this.pathfinder = new PathFinder()

        this.matchStart = false
        this.notreTour = false
        
        this.sessionStartTime = new Date().getTime()

        this.eventCombat()

        this.intervalCancelInactivite = setInterval(() => {
            this.cancelInactivite()
        }, 1000)
    }

    public betterLogger(msg) {
        Logger.info(msg)
        this.wGame.gui.chat.logMsg(msg)
    }

    private eventCombat() {
        this.on(this.wGame.dofus.connectionManager, 'GameFightStartingMessage', (e: any) => {
            this.matchStart = true
        })
        this.on(this.wGame.dofus.connectionManager, 'GameFightEndMessage', (e: any) => {
            this.matchStart = false
        })
        // event lorsqu'un tour commence
        this.on(this.wGame.dofus.connectionManager, 'GameFightTurnStartMessage', (e: any) => {
            let fighters = this.wGame.gui.fightManager.getFighters();
            for (let index in fighters) {
                let fighter = this.wGame.gui.fightManager.getFighter(fighters[index]);
                if (fighter.data.alive && fighter.id == e.id){
                    //Logger.info('debut tour de '+fighter.name);
                    if (fighter.name == this.wGame.gui.playerData.characterBaseInformations.name) { // c'est au joueur(fenetre de jouer)
                        this.matchStart = true;
                        this.notreTour = true;
                    }
                }
            }
        });
    }

    /**
     * 
     * @param id id unique
     * @param title titre
     * @param x x coordonné (gauche a droite)
     * @param y y coordonné (haut vers bas)
     * @param w largeur (gauche a droite)
     * @param h hauteur (haut en bas)
     * @returns 
     */
    public createWindow(id, title, x,y, w, h) {
        const windowMaker = this.startWaitingForContentSing
        const superClass = this.inheritSing
        let manager = this.getwindowSing
        function myWindow() {
            let left = x + 'px'
            let top = y + 'px'
            let classname = 'my-window'+id
            windowMaker.call(this, {
            className: classname,
            title: title,
            positionInfo: { left: left, top: top, width: w, height: h }
            });
        }
        superClass(myWindow, windowMaker);
        let nom = 'window'+id
        manager.addWindow(nom, new myWindow());
        //let windowBody = manager.getWindow(nom).windowBody;
        //windowBody.rootElement.innerHTML = "text"
        manager.switch(nom);
        return nom
    }

    public updateSession(){
        try {
            //this.sessionInfo[2] = (new Date().getTime() - this.sessionStartTime)/1000//en seconde
            //this.socket.emit('updatesession',this.sessionInfo[0],this.sessionInfo[1],this.wGame.gui.playerData.loginName,
            //this.sessionInfo[2],this.sessionInfo[3],this.sessionInfo[4],this.sessionInfo[5],this.sessionInfo[6],this.sessionInfo[7],
            //this.wGame.gui.playerData.position.mapPosition.posX,
            //this.wGame.gui.playerData.position.mapPosition.posY,
            //this.sessionInfo[8])
        } catch (error) {
            Logger.error('erreur update session:'+error)
        }
        
    }

    public checkPrix(id,typeid) {
        return new Promise(async (resolve, reject) => {
            await this.ouvrirPnjMarket()
            await this.ouvrirType(typeid)
            let retour = await this.checkId(id)
            setTimeout(() => {
                Logger.info('id check')
                resolve(retour)
            }, this.randomIntFromInterval(500,1000))
        })
    }

    private checkPnjMarketOuvert() {
        for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
            let win = this.wGame.gui.windowsContainer._childrenList[i];
            if (win.isVisible()) {
                if(win.id == 'bidHouseShop'){
                    return true
                }
                break;
            }
        }
        return false
    }

    //ET non CHEH
    public activerAI():number {
        this.betterLogger('et non cheh pas d"ia pour toi')
        let retour = 0
        if(this.combat == undefined){
            switch (this.wGame.gui.playerData.characterBaseInformations.breed) {
                case 4://sram
                    this.betterLogger('ia activer')
                    break
                case 12://panda
                    this.betterLogger('ia activer')
                    break
                case 7://eni
                    this.betterLogger('ia activer')
                    break
                case 6://eca
                    this.betterLogger('ia activer')
                    break
                case 8://iop
                    this.betterLogger('ia activer')
                    break
                case 9://cra
                    if(this.wGame.gui.playerData.position.mapId == 133432324 || this.wGame.gui.playerData.position.mapId == 117441544){
                        this.betterLogger('ia tanniere activer')
                    }else{
                        this.betterLogger('ia activer')
                    }
                    break
                case 14://zozo
                    this.betterLogger('ia activer')
                    break
                case 3:
                    this.betterLogger('ia activer')
                    break
                case 1://feca
                    
                    //break
                case 3://enutrof
                    
                    //break
                case 15://streamer
                    
                    //break
                default://perso non reconnu
                    this.betterLogger('ia non activer, classe inconnue')
                    Logger.error('iacombat classe inconnue ('+this.wGame.gui.playerData.characterBaseInformations.breed+')')
                    retour = -1
                    break;
            }
        }else{
            //IA deja activer
        }
        return retour
        
    }
    
    public ouvrirPnjMarket() {
        return new Promise(async (resolve, reject) => {
            let shopWindow = this.mover.finder.getSingletonObjectWithKey("getWindow")[0].getWindow("bidHouseShop")
            if(shopWindow.openState == false){//si shop pas ouvert
                this.once(this.wGame.dofus.connectionManager, 'ExchangeStartedBidBuyerMessage', async (e: any) => {
                    await this.mover.timeoutResolveV2(this.randomIntFromInterval(500,1000))
                    this.betterLogger('pnj market ouvert')
                    resolve(1)
                })
                await this.mover.timeoutResolveV2(this.randomIntFromInterval(500,1000))
                this.wGame.dofus.sendMessage('NpcGenericActionRequestMessage', {
                    npcId: 0,
                    npcActionId: 6,//6 = acheter
                    npcMapId: this.wGame.gui.playerData.position.mapId
                });
            }else{
                setTimeout(() => {
                    Logger.info('pnj deja ouvert')
                    resolve(1)
                }, this.randomIntFromInterval(50,100))
            }
        })
    }

    //catégorie dans le mareket
    public ouvrirType(typeID) {
        return new Promise(async (resolve, reject) => {
            
            let shopWindow = this.mover.finder.getSingletonObjectWithKey("getWindow")[0].getWindow("bidHouseShop")

            if(this.typeIdMarket != typeID){
            //if(shopWindow._categoryToDisplay != typeID){
                await this.mover.timeoutResolveV2(this.randomIntFromInterval(500,1000))
                shopWindow._cancelSearch(true)
                this.wGame.dofus.sendMessage("ExchangeBidHouseTypeMessage", {
                    type: typeID
                })
                //TODO await once ExchangeEtcETc ??
                await this.mover.timeoutResolveV2(this.randomIntFromInterval(500,1000))
                this.betterLogger('type ouvert')
                this.typeIdMarket = typeID
                resolve(1)
            }else{
                await this.mover.timeoutResolveV2(this.randomIntFromInterval(500,1000))
                this.betterLogger('type deja ouvert')
                shopWindow._cancelSearch(true)
                resolve(1)
            }
        })
        //await once ExchangeTypesExchangerDescriptionForUserMessage ??
    }

    public checkId(id) {
        return new Promise(async (resolve, reject) => {
            this.mover.timeoutResolveV2(this.randomIntFromInterval(500,1000))
            let shopWindow = this.mover.finder.getSingletonObjectWithKey("getWindow")[0].getWindow("bidHouseShop")
            let end = false
            let boooo = setTimeout(() => {
                this.betterLogger('erreur checkId')
                end = true
                resolve(-1)
            }, 10000)
            this.once(this.wGame.dofus.connectionManager, 'ExchangeTypesItemsExchangerDescriptionForUserMessage', (e: any) => {
                if(!end){
                    clearTimeout(boooo)
                    setTimeout(() => {
                        resolve(e.itemTypeDescriptions)
                    }, this.randomIntFromInterval(500,1000))
                }
            })

            /*this.wGame.dofus.sendMessage("ExchangeBidHouseListMessage", {
                id: id
            })*/
            let retryload = 0
            let checkRowLoad = async () =>{
                if(shopWindow.shopViewer.table.rows._childrenMap[id] != undefined){
                    this.betterLogger('row charger (checkId)')
                    await this.mover.timeoutResolveV2(400)
                    shopWindow.shopViewer.table.rows._childrenMap[id].tap()
                }else{
                    retryload++
                    if(retryload<9){
                        await this.mover.timeoutResolveV2(1000)
                        checkRowLoad()
                    }
                }
            }
            checkRowLoad()
        })
    }

    /**
     * patienter
     */
    public patienter(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(1)
            }, ms);
        })
    }
    
    public passer() {
        return new Promise((resolve, reject) => {
            if(this.matchStart && this.wGame.gui.fightManager.isInBattle()){
                this.notreTour = false;
                setTimeout(() => {
                    this.notreTour = false
                    this.betterLogger('fin notre tour')
                    this.wGame.gui.fightManager.finishTurn();
                    resolve(1)
                    // this.wGame.dofus.sendMessage("GameFightTurnFinishMessage", { isReady: true });
                },this.getRandomTime(0.3, 0.5))
            }else{
                //Logger.error('pas en combat')
                resolve(-2)
            }
        })
        
    }

    public httpsrequete(url) {
        return new Promise((resolve, reject) => {
            var xhrReponse = new XMLHttpRequest()

            xhrReponse.open("GET", url, true)
            //xhrReponse.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
            xhrReponse.onreadystatechange = function (e) {
                if(xhrReponse.readyState === XMLHttpRequest.DONE && xhrReponse.status === 200) {
                    resolve(e)
                }
            }
            xhrReponse.send()

            //TODO a test si ça marche encore surtout le "resolve(e)"
            /*const https = require('https');

            https.get(url, (resp) => {
                let data = ''

                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    data += chunk
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    //Logger.info(JSON.parse(data).explanation)
                    resolve(data)
                });

                }).on("error", (err) => {
                    Logger.info("Error: " + err.message)
                    resolve(0)
            })*/
        })
    }

    // obtenir l'ennemy le plus proche du joueur(fenetre) version 2
    public getClosestEnnemyV2(): any{
        let fighters = this.wGame.gui.fightManager.getFighters();
        let distancemax = 9999999
        let fighterFinal = null

        //init final fighter avec un ennemi en vie (pour ne pas retourner null)
        for (let index in fighters) {
            let fighter = this.wGame.gui.fightManager.getFighter(fighters[index]);
            if (fighter.data.alive && fighter.data.teamId != this.getPlayer().data.teamId) {// si il est en vie et dans l'autre equipe
                fighterFinal = fighter
            }
        }
        fighters = this.wGame.gui.fightManager.getFighters();
        for (let index in fighters) {
            let fighter = this.wGame.gui.fightManager.getFighter(fighters[index]);
            if (fighter.data.alive && fighter.data.teamId != this.getPlayer().data.teamId) {// si il est en vie et dans l'autre equipe
                let distancetmp = this.porterv2(fighter)
                if(distancetmp<distancemax){
                    fighterFinal = fighter
                    distancemax = distancetmp
                }
            }
        }
        //Logger.info('fighter nom :'+fighterFinal.name);
        //Logger.info('fighter equipe (0 = joueur en pvm):'+fighterFinal.data.teamId);
        //Logger.info('fighter lvl :'+fighterFinal.level);
        //Logger.info('fighter case :'+fighterFinal.data.disposition.cellId);
        return fighterFinal;
    }

    public vendre(id):any {
        return new Promise((resolve, reject) => {
            if(this.entraindeVendre){
                Logger.error('je peux pas vendre 2 fois')
                resolve(-1)
            }else{
                let onLanceLechange = false
                let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
                for (let index = 0; index < keys.length; index++) {
                    if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == id && this.wGame.gui.playerData.inventory.objects[keys[index]].quantity>=100){
                        onLanceLechange = true
                    }
                }

                if(onLanceLechange){
                    this.once(this.wGame.dofus.connectionManager, 'ExchangeBidhouseMinimumItemPriceListMessage', (e: any) => {// fin combat
                        setTimeout(() => {
                            let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
                            for (let index = 0; index < keys.length; index++) {
                                if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == id){//311 = eau
                                    if(e.prices[0]>e.prices[1] || e.prices[1]>e.prices[2]){
                                        Logger.error('wtf le prix de vente coutant a 1 est plus eleve qu a 10 ou 10 > 100 VENTE ANNULE')
                                        this.entraindeVendre = false
                                        resolve(0)
                                    }else{
                                        setTimeout(async () => {
                                            if(this.wGame.gui.playerData.inventory.kamas>(e.prices[2]*0.03)){
                                                this.sessionInfo[6] += 1
                                                this.updateSession()
                                                Logger.info('on vend 100 '+this.wGame.gui.playerData.inventory.objects[keys[index]].item.nameId+' a '+e.prices[2])
                                                this.wGame.dofus.sendMessage("ExchangeObjectMovePricedMessage", {
                                                    objectUID: this.wGame.gui.playerData.inventory.objects[keys[index]].objectUID,
                                                    quantity: 100,
                                                    price: (e.prices[2])
                                                })
                                                setTimeout(() => {
                                                    Logger.info('la vente est fini')
                                                    this.fermerFenetre()
                                                    this.entraindeVendre = false
                                                    resolve(1)
                                                },this.randomIntFromInterval(500,1500))
                                            }else{
                                                Logger.info('on a pas assez d argent pour mettre en vente (taxe 3%)')
                                                this.entraindeVendre = false
                                                resolve(0)
                                            }
                                        },this.randomIntFromInterval(500,1500))
                                    }
                                }
                            }
                        }, this.randomIntFromInterval(500,1500));
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
                
                    this.entraindeVendre = true
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
                        }, this.randomIntFromInterval(500,1000))
                    }, this.randomIntFromInterval(500,1000))
                }else{
                    resolve(1)
                }
            }
        })
    }


    /**
     * vendreV2
     */
    public vendreV2(id,quantity) {
        return new Promise((resolve, reject) => {
            let timeoutGeneral = setTimeout(async () => {
                    Logger.info('timeout vente')
                    await this.fermerFenetreAsync()
                    resolve(-1)
                    return(-1)
                }, 20000)
            setTimeout(async () => {
                let valideItem = false
                let keysIndex = null
                let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
                for (let index = 0; index < keys.length; index++) {
                    if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == id && this.wGame.gui.playerData.inventory.objects[keys[index]].quantity>=quantity){
                        valideItem = true
                        keysIndex = keys[index]
                    }
                }
                if(valideItem){
                    Logger.info('on lance l echange pour vendre')
                    //npcActionId: 5 = ExchangeStartedBidSellerMessage, 6:ExchangeStartedBidBuyerMessage
                    let isOpen = false
                    this.once(this.wGame.dofus.connectionManager, 'ExchangeStartedBidSellerMessage', (e: any) => {
                        if(!isOpen){
                            isOpen = true
                            Logger.info('nbr max de truc qu on peut vendre:'+e.sellerDescriptor.maxItemPerAccount+', ce qu on vend deja:'+e.objectsInfos.length)
                            if(e.sellerDescriptor.maxItemPerAccount <= e.objectsInfos.length){
                                Logger.error('trop d item mis en vente')
                                clearTimeout(timeoutGeneral)
                                setTimeout(() => {
                                    resolve(-2)
                                    return(-2)
                                }, 500)
                            }else{
                                setTimeout(() => {
                                    this.once(this.wGame.dofus.connectionManager, 'ExchangeBidhouseMinimumItemPriceListMessage', (e: any) => {
                                        setTimeout(() => {
                                            if(e.prices[0]>e.prices[1] || e.prices[1]>e.prices[2]){
                                                Logger.error('wtf le prix de vente coutant a 1 est plus eleve qu a 10 ou 10 > 100 VENTE ANNULE ('+e.prices[0]+','+e.prices[1]+','+e.prices[2]+')')
                                                clearTimeout(timeoutGeneral)
                                                resolve(-1)
                                                return(-1)
                                            }else{
                                                setTimeout(async () => {
                                                    let quantiteFinal = quantity
                                                    let nbrDeVenteA100 = Math.floor(quantiteFinal/100)
                                                    for (let qsqscdfghytjh = 0; qsqscdfghytjh < nbrDeVenteA100; qsqscdfghytjh++) {
                                                        let retourVente = await this.vendreSocket(this.wGame.gui.playerData.inventory.objects[keysIndex].objectUID,100,e.prices[2])
                                                        if(retourVente == -1){
                                                            clearTimeout(timeoutGeneral)
                                                            resolve(-1)
                                                            return(-1)
                                                        }
                                                        quantiteFinal -= 100
                                                    }
                                                    let nbrDeVenteA10 = Math.floor(quantiteFinal/10)
                                                    for (let qsqscdfghytjh = 0; qsqscdfghytjh < nbrDeVenteA10; qsqscdfghytjh++) {
                                                        let retourVente = await this.vendreSocket(this.wGame.gui.playerData.inventory.objects[keysIndex].objectUID,10,e.prices[1])
                                                        if(retourVente == -1){
                                                            clearTimeout(timeoutGeneral)
                                                            resolve(-1)
                                                            return(-1)
                                                        }
                                                        quantiteFinal -= 10
                                                    }
                                                    Logger.info('la vente s est bien terminer')
                                                    clearTimeout(timeoutGeneral)
                                                    resolve(1)
                                                    return(1)
                                                },this.randomIntFromInterval(500,1500))
                                            }
                                        }, this.randomIntFromInterval(500,1500));
                                    })
                                    this.wGame.dofus.sendMessage("ExchangeBidHouseListMessage", {
                                        id: id
                                    })
                                }, this.randomIntFromInterval(500,1000))
                            }
                        }
                    })
                    //on sais pas si on a une autre fenetre d'ouverte ou pas
                    await this.fermerFenetreAsync()
                    this.wGame.dofus.sendMessage("NpcGenericActionRequestMessage", {
                        npcId: 0,
                        npcActionId: 5,// 6 = acheter, 5 = vendre
                        npcMapId: this.wGame.gui.playerData.position.mapId
                    })
                }else{
                    Logger.info('on a pas l item, ou moins de 10')
                    resolve(-1)
                }
            }, this.randomIntFromInterval(500,1000))
        })
    }

    private vendreSocket(uid,quantiteReel,prix) {
        return new Promise(async (resolve, reject) => {
            if(this.wGame.gui.playerData.inventory.kamas>(prix*0.03)){
                //4{"_messageType":"ExchangeBidHouseItemAddOkMessage","itemInfo":{"_type":"ObjectItemToSellInBid","objectGID":289,"effects":[],"objectUID":154470918,"quantity":100,"objectPrice":669,"unsoldDelay":672},"_isInitialized":true}
                this.once(this.wGame.dofus.connectionManager, 'ExchangeBidHouseItemAddOkMessage', (e: any) => {
                    Logger.info('mise en vente avec succes')
                    setTimeout(() => {
                        resolve(1)
                    },this.randomIntFromInterval(500,1500))
                })
                Logger.info('on vend')
                this.wGame.dofus.sendMessage("ExchangeObjectMovePricedMessage", {
                    objectUID: uid,
                    quantity: quantiteReel,
                    price: prix
                })
                
            }else{
                Logger.info('on a pas assez d argent pour mettre en vente (taxe 3%)')
                resolve(-1)
            }
        })
    }

    // sur la map comme en combat
    public async seDeplacer(cellId, path = null):Promise<number>{      
        return new Promise<number>(async (resolve, reject) => {
            //Logger.info('Je me deplace vers '+cellId)

            if(cellId != this.wGame.isoEngine.actorManager.userActor.cellId){
                let scenePos = this.wGame.isoEngine.mapRenderer.getCellSceneCoordinate(cellId)
                let pos = this.wGame.isoEngine.mapScene.convertSceneToCanvasCoordinate(scenePos.x, scenePos.y)
                this.wGame.isoEngine.touchEnd(pos.x, pos.y,this.wGame.foreground.tapOptions)
                if(this.matchStart){
                    setTimeout(() => {// double clicks
                        this.wGame.isoEngine.touchEnd(pos.x, pos.y,this.wGame.foreground.tapOptions)
                        setTimeout(() => {// fin "animation"
                            //Logger.info('fin deplacement')
                            resolve(1)
                        },this.randomIntFromInterval(1000,3000))
                    },this.randomIntFromInterval(50,150))
                }else{
                    if(path != null && path.length>0){
                        let msPath = path.length*200
                        setTimeout(() => {// fin "animation"
                            //Logger.info('fin deplacement')
                            resolve(1)
                        },this.randomIntFromInterval(msPath-25,msPath+25))
                    }else{
                        setTimeout(() => {// fin "animation"
                            //Logger.info('fin deplacement')
                            resolve(1)
                        },this.randomIntFromInterval(50,150))
                    }
                }
            }else{
                resolve(1)
            }
        })
    }

    /**
     * seDeplacerOffi
     */
    public seDeplacerOffi(cellId) {
        return new Promise<number>(async (resolve, reject) => {
            let timeDep = setTimeout(() => {
                resolve(-1)
            }, 5000);
            this.wGame.isoEngine._movePlayerOnMap(cellId, false, () => {
                clearTimeout(timeDep)
                resolve(1)
            });
        })
    }

    public async seDeplacerVersCellIdOld(cellId):Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            let listeCaseDispoDeplacement = await this.getListeCaseDispoDeplacement(this.getPlayer().data.disposition.cellId)
            
            let distance = 999999
            let caseLaPlusProche = -1
            for (let index in listeCaseDispoDeplacement) {
                if(this.distanceEntreDeuxCell(Number(index), cellId)<distance){
                    distance = this.distanceEntreDeuxCell(Number(index), cellId)
                    caseLaPlusProche = Number(index)
                }
            }

            if(caseLaPlusProche != -1){
                if(this.getPlayer().data.stats.movementPoints>0){
                    let retour = await this.seDeplacer(caseLaPlusProche)
                    resolve(1)
                }else{
                    resolve(-1)
                }
            }else{
                Logger.error('aucune case trouve pour se deplacer vers :'+cellId)
                resolve(-1)
            }
        })    
    }

    public async seDeplacerVersCellId(cellId):Promise<number> {
        return new Promise<number>(async (resolve, reject) => {
            
            this.pathfinder.resetPath()
            this.pathfinder.fillPathGrid(this.wGame.isoEngine.mapRenderer.map)
            
            //on parcourt les cases dispo (porté de PM)
            //on check le path sur chacune<->"monstre" et on clique sur celle avec le path le moins grand
            let pmDispo = this.getPlayer().data.stats.movementPoints

            let path = this.pathfinder.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, cellId, 
                this.getOccupiedCellNotToBeAggressed(), false, false)

            if(path.length>1){
                //théorie, check si pmDispo<path.length et que faire sinon
                if(pmDispo>path.length-1){
                    let retour = await this.seDeplacer(path[path.length-2])
                }else{
                    let retour = await this.seDeplacer(path[pmDispo])
                }
                
            }else{
                Logger.info('on est deja au plus pret ???')
            }
            setTimeout(() => {
                resolve(1)
            }, this.randomIntFromInterval(300,500))
        })    
    }

    /**
     * getCheminVersCellId
     */
    public getCheminVersCellId(cellId) {
        this.pathfinder.resetPath()
        this.pathfinder.fillPathGrid(this.wGame.isoEngine.mapRenderer.map)
        let path = this.pathfinder.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, cellId, 
                this.getOccupiedCellNotToBeAggressed(), false, false)

        return path
    }

    /**
     * getDistanceEntre2Cell
     */
    public getDistanceEntredeuxCellV2(cell1, cell2) {
        this.pathfinder.resetPath()
        this.pathfinder.fillPathGrid(this.wGame.isoEngine.mapRenderer.map)
        var path = this.pathfinder.getPath(cell1, cell2, 
            this.wGame.isoEngine.actorManager._occupiedCells, false, false)
        let retour = path.length-1
        if(retour<0){
            retour = 0
        }
        return(retour)
    }

    /**
     * retourner les cellId disponible avec un nombre de pm
     * @param cellID la cellId (la notre ou celle des mob)
     * @param nbrPm le nombre de pm dispo (peux etre utiliser pour tester les mob?)
     */
    public getListeCaseDispoPMOLD(cellID, nbrPm){
        let listCell = []
        let listCellTmp = []
        listCell.push(cellID)
        listCellTmp.push(cellID)
        //hautdoite,basdroite,basgauche,hautgauche

        let add = (cell) => {
            if(this.cellDispo(cell)){
                this.pathfinder.resetPath()
                this.pathfinder.fillPathGrid(this.wGame.isoEngine.mapRenderer.map)
                var path = this.pathfinder.getPath(cellID, cell, 
                    this.wGame.isoEngine.actorManager._occupiedCells, false, false);
                if(path.length-1<=nbrPm){
                    let boolTrouver = false
                    for (let qzddqz = 0; qzddqz < listCellTmp.length; qzddqz++) {
                        if(listCellTmp[qzddqz]==cell){
                            boolTrouver = true
                        }
                    }
                    if(!boolTrouver)
                        listCellTmp.push(cell)  
                }
            }
        }

        let copyList = () => {
            listCell = []
            for (let index = 0; index < listCellTmp.length; index++) {
                listCell.push(listCellTmp[index])
            }
        }

        for (let index = 0; index < nbrPm; index++) {
            for (let dfqsefezf = 0; dfqsefezf < listCell.length; dfqsefezf++) {
                //ne pas traverser les bords de map comme snake 
                //vérif dans add(cell)
                let ceell1 = this.getCellPosTourni("hautdoite",listCell[dfqsefezf])
                add(ceell1)
                let ceell4 = this.getCellPosTourni("hautgauche",listCell[dfqsefezf])
                add(ceell4)
                let ceell2 = this.getCellPosTourni("basdroite",listCell[dfqsefezf])
                add(ceell2)
                let ceell3 = this.getCellPosTourni("basgauche",listCell[dfqsefezf])
                add(ceell3)
            }
            copyList()
        }
        listCell.splice(0,1)//on enleve notre case
        return listCell
    }

    /**
     * getListeCaseDispoPMV2
     * possibilite de recup actor this.actorManager.getActor(fighter.id) //pour mob?
     * this.api.getListeCaseDispoPM(this.wGame.isoEngine.actorManager.userActor,this.wGame.isoEngine.actorManager.userActor.cellId)
     */
    public getListeCaseDispoPM(currentCellId, nbrPM, actor = null) {
        if(actor == null){
            actor = this.wGame.isoEngine.actorManager.userActor
        }
        let retour = this.getReachableZoneSing.getReachableZone(actor,currentCellId)
        let keyRe = Object.keys(retour)

        let listeCell = []
        for (let jhjhj = 0; jhjhj < keyRe.length; jhjhj++) {
            const celliId = keyRe[jhjhj];
            const elem = retour[celliId]
            if(elem.reachable){
                if(elem.costAP==0){
                    listeCell.push(celliId)
                }
            }
        }
        return listeCell
    }
    //OBSOLETE
    //obtenir la liste des cases diponible avec mes pm (pour aller vers le mob le plus proche)
    public async getListeCaseDispoDeplacement(cellId):Promise<number[]>{
        return new Promise<number[]>(async (resolve, reject) => {
            let pmDispo = this.getPlayer().data.stats. c
            let retour = []

            let voisineHautDroite = await this.getCellPosTourni('hautgauche',cellId)
            let voisineBasDroite = await this.getCellPosTourni('hautdoite',cellId)
            let voisineBasGauche = await this.getCellPosTourni('basdroite',cellId)
            let voisineHautGauche = await this.getCellPosTourni('basgauche',cellId)

            if(pmDispo>0){ // on peux bouger au moins lul
                if(this.esCeQuOnPeuxSeDeplacerSurCellId(voisineHautGauche,cellId))
                    retour[voisineHautGauche] = 1
                if(this.esCeQuOnPeuxSeDeplacerSurCellId(voisineHautDroite,cellId))
                    retour[voisineHautDroite] = 1
                if(this.esCeQuOnPeuxSeDeplacerSurCellId(voisineBasDroite,cellId))
                    retour[voisineBasDroite] = 1
                if(this.esCeQuOnPeuxSeDeplacerSurCellId(voisineBasGauche,cellId))
                    retour[voisineBasGauche] = 1
                
                //while (onContinue) {
                for (let yoooo = 0; yoooo < 5; yoooo++) {
                    for (let index in retour) {

                        //Logger.info('index:'+index)
                        
                        voisineHautDroite = await this.getCellPosTourni('hautgauche',index)
                        voisineBasDroite = await this.getCellPosTourni('hautdoite',index)
                        voisineBasGauche = await this.getCellPosTourni('basdroite',index)
                        voisineHautGauche = await this.getCellPosTourni('basgauche',index)

                        //*4 pour chaque voisin
                        if(this.esCeQuOnPeuxSeDeplacerSurCellId(voisineHautDroite,Number(index))){
                            if(retour[index]+1<=pmDispo){
                                let trouver = false
                                for (let index2 in retour) {
                                    if(index2 == ''+voisineHautDroite){
                                        if(retour[index2]<retour[index]+1)
                                            trouver = true
                                    }
                                }
                                if(!trouver){
                                    retour[voisineHautDroite] = retour[index]+1
                                }   
                            }
                        }

                        if(this.esCeQuOnPeuxSeDeplacerSurCellId(voisineBasDroite,Number(index))){
                            if(retour[index]+1<=pmDispo){
                                let trouver = false
                                for (let index2 in retour) {
                                    if(index2 == ''+voisineBasDroite){
                                        if(retour[index2]<retour[index]+1)
                                            trouver = true
                                    }
                                }
                                if(!trouver){
                                    retour[voisineBasDroite] = retour[index]+1
                                }  
                            }
                        }

                        if(this.esCeQuOnPeuxSeDeplacerSurCellId(voisineBasGauche,Number(index))){
                            if(retour[index]+1<=pmDispo){
                                let trouver = false
                                for (let index2 in retour) {
                                    if(index2 == ''+voisineBasGauche){
                                        if(retour[index2]<retour[index]+1)
                                            trouver = true
                                    }
                                }
                                if(!trouver){
                                    retour[voisineBasGauche] = retour[index]+1
                                }
                            }
                        }

                        if(this.esCeQuOnPeuxSeDeplacerSurCellId(voisineHautGauche,Number(index))){
                            if(retour[index]+1<=pmDispo){
                                let trouver = false
                                for (let index2 in retour) {
                                    //Logger.info('index2:'+index2+', voisineHautGauche:'+voisineHautGauche)
                                    if(index2 == ''+voisineHautGauche){
                                        if(retour[index2]<retour[index]+1)
                                            trouver = true
                                    }
                                }
                                if(!trouver){
                                    retour[voisineHautGauche] = retour[index]+1
                                }
                            }
                        }
                    }
                }
            }
            resolve(retour)
        })
    }

    //es ce qu'on peux ce déplacer sur une cell (ou invoc dessus)
    public cellDispo(cellId:number) {
        if(this.isCellOnMap(cellId)){
            if(this.isCellWalkable(cellId)){
                let fighters = this.wGame.gui.fightManager.getFighters()
                for (let index in fighters) {
                    let fighter = this.wGame.gui.fightManager.getFighter(fighters[index]);
                    if(fighter.data.disposition.cellId == cellId && fighter.data.alive){
                        return false
                    }
                }
                return true
            }
        }
    }

    /**
     * ATTENTION cellcentre rajouté a voir pour réutiliser
     * vérifie si on peux se la cellule est marchable et si il n'y a personne dessus
     * esCeQuOnPeuxSeDeplacerSurCellId
     */
    public esCeQuOnPeuxSeDeplacerSurCellId(cellId:number,cellCentre:number):boolean {
        if(this.isCellOnMap(cellId)){
            if(this.isCellWalkable(cellId)){
                if(this.getCellIDPosition(cellId)[0] <= (Number(this.getCellIDPosition(cellCentre)[0]) +2)
                && this.getCellIDPosition(cellId)[0] >= this.getCellIDPosition(cellCentre)[0] - 2){// pour eviter les changements de coté (les murs de snake)
                    let fighters = this.wGame.gui.fightManager.getFighters()
                    for (let index in fighters) {
                        let fighter = this.wGame.gui.fightManager.getFighter(fighters[index]);
                        if(fighter.data.disposition.cellId == cellId && fighter.data.alive){
                            return false
                        }
                    }
                    return true
                }
            }
        }
        return false
    }

    /**
     * retourne le numero d'une 'cellule voisine en fonction d'une direction
     * @param posString position que l'on cherche : hautdoite,basdroite,basgauche,hautgauche
     * @param cell cellule "central"
     */
    public getCellPosTourni(posString,cell) {
         //y impair:
            //top gauche = cell - 15
            //top droit  = cell - 14
            //bas gauche = cell + 13
            //bas droit  = cell + 14

        //y pair:
            //top gauche = cell - 14
            //top droit  = cell - 13
            //bas gauche = cell + 14
            //bas droit  = cell + 15
            let poscell = this.getCellIDPosition(cell)
            switch (posString) {
                case 'hautdoite':// on retourne bas droite
                    if(this.pair(poscell[1]))
                        return((parseInt(cell) + 15))
                    else
                        return((parseInt(cell) + 14))
                case 'basdroite':// on retourne bas gauche
                    if(this.pair(poscell[1]))
                        return((parseInt(cell) + 14))
                    else
                        return((parseInt(cell) + 13))
                case 'basgauche':// on retourne haut gauche
                    if(this.pair(poscell[1]))
                        return((cell - 14))
                    else
                        return((cell - 15))
                case 'hautgauche':// on retourne haut droite
                    
                    if(this.pair(poscell[1]))
                        return((cell - 13))
                    else
                        return((cell - 14))
                default:
                    return(-1)
            }
    }

    /** distance a vol d'oiseau
     * si cellUn == cellDeux return 0
     * @param cellUn cellule de depard
     * @param cellDeux cellule arrivé
     */
    public distanceEntreDeuxCell(cellUn, cellDeux):number{

        let posJoueur = this.getCellIDPosition(cellUn)
        let posEnnemy = this.getCellIDPosition(cellDeux)
        //Logger.info('cell joueur :'+cellJoueur)
        let posJoueurQuiBouge = posJoueur
        let cellQuiBouge = cellUn
        //y impair:
            //top gauche = pos - 15
            //top droit  = pos - 14
            //bas gauche = pos + 13
            //bas droit  = pos + 14

        //y pair:
            //top gauche = pos - 14
            //top droit  = pos - 13
            //bas gauche = pos + 14
            //bas droit  = pos + 15
        
            //[0]=x et [1]=y

            //y = vers le bas

            //x = <---->
        let porteRetour = 0
        let debug = true
        while (cellQuiBouge != cellDeux && debug) {
            if(this.pair(posJoueurQuiBouge[1])){
                if(posJoueurQuiBouge[0]>=posEnnemy[0]){// si l'ennemi est a gauche de la position de la porté (>+egal car pair)
                    if(posJoueurQuiBouge[1]>posEnnemy[1]){// si l'ennemi est "en haut" de la position de la porté
                        // top gauche
                        cellQuiBouge -= 14
                    }else{
                        //bas gauche
                        cellQuiBouge += 14
                    }
                }else{
                    if(posJoueurQuiBouge[1]>posEnnemy[1]){// si l'ennemi est "en haut" de la position de la porté
                        // top droit
                        cellQuiBouge -= 13
                    }else{
                        //bas droit
                        cellQuiBouge += 15
                    }
                }
            }else{// impaire
                if(posJoueurQuiBouge[0]>posEnnemy[0]){// si l'ennemi est a gauche de la position de la porté (strictement> car impaire)
                    if(posJoueurQuiBouge[1]>posEnnemy[1]){// si l'ennemi est "en haut" de la position de la porté
                        // top gauche
                        cellQuiBouge -= 15
                    }else{
                        //bas gauche
                        cellQuiBouge += 13
                    }
                }else{
                    if(posJoueurQuiBouge[1]>posEnnemy[1]){// si l'ennemi est "en haut" de la position de la porté
                        // top droit
                        cellQuiBouge -= 14
                    }else{
                        //bas droit
                        cellQuiBouge += 14
                    }
                }
            }
            porteRetour++
            posJoueurQuiBouge = this.getCellIDPosition(cellQuiBouge)
            
            //Logger.info('marchable :'+cellQuiBouge+' :'+this.wGame.isoEngine.mapRenderer.isWalkable(cellQuiBouge))
            
            if(porteRetour>100){
                debug = false
                Logger.error('Porté supérieur a 100, impossible erreur ')
            }
        }
        return porteRetour
    }

    //obtenir la porter entre le joueur actuelle et un monstre/personnage
    public porterv2(monstre):number{

        let cellJoueur = this.getPlayer().data.disposition.cellId
        let posJoueur = this.getPlayerPosition()
        let cellEnnemy = monstre.data.disposition.cellId
        let posEnnemy = this.getCellIDPosition(cellEnnemy)
        //Logger.info('cell joueur :'+cellJoueur)
        let posJoueurQuiBouge = posJoueur
        let cellQuiBouge = cellJoueur
        //y impair:
            //top gauche = pos - 15
            //top droit  = pos - 14
            //bas gauche = pos + 13
            //bas droit  = pos + 14

        //y pair:
            //top gauche = pos - 14
            //top droit  = pos - 13
            //bas gauche = pos + 14
            //bas droit  = pos + 15
        
            //[0]=x et [1]=y

            //y = vers le bas

            //x = <---->
        let porteRetour = 0
        let debug = true
        let chemin = []
        while (cellQuiBouge != cellEnnemy && debug) {
            if(this.pair(posJoueurQuiBouge[1])){
                if(posJoueurQuiBouge[0]>=posEnnemy[0]){// si l'ennemi est a gauche de la position de la porté (>+egal car pair)
                    if(posJoueurQuiBouge[1]>posEnnemy[1]){// si l'ennemi est "en haut" de la position de la porté
                        // top gauche
                        cellQuiBouge -= 14
                    }else{
                        //bas gauche
                        cellQuiBouge += 14
                    }
                }else{
                    if(posJoueurQuiBouge[1]>posEnnemy[1]){// si l'ennemi est "en haut" de la position de la porté
                        // top droit
                        cellQuiBouge -= 13
                    }else{
                        //bas droit
                        cellQuiBouge += 15
                    }
                }
            }else{// impaire
                if(posJoueurQuiBouge[0]>posEnnemy[0]){// si l'ennemi est a gauche de la position de la porté (strictement> car impaire)
                    if(posJoueurQuiBouge[1]>posEnnemy[1]){// si l'ennemi est "en haut" de la position de la porté
                        // top gauche
                        cellQuiBouge -= 15
                    }else{
                        //bas gauche
                        cellQuiBouge += 13
                    }
                }else{
                    if(posJoueurQuiBouge[1]>posEnnemy[1]){// si l'ennemi est "en haut" de la position de la porté
                        // top droit
                        cellQuiBouge -= 14
                    }else{
                        //bas droit
                        cellQuiBouge += 14
                    }
                }
            }
            porteRetour++
            posJoueurQuiBouge = this.getCellIDPosition(cellQuiBouge)
            chemin.push(cellQuiBouge)
            
            //Logger.info('marchable :'+cellQuiBouge+' :'+this.wGame.isoEngine.mapRenderer.isWalkable(cellQuiBouge))
            
            if(porteRetour>100){
                debug = false
                Logger.error('Porté supérieur a 100, impossible erreur ')
            }
        }
        return porteRetour
    }

    /**
     * retourne si on peux utiliser le spell sur la case
     * @param cellOpposer id de la cell a vérifier
     * @param spell exemple : this.wGame.gui.playerData.characters.mainCharacter.spellData.spells[51].spellLevel
     */
    public esCeQuOnPeuxAttaquer(cellOpposer, spell):boolean {
        let retour = false
        let spellRange = this.getSpellRange(this.wGame.isoEngine.mapRenderer.map.cells, this.wGame.isoEngine.actorManager.userActor.cellId, spell)
        for (let index = 0; index < spellRange.length; index++) {
            if(this.getCellIDPosition(cellOpposer)[0] == spellRange[index][0] && this.getCellIDPosition(cellOpposer)[1] == spellRange[index][1]){
                retour = true
            }
        }
        return retour
    }

    public getCellIdFromMapPoint(e,t) {
        var A = []
        A['0_19'] = 532
        A['0_20'] = 546
        A['1_18'] = 504
        A['1_19'] = 518
        A['1_20'] = 533
        A['1_21'] = 547
        A['2_17'] = 476
        A['2_18'] = 490
        A['2_19'] = 505
        A['2_20'] = 519
        A['2_21'] = 534
        A['2_22'] = 548
        A['3_16'] = 448
        A['3_17'] = 462
        A['3_18'] = 477
        A['3_19'] = 491
        A['3_20'] = 506
        A['3_21'] = 520
        A['3_22'] = 535
        A['3_23'] = 549
        A['4_15'] = 420
        A['4_16'] = 434
        A['4_17'] = 449
        A['4_18'] = 463
        A['4_19'] = 478
        A['4_20'] = 492
        A['4_21'] = 507
        A['4_22'] = 521
        A['4_23'] = 536
        A['4_24'] = 550
        A['5_14'] = 392
        A['5_15'] = 406
        A['5_16'] = 421
        A['5_17'] = 435
        A['5_18'] = 450
        A['5_19'] = 464
        A['5_20'] = 479
        A['5_21'] = 493
        A['5_22'] = 508
        A['5_23'] = 522
        A['5_24'] = 537
        A['5_25'] = 551
        A['6_13'] = 364
        A['6_14'] = 378
        A['6_15'] = 393
        A['6_16'] = 407
        A['6_17'] = 422
        A['6_18'] = 436
        A['6_19'] = 451
        A['6_20'] = 465
        A['6_21'] = 480
        A['6_22'] = 494
        A['6_23'] = 509
        A['6_24'] = 523
        A['6_25'] = 538
        A['6_26'] = 552
        A['7_12'] = 336
        A['7_13'] = 350
        A['7_14'] = 365
        A['7_15'] = 379
        A['7_16'] = 394
        A['7_17'] = 408
        A['7_18'] = 423
        A['7_19'] = 437
        A['7_20'] = 452
        A['7_21'] = 466
        A['7_22'] = 481
        A['7_23'] = 495
        A['7_24'] = 510
        A['7_25'] = 524
        A['7_26'] = 539
        A['7_27'] = 553
        A['8_11'] = 308
        A['8_12'] = 322
        A['8_13'] = 337
        A['8_14'] = 351
        A['8_15'] = 366
        A['8_16'] = 380
        A['8_17'] = 395
        A['8_18'] = 409
        A['8_19'] = 424
        A['8_20'] = 438
        A['8_21'] = 453
        A['8_22'] = 467
        A['8_23'] = 482
        A['8_24'] = 496
        A['8_25'] = 511
        A['8_26'] = 525
        A['8_27'] = 540
        A['8_28'] = 554
        A['9_10'] = 280
        A['9_11'] = 294
        A['9_12'] = 309
        A['9_13'] = 323
        A['9_14'] = 338
        A['9_15'] = 352
        A['9_16'] = 367
        A['9_17'] = 381
        A['9_18'] = 396
        A['9_19'] = 410
        A['9_20'] = 425
        A['9_21'] = 439
        A['9_22'] = 454
        A['9_23'] = 468
        A['9_24'] = 483
        A['9_25'] = 497
        A['9_26'] = 512
        A['9_27'] = 526
        A['9_28'] = 541
        A['9_29'] = 555
        A['10_9'] = 252
        A['10_10'] = 266
        A['10_11'] = 281
        A['10_12'] = 295
        A['10_13'] = 310
        A['10_14'] = 324
        A['10_15'] = 339
        A['10_16'] = 353
        A['10_17'] = 368
        A['10_18'] = 382
        A['10_19'] = 397
        A['10_20'] = 411
        A['10_21'] = 426
        A['10_22'] = 440
        A['10_23'] = 455
        A['10_24'] = 469
        A['10_25'] = 484
        A['10_26'] = 498
        A['10_27'] = 513
        A['10_28'] = 527
        A['10_29'] = 542
        A['10_30'] = 556
        A['11_8'] = 224
        A['11_9'] = 238
        A['11_10'] = 253
        A['11_11'] = 267
        A['11_12'] = 282
        A['11_13'] = 296
        A['11_14'] = 311
        A['11_15'] = 325
        A['11_16'] = 340
        A['11_17'] = 354
        A['11_18'] = 369
        A['11_19'] = 383
        A['11_20'] = 398
        A['11_21'] = 412
        A['11_22'] = 427
        A['11_23'] = 441
        A['11_24'] = 456
        A['11_25'] = 470
        A['11_26'] = 485
        A['11_27'] = 499
        A['11_28'] = 514
        A['11_29'] = 528
        A['11_30'] = 543
        A['11_31'] = 557
        A['12_7'] = 196
        A['12_8'] = 210
        A['12_9'] = 225
        A['12_10'] = 239
        A['12_11'] = 254
        A['12_12'] = 268
        A['12_13'] = 283
        A['12_14'] = 297
        A['12_15'] = 312
        A['12_16'] = 326
        A['12_17'] = 341
        A['12_18'] = 355
        A['12_19'] = 370
        A['12_20'] = 384
        A['12_21'] = 399
        A['12_22'] = 413
        A['12_23'] = 428
        A['12_24'] = 442
        A['12_25'] = 457
        A['12_26'] = 471
        A['12_27'] = 486
        A['12_28'] = 500
        A['12_29'] = 515
        A['12_30'] = 529
        A['12_31'] = 544
        A['12_32'] = 558
        A['13_6'] = 168
        A['13_7'] = 182
        A['13_8'] = 197
        A['13_9'] = 211
        A['13_10'] = 226
        A['13_11'] = 240
        A['13_12'] = 255
        A['13_13'] = 269
        A['13_14'] = 284
        A['13_15'] = 298
        A['13_16'] = 313
        A['13_17'] = 327
        A['13_18'] = 342
        A['13_19'] = 356
        A['13_20'] = 371
        A['13_21'] = 385
        A['13_22'] = 400
        A['13_23'] = 414
        A['13_24'] = 429
        A['13_25'] = 443
        A['13_26'] = 458
        A['13_27'] = 472
        A['13_28'] = 487
        A['13_29'] = 501
        A['13_30'] = 516
        A['13_31'] = 530
        A['13_32'] = 545
        A['13_33'] = 559
        A['14_5'] = 140
        A['14_6'] = 154
        A['14_7'] = 169
        A['14_8'] = 183
        A['14_9'] = 198
        A['14_10'] = 212
        A['14_11'] = 227
        A['14_12'] = 241
        A['14_13'] = 256
        A['14_14'] = 270
        A['14_15'] = 285
        A['14_16'] = 299
        A['14_17'] = 314
        A['14_18'] = 328
        A['14_19'] = 343
        A['14_20'] = 357
        A['14_21'] = 372
        A['14_22'] = 386
        A['14_23'] = 401
        A['14_24'] = 415
        A['14_25'] = 430
        A['14_26'] = 444
        A['14_27'] = 459
        A['14_28'] = 473
        A['14_29'] = 488
        A['14_30'] = 502
        A['14_31'] = 517
        A['14_32'] = 531
        A['15_4'] = 112
        A['15_5'] = 126
        A['15_6'] = 141
        A['15_7'] = 155
        A['15_8'] = 170
        A['15_9'] = 184
        A['15_10'] = 199
        A['15_11'] = 213
        A['15_12'] = 228
        A['15_13'] = 242
        A['15_14'] = 257
        A['15_15'] = 271
        A['15_16'] = 286
        A['15_17'] = 300
        A['15_18'] = 315
        A['15_19'] = 329
        A['15_20'] = 344
        A['15_21'] = 358
        A['15_22'] = 373
        A['15_23'] = 387
        A['15_24'] = 402
        A['15_25'] = 416
        A['15_26'] = 431
        A['15_27'] = 445
        A['15_28'] = 460
        A['15_29'] = 474
        A['15_30'] = 489
        A['15_31'] = 503
        A['16_3'] = 84
        A['16_4'] = 98
        A['16_5'] = 113
        A['16_6'] = 127
        A['16_7'] = 142
        A['16_8'] = 156
        A['16_9'] = 171
        A['16_10'] = 185
        A['16_11'] = 200
        A['16_12'] = 214
        A['16_13'] = 229
        A['16_14'] = 243
        A['16_15'] = 258
        A['16_16'] = 272
        A['16_17'] = 287
        A['16_18'] = 301
        A['16_19'] = 316
        A['16_20'] = 330
        A['16_21'] = 345
        A['16_22'] = 359
        A['16_23'] = 374
        A['16_24'] = 388
        A['16_25'] = 403
        A['16_26'] = 417
        A['16_27'] = 432
        A['16_28'] = 446
        A['16_29'] = 461
        A['16_30'] = 475
        A['17_2'] = 56
        A['17_3'] = 70
        A['17_4'] = 85
        A['17_5'] = 99
        A['17_6'] = 114
        A['17_7'] = 128
        A['17_8'] = 143
        A['17_9'] = 157
        A['17_10'] = 172
        A['17_11'] = 186
        A['17_12'] = 201
        A['17_13'] = 215
        A['17_14'] = 230
        A['17_15'] = 244
        A['17_16'] = 259
        A['17_17'] = 273
        A['17_18'] = 288
        A['17_19'] = 302
        A['17_20'] = 317
        A['17_21'] = 331
        A['17_22'] = 346
        A['17_23'] = 360
        A['17_24'] = 375
        A['17_25'] = 389
        A['17_26'] = 404
        A['17_27'] = 418
        A['17_28'] = 433
        A['17_29'] = 447
        A['18_1'] = 28
        A['18_2'] = 42
        A['18_3'] = 57
        A['18_4'] = 71
        A['18_5'] = 86
        A['18_6'] = 100
        A['18_7'] = 115
        A['18_8'] = 129
        A['18_9'] = 144
        A['18_10'] = 158
        A['18_11'] = 173
        A['18_12'] = 187
        A['18_13'] = 202
        A['18_14'] = 216
        A['18_15'] = 231
        A['18_16'] = 245
        A['18_17'] = 260
        A['18_18'] = 274
        A['18_19'] = 289
        A['18_20'] = 303
        A['18_21'] = 318
        A['18_22'] = 332
        A['18_23'] = 347
        A['18_24'] = 361
        A['18_25'] = 376
        A['18_26'] = 390
        A['18_27'] = 405
        A['18_28'] = 419
        A['19_0'] = 0
        A['19_1'] = 14
        A['19_2'] = 29
        A['19_3'] = 43
        A['19_4'] = 58
        A['19_5'] = 72
        A['19_6'] = 87
        A['19_7'] = 101
        A['19_8'] = 116
        A['19_9'] = 130
        A['19_10'] = 145
        A['19_11'] = 159
        A['19_12'] = 174
        A['19_13'] = 188
        A['19_14'] = 203
        A['19_15'] = 217
        A['19_16'] = 232
        A['19_17'] = 246
        A['19_18'] = 261
        A['19_19'] = 275
        A['19_20'] = 290
        A['19_21'] = 304
        A['19_22'] = 319
        A['19_23'] = 333
        A['19_24'] = 348
        A['19_25'] = 362
        A['19_26'] = 377
        A['19_27'] = 391
        A['20_1'] = 1
        A['20_2'] = 15
        A['20_3'] = 30
        A['20_4'] = 44
        A['20_5'] = 59
        A['20_6'] = 73
        A['20_7'] = 88
        A['20_8'] = 102
        A['20_9'] = 117
        A['20_10'] = 131
        A['20_11'] = 146
        A['20_12'] = 160
        A['20_13'] = 175
        A['20_14'] = 189
        A['20_15'] = 204
        A['20_16'] = 218
        A['20_17'] = 233
        A['20_18'] = 247
        A['20_19'] = 262
        A['20_20'] = 276
        A['20_21'] = 291
        A['20_22'] = 305
        A['20_23'] = 320
        A['20_24'] = 334
        A['20_25'] = 349
        A['20_26'] = 363
        A['21_2'] = 2
        A['21_3'] = 16
        A['21_4'] = 31
        A['21_5'] = 45
        A['21_6'] = 60
        A['21_7'] = 74
        A['21_8'] = 89
        A['21_9'] = 103
        A['21_10'] = 118
        A['21_11'] = 132
        A['21_12'] = 147
        A['21_13'] = 161
        A['21_14'] = 176
        A['21_15'] = 190
        A['21_16'] = 205
        A['21_17'] = 219
        A['21_18'] = 234
        A['21_19'] = 248
        A['21_20'] = 263
        A['21_21'] = 277
        A['21_22'] = 292
        A['21_23'] = 306
        A['21_24'] = 321
        A['21_25'] = 335
        A['22_3'] = 3
        A['22_4'] = 17
        A['22_5'] = 32
        A['22_6'] = 46
        A['22_7'] = 61
        A['22_8'] = 75
        A['22_9'] = 90
        A['22_10'] = 104
        A['22_11'] = 119
        A['22_12'] = 133
        A['22_13'] = 148
        A['22_14'] = 162
        A['22_15'] = 177
        A['22_16'] = 191
        A['22_17'] = 206
        A['22_18'] = 220
        A['22_19'] = 235
        A['22_20'] = 249
        A['22_21'] = 264
        A['22_22'] = 278
        A['22_23'] = 293
        A['22_24'] = 307
        A['23_4'] = 4
        A['23_5'] = 18
        A['23_6'] = 33
        A['23_7'] = 47
        A['23_8'] = 62
        A['23_9'] = 76
        A['23_10'] = 91
        A['23_11'] = 105
        A['23_12'] = 120
        A['23_13'] = 134
        A['23_14'] = 149
        A['23_15'] = 163
        A['23_16'] = 178
        A['23_17'] = 192
        A['23_18'] = 207
        A['23_19'] = 221
        A['23_20'] = 236
        A['23_21'] = 250
        A['23_22'] = 265
        A['23_23'] = 279
        A['24_5'] = 5
        A['24_6'] = 19
        A['24_7'] = 34
        A['24_8'] = 48
        A['24_9'] = 63
        A['24_10'] = 77
        A['24_11'] = 92
        A['24_12'] = 106
        A['24_13'] = 121
        A['24_14'] = 135
        A['24_15'] = 150
        A['24_16'] = 164
        A['24_17'] = 179
        A['24_18'] = 193
        A['24_19'] = 208
        A['24_20'] = 222
        A['24_21'] = 237
        A['24_22'] = 251
        A['25_6'] = 6
        A['25_7'] = 20
        A['25_8'] = 35
        A['25_9'] = 49
        A['25_10'] = 64
        A['25_11'] = 78
        A['25_12'] = 93
        A['25_13'] = 107
        A['25_14'] = 122
        A['25_15'] = 136
        A['25_16'] = 151
        A['25_17'] = 165
        A['25_18'] = 180
        A['25_19'] = 194
        A['25_20'] = 209
        A['25_21'] = 223
        A['26_7'] = 7
        A['26_8'] = 21
        A['26_9'] = 36
        A['26_10'] = 50
        A['26_11'] = 65
        A['26_12'] = 79
        A['26_13'] = 94
        A['26_14'] = 108
        A['26_15'] = 123
        A['26_16'] = 137
        A['26_17'] = 152
        A['26_18'] = 166
        A['26_19'] = 181
        A['26_20'] = 195
        A['27_8'] = 8
        A['27_9'] = 22
        A['27_10'] = 37
        A['27_11'] = 51
        A['27_12'] = 66
        A['27_13'] = 80
        A['27_14'] = 95
        A['27_15'] = 109
        A['27_16'] = 124
        A['27_17'] = 138
        A['27_18'] = 153
        A['27_19'] = 167
        A['28_9'] = 9
        A['28_10'] = 23
        A['28_11'] = 38
        A['28_12'] = 52
        A['28_13'] = 67
        A['28_14'] = 81
        A['28_15'] = 96
        A['28_16'] = 110
        A['28_17'] = 125
        A['28_18'] = 139
        A['29_10'] = 10
        A['29_11'] = 24
        A['29_12'] = 39
        A['29_13'] = 53
        A['29_14'] = 68
        A['29_15'] = 82
        A['29_16'] = 97
        A['29_17'] = 111
        A['30_11'] = 11
        A['30_12'] = 25
        A['30_13'] = 40
        A['30_14'] = 54
        A['30_15'] = 69
        A['30_16'] = 83
        A['31_12'] = 12
        A['31_13'] = 26
        A['31_14'] = 41
        A['31_15'] = 55
        A['32_13'] = 13
        A['32_14'] = 27
        var i = A[e + '_' + t];
        return i
    }

    public getMapPointFromCellId(e) {
        var t = e % 14 - ~~(e/28),i = t + 19, n = t + ~~(e/14);
        return {x:i,y:n}
    }

    /**
     * retourne un tableau avec les cases dans la range (et leur range) exemple :[10,5,2] x:10,y:5,range:2
     * @param e e = this.mapRenderer.map.cells
     * @param t t = this.actorManager.userActor.cellId
     * @param i i = this.wGame.gui.playerData.characters.mainCharacter.spellData.spells[51].spellLevel
     */
    public getSpellRange(e, t, i) {
        //{x: 11, y: 11}
        var a , r = {x:this.getCellIDPosition(t)[0],y:this.getCellIDPosition(t)[1]}
        return a = i.castInLine && i.castInDiagonal ? this.o(r.x, r.y, i.minRange, i.range)
            .concat(this.s(r.x, r.y, i.minRange, i.range)) : i.castInLine ? this.o(r.x, r.y, i.minRange, i.range) : i.castInDiagonal ? this.s(r.x, r.y, i.minRange, i.range) : this.n(r.x, r.y, i.minRange, i.range)
    }

    private n(e, t, i, n) {
        var o = [];
        0 === i && o.push([e, t, 0]);
        for (var s = i || 1; s <= n; s++)
            for (var a = 0; a < s; a++) {
                var r = s - a;
                o.push([e + a, t - r, s]), o.push([e + r, t + a, s]), o.push([e - a, t + r, s]), o.push([e - r, t - a, s])
            }
        return o
    }
    
    private o(e, t, i, n) {
        var o = [];
        0 === i && o.push([e, t, 0]);
        for (var s = i || 1; s <= n; s++) o.push([e - s, t, s]), o.push([e + s, t, s]), o.push([e, t - s, s]), o.push([e, t + s, s]);
        return o
    }

    private s(e, t, i, n) {
        var o = [];
        0 === i && o.push([e, t, 0]);
        for (var s = i || 1; s <= n; s++) o.push([e - s, t - s, s]), o.push([e - s, t + s, s]), o.push([e + s, t - s, s]), o.push([e + s, t + s, s]);
        return o
    }

    // retourner un entier compris entre deux entier
    public randomIntFromInterval(min,max):number {
        return Math.floor(Math.random()*(max-min+1)+min);
    }

    public viderInventaire(){
        return new Promise(async (resolve, reject) => {

            let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
            for (let index = 0; index < keys.length; index++) {
                //Logger.info('item:'+util.inspect(this.wGame.gui.playerData.inventory.objects[keys[index]]))
                if(this.wGame.gui.playerData.inventory.objects[keys[index]].exchangeable
                    && !this.wGame.gui.playerData.inventory.objects[keys[index]].item.isWeapon && this.wGame.gui.playerData.inventory.objects[keys[index]].item.realWeight > 0
                    && this.wGame.gui.playerData.inventory.objects[keys[index]].item.dropMonsterIds.length != 0){
                        Logger.info('item:'+this.wGame.gui.playerData.inventory.objects[keys[index]].item.nameId +', prix:'+
                        this.wGame.gui.playerData.inventory.objects[keys[index]].item.averagePrice)
                    if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.averagePrice > 10){
                        //let retour = await this.vendreItem(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id)
                        //if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == 13851)
                        //    Logger.info(util.inspect(this.wGame.gui.playerData.inventory.objects[keys[index]]))
                    }else{
                        Logger.info('on supprime')
                        let retour = await this.deleteItem(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id, this.wGame.gui.playerData.inventory.objects[keys[index]].quantity)
                    }
                    
                }
            }
            resolve(1)
        })
    }

    public utiliserItem(id) {
        return new Promise((resolve, reject) => {
            let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
            for (let index = 0; index < keys.length; index++) {
                if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == id){
                    //Logger.info('objectUID:'+this.wGame.gui.playerData.inventory.objects[keys[index]].objectUID)
                    Logger.info('on utilise '+this.wGame.gui.playerData.inventory.objects[keys[index]].item.nameId)
                    this.sessionInfo[5] += 1
                    this.updateSession()
                    this.wGame.dofus.sendMessage("ObjectUseMessage", {
                        objectUID: this.wGame.gui.playerData.inventory.objects[keys[index]].objectUID
                    })
                    resolve(1)
                }
            }
            resolve(-1)
        })
    }

    public deleteItem(id, quantite) {
        return new Promise((resolve, reject) => {
            //{"call":"sendMessage","data":{"type":"ObjectDeleteMessage","data":{"objectUID":69592661,"quantity":1}}}
            if(this.esCeQuOnPossedeCetteItem(id)){
                let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
                for (let index = 0; index < keys.length; index++) {
                    if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == id){
                        setTimeout(() => {
                            Logger.info('suppression en cour')
                            this.wGame.dofus.sendMessage("ObjectDeleteMessage", {
                                objectUID: this.wGame.gui.playerData.inventory.objects[keys[index]].objectUID,
                                quantity: quantite
                            })
                            setTimeout(() => {
                                Logger.info('fin suppr')
                                resolve(1)
                                return(1)
                            },this.randomIntFromInterval(500,1000))
                        },this.randomIntFromInterval(500,1000))
                    }
                }
                
            }
        })
        
    }

    public moveToRandomCellOnMap() {
        return new Promise((resolve, reject) => {
            let width = this.wGame.isoEngine.mapRenderer.grid.grid.length;
            let height = this.wGame.isoEngine.mapRenderer.grid.grid[0].length;
            let x = null;
            let y = null;
            let flags = null;
            let cellId = null;
            let count = 0;
            while (cellId == null) {
                if (count++ > 100) return;
                x = Math.floor(Math.random() * (width - 20)) + 10;
                y = Math.floor(Math.random() * (height - 20)) + 10;
                cellId = this.wGame.isoEngine.mapRenderer.grid.grid[x][y].cellId || null;
                flags = this.wGame.isoEngine.mapRenderer.getChangeMapFlags(cellId);
                if (this.wGame.isoEngine.actorManager._occupiedCells[cellId]
                    || flags["bottom"] || flags["top"] || flags["right"] || flags["left"]
                    || !this.wGame.isoEngine.mapRenderer.isWalkable(cellId)) cellId = null;
            }
            this.seDeplacer(cellId)
            setTimeout(() => {
                resolve(1)
            }, 5000)
        })
    }

    public ouvrirCoffre(idInterra, code) {
        return new Promise(async (resolve, reject) => {
            let fini = false
            this.once(this.wGame.dofus.connectionManager, 'LockableShowCodeDialogMessage', async (e: any) => {
                if(!fini){
                    fini = true
                    //{"_messageType":"LockableShowCodeDialogMessage","changeOrUse":false,"codeSize":8,"_isInitialized":true}
                    await this.mover.timeoutResolveV2(this.randomIntFromInterval(1000,3000))
    
                    this.wGame.dofus.sendMessage('LockableUseCodeMessage', {
                        code: ""+code
                    });
                    //{"call":"sendMessage","data":{"type":"LockableUseCodeMessage","data":{"code":"66558877"}}}
                    await this.mover.timeoutResolveV2(this.randomIntFromInterval(100,500))
                    resolve(1)
                }
            })

            //proprio (pas besoin de code)
            this.once(this.wGame.dofus.connectionManager, 'ExchangeStartedWithStorageMessage', async (e: any) => {
                await this.mover.timeoutResolveV2(this.randomIntFromInterval(100,500))
                resolve(1)
            })
            await this.mover.useInteractive(idInterra)
        })
    }

    public rentrerMaison(idInterra, code) {
        return new Promise(async (resolve, reject) => {
            //console.log('on rentre dans maison:'+idInterra)
            this.once(this.wGame.dofus.connectionManager, 'LockableShowCodeDialogMessage', async (e: any) => {
                //{"_messageType":"LockableShowCodeDialogMessage","changeOrUse":false,"codeSize":8,"_isInitialized":true}
                await this.mover.timeoutResolveV2(this.randomIntFromInterval(1000,3000))

                this.wGame.dofus.sendMessage('LockableUseCodeMessage', {
                    code: ""+code
                })
                //console.log('code send')
                //{"call":"sendMessage","data":{"type":"LockableUseCodeMessage","data":{"code":"66558877"}}}
                await this.mover.timeoutResolveV2(this.randomIntFromInterval(100,500))
                resolve(1)
            })
            await this.mover.useInteractiveChangeMap(idInterra)
        })
    }

    //on achete le moins chere possible (possibilité de dépassé (sans dépasser le listprixmax si renseigner))
    /**
     * return [etat, quantité acheter avec succes]
     */
    public acheterItemV2(id, item, quantite, listePrixMax) {
        return new Promise(async (resolve, reject) => {
            console.log('id:'+id+', categorie:'+item.typeId+', quantite:'+quantite + ", pods:"+(item.realWeight * quantite))
            await this.ouvrirPnjMarket()
            await this.ouvrirType(item.typeId)
            let retour = await this.checkId(id) as any

            let uidStore = -1
            if(retour[0] != undefined)
                uidStore = retour[0].objectUID
            else{
                console.log('erreur retour ?')
                console.log(retour)
            }

            if(listePrixMax[id] == undefined || retour.length>1){//mode manuel (prix max inconnue)
                if(retour.length>1){
                    this.betterLogger('plusieurs objet en vente, achat manuel')
                }
                //on écoute les events emis (match uid et uidStore)
                //{"call":"sendMessage","data":{"type":"ExchangeBidHouseBuyMessage","data":{"uid":615570,"qty":1,"price":1}}}
                //on écoute retour 
                //{"_messageType":"ExchangeBidHouseBuyResultMessage","uid":615570,"bought":true,"_isInitialized":true}

                let compteurAchat = 0

                let onSendMessage = (msg) => {
                    if(msg.data.data != undefined)
                        if (msg.data.data.type == 'ExchangeBidHouseBuyMessage'){
                            if(msg.data.data.data.uid == uidStore || uidStore == -1){
                                this.once(this.wGame.dofus.connectionManager, 'ExchangeBidHouseBuyResultMessage', (e: any) => {
                                    if(e.uid == msg.data.data.data.uid){
                                        compteurAchat += msg.data.data.data.qty
                                    }
                                })
                            }
                        }
                }

                this.wGame.connectionManager.on('send', onSendMessage);

                let rng = Math.floor(Math.random()*(1000000+1))
                let idFenetre = this.createWindow(rng, "InfoAchat", 600, 50, 250, 200);
                let bodyFenetre = this.getwindowSing.getWindow(idFenetre).windowBody;

                bodyFenetre.rootElement.innerHTML = "On achete :"+item.nameId+' *'+quantite

                let txtPods = document.createElement("p")
                txtPods.appendChild(document.createTextNode("Pods :"+this.wGame.gui.playerData.inventory.weight+'/'+this.wGame.gui.playerData.inventory.maxWeight+' ,dispo: ('+(this.wGame.gui.playerData.inventory.maxWeight-this.wGame.gui.playerData.inventory.weight)+')'))
                bodyFenetre.rootElement.appendChild(txtPods)

                let color = "green"

                if((this.wGame.gui.playerData.inventory.weight+(quantite*item.realWeight))>this.wGame.gui.playerData.inventory.maxWeight){
                    color = "red"
                }else if((this.wGame.gui.playerData.inventory.weight+(quantite*item.realWeight)+100)>this.wGame.gui.playerData.inventory.maxWeight){
                    color = "orange"
                }

                let txtPodsOverload = document.createElement("p")
                txtPodsOverload.innerHTML = "Pods apres achat :<span style=\"color:"+color+"\">"+(this.wGame.gui.playerData.inventory.weight+(quantite*item.realWeight))+'</span>/'+this.wGame.gui.playerData.inventory.maxWeight
                bodyFenetre.rootElement.appendChild(txtPodsOverload)

                let boutonnext = document.createElement('button')
                boutonnext.appendChild(document.createTextNode('Next:'))

                let next = () => {
                    const focusedWindow = this.getwindowSing.getWindow(idFenetre);
                    focusedWindow.close();
                    this.wGame.connectionManager.removeListener('send', onSendMessage);
                    resolve([1,quantite])
                }

                boutonnext.onclick = () => {
                    next()
                }
                bodyFenetre.rootElement.appendChild(boutonnext)

                let prev = () => {
                    console.log("prev")
                    this.wGame.connectionManager.removeListener('send', onSendMessage);
                    const focusedWindow = this.getwindowSing.getWindow(idFenetre);
                    focusedWindow.close();
                    console.log("achete:"+compteurAchat)
                    resolve([-1,compteurAchat])//on retourne -1 (trigger le vidage dans banque/coffre et réouverture meme ingrédient)
                }
                //bouton qui vide l'inv et "réouvre" la bonne page
                let boutonvidage = document.createElement('button')
                boutonvidage.appendChild(document.createTextNode('Vide banque/coffre:'))
                boutonvidage.onclick = () => {
                    prev()
                }

                bodyFenetre.rootElement.appendChild(boutonvidage)
            }else{//mode full auto
                //on check les prix les plus bas, on essaye de prendre le "max" dans la limite exemple : 124 de dispo, 1er prix *1, puis *10, *100 hors prix
                //on achete par 10 en 1er (si pas de surpoid) puis *1
                //si surpoid, on resolve [-2,qty deja acheté]

                let hightestBuy = this.getHighestQty(quantite)
                console.log(retour[0].prices)


                this.betterLogger('mode full auto pas la, prix max/u'+listePrixMax[id])
            }
        })
    }

    private getHighestQty(qty) {
        if(qty>=100)
            return 100
        if(qty <10)
            return 1
        return 10
    }

    public acheterItem(id, categorie, quantite, prixMax = null) {
        return new Promise((resolve, reject) => {
            if(prixMax == null)prixMax=10000
            this.fermerFenetre()

            let uidAcheter = -1

            // on prend le cas ou l'objet = 1pod
            if(this.wGame.gui.playerData.inventory.weight+quantite >= this.wGame.gui.playerData.inventory.maxWeight){
                Logger.info('surpoid on ne peut pas acheter')
                resolve(-1)// surpoid probable
            }else{
                let achatTimeout = setTimeout(async () => {
                    Logger.info('achat echoue')
                    await this.fermerFenetreAsync()
                    resolve(0)
                }, 10000);
    
                // une traitement des requetes informatives (obtention du uid, prix)
                this.once(this.wGame.dofus.connectionManager, 'ExchangeTypesItemsExchangerDescriptionForUserMessage', (e: any) => {
                    setTimeout(() => {
                        let position = 0
                        switch (quantite) {
                            case 10:
                                position = 1
                                break;
                            case 100:
                                position = 2
                                break;
                            default:
                                break;
                        }
                        if(prixMax>e.itemTypeDescriptions[0].prices[position]/quantite){
                            if(this.wGame.gui.playerData.inventory.kamas>e.itemTypeDescriptions[0].prices[0]){
                                this.once(this.wGame.dofus.connectionManager, 'ExchangeBidHouseBuyResultMessage', (e: any) => {
                                    try {
                                        if(e.uid == uidAcheter){
                                            if(e.bought){
                                                Logger.info('achat reussi')
                                            }
                                        }
                                        clearTimeout(achatTimeout);
                                        resolve(1)
                                    } catch (ex) {
                                        Logger.info(ex);
                                    }
                                })
                                Logger.info('on achete')
                                uidAcheter = e.itemTypeDescriptions[0].objectUID
                                this.wGame.dofus.sendMessage("ExchangeBidHouseBuyMessage", {
                                    uid: e.itemTypeDescriptions[0].objectUID,
                                    qty: quantite,
                                    price: e.itemTypeDescriptions[0].prices[position]
                                })
                            }else{
                                Logger.info('pas assez de kamas pour acheter, kamas :'+this.wGame.gui.playerData.inventory.kamas+', prix:'+e.itemTypeDescriptions[0].prices[0])
                                resolve(0)
                            }
                        }else{
                            Logger.info('truc trop chere')
                            resolve(0)
                        }
                    }, 100)//pour pas ce faire voler
                })
    
                setTimeout(() => {
                    // on ouvre l'echange pour acheter
                    this.wGame.dofus.sendMessage("NpcGenericActionRequestMessage", {
                        npcId: 0,
                        npcActionId: 6,// 6 = acheter, 5 = vendre
                        npcMapId: this.wGame.gui.playerData.position.mapId
                    })
    
                    // on demande la catégorie de la ressources et la ressource
                    setTimeout(() => {
                        this.wGame.dofus.sendMessage("ExchangeBidHouseTypeMessage", {
                            type: categorie // categorie hdv (exemple 15 = ressources diverses)
                        })
                        this.wGame.dofus.sendMessage("ExchangeBidHouseListMessage", {
                            id: id//311 = eau
                        })
                    }, this.randomIntFromInterval(500,1000))
                }, this.randomIntFromInterval(500,1000))
            }
        })

    }

    public esCeQuOnPossedeCetteItem(id) {
        let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
        for (let index = 0; index < keys.length; index++) {
            if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == id){//311 = eau
                return true
            }
        }
        return false
    }

    //retourne vrai si le chiffre en param est pair
    public pair(chiffre):boolean{
        chiffre=parseInt(chiffre);
        if ( (chiffre % 2) == 0) {
            return true
       } else {
            return false
       }
    }
    
    //vérifier et déactiver l'inactivité
    public cancelInactivite() {
        if(this.wGame.gui.fightManager.isInactive){
            Logger.error('inactiviter detecter')
            for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
                let win = this.wGame.gui.windowsContainer._childrenList[i];
                if (win.isVisible()) {
                    Logger.info(win.messageStack[0].title)
                    if(win.messageStack[0].title == 'Inactivité'){
                        win.closeButton.tap()
                        // on force l'inactivity a false
                        this.wGame.gui.fightManager.isInactive = false
                        Logger.info('inactiviter resolu')
                    }
                    break;
                }
            }
        }
    }
    
    // retourner une cellule disponible (pour changer de map)
    public getRandomAvailableCell(cells: Array<number>, direction: string): number {
        let occupiedCells = this.getMonsterGroupBossCells();
        let availableCells = cells.filter( cell => !occupiedCells.includes(cell) 
        	&& this.isCellOnMap(cell) 
        	&& this.isCellWalkable(cell) 
        	&& this.isCellChangesMapToDirection(cell, direction)).sort(() => Math.random() - 0.5);

        if (availableCells.length > 0) {
        	return availableCells[0];
        } else {
        	return -1;
        }
    }

    // retourner une cellule disponible sur la map
    public getRandomAvailableCellOnMap(): number {
        let cells = this.getCellWalkable()
        let occupiedCells = this.getMonsterGroupBossCells();
        let availableCells = cells.filter( cell => !occupiedCells.includes(cell) 
            && this.isCellOnMap(cell) 
            && !this.isCellChangesMapToDirection(cell, 'top')
            && !this.isCellChangesMapToDirection(cell, 'bottom')
            && !this.isCellChangesMapToDirection(cell, 'left')
            && !this.isCellChangesMapToDirection(cell, 'right')
        	&& this.isCellWalkable(cell)).sort(() => Math.random() - 0.5);

        if (availableCells.length > 0) {
        	return availableCells[0];
        } else {
        	return -1;
        }
    }

    // retourner la cellule disponible la plus proche de nous
    public getClosestAvailableCellOnMap(): number {
        let cells = this.getCellWalkable()
        let occupiedCells = this.getMonsterGroupBossCells();
        let availableCells = cells.filter( cell => !occupiedCells.includes(cell) 
            && this.isCellOnMap(cell) 
            && !this.isCellChangesMapToDirection(cell, 'top')
            && !this.isCellChangesMapToDirection(cell, 'bottom')
            && !this.isCellChangesMapToDirection(cell, 'left')
            && !this.isCellChangesMapToDirection(cell, 'right')
        	&& this.isCellWalkable(cell));

        if (availableCells.length > 0) {
            this.pathfinder.resetPath()
            this.pathfinder.fillPathGrid(this.wGame.isoEngine.mapRenderer.map)
            let tailleChemin = 9999
            let pluscourt = null
            for (let sdsdsd = 0; sdsdsd < availableCells.length; sdsdsd++) {
                var path = this.pathfinder.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, availableCells[sdsdsd], 
                    this.wGame.isoEngine.actorManager._occupiedCells, this.wGame.isoEngine.actorManager.userActor.canMoveDiagonally, false);

                if(path.length<tailleChemin){
                    pluscourt = availableCells[sdsdsd]
                    tailleChemin = path.length
                }
            }
        	return pluscourt;
        } else {
        	return -1;
        }
    }

    public getCellWalkable():Array<number>{
        let cellWalkable = []
        if(this.wGame.isoEngine.mapRenderer.map != null)
            for (let index = 0; index < this.wGame.isoEngine.mapRenderer.map.cells.length; index++) {
                var los = this.wGame.isoEngine.mapRenderer.map.cells[index].l || 0
                if ((los & 7) === 3) {
                    cellWalkable.push(index)
                }
            }
        return cellWalkable
    }

    //retourne la cellule la plus proche pour changer de map
    public getClosestAvailableCell(cells: Array<number>, direction: string): number {
        let occupiedCells = this.getMonsterGroupBossCells();
        let availableCells = cells.filter( cell => !occupiedCells.includes(cell) 
        	&& this.isCellOnMap(cell) 
        	&& this.isCellWalkable(cell) 
        	&& this.isCellChangesMapToDirection(cell, direction))

        if (availableCells.length > 0) {
            let plusGrandChemin = 9999
            let cellIdFinal = -1
            this.pathfinder.resetPath()
            this.pathfinder.fillPathGrid(this.wGame.isoEngine.mapRenderer.map)
            for (let index = 0; index < availableCells.length; index++) {
                var path = this.pathfinder.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, availableCells[index], 
                    this.getOccupiedCellNotToBeAggressed(), this.wGame.isoEngine.actorManager.userActor.canMoveDiagonally, false);
                if(path.length<plusGrandChemin && availableCells[index] == path[path.length-1]){
                    cellIdFinal = availableCells[index]
                    plusGrandChemin = path.length
                }
            }
        	return cellIdFinal
        } else {
        	return -1;
        }
    }

    // verifier si la cellules existe sur la map
    public isCellOnMap(cell: number): boolean {
    	return this.wGame.isoEngine.mapRenderer.map.cells[cell];
    }

    // verifier si on peux marcher sur la cellule
    public isCellWalkable(cell: number): boolean {
    	return this.wGame.isoEngine.mapRenderer.isWalkable(cell);
    }

    // verifier si la cellule permet de changer de map
    public isCellChangesMapToDirection(cell: number, direction: string): boolean {
    	return this.wGame.isoEngine.mapRenderer.getChangeMapFlags(cell)[direction];
    }

    // obenir la liste des cellules occupées par des monstres
    public getMonsterGroupBossCells(): Array<number> {
        let cells = [];
        let actors = this.wGame.isoEngine.actorManager.getIndexedVisibleActors();
        for (var id in actors) {
            if (actors[id].data.type == "GameRolePlayGroupMonsterInformations" && actors[id].groupBoss == null) {
                cells.push(actors[id].cellId);
            }
        }
        return cells;
    }

    public getTopCells(): any {
        return [1, 15, 2, 16, 3, 17, 4, 18, 5, 19, 6, 20, 7, 21, 8, 22, 9, 23, 10, 24, 11, 25, 12, 26, 13];
    }
    
    public getTopCellsLeft(): any {
        return [1, 15, 2, 16, 3, 17, 4, 18, 5, 19, 6, 20, 7];
    }

    public getBottomCells(): any {
        return [533, 547, 534, 548, 535, 549, 536, 550, 537, 551, 538, 552, 539, 553, 540, 554, 541, 555, 542, 556, 543, 557, 544, 558, 545, 559];
    }

    public getLeftCells(): any {
        return [98, 112, 126, 140, 154, 168, 182, 196, 210, 224, 238, 252, 266, 280, 294, 308, 322, 336, 350, 364, 378, 392, 406, 420, 434, 448, 462, 476, 490, 504, 518];
    }

    public getRightCells(): any {
        return [167, 181, 195, 209, 223, 251, 279, 307, 321, 335, 349, 363, 377, 391, 405, 419, 433, 447, 475, 489, 503, 517, 531, 545, 559];
    }

    public getRightCellsBas() {
        return [349, 363, 377, 391, 405, 419, 433, 447, 475, 489, 503, 517, 531, 545, 559];
    }

    // obtenir une "liste" avec un ennemi dedans
    public getMonsterGroupActor(): any {
        let cells = [];
        let actors = this.wGame.isoEngine.actorManager.getIndexedVisibleActors();
        for (var id in actors) {
            if (actors[id].data.type == "GameRolePlayGroupMonsterInformations" && actors[id].groupBoss == null) {
                cells.push(actors[id]);
            }
        }
        return cells;
    }

    // retourne la porté d'un spell avec les bonus malus des objets équipé/monture
    public getPorterSpell(spell:any):number {
        let rangeFinal = spell.spellLevel.range
        
        if(spell.spellLevel.rangeCanBeBoosted){
            let keys = Object.keys(this.wGame.gui.playerData.inventory.equippedItems)
            for (let index = 0; index < keys.length; index++) {
                // Logger.info(util.inspect(this.wGame.gui.playerData.inventory.equippedItems[keys[index]]))
                let keysEffect = Object.keys(this.wGame.gui.playerData.inventory.equippedItems[keys[index]].effectsMap)
                for (let index2 = 0; index2 < keysEffect.length; index2++) {
                    if(keysEffect[index2] == '117'){
                        //Logger.info('nom:'+this.wGame.gui.playerData.inventory.equippedItems[keys[index]].item.nameId)
                        //Logger.info(util.inspect(this.wGame.gui.playerData.inventory.equippedItems[keys[index]].effectsMap[keysEffect[index2]]))
                        rangeFinal += this.wGame.gui.playerData.inventory.equippedItems[keys[index]].effectsMap[keysEffect[index2]].value
                    }else if(keysEffect[index2] == '116'){//malus
                        rangeFinal -= this.wGame.gui.playerData.inventory.equippedItems[keys[index]].effectsMap[keysEffect[index2]].value
                    }
                }
            }
            if(this.wGame.gui.playerData.isRiding){ // si on as une monture/ truc ou on monte dessus et qui donne des bonus/malus
                let keyEffec = Object.keys(this.wGame.gui.playerData.equippedMount.effectList)
                for (let index = 0; index < keyEffec.length; index++) {
                    if(this.wGame.gui.playerData.equippedMount.effectList[keyEffec[index]].actionId == '117'){
                        rangeFinal += this.wGame.gui.playerData.equippedMount.effectList[keyEffec[index]].value
                    }else if(this.wGame.gui.playerData.equippedMount.effectList[keyEffec[index]].actionId == '116'){//malus
                        rangeFinal -= this.wGame.gui.playerData.equippedMount.effectList[keyEffec[index]].value
                    }
                }
                
            }
        }
        return rangeFinal
    }

    // obtenir l'ennemy le plus proche du joueur(fenetre)
    public getClosestEnnemy(): any{
        let fighters = this.wGame.gui.fightManager.getFighters();
        let distanceMax = 99999;
        let fighterFinal = null;
        for (let index in fighters) {
            let fighter = this.wGame.gui.fightManager.getFighter(fighters[index]);
            if (fighter.data.alive && fighter.data.teamId != this.getPlayer().data.teamId) {// si il est en vie et dans l'autre equipe
                let y=0;
                let tmp=fighter.data.disposition.cellId;
                while(tmp>0){
                    y++;
                    tmp -= 14;
                }
                let x = ((fighter.data.disposition.cellId % 14)+1);

                let y2=0;
                let tmp2=this.getPlayer().data.disposition.cellId;
                while(tmp2>0){
                    y2++;
                    tmp2 -= 14;
                }
                let x2 = ((this.getPlayer().data.disposition.cellId % 14)+1);

                //Logger.info("x:"+x+ "y:"+y);
                if((Math.sqrt(Math.pow((x2-x),2)+Math.pow((y2-y),2)))<distanceMax){
                    fighterFinal = fighter;
                    distanceMax = (Math.sqrt(Math.pow((x2-x),2)+Math.pow((y2-y),2)));
                }
            }
        }
        //Logger.info('fighter nom :'+fighterFinal.name);
        //Logger.info('fighter equipe (0 = joueur en pvm):'+fighterFinal.data.teamId);
        //Logger.info('fighter lvl :'+fighterFinal.level);
        //Logger.info('fighter case :'+fighterFinal.data.disposition.cellId);
        return fighterFinal;
    }

    // obtenir l'objet Player du JOUEUR(de la fenetre) pendant le combat
    public getPlayer(): any{ 
        let fighters = this.wGame.gui.fightManager.getFighters();
        for (let index in fighters) {
            let fighter = this.wGame.gui.fightManager.getFighter(fighters[index]);
            if (fighter.data.alive && fighter.name == this.wGame.gui.playerData.characterBaseInformations.name) {
                return fighter;
            }
        }
    }

    // transforme une cellID en x,y
    public getCellIDPosition(cellID): number[]{
        let y=0;
        let tmp=cellID;
        while(tmp>0){
            y++;
            tmp -= 14;
        }
        return [((cellID % 14)+1), y];
    }

    // retourne la position x,y du joueur(fenetre) pendant combat
    public getPlayerPosition(): number[]{
        let fighters = this.wGame.gui.fightManager.getFighters();
        for (let index in fighters) {
            let fighter = this.wGame.gui.fightManager.getFighter(fighters[index]);
            if (fighter.data.alive && fighter.name == this.wGame.gui.playerData.characterBaseInformations.name) {
                let y=0;
                let tmp=fighter.data.disposition.cellId;
                while(tmp>0){
                    y++;
                    tmp -= 14;
                }
                return [((fighter.data.disposition.cellId % 14)+1), y];
            }
        }
    }

    // on ferme toutes les fenetres ouverte a l'ecran (fin combat par exemple)
    public fermerFenetre() {
        for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
            let win = this.wGame.gui.windowsContainer._childrenList[i];
            if (win.isVisible()) {
                Logger.info('on ferme une fenetre')
                //Logger.info('win:'+util.inspect(win.windowTitle))
                //Logger.info('win:'+win.windowTitle._currentTextContent)
                win.close();
                break;
            }
        }
    }

     // on ferme toutes les fenetres ouverte a l'ecran (fin combat par exemple)
     public fermerFenetreAsync(idblacklist = null) {
        return new Promise(async (resolve, reject) => {
            for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
                let win = this.wGame.gui.windowsContainer._childrenList[i];
                if (win.isVisible() && win.id != idblacklist) {
                    Logger.info('on ferme une fenetre')
                    //Logger.info('win:'+util.inspect(win.windowTitle))
                    //Logger.info('win:'+win.windowTitle._currentTextContent)
                    win.close();
                }
            }
            setTimeout(() => {
                resolve(1)
            }, this.randomIntFromInterval(300,700));
        })
    }

    public checkNiveauPotion() {
        return new Promise(async (resolve, reject) => {
            //548 = popo rappel
            //6964 = popo brack
            //6965 = popo bonta
            //10973 = desti inconnue
            let countRappel = 0
            let countBrack = 0
            let countBonta = 0
            let countDesti = 0
            let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
            for (let index = 0; index < keys.length; index++) {
                if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == 6964){
                    countBrack = this.wGame.gui.playerData.inventory.objects[keys[index]].quantity
                }
                if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == 6965){
                    countBonta = this.wGame.gui.playerData.inventory.objects[keys[index]].quantity
                }
                if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == 548){
                    countRappel = this.wGame.gui.playerData.inventory.objects[keys[index]].quantity
                }
                if(this.wGame.gui.playerData.inventory.objects[keys[index]].item.id == 10973){
                    countDesti = this.wGame.gui.playerData.inventory.objects[keys[index]].quantity
                }
            }
            if(countRappel<=0){
                await this.acheterItem(548,12,10)
                await this.fermerFenetreAsync()
            }
            if(countBrack<=0){
                await this.acheterItem(6964,12,10)
                await this.fermerFenetreAsync()
            }
            if(countBonta<=0){
                await this.acheterItem(6965,12,10)
                await this.fermerFenetreAsync()
            }
            resolve(countDesti)
        })
    }

    /**
     * changeMapAsync
     */
    public changeMapAsync(direction) {
        return new Promise((resolve, reject) => {
            Logger.error('DEPRECATED')
            if (this.wGame.gui.playerData.inventory.isOverloaded() && !this.wGame.gui.playerData.isMutant()) {
                this.sendMessagePartyOverload()
                resolve(-1)
            }
            Logger.info('changeMapAsync')
            let cells = null;
            switch(direction) {
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
                    Logger.error('wtf la direction est fausse. changeMapAsync');
                    resolve(-1)
            }
            //let cell = this.getRandomAvailableCell(cells, direction)
            let cell = this.getClosestAvailableCell(cells, direction)

            let previousMap = this.wGame.isoEngine.mapRenderer.mapId;
            let changeTimeout = setTimeout(() => {
                Logger.error('timeout changeMapAsync')
                resolve(-1)
            }, 15000)

            let onChange = (e: any) => {
                this.wGame.dofus.connectionManager.removeListener("MapComplementaryInformationsWithCoordsMessage", onChange)
                this.wGame.dofus.connectionManager.removeListener("MapComplementaryInformationsDataMessage", onChange)
                clearTimeout(changeTimeout)
                let changeMapRetry = () => {
                    if (this.wGame.isoEngine.actorManager.getActor(this.wGame.isoEngine.actorManager.userId).moving || previousMap == this.wGame.isoEngine.mapRenderer.mapId) {
                        setTimeout(changeMapRetry, 300)
                    }
                    else {
                        setTimeout(() => {
                            resolve(1)
                        }, this.randomIntFromInterval(1000,2000))
                    }
                }
                setTimeout(changeMapRetry, 1200);
            }
            
            this.once(this.wGame.dofus.connectionManager, "MapComplementaryInformationsWithCoordsMessage", onChange)
            this.once(this.wGame.dofus.connectionManager, "MapComplementaryInformationsDataMessage", onChange)

            let doMove = () => {
                let scenePos = this.wGame.isoEngine.mapRenderer.getCellSceneCoordinate(cell);
                let pos = this.wGame.isoEngine.mapScene.convertSceneToCanvasCoordinate(scenePos.x, scenePos.y);
                this.wGame.isoEngine.gotoNeighbourMap(direction, cell, Math.floor(pos.x), Math.floor(pos.y));
            }
            if (this.wGame.isoEngine.actorManager.userActor.moving){
                this.wGame.isoEngine.actorManager.userActor.cancelMovement(doMove)
            }else{
                if(!this.matchStart){
                    doMove()
                }else{
                    Logger.error('le match a commencé ???? changeMapAsync')
                    resolve(-1)
                }
            } 
        })
    }

    public changeMapAsyncEsquiveMobHostile(direction) {
        return new Promise((resolve, reject) => {
            Logger.error('DEPRECATED')
            if (this.wGame.gui.playerData.inventory.isOverloaded() && !this.wGame.gui.playerData.isMutant()) {
                this.sendMessagePartyOverload()
                resolve(-1)
            }
            //on obtient la cell ou on va changer de map
            let cells = null;
            switch(direction) {
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
                    //Logger.info('wtf la direction est fausse.');
                    resolve(-1)
            }
            let cell = this.getClosestAvailableCell(cells, direction)
            
            //on obtient la cell d'avant
            this.pathfinder.resetPath()
            this.pathfinder.fillPathGrid(this.wGame.isoEngine.mapRenderer.map)
            var path = this.pathfinder.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, cell, 
                this.getOccupiedCellNotToBeAggressed(), this.wGame.isoEngine.actorManager.userActor.canMoveDiagonally, false)
            if(path.length>2){
                this.movePlayerOnMapAggro(path[path.length-2], false, () => {
                    Logger.info('je suis arrivé')
                    this.changeMapAsync(direction)
                })

                let arriveInterval = setInterval(() => {
                    if (!this.wGame.isoEngine.actorManager.userActor.moving){
                        //on est arrivé
                        Logger.info('je suis arrivé')
                        this.changeMapAsync(direction)
                        clearInterval(arriveInterval)
                    }
                }, 100)
            }else{
                this.changeMapAsync(direction)
            }
            
        })
    }

    /**
     * sendMessagePartyOverload
     */
    public sendMessagePartyOverload() {
        //if(this.wGame.gui.party.currentParty && this.wGame.gui.party.currentParty._childrenList.length > 0) {
            this.wGame.dofus.sendMessage("ChatClientMultiMessage", {
                content: 'je suis surchargé attendez moi',
                channel: 4
            })
        //}
    }

    public movePlayerOnMapAggro(cellId, stopNextToTarget, cb) {
        if (!cb || typeof cb !== 'function') { cb = function () {}; }

        let window = this.wGame
        let mapRenderer = this.wGame.isoEngine.mapRenderer

        if (window.gui.playerData.inventory.isOverloaded() && !window.gui.playerData.isMutant()) {
            this.sendMessagePartyOverload()
            return;
        }
        stopNextToTarget = stopNextToTarget || false;
        var userActor = this.wGame.isoEngine.actorManager.userActor;
        var source = userActor.cellId;
        if (source === cellId) {
            cb(null, cellId);
            return cellId;
        }

        // find a path from actual position to the tapped cell
        var map  = mapRenderer.map;
        var occupiedCells = this.wGame.isoEngine.actorManager._occupiedCells
        var canMoveDiagonally = userActor.canMoveDiagonally
        this.pathfinder.resetPath()
        this.pathfinder.fillPathGrid(mapRenderer.map)
        //let cheminTrouver = pathfinder.getPath(this.wGame.isoEngine.actorManager.userActor.cellId,450,this.getOccupiedCellNotToBeAggressed(),true,false)
        //Logger.info(cheminTrouver)

        var path = this.pathfinder.getPath(this.wGame.isoEngine.actorManager.userActor.cellId, cellId, this.getOccupiedCellNotToBeAggressed(), canMoveDiagonally, stopNextToTarget);

        if (path.length <= 1) {
            cb(new Error('_movePlayerOnMap noPath:' + source + ':' + cellId));
            return null;
        }
        // send request to the server and wait for the response.
        this.wGame.isoEngine.isMovementWaitingForConfirmation = true;
        this.wGame.isoEngine.lastMoveRequestTime = Date.now();
        window.gui.emit('checkServerLag', 'roleplayUserActorMovement', 'start');
        window.dofus.sendMessage('GameMapMovementRequestMessage', { keyMovements: this.pathfinder.compressPath(path), mapId: map.id });

        // create and trigger player animation
        var destination = path[path.length - 1];
        mapRenderer.addMovementFeedback(destination);

        this.wGame.isoEngine.endMovementCallback = cb;
        userActor.setPath(path, { cb: function () {
            window.dofus.sendMessage('GameMapMovementConfirmMessage', null);
            mapRenderer.removeMovementFeedback();
        } });

        var camera = this.wGame.isoEngine.mapScene.camera;
        camera.setAcceleration(1);

        userActor.pathTween.removeOnUpdate();
        userActor.onMovementUpdate = function () {
            camera.moveTo(userActor.x, userActor.y);
        };
        userActor.pathTween.onUpdate(userActor.onMovementUpdate);
        this.wGame.isoEngine.userPreviousPosition = userActor.cellId;
        userActor.setCellPosition(destination);
        return destination;
    }

    public getOccupiedCellNotToBeAggressed() {
        let aggressivesMob = this.mover.agressives
        let cellIdsAGGRESSIVE = []
        let cellIdsAGGRESSIVEetVOISINE = []
        let allInteractive = this.wGame.isoEngine._getAllInteractives()
        let interas = this.wGame.isoEngine.mapRenderer.interactiveElements
        //check mob aggressive
        for (let bvbvbvbvb = 0; bvbvbvbvb < allInteractive.length; bvbvbvbvb++) {
            let aggressive = false
            let mob = null
            var c = allInteractive[bvbvbvbvb];
			if (c.data && c.data.type == "GameRolePlayGroupMonsterInformations") {
				mob = c
            }
            if(mob){
                aggressive = aggressivesMob.indexOf(mob.data.staticInfos.mainCreatureLightInfos.creatureGenericId) != -1
                var mobs = mob.data.staticInfos.underlings
				for (var k = 0; k < mobs.length; k++) {
					if (aggressivesMob.indexOf(mobs[k].creatureGenericId) != -1) {
                        aggressive = true
					}
				}
            }
            if (aggressive) {
				cellIdsAGGRESSIVE.push(mob.cellId)
			}
        }

        //on récup les cases voisines du monstre (radius 1?)
        for (var r = 0; r < cellIdsAGGRESSIVE.length; r++) {
			var cells = this.getCellsNotToBeAggressed(cellIdsAGGRESSIVE[r]);
			for (var m = 0; m < cells.length; m++) {
				if (cells[m] > 0) {
					cellIdsAGGRESSIVEetVOISINE.push(cells[m]);
				}
			}
        }
        //on récup les cases voisines du monstre (radius 2?)
        var tmp = cellIdsAGGRESSIVEetVOISINE.slice(0);
		for (var i = 0; i < tmp.length; i++) {
			var cells = this.getCellsNotToBeAggressed(tmp[i]);
			for (var m = 0; m < cells.length; m++) {
				if (cells[m] > 0) {
					cellIdsAGGRESSIVEetVOISINE.push(cells[m]);
				}
			}
        }
        //radius 3 //on est jamais trop prudent
        tmp = cellIdsAGGRESSIVEetVOISINE.slice(0);
		for (var i = 0; i < tmp.length; i++) {
			var cells = this.getCellsNotToBeAggressed(tmp[i]);
			for (var m = 0; m < cells.length; m++) {
				if (cells[m] > 0) {
					cellIdsAGGRESSIVEetVOISINE.push(cells[m]);
				}
			}
        }
        cellIdsAGGRESSIVEetVOISINE.filter(function (item, index, inputArray) {
			return inputArray.indexOf(item) == index;
        })
        var realOccupied = this.wGame.isoEngine.actorManager._occupiedCells;
		for (var i = 0; i < cellIdsAGGRESSIVEetVOISINE.length; i++) {
			if (realOccupied[cellIdsAGGRESSIVEetVOISINE[i]]) {
				realOccupied[cellIdsAGGRESSIVEetVOISINE[i]].push({
					id: 0
				});
			} else {
				realOccupied[cellIdsAGGRESSIVEetVOISINE[i]] = [{
					id: 0
				}];
			}
        }
        return realOccupied
    }

    public getCellsNotToBeAggressed(cellId, boolDiago = true) {
		return this.getNeighbourCells(cellId, boolDiago);
    }

    public getNeighbourCells(cellId, allowDiagonal) {
        allowDiagonal = allowDiagonal || false;
        var coord = this.getMapPointFromCellId(cellId);
        var x = coord.x;
        var y = coord.y;
        var neighbours = [];
        if (allowDiagonal) { neighbours.push(this.getCellIdFromMapPoint(x + 1, y + 1)); }
        neighbours.push(this.getCellIdFromMapPoint(x, y + 1));
        if (allowDiagonal) { neighbours.push(this.getCellIdFromMapPoint(x - 1, y + 1)); }
        neighbours.push(this.getCellIdFromMapPoint(x - 1, y));
        if (allowDiagonal) { neighbours.push(this.getCellIdFromMapPoint(x - 1, y - 1)); }
        neighbours.push(this.getCellIdFromMapPoint(x, y - 1));
        if (allowDiagonal) { neighbours.push(this.getCellIdFromMapPoint(x + 1, y - 1)); }
        neighbours.push(this.getCellIdFromMapPoint(x + 1, y));
        return neighbours;
    }

    /**
     * prendreZaapi
     */
    public prendreZaapi(mapid) {
        return new Promise((resolve, reject) => {
            if (this.wGame.gui.playerData.inventory.isOverloaded() && !this.wGame.gui.playerData.isMutant()) {
                this.sendMessagePartyOverload()
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
                                            }, this.randomIntFromInterval(500,1000))
                                        })
                                        setTimeout(() => {
                                            this.wGame.dofus.sendMessage("TeleportRequestMessage", {
                                                teleporterType: e.teleporterType,
                                                mapId:mapid
                                            })
                                        }, this.randomIntFromInterval(500,1000))
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

    public async crafting(idObj, qty){
        return new Promise(async (resolve, reject) => {
            await this.mover.timeoutResolveV2(this.randomIntFromInterval(600,900))
            this.wGame.dofus.sendMessage("ExchangeSetCraftRecipeMessage", {
                objectGID: idObj
            })

            if(qty>1){
                //{"call":"sendMessage","data":{"type":"ExchangeReplayMessage","data":{"count":2}}}
                await this.mover.timeoutResolveV2(this.randomIntFromInterval(600,900))

                this.wGame.dofus.sendMessage("ExchangeReplayMessage", {
                    count: qty
                })
            }

            //TODO event ack ?
            await this.mover.timeoutResolveV2(this.randomIntFromInterval(600,900))

            this.wGame.dofus.sendMessage("ExchangeReadyMessage", {
                ready: true,
                step: 2
            })
            await this.mover.timeoutResolveV2(this.randomIntFromInterval(1000,1200))

            resolve(1)
        })
    }

    public onBouge(chemin) {
        this.sessionInfo[8] = 'En cours de deplacement, entre ['+chemin[0][0]+','+chemin[0][1]+'] et ['+chemin[chemin.length-1][0]+','+chemin[chemin.length-1][1]+']'
        this.updateSession()
        let nextEtape = -1
        for (let index = 0; index < chemin.length; index++) {
            if(chemin[index][0] == this.wGame.gui.playerData.position.mapPosition.posX && chemin[index][1] == this.wGame.gui.playerData.position.mapPosition.posY){
                nextEtape = (index+1)
            }
        }

        if(nextEtape == -1){
            Logger.error('Le joueur doit etre a la position du depart ou sur le chemin')
        }else{
            if(chemin.length == nextEtape){//derniere pos tableau->debut
                Logger.info('on a est arrive')
                this.sessionInfo[8] = 'Déplacement terminé, idle'
                this.updateSession()
            }else{
                // on recherche la direction, x=<-> y=|
                let direction = 'nop'
                if(this.wGame.gui.playerData.position.mapPosition.posX>chemin[nextEtape][0]){
                    direction = 'left'
                }else if(this.wGame.gui.playerData.position.mapPosition.posX<chemin[nextEtape][0]){
                    direction = 'right'
                }else if(this.wGame.gui.playerData.position.mapPosition.posY>chemin[nextEtape][1]){
                    direction = 'top'
                }else if(this.wGame.gui.playerData.position.mapPosition.posY<chemin[nextEtape][1]){
                    direction = 'bottom'
                }
    
                if(direction == 'nop'){
                    Logger.error('direction non trouvé :/')
                }else{
                    //Logger.info('direction:'+direction)
                    this.enCourDeChangementDeMap = true;
                    this.changerDeMap(direction, () => {
                        Logger.info('Changement de map vers '+direction+' OK');
                        this.enCourDeChangementDeMap = false;
                        this.onBouge(chemin)
                    }, (reason: string = '') => {
                        Logger.error('Changement de map vers '+direction+' Failed... (' + reason + ')');
                        this.enCourDeChangementDeMap = false
                        this.onBouge(chemin)
                    });
                }
            }
        }
    }

    // on change de map
    private changerDeMap(direction: string, success: any, fail: any) {
        let cells = null;
        switch(direction) {
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
                //Logger.info('wtf la direction est fausse.');
                fail('wtf la direction est fausse.');
        }
        let cell = this.getRandomAvailableCell(cells, direction);

        let doMove = () => {
            let scenePos = this.wGame.isoEngine.mapRenderer.getCellSceneCoordinate(cell);
            let pos = this.wGame.isoEngine.mapScene.convertSceneToCanvasCoordinate(scenePos.x, scenePos.y);
            this.wGame.isoEngine.gotoNeighbourMap(direction, cell, Math.floor(pos.x), Math.floor(pos.y));
        };
        this.onMapChange(success, fail);
        if (this.wGame.isoEngine.actorManager.userActor.moving) this.wGame.isoEngine.actorManager.userActor.cancelMovement(doMove);
        else{
            if(!this.matchStart){
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

        
    public destroy(){
        Logger.info('api destroy')
        clearInterval(this.intervalCancelInactivite)
    }

    public reset() {
        super.reset()
        Logger.info('api reset')
        if(this.socketActiver){
            this.socket.close()
        }
        clearInterval(this.intervalCancelInactivite)
    }
}
