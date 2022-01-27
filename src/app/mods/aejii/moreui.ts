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

import {
    Mod
} from "../mod"
import {
    SettingsService
} from "@services/settings.service"
import {
    API
} from "./api"

import { DdGestion } from "./ddgestion"
import { TranslateService } from "@ngx-translate/core"

export class Moreui extends Mod {

    private affichageDiv: HTMLDivElement
    private container: HTMLDivElement

    private api: API

    private boolOpen: boolean

    private boolPassTour: boolean
    private finishTurnMin = 300
    private finishTurnMax = 1300

    private enclosChecked
    private inter

    private boolFollow: boolean
    private destX = 0
    private destY = 0
    private isFollowing = false
    private changingmap = false

    private boolClose: boolean

    private isMoreUiHide: boolean

    startMod(): void {
        return
    }
    
    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        Logger.info('moreui pre chargement ok')
        this.enclosChecked = false
        let checkInterfaceOk = setInterval(() => {
            let containerVieEtPlusButton = this.wGame.document.querySelector("#dofusBody > div.gameGuiContainer > div.SwipingDrawer.MenuDrawer.MainControls.roleplay.left > div.visibleArea > div > div.buttonBox")
            if(containerVieEtPlusButton == null){
                containerVieEtPlusButton = this.wGame.document.querySelector("#dofusBody > div.gameGuiContainer > div.SwipingDrawer.MenuDrawer.MainControls.roleplay.top > div.visibleArea > div > div.buttonBox")
            }
            if(containerVieEtPlusButton == null){

            }else{
                clearInterval(checkInterfaceOk)
                this.boolPassTour = false
                this.isMoreUiHide = false
                this.boolOpen = true
                this.boolFollow = false
                this.boolClose = false

                this.api = api//new API(wGame)

                //register event
                this.registerEvent()
                
                //on ajoute le button a coté de la vie
                let containerVieEtPlusButton = this.wGame.document.querySelector("#dofusBody > div.gameGuiContainer > div.SwipingDrawer.MenuDrawer.MainControls.roleplay.left > div.visibleArea > div > div.buttonBox")
                if(containerVieEtPlusButton == null){
                    containerVieEtPlusButton = this.wGame.document.querySelector("#dofusBody > div.gameGuiContainer > div.SwipingDrawer.MenuDrawer.MainControls.roleplay.top > div.visibleArea > div > div.buttonBox")
                }
                let divNewButton = document.createElement('div')
                divNewButton.className = 'consoleButton alwaysShowButton controlsButton Button scaleOnPress'
                divNewButton.id = 'idpourdelete'
                let avantInsertion = this.wGame.document.querySelector("#dofusBody > div.gameGuiContainer > div.SwipingDrawer.MenuDrawer.MainControls.roleplay.left > div.visibleArea > div > div.buttonBox > div.showFightsButton.roleplayButton.controlsButton.Button.scaleOnPress.disabled")
                containerVieEtPlusButton.insertBefore(divNewButton, avantInsertion)
                divNewButton.onclick = () => {
                    this.toggleUi()
                }

                this.container = document.createElement('div')
                this.container.id = 'containerMoreUi'
                this.container.className = 'containerMoreUiC'

                this.wGame.document.querySelector('#dofusBody').appendChild(this.container)

                let moreidCss = document.createElement('style')
                moreidCss.id = 'moreidCss'
                moreidCss.innerHTML = `
                    #moreidCssText {
                        box-sizing: border-box;
                        overflow: hidden;
                        font-size: 11px;
                        position: absolute;
                        color: white;
                        width: 180px;
                        height: 210px;
                        margin-left: 10px;
                        margin-top: 10px;
                        text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.9);
                        left: 10px;
                    }

                    #alertBox {
                        position:relative;
                        width:300px;
                        min-height:100px;
                        margin-top:50px;
                        border:1px solid #666;
                        background-color:#fff;
                        background-repeat:no-repeat;
                        background-position:20px 30px;
                    }
        
                    #modalContainer > #alertBox {
                        position:fixed;
                    }
        
                    #alertBox h1 {
                        margin:0;
                        font:bold 0.9em verdana,arial;
                        background-color:#3073BB;
                        color:#FFF;
                        border-bottom:1px solid #000;
                        padding:2px 0 2px 5px;
                    }
        
                    #alertBox p {
                        font:0.7em verdana,arial;
                        height:50px;
                        padding-left:5px;
                        margin-left:55px;
                    }
        
                    #alertBox #closeBtn {
                        display:block;
                        position:relative;
                        margin:5px auto;
                        padding:7px;
                        border:0 none;
                        width:70px;
                        font:0.7em verdana,arial;
                        text-transform:uppercase;
                        text-align:center;
                        color:#FFF;
                        background-color:#357EBD;
                        border-radius: 3px;
                        text-decoration:none;
                    }
        
                    /* unrelated styles */
        
                    #mContainer {
                        position:relative;
                        width:600px;
                        margin:auto;
                        padding:5px;
                        border-top:2px solid #000;
                        border-bottom:2px solid #000;
                        font:0.7em verdana,arial;
                    }
        
                    h1,h2 {
                        margin:0;
                        padding:4px;
                        font:bold 1.5em verdana;
                        border-bottom:1px solid #000;
                    }
        
                    code {
                        font-size:1.2em;
                        color:#069;
                    }
        
                    #credits {
                        position:relative;
                        margin:25px auto 0px auto;
                        width:350px; 
                        font:0.7em verdana;
                        border-top:1px solid #000;
                        border-bottom:1px solid #000;
                        height:90px;
                        padding-top:4px;
                    }
        
                    #credits img {
                        float:left;
                        margin:5px 10px 5px 0px;
                        border:1px solid #000000;
                        width:80px;
                        height:79px;
                    }
        
                    .important {
                        background-color:#F5FCC8;
                        padding:2px;
                    }
        
                    code span {
                        color:green;
                    }
                `;
                this.wGame.document.querySelector('#dofusBody').appendChild(moreidCss)

                this.affichageDiv = document.createElement('div');
                this.affichageDiv.id = 'moreidCssText';
                this.affichageDiv.classList.add('window')
                this.affichageDiv.classList.add('FightEndWindow')
                this.affichageDiv.style.cssText = 'opacity: 1;'

                let divBorder = document.createElement('div')
                divBorder.classList.add('windowBorder')

                let divContent = document.createElement('div')
                divContent.classList.add('windowContent')

                let divHeadWrapper = document.createElement('div')
                divHeadWrapper.classList.add('windowHeadWrapper')

                let divTitle = document.createElement('div')
                divTitle.classList.add('windowTitle')

                let divButton = document.createElement('div')
                divButton.classList.add('closeButton')
                divButton.classList.add('Button')
                divButton.classList.add('scaleOnPress')
                divButton.onclick = () => {
                    this.button()
                }
                let divBodyWrapper = document.createElement('div')
                divBodyWrapper.classList.add('windowBodyWrapper')

                let divwindowBody = document.createElement('div')
                divwindowBody.classList.add('windowBody')
                //#region component
                //component
                let componentTextCheck = document.createElement('div')
                componentTextCheck.appendChild(document.createTextNode('Passer son tour'))

                let componentImput = document.createElement('input')
                componentImput.setAttribute('type', "checkbox")
                componentImput.setAttribute('id', "passTour")
                componentImput.setAttribute('name', "passTour")
                componentImput.onclick = () => {
                    var checkBox = this.wGame.document.getElementById("passTour")
                    this.passTourCheck(checkBox)
                }
                componentTextCheck.appendChild(componentImput)
                divwindowBody.appendChild(componentTextCheck)
                //fin component

                //component
                let componentFollow = document.createElement('div')
                componentFollow.appendChild(document.createTextNode('Suivre via compas'))

                let componentImputFollow = document.createElement('input')
                componentImputFollow.setAttribute('type', "checkbox")
                componentImputFollow.setAttribute('id', "followw")
                componentImputFollow.setAttribute('name', "followw")
                componentImputFollow.onclick = () => {
                    var checkBox = this.wGame.document.getElementById("followw")
                    this.follow(checkBox)
                }
                componentFollow.appendChild(componentImputFollow)
                divwindowBody.appendChild(componentFollow)
                //fin component

                //component
                let componentClose = document.createElement('div')
                componentClose.appendChild(document.createTextNode('Fermer rapport cmb'))

                let componentImputClose = document.createElement('input')
                componentImputClose.setAttribute('type', "checkbox")
                componentImputClose.setAttribute('id', "closeee")
                componentImputClose.setAttribute('name', "closeee")
                componentImputClose.onclick = () => {
                    var checkBox = this.wGame.document.getElementById("closeee")
                    this.close(checkBox)
                }
                componentClose.appendChild(componentImputClose)
                divwindowBody.appendChild(componentClose)
                //fin component

                //component
                let componentIdCell = document.createElement('div')
                componentIdCell.appendChild(document.createTextNode('Montrer cell id'))

                let componentIdCellinput = document.createElement('input')
                componentIdCellinput.setAttribute('type', "checkbox")
                componentIdCellinput.setAttribute('id', "toggledebugmod")
                componentIdCellinput.setAttribute('name', "toggledebugmod")
                componentIdCellinput.onclick = () => {
                    var checkBox = this.wGame.document.getElementById("toggledebugmod")
                    this.toggle(checkBox)
                }
                componentIdCell.appendChild(componentIdCellinput)
                divwindowBody.appendChild(componentIdCell)
                //fin component

                //component
                let componentscript = document.createElement('div')
                componentscript.appendChild(document.createTextNode('Lancer script'))

                let componentScriptSelect = document.createElement('select')
                //componentScriptInput.setAttribute('type', "checkbox")
                componentScriptSelect.setAttribute('id', "selectscript")

                let addOption = (nom) => {
                    let optionA = document.createElement('option')
                    optionA.setAttribute('value', nom)
                    optionA.appendChild(document.createTextNode(nom))
                    componentScriptSelect.appendChild(optionA)
                }
                addOption('dd algo')
                addOption('revente enclos')
                addOption('bot perco')

                let componentscriptbutton = document.createElement('button')
                componentscriptbutton.appendChild(document.createTextNode('GO'))
                componentscriptbutton.onclick = () => {
                    this.lancerScript(this.wGame.document.getElementById("selectscript").value)
                }
                componentscript.appendChild(componentScriptSelect)
                componentscript.appendChild(componentscriptbutton)
                divwindowBody.appendChild(componentscript)
                //fin component

                //#endregion

                divHeadWrapper.appendChild(divTitle)
                divHeadWrapper.appendChild(divButton)
                divContent.appendChild(divHeadWrapper)

                divTitle.appendChild(document.createTextNode('uwu'))

                divBodyWrapper.appendChild(divwindowBody)

                divContent.appendChild(divBodyWrapper)

                this.affichageDiv.appendChild(divBorder)
                this.affichageDiv.appendChild(divContent)

                this.affichageDiv.style.visibility = 'hidden'
                this.container.appendChild(this.affichageDiv)
            }
        }, 1000);
        checkInterfaceOk

        /*this.shortcutsHelper = new ShortcutsHelper(this.wGame);
        this.shortcutsHelper.bind('w', () => {
            this.test()
        });*/
    }

    private acheterEnclos() {
        for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
            let win = this.wGame.gui.windowsContainer._childrenList[i];
            if (win.isVisible()) {
                if(win.id == "paddockBuy"){
                    const prix = win.windowBodyWrapper._childrenList[0]._childrenList[1]._childrenList[0].getValue()
                    if(prix<2500000){
                        win.windowContent._childrenList[1]._childrenList[0]._childrenList[2]._childrenList[1].tap()
                        setTimeout(() => {
                            this.confirmerAchat()
                        }, 100);
                        clearInterval(this.inter)
                    }else{
                        this.api.betterLogger('wtf prix trop chere')
                    }
                }
            }
        }
    }

    private confirmerAchat() {
        for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
            let win = this.wGame.gui.windowsContainer._childrenList[i];
            if (win.isVisible()) {
                if(win.id == "confirm"){
                    win._buttonYes.tap()
                }
            }
        }
    }

    private lancerScript(scriptid) {
        Logger.info('lancerScript '+scriptid)
        switch (scriptid) {
            case 'activer IA':
                //et non
                this.api.activerAI()
                break
            case 'dd algo':
                let ddGestion = new DdGestion(this.wGame, this.settings, this.translate, this.api)
                setTimeout(() => {
                    ddGestion.startDD()
                    let intervalMort = setInterval(() => {
                        if(ddGestion.checkSiMort){
                            clearInterval(intervalMort)
                            //fin script
                        }
                    }, 1000)
                }, 2000)
                break
            case "revente enclos":
                this.api.betterLogger('check revente enclos  actif, pour déactivé veuillez fermer l\'onglet')
                //////////////////////////////////////////REVENTE ENCLOS LOLLLLL
                setInterval(() => {
                    if(!this.enclosChecked){
                        let allInteractive = this.wGame.isoEngine._getAllInteractives()
                        let interas = this.wGame.isoEngine.mapRenderer.interactiveElements
                        let ok = false
                        for (const elem of allInteractive) {
                            if(interas[elem.id] != undefined)
                                if(interas[elem.id]._name == 'Enclos'){
                                    if(interas[elem.id].enabledSkills.length>1){
                                        if(interas[elem.id].enabledSkills[0]._name == 'Acheter'){
                                            //liste enclos privé
                                            this.enclosChecked = true
                                            this.api.betterLogger('GOOOOOOOOOOOOO')
                                            
                                            ok = true
                                            this.inter = setInterval(() => {
                                                this.acheterEnclos()
                                            }, 100);
                                            this.wGame.isoEngine._useInteractive(interas[elem.id].elementId,interas[elem.id].enabledSkills[0].skillInstanceUid)
                                        }
                                        if(interas[elem.id].enabledSkills[1]._name == 'Acheter'){
                                            //liste enclos privé
                                            this.enclosChecked = true
                                            this.api.betterLogger('GOOOOOOOOOOOOO')
                                            ok = true
                                            this.inter = setInterval(() => {
                                                this.acheterEnclos()
                                            }, 100);
                                            this.wGame.isoEngine._useInteractive(interas[elem.id].elementId,interas[elem.id].enabledSkills[1].skillInstanceUid)
                                        }
                                    }
                                }
                        }
                    }
                }, 100)
                break
            case 'bot perco'://KEKW
                this.api.whatIamDoing = 'bot perco'
                this.wGame.gui.menuBar._icons._childrenList[18].tap()
                setTimeout(() => {
                    for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
                        let win = this.wGame.gui.windowsContainer._childrenList[i];
                        if (win.id == "social") {
                            let bouton = win._childrenList[1]._childrenList[1]._childrenList[0]._childrenList[3]._childrenList[1]._childrenList[0]._childrenList[2]
                            bouton.tap()
                            //Logger.info('bot perco ok')
                        }
                    }
                }, 1000)
                break
            default:
                break;
        }
    }

    private toggleUi() {
        if(this.isMoreUiHide){
            this.affichageDiv.style.visibility = 'hidden'
        }else{
            this.affichageDiv.style.visibility = 'visible'
        }
        this.isMoreUiHide = !this.isMoreUiHide
    }

    private toggle(param){
        this.wGame.gui.playerData.isModeratorOrMore = () => param.checked
        this.wGame.background.toggleDebugMode()
    }

    private registerEvent() {
        //passer auto
        this.on(this.wGame.dofus.connectionManager, 'GameFightTurnStartMessage', (e: any) => {
            let id = e.id
            if (id == this.wGame.gui.playerData.id) {
                if (this.boolPassTour) {
                    setTimeout(() => {
                        this.wGame.dofus.sendMessage("GameFightTurnFinishMessage");
                    }, this.api.randomIntFromInterval(this.finishTurnMin, this.finishTurnMax))
                }
            }
        })

        //dofuck autofollow (nul mais mieux que r)
        this.on(this.wGame.dofus.connectionManager, 'CompassUpdatePartyMemberMessage', (e: any) => {
            let x = e.worldX
            let y = e.worldY

            this.destX = x
            this.destY = y

            if (!this.wGame.isoEngine.actorManager.userActor.moving && !this.wGame.isoEngine.actorManager.userActor.isLocked && this.isFollowing && !this.api.matchStart) {
                if (this.boolFollow && !this.changingmap){
                    this.changingmap = true
                    this.goToNextMap()
                }  
            }
        })

        this.on(this.wGame.dofus.connectionManager, 'MapComplementaryInformationsDataMessage', (e: any) => {
            setTimeout(() => {
                this.changingmap = false//autoriser un nouveau changement de map si besoin
            }, 1000)
        })

        //autofollow ouai c moche
        setInterval(() => {
            if (!this.wGame.isoEngine.actorManager.userActor.moving && !this.wGame.isoEngine.actorManager.userActor.isLocked && this.isFollowing && !this.api.matchStart) {
                if (this.boolFollow && !this.changingmap){
                    this.changingmap = true
                    this.goToNextMap()
                }
            }
        }, 1000)

        //dofuck autofollow autostop
        this.on(this.wGame.dofus.connectionManager, 'CompassResetMessage', (e: any) => {
            this.isFollowing = false
        })
        //dofuck autofollow
        this.on(this.wGame.dofus.connectionManager, 'PartyFollowStatusUpdateMessage', (e: any) => {
            this.isFollowing = e.success;
            if (e.success) {
                if (this.boolFollow && this.api.matchStart == false)
                    this.goToNextMap()
            }
        })

        //autoclose rapport combat
        this.on(this.wGame.dofus.connectionManager, 'GameFightEndMessage', (e: any) => {
            if (this.boolClose) {
                setTimeout(() => {
                    this.api.fermerFenetre()
                }, this.api.randomIntFromInterval(500,1500))
            }
        })
    }

    private async goToNextMap() {
        if (this.boolFollow && this.api.matchStart == false) {
            var currentMap = this.getMapCoordinates()

            var nextMap = {
                x: this.destX.toString(),
                y: this.destY.toString()
            }
            let direction = this.getDirection(nextMap, currentMap)
            if (!direction) {
                this.changingmap = false
            } else {
                if(this.api.mover.checkSiAggressivesOnMap()){
                    this.api.mover.changeMapEsquiveAsync(direction)
                }else{
                    this.api.mover.changeMapAsync(direction)
                }
                //await this.api.changeMapAsyncEsquiveMobHostile(direction)
            }
        } else {
            Logger.info('bool follow a false')
        }
    }

    private getDirection(next, current) {
        var x = next.x - current.x;
        var y = next.y - current.y;
        return x != 0 ? (x < 0 ? "left" : "right") : (y != 0 ? (y < 0 ? "top" : "bottom") : false);
    }

    private getMapCoordinates() {
        var posx = this.wGame.gui.playerData.position.mapPosition.posX;
        var posy = this.wGame.gui.playerData.position.mapPosition.posY;
        return posx !== undefined ? {
            x: posx,
            y: posy
        } : {
            x: 0,
            y: 0
        };
    }

    private passTourCheck(param) {
        if (param.checked) {
            this.boolPassTour = true
        } else {
            this.boolPassTour = false
        }
    }

    private follow(param) {
        if (param.checked) {
            this.boolFollow = true
        } else {
            this.boolFollow = false
        }
    }

    private close(param) {
        if (param.checked) {
            this.boolClose = true
        } else {
            this.boolClose = false
        }
    }

    private button() {
        if (this.boolOpen) {
            //on cache
            this.boolOpen = !this.boolOpen
            //this.affichageDiv.style.opacity = "0.3"
            let cssText = this.wGame.document.querySelector('#moreidCss')
            cssText.innerHTML = `
            #moreidCssText {
                box-sizing: border-box;
                overflow: hidden;
                font-size: 11px;
                position: absolute;
                color: white;
                width: 180px;
                height: 210px;
                margin-bottom: 10px;
                margin-left: 10px;
                text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.9);
                bottom: 10px;
            }
            #alertBox {
                position:relative;
                width:300px;
                min-height:100px;
                margin-top:50px;
                border:1px solid #666;
                background-color:#fff;
                background-repeat:no-repeat;
                background-position:20px 30px;
            }

            #modalContainer > #alertBox {
                position:fixed;
            }

            #alertBox h1 {
                margin:0;
                font:bold 0.9em verdana,arial;
                background-color:#3073BB;
                color:#FFF;
                border-bottom:1px solid #000;
                padding:2px 0 2px 5px;
            }

            #alertBox p {
                font:0.7em verdana,arial;
                height:50px;
                padding-left:5px;
                margin-left:55px;
            }

            #alertBox #closeBtn {
                display:block;
                position:relative;
                margin:5px auto;
                padding:7px;
                border:0 none;
                width:70px;
                font:0.7em verdana,arial;
                text-transform:uppercase;
                text-align:center;
                color:#FFF;
                background-color:#357EBD;
                border-radius: 3px;
                text-decoration:none;
            }

            /* unrelated styles */

            #mContainer {
                position:relative;
                width:600px;
                margin:auto;
                padding:5px;
                border-top:2px solid #000;
                border-bottom:2px solid #000;
                font:0.7em verdana,arial;
            }

            h1,h2 {
                margin:0;
                padding:4px;
                font:bold 1.5em verdana;
                border-bottom:1px solid #000;
            }

            code {
                font-size:1.2em;
                color:#069;
            }

            #credits {
                position:relative;
                margin:25px auto 0px auto;
                width:350px; 
                font:0.7em verdana;
                border-top:1px solid #000;
                border-bottom:1px solid #000;
                height:90px;
                padding-top:4px;
            }

            #credits img {
                float:left;
                margin:5px 10px 5px 0px;
                border:1px solid #000000;
                width:80px;
                height:79px;
            }

            .important {
                background-color:#F5FCC8;
                padding:2px;
            }

            code span {
                color:green;
            }
            `;
        } else {
            //on ouvre
            this.boolOpen = !this.boolOpen
            //this.affichageDiv.style.opacity = "1"
            let cssText = this.wGame.document.querySelector('#moreidCss')
            cssText.innerHTML = `
            #moreidCssText {
                box-sizing: border-box;
                overflow: hidden;
                font-size: 11px;
                position: absolute;
                color: white;
                width: 180px;
                height: 210px;
                margin-left: 10px;
                margin-top: 10px;
                text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.9);
                left: 10px;
            }
            #alertBox {
                position:relative;
                width:300px;
                min-height:100px;
                margin-top:50px;
                border:1px solid #666;
                background-color:#fff;
                background-repeat:no-repeat;
                background-position:20px 30px;
            }

            #modalContainer > #alertBox {
                position:fixed;
            }

            #alertBox h1 {
                margin:0;
                font:bold 0.9em verdana,arial;
                background-color:#3073BB;
                color:#FFF;
                border-bottom:1px solid #000;
                padding:2px 0 2px 5px;
            }

            #alertBox p {
                font:0.7em verdana,arial;
                height:50px;
                padding-left:5px;
                margin-left:55px;
            }

            #alertBox #closeBtn {
                display:block;
                position:relative;
                margin:5px auto;
                padding:7px;
                border:0 none;
                width:70px;
                font:0.7em verdana,arial;
                text-transform:uppercase;
                text-align:center;
                color:#FFF;
                background-color:#357EBD;
                border-radius: 3px;
                text-decoration:none;
            }

            /* unrelated styles */

            #mContainer {
                position:relative;
                width:600px;
                margin:auto;
                padding:5px;
                border-top:2px solid #000;
                border-bottom:2px solid #000;
                font:0.7em verdana,arial;
            }

            h1,h2 {
                margin:0;
                padding:4px;
                font:bold 1.5em verdana;
                border-bottom:1px solid #000;
            }

            code {
                font-size:1.2em;
                color:#069;
            }

            #credits {
                position:relative;
                margin:25px auto 0px auto;
                width:350px; 
                font:0.7em verdana;
                border-top:1px solid #000;
                border-bottom:1px solid #000;
                height:90px;
                padding-top:4px;
            }

            #credits img {
                float:left;
                margin:5px 10px 5px 0px;
                border:1px solid #000000;
                width:80px;
                height:79px;
            }

            .important {
                background-color:#F5FCC8;
                padding:2px;
            }

            code span {
                color:green;
            }
            `;
        }
    }

    public reset() {
        super.reset()
        var element = this.wGame.document.getElementById("moreidCss")
        if(element)
            element.parentNode.removeChild(element)

        let elemetPanel = this.wGame.document.getElementById("idpourdelete")
        if(elemetPanel)
            elemetPanel.parentNode.removeChild(elemetPanel)

        let element2 = this.wGame.document.getElementById("containerMoreUi")
        if(element2)
            element2.parentNode.removeChild(element2)
    }
}