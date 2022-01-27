/* eslint-disable @typescript-eslint/restrict-template-expressions */
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

import { Mod } from "../mod"
import {SettingsService} from "@services/settings.service"
import { TranslateService } from "@ngx-translate/core"
import { API } from ".."
import { isDevMode } from "@angular/core"

export class DialogueAuto extends Mod{

    public checkSiMort:boolean
    private api:API

    private activer

    startMod(): void {
        this.checkSiMort = false
    }

    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api = api
        this.wGame.gui.npcDialogUi.on("opened",this.talkToNpc);
        this.wGame.isoEngine.on("mapLoaded", this.mapLoaded);

        if(isDevMode()){
            this.activer = true
        }else{
            this.activer = false
        }
        
        //debug/creation auto quete
        this.on(this.wGame.dofus.connectionManager, 'NpcDialogQuestionMessage', (e: any) => {
            if(this.activer)
                console.log(e)
        })
    }

    private talkToNpc = () => {
        if(this.activer)
            setTimeout(() => {//on est pas des machines quand meme
                for (let index = 0; index < this.wGame.gui.npcDialogHandler.replyIds.length; index++) {
                    const element = this.wGame.gui.npcDialogHandler.replyIds[index];
                    switch (element) {
                        case 18851://quitter le dj terrier du wa
                            setTimeout(() => {
                                this.wGame.gui.npcDialogUi._sendReply(index);
                            }, 500);
                            break;
                        case 11688://saluer le wobot
                            setTimeout(() => {
                                this.wGame.gui.npcDialogUi._sendReply(index);
                            }, 500);
                            break
                        case 18915://le calmer
                            setTimeout(() => {
                                this.wGame.gui.npcDialogUi._sendReply(index);
                            }, 500);
                            break
                        case 18910://entrer dans le dj terrier AVEC LA CLEF
                            setTimeout(() => {
                                this.wGame.gui.npcDialogUi._sendReply(index);
                            }, 500);
                            break
                        default:
                        break;
                    }
                }
            }, this.api.randomIntFromInterval(100,500));
    }

    private mapLoaded = () => {
        if(this.activer)
            setTimeout(async () => {
                switch (this.wGame.isoEngine.mapRenderer.mapId) {
                        case 116654593://salle terrier du wa
                            setTimeout(() => {
                                this.api.activerAI()//on ne sais pas si on viens de ce co ou pas, on try de d'activer l'ia a chaque fois
                                this.api.combat.attaquerGroupeDeMonstreRandom()
                            }, 7500);
                            break
                        case 116655617://salle terrier du wa
                            setTimeout(() => {
                                this.api.activerAI()//on ne sais pas si on viens de ce co ou pas, on try de d'activer l'ia a chaque fois
                                this.api.combat.attaquerGroupeDeMonstreRandom()
                            }, 7500);
                            break
                        case 116656641://salle terrier du wa
                            setTimeout(() => {
                                this.api.activerAI()//on ne sais pas si on viens de ce co ou pas, on try de d'activer l'ia a chaque fois
                                this.api.combat.attaquerGroupeDeMonstreRandom()
                            }, 7500);
                            break
                        case 116657665://salle terrier du wa
                            setTimeout(() => {
                                this.api.activerAI()//on ne sais pas si on viens de ce co ou pas, on try de d'activer l'ia a chaque fois
                                this.api.combat.attaquerGroupeDeMonstreRandom()
                            }, 7500);
                            break
                        case 116654595://boss terrier du wa
                            //{"call":"sendMessage","data":{"type":"ObjectSetPositionMessage","data":{"objectUID":264522916,"position":1,"quantity":1}}}
                            setTimeout(() => {
                                this.equipStone(100)
                            }, 500);
                            setTimeout(async () => {
                                await this.attendreVieOkAvantCmb()
                                this.api.activerAI()//on ne sais pas si on viens de ce co ou pas, on try de d'activer l'ia a chaque fois
                                this.api.combat.attaquerGroupeDeMonstreRandom()
                            }, 7500);
                            break
                        case 116655619://map pnj fin dj terrier du wa
                            setTimeout(() => {
                                this.wGame.isoEngine.actorManager.actors[-1].openNpcContextualMenu();
                            }, 5000)
                            break
                        case 106694158://entrer dj wa wabbit
                            setTimeout(() => {
                                this.equipArme('Epée Gloursonne')
                                this.equipArme('Dagues Érhy')
                            }, 500);
                            
                            setTimeout(() => {
                                this.wGame.isoEngine.actorManager.actors[-1].openNpcContextualMenu();
                            }, 5000)
                            break
                        default:
                            break;
                    }
            }, 500);
    }

    private attendreVieOkAvantCmb() {
        return new Promise(async (resolve, reject) => {
            let pdvActual = this.wGame.gui.playerData.characters.mainCharacter.characteristics.lifePoints
            let pdvMax = this.wGame.gui.playerData.characters.mainCharacter.characteristics.maxLifePoints
            if(pdvActual*100/pdvMax>80){
                resolve(1)
            }else{
                this.wGame.gui.chat.logMsg('on a moins de 60% de vie, on attend un peu')
                this.wGame.dofus.connectionManager.sendMessage("EmotePlayRequestMessage", {emoteId: 1})
                let intervalCheck = setInterval(() => {
                    pdvActual = this.wGame.gui.playerData.characters.mainCharacter.characteristics.lifePoints
                    if(pdvActual*100/pdvMax>80){
                        clearInterval(intervalCheck)
                        this.wGame.gui.chat.logMsg('et c est reparti')
                        resolve(1)
                    }
                }, 1000)
            }
        })
    }

    private equipArme(nom) {
        if (this.wGame.isoEngine.actorManager.userActor.moving) {
          this.wGame.gui.chat.logError(`Impossible d'équiper une arme en se déplaçant, réessaye une fois arrêté.`);
          setTimeout(() => {
            this.equipArme(nom)
          }, 1000);
          return;
        }
        let curWeaponGID = undefined
        if(this.wGame.gui.playerData.inventory.getCurrentWeapon() != undefined)
            curWeaponGID = this.wGame.gui.playerData.inventory.getCurrentWeapon().objectGID;
        //@ts-ignore
        const weaponGID = Object.values(this.wGame.gui.playerData.inventory.objects).find(o => o.shortName == "Epée Gloursonne").objectGID;
        if(weaponGID != curWeaponGID){
            //@ts-ignore
            const weaponUID = Object.values(this.wGame.gui.playerData.inventory.objects).find(o => o.shortName == "Epée Gloursonne").objectUID;

            if (weaponUID) {
                this.wGame.gui.playerData.inventory.equipItem(weaponUID);
                this.wGame.gui.chat.logMsg(`L'arme ${nom} vient d'être équipée.`);
            }
        }else{
            this.wGame.gui.chat.logMsg(`L'arme ${nom} est deja équipée.`);
        }
    }

    private equipStone(maxLevel) {
        if (this.wGame.isoEngine.actorManager.userActor.moving) {
          this.wGame.gui.chat.logError(`Impossible d'équiper une pierre en se déplaçant, réessaye une fois arrêté.`);
          setTimeout(() => {
            this.equipStone(maxLevel)
          }, 1000);
          return;
        }
    
        if (maxLevel && maxLevel > 0) {
          let capture = 50;
          if (maxLevel > capture) capture = 100;
          if (maxLevel > capture) capture = 150;
          if (maxLevel > capture) capture = 1000;
    
          const stoneGID = this.getStone(capture);
          const curWeaponGID = this.wGame.gui.playerData.inventory.getCurrentWeapon().objectGID;
    
          if (curWeaponGID !== stoneGID) {
            const stoneUID = this.getFirstUID(stoneGID);
            if (stoneUID) {
                this.wGame.gui.playerData.inventory.equipItem(stoneUID);
              this.wGame.gui.chat.logMsg(`Une pierre d'âme de taille ${capture} vient d'être équipée.`);
            }
            else {
              this.wGame.gui.chat.logError(`Aucune pierre d'âme de taille ${capture} n'a été trouvée dans l'inventaire.`);
            }
          }
        }
    }

    private getFirstUID(objectGID) {
        //@ts-ignore
        return Object.values(this.wGame.gui.playerData.inventory.objects).find(o => o.objectGID == objectGID).objectUID;
    }

    private getStone(level) {
        let gid = 9690;
        if (level == 50)   gid = 9686;
        if (level == 100)  gid = 9687;
        if (level == 150)  gid = 9688;
        return gid;
    }

    public reset() {
        super.reset()
        this.wGame.isoEngine.removeListener("mapLoaded", this.mapLoaded);
        this.checkSiMort = true
    }
}