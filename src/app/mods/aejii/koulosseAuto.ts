import { Mod } from "../mod"

import {ShortcutsHelper} from "@helpers/shortcuts.helper"
import {API} from "./api"

import * as util from 'util'
import { inspect } from 'util'
import { TranslateService } from "@ngx-translate/core"
import {SettingsService} from "@services/settings.service"

export class KoulosseAuto extends Mod{

    private api: API
    public checkSiMort:boolean

    private intervalCheck
    private mapIdCheck

    startMod(): void {
        return
    }
    
    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api = api
        this.checkSiMort = false
        Logger.info("- KoulosseAuto active")
        this.wGame.isoEngine.on("mapLoaded", this.mapLoaded);
        this.wGame.gui.npcDialogUi.on("opened",this.talkToNpc);
    }

    private talkToNpc = () => {
        setTimeout(() => {//on est pas des machines quand meme
            //console.log(this.wGame.gui.npcDialogHandler.replyIds[0])
            switch (this.wGame.gui.npcDialogHandler.replyIds[0]) {
                case 2744:
                    this.wGame.gui.npcDialogUi._sendReply(0);
                  break;
                case 2745:
                    this.wGame.gui.npcDialogUi._sendReply(0);
                  break;
                case 2746:
                    this.wGame.gui.npcDialogUi._sendReply(0);
                  break;
                case 2747:
                    this.wGame.gui.npcDialogUi._sendReply(0);
                  break;
                case 2748:
                    this.wGame.gui.npcDialogUi._sendReply(0);
                  break;
                case 2750:
                    this.wGame.gui.npcDialogUi._sendReply(1);
                  break;
                default:
                  break;
              }
        }, this.api.randomIntFromInterval(500,1000));
    }

    private finAnimMove() {
        return new Promise(async (resolve, reject) => {
            let intervalcheck = setInterval(() => {
                if(!this.wGame.isoEngine.actorManager.getActor(this.wGame.isoEngine.actorManager.userId).moving && !this.wGame.isoEngine.actorManager.userActor.animated){
                    clearInterval(intervalcheck)
                    setTimeout(() => {
                        resolve(1)
                    }, 500);
                }
            }, 100);
        })
    }

    private mapLoaded = () => {
        setTimeout(async () => {
            if(this.wGame.isoEngine.mapRenderer.map != undefined){
                await this.finAnimMove()
                switch (this.wGame.isoEngine.mapRenderer.mapId) {
                    case 107228160://on parle au pnj
                        //-2 = koulosse
                        this.wGame.isoEngine.actorManager.actors[-2].openNpcContextualMenu();
                        break
                    case 107218944:
                        await this.api.mover.changeMapEsquiveAsync('bottom')
                        break
                    case 107219968:
                        await this.api.mover.changeMapEsquiveAsync('right')
                        break
                    case 107222016:
                        await this.api.mover.changeMapEsquiveAsync('bottom')
                        break
                    case 107223040:
                        await this.api.mover.changeMapEsquiveAsync('right')
                        break
                    case 107224064:
                        await this.api.mover.changeMapEsquiveAsync('right')
                        break
                    default:
                        break;
                }
            }
        }, 50);
    }

    public reset() {
        super.reset()
        this.checkSiMort = true
        clearInterval(this.intervalCheck)
        Logger.info(' - KoulosseAuto deactiver')

        this.wGame.isoEngine.removeListener("mapLoaded", this.mapLoaded);
        this.wGame.gui.npcDialogUi.removeListener("opened",this.talkToNpc);
    }
}