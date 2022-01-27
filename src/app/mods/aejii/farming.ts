/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { Mod } from "../mod"
import {SettingsService} from "@services/settings.service"
import { TranslateService } from "@ngx-translate/core"
import { API } from ".."
import { ShortcutsHelper } from "@helpers/shortcuts.helper"

export class FarmingBase extends Mod{

    public checkSiMort:boolean
    private api:API

    private GATHERING
    private CURRENT_ELEM_ID
    private ALLOWED_JOBS
    private FULLPODS;
    private RECOLTABLE;
    private SELECTED_SLOTS;
    private Debug;
    private BasicWait;

    private BotEnabled
    private Busy

    private windowManager
    private stylesheet
    private resizeBehavior
    private autoCollectWindow
    private btnEnable
    private _tabs
    private btnReset
    private btnSetPath
    private RecordPathInProgress

    private ID

    private itemSlot
    private swipingTabs
    private wuiDom
    private dTButton

    private shortcutsHelper: ShortcutsHelper

    startMod(): void {
        this.checkSiMort = false
    }

    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api = api
        this.ID = "KadAutoCollectV10"
        this.windowManager = this.api.getwindowSing

        this.itemSlot = this.api.mover.finder.singleton("setBackgroundImageByItemType")[1]; //this.api.mover.finder.getSingletonConstructorWithKey("setBackgroundImageByItemType")[1]
        this.swipingTabs = this.api.mover.finder.singleton('setSwipeDirection'); //this.api.mover.finder.getSingletonConstructorWithKey("setSwipeDirection")[1]
        this.wuiDom = this.api.mover.finder.singleton("getWuiName")[2]//this.api.mover.finder.getSingletonConstructorWithKey("getWuiName")[1]
        this.dTButton = this.api.mover.finder.singleton('DofusButton');

        this.ALLOWED_JOBS = [
            2,  // Bûcheron
            24, // Mineur
            26, // Alchimiste
            28, // Paysan
            36, // Pêcheur
        ];
        this.RecordPathInProgress = false
        this.BotEnabled = false;
        this.Busy = false;
        this.BasicWait = 246
        this.FULLPODS = false
        this.Debug = true
        this.GATHERING = false
        this.RECOLTABLE = []
        this.SELECTED_SLOTS = []
        this.RECOLTABLE.push({
            id: 311,
            interactive: 84,
            skill: 102,
        });
        this.stylesheet = this.wGame.document.createElement('style');
        this.stylesheet.id = this.ID;
        this.stylesheet.innerHTML = `
        .windowkedaAutoCollect .windowBody {
            display: flex;
            flex-direction: column;
        }

        .windowkedaAutoCollect .SwipingTabs {
            height: 100%;
            margin-bottom: 10px;
        }

        .windowkedaAutoCollect .SwipingTabs .swipeHeader .swipeTabBtn {
            font-size: 14px;
        }

        .windowkedaAutoCollect .panel {
            padding: 10px;
            box-sizing: border-box;
        }

        .windowkedaAutoCollect .panel.swipeTabContent::before {
            content: "";
            width: 100%;
            height: 100%;
            position: absolute;
            z-index: -1;
            top: 0px;
            left: 0px;
            -webkit-border-image: url(./assets/ui/containerBg.png) 48 fill;
            box-sizing: border-box;
            border-style: solid;
            border-width: 24px;
            border-image: url(./assets/ui/containerBg.png) 48 fill / 1 / 0 stretch;
        }

        .windowkedaAutoCollect .panel .Slot {
            float: left;
        }

        .windowkedaAutoCollect .InputBox.horizontalBox {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
        }

        .windowkedaAutoCollect .kedamaxPods {
            margin-left: 10px;
            width: 50px;
            min-width: 10%;
        }

        `;
        this.wGame.document.head.appendChild(this.stylesheet);

        this.initResizeBehavior();

        this.createWindow("windowkedaAutoCollect", "Récolte automatique");
        this.autoCollectWindow = this.windowManager.getWindow('windowkedaAutoCollect');
        this.resizeBehavior(this.autoCollectWindow);

        const inputBox = this.autoCollectWindow.windowBody.createChild('div', { className: ['InputBox', 'horizontalBox'] });
        inputBox.createChild('label', { text: 'Pods max. avant surcharge' });
        inputBox.createChild('input', { className: ['kedamaxPods', 'domInputBox', 'text'] });
        inputBox.createChild('span', { text: '%' });
        this.wGame.document.querySelector('.kedamaxPods')["value"] = 95;//au lieu de .value
        this.wGame.document.querySelector('.kedamaxPods').addEventListener('blur', () => {
            this.checkFullPods();
        });
        
        this.autoCollectWindow.once('open', () => {
            this.createPanels();
            //#region btnReset
            /*
            this.btnReset = new this.dTButton({
                text: 'Réinitialiser',
                className: ['Button', 'greenButton'],
              }, async () => {
                this.wGame.gui.openConfirmPopup({
                  title: "Réinitialiser",
                  message: `Étes-vous sûr de vouloir réinitialiser la fenêtre de récolte automatique ? Les slots cochés seront dé-cochés. Les ressources manquantes (suite à un up de métier) seront ajoutées.`,
                  cb: (success) => {
                    if (success) {
                      //this.setBotEnabled(false);
                      //this.unload();
                      //this.load();
                      //this.windowManager.switch('windowkedaAutoCollect');
                    }
                  }
                });
              }
            );
            this.autoCollectWindow.windowBody.appendChild(this.btnReset);*/
            //#endregion
      
            const inputBoxPath = this.autoCollectWindow.windowBody.createChild('div', { className: ['InputBox', 'horizontalBox'] });
            inputBoxPath.createChild('label', { text: 'Ajouter path' });
            inputBoxPath.createChild('input', { className: ['aePath', 'domInputBox', 'text'] });

            const boutonAddScypt = new this.dTButton({
                text: 'Save',
                className: ['Button', 'greenButton'],
                }, async () => {
                    console.log('save')
                    console.log(this.wGame.document.querySelector('.aePath').value)
                }
            );
            inputBoxPath.appendChild(boutonAddScypt)

            this.btnSetPath = new this.dTButton({
              text: 'Enregistrer un trajet',
              className: ['Button', 'greenButton'],
              }, async () => this.processRecordPath(!this.RecordPathInProgress)
            );
            this.autoCollectWindow.windowBody.appendChild(this.btnSetPath);
      
            this.btnEnable = new this.dTButton({
                text: 'Activer',
                className: ['Button', 'greenButton'],
              }, async () => this.setBotEnabled(!this.BotEnabled)
            );
            this.autoCollectWindow.windowBody.appendChild(this.btnEnable);
        });

        this.on(this.wGame.dofus.connectionManager, 'MapComplementaryInformationsDataMessage', (e: any) => {
            this.wGame.isoEngine.once("mapLoaded", async ()=>{
                await this.api.mover.timeoutResolveV2(2000)
                this.stepIn();
            });
            
        })
        this.on(this.wGame.dofus.connectionManager, 'InteractiveElementUpdatedMessage', (e: any) => {
            /*this.sleep(500).then(() => {
                this.stepIn();
            });*/
        })
        this.on(this.wGame.dofus.connectionManager, 'InteractiveUsedMessage', (e: any) => {
            if (e.entityId == this.wGame.isoEngine.actorManager.userId) {
                this.GATHERING = true;
                this.CURRENT_ELEM_ID = e.elemId;
            }
        })
        this.on(this.wGame.dofus.connectionManager, 'InteractiveUseEndedMessage', (e: any) => {
            if (e.elemId == this.CURRENT_ELEM_ID) {
                this.GATHERING = false;
                this.CURRENT_ELEM_ID = '';
            }
        })
        this.on(this.wGame.dofus.connectionManager, 'InventoryWeightMessage', (e: any) => {
            this.checkFullPods(e);
        })
        this.on(this.wGame.dofus.connectionManager, 'JobLevelUpMessage', (e: any) => {
            if (this.SELECTED_SLOTS.length > 0) {
                this.closePopup();
            }
        })

        this.on(this.wGame.dofus.connectionManager, 'GameFightEndMessage', async (e: any) => {// fin combat
            await this.api.mover.timeoutResolveV2(2000)
            this.stepIn();
        })

        this.on(this.wGame.dofus.connectionManager, 'GameFightLeaveMessage', async () => {
            await this.api.mover.timeoutResolveV2(2000)
            this.stepIn();
        });
        this.shortcutsHelper = new ShortcutsHelper(this.wGame);
        this.shortcutsHelper.bind('ctrl+o', () => {
            this.windowManager.switch('windowkedaAutoCollect');
        })
    }

    private processRecordPath(enabled) {
        this.btnSetPath.setText(enabled ? "Appliquer le trajet" : "Enregistrer un trajet");
        this.RecordPathInProgress = enabled;
        if (enabled) {
            //window.elyRec.copyActions = false;
            //window.elyRec.copyMovements = true;
            //window.elyRec.start();
        }
        else {
            //const script = JSON.parse(window.elyRec.stop());
            //this.logObj("Trajet enregistré. Etapes : " + script?.actions?.length, script);
            //this.mapMovements = script.actions;
        }
    }
    
    async createPanels() {
        const tabs = this._tabs = this.autoCollectWindow.windowBody.appendChild(new this.swipingTabs({ className: 'tabs' }));
    
        for (const [key, value] of Object.entries(this.wGame.gui.playerData.jobs.list)) {
          if (this.ALLOWED_JOBS.includes(value["id"])) {
            const panelFrame = new this.wuiDom('div', { className: 'panel' });
            const skills = value["description"].skills;
            for (let i = 0; i < skills.length; i++) {
              const skill = skills[i];
              if (skill._type === 'SkillActionDescriptionCollect') {
                const ress = {};
                ress["id"] = skill.info.gatheredRessourceItem;
                ress["interactive"] = skill.info.interactiveId;
                ress["skill"] = skill.skillId;
                this.RECOLTABLE.push(ress);
                const currentItemSlot = panelFrame.appendChild(new this.itemSlot({ descriptionOptions: { effects: false } }));
                const item = await this.getItems([skill.info.gatheredRessourceItem]);
                currentItemSlot.setItem(item[0]);
    
                currentItemSlot.on('tap', () => {
                  this.selectSlot(currentItemSlot);
                });
              }
            }
            tabs.addTab(value["info"].nameId, panelFrame, value["info"].nameId);
          }
        }
    
        const otherFrame = new this.wuiDom('div', { className: 'panel' });
        const currentItemSlot = otherFrame.appendChild(new this.itemSlot({ descriptionOptions: { effects: false } }));
        const item = await this.getItems([311]);
        currentItemSlot.setItem(item[0]);
        currentItemSlot.on('tap', () => {
          this.selectSlot(currentItemSlot);
        });
    
        tabs.addTab('Autre', otherFrame, 'autre');
    
        if (Object.keys(this.wGame.gui.playerData.jobs.list).length === 0) {
          tabs.openTab('autre')
        } else {
          tabs.openTab(this.wGame.gui.playerData.jobs.list[Object.keys(this.wGame.gui.playerData.jobs.list)[0]].info.nameId);
        }
    }

    private closePopup() {
        setTimeout(() => {
          for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
            let win = this.wGame.gui.windowsContainer._childrenList[i];
            if (win.isVisible() && win.id === "popup") {
              win.destroy();
            }
          }
        }, this.getRandomTime(1, 3));
    }

    private selectSlot(slot) {
        slot.selected === true ? slot.selected = false : slot.selected = true;
        slot.rootElement.classList.toggle('selected');
        const selected_index = this.SELECTED_SLOTS.findIndex(item => item.id === slot.data.id);
        const index = this.RECOLTABLE.findIndex(item => item.id === slot.data.id);
        if (selected_index === -1) {
          this.SELECTED_SLOTS.push(this.RECOLTABLE[index]);
        } else {
          this.SELECTED_SLOTS.splice(selected_index, 1);
        }
    }

    private getItems(itemIds) {
        return new Promise(res =>
            this.api.mover.finder.singleton('createItemInstances')?.getItems(itemIds, (error, result) => {
            if (error) return res([]);
            return res(result);
          }));
    }

    private async stepIn() {
        this.checkFullPods();
        if (this.canStepIn()) {
          this.Busy = true;
          try {
            const success = await this.gatherSingle();
            if (!success) {
              //si on doit changer de map, alors await changement de map
              //else 
              //TODO
              //this.api.betterLogger('changement de map ?')
              await this.pauseStepIn();
            }
          }
          catch (ex) {
            this.logObj("Error during step in", ex);
            if (ex.message) this.wGame.gui.chat.logError(ex.message);
          }
          this.Busy = false;
          await this.api.mover.timeoutResolveV2(this.BasicWait);
          this.stepIn();
        }
    }

    async pauseStepIn(timeout = 2000) {
        this.log("Rien à faire, attente " + timeout + "ms");
        await this.api.mover.timeoutResolveV2(timeout);
    }

    private async gatherSingle() {
        let possibleInteractive = undefined;
        let skill = undefined;
    
        const interactiveIds = Object.keys(this.wGame.isoEngine.mapRenderer.interactiveElements);
        for (let i = 0; i < interactiveIds.length; i++) {
          const key = interactiveIds[i];
          const el = this.wGame.isoEngine.mapRenderer.interactiveElements[key].elementTypeId;
          const index = this.SELECTED_SLOTS.findIndex(item => item.interactive === el);
          if (index !== -1                                                                                                          // Si l'interactiveElement est inclu dans ceux cochés
            && typeof this.wGame.isoEngine.mapRenderer.interactiveElements[key].enabledSkills !== 'undefined'                                  // Si l'interactiveElement est actif
            && this.wGame.isoEngine.mapRenderer.interactiveElements[key].enabledSkills.length > 0) {                                           // Si j'ai le skill pour récolter
    
            const found_skill = Object.values(this.wGame.isoEngine.mapRenderer.interactiveElements[key].enabledSkills).find((obj) => {       // Je cherche les éléments récolable
              if (obj["skillId"] == this.SELECTED_SLOTS[index].skill) {
                return obj;
              }
            });
    
            if (found_skill) {                                                                                                    // Si j'ai trouvé un élément récoltable
              possibleInteractive = key;
              skill = found_skill;
              break;
            }
          }
        }
    
        if (possibleInteractive && skill) {
          const elemId = this.wGame.isoEngine.mapRenderer.interactiveElements[possibleInteractive].elementId;
          this.logObj("Gather a resource " + elemId, { elemId, skill:skill.skillInstanceUid });
          this.wGame.isoEngine.useInteractive(elemId, skill.skillInstanceUid); // Je récolte
          await this.waitInteractiveEnd();
          return true;
        }
        return false;
    }

    async waitInteractiveEnd() {
        await this.waitMsg("InteractiveUseEndedMessage", 40000);//40 parceque y'a le trajet lol
    }

    private waitMsg(msgId, timeout = 13000) {
        return new Promise((ok, fail) => {
          let tm = null;
          const evOk = () => {
            this.log("wait " + msgId + " finished");
            clearTimeout(tm);
            ok(1);
          };
          tm = setTimeout(() => {
            this.wGame.dofus.connectionManager.removeListener(msgId, evOk);
            fail("wait " + msgId + " timeout");
          }, timeout);
          this.wGame.dofus.connectionManager?.once(msgId, evOk);
        });
    }

    private log(msg) {
        if (this.Debug) {
          console.log("- " + this.ID + " - " + msg);
        }
    }

    private logObj(msg, obj) {
        if (this.Debug) {
          console.log({ log: "- " + this.ID + " - " + msg, obj });
        }
    }

    private canStepIn() {
        let ret = true;
        if (!this.BotEnabled || this.Busy) ret = false;
        if (!this.canGather()) ret = false;
    
        return ret;
    }

    private canGather() {
        let ret = true;
        if (this.GATHERING) ret = false;
        if (this.wGame.isoEngine.actorManager.userActor.moving) ret = false;
        if (this.wGame.gui.fightManager.isInFight()) ret = false;
        if (this.FULLPODS) ret = false;
    
        return ret;
    }

    private initResizeBehavior() {
        const dimensions = this.api.mover.finder.getSingletonObjectWithKey("dimensions")[0].dimensions;
        const tapHelper = this.api.mover.finder.getSingletonObjectWithKey("getPosition")[0];
        const getPosition = tapHelper.getPosition;
        const requestInteractionHandle = this.api.mover.finder.getSingletonObjectWithKey("requestInteractionHandle")[0].requestInteractionHandle;
    
        const WINDOW_MIN_WIDTH = 200; // (pixels)
        const WINDOW_MIN_HEIGHT = 200; // (pixels)
    
        function resizeBehavior(element, options) {
          options = options || {};
    
          let minWidth = options.minWidth || WINDOW_MIN_WIDTH;
          let minHeight = options.minHeight || WINDOW_MIN_HEIGHT;
    
          element.resizeHandle = element.createChild('div', {
            className: 'resizeHandle'
          });
          element.resizeHandle.allowDomEvents();
    
          let resizing = false;
          let initialSize = {
            w: null,
            h: null
          };
          let initialPosition = {
            x: null,
            y: null
          };
          let currentSize = {
            w: null,
            h: null
          };
    
          let onResizeStart =(e) => {
            if (resizing || !requestInteractionHandle(element)) {
              return;
            }
            resizing = true;
    
            initialSize.w = currentSize.w = element.rootElement.clientWidth;
            initialSize.h = currentSize.h = element.rootElement.clientHeight;
    
            let touch = getPosition(e);
            initialPosition.x = touch.x;
            initialPosition.y = touch.y;
    
            element.emit('resizeStart');
    
            this.wGame.gui.wBody.once('dom.touchend', onResizeEnd);
            this.wGame.gui.wBody.on('dom.touchmove', onResize);
            onResize(e);
          }
    
          function onResize(e) {
            let touch = getPosition(e);
    
            let deltaW = touch.x - initialPosition.x;
            let deltaH = touch.y - initialPosition.y;
    
            currentSize.w = initialSize.w + deltaW;
            currentSize.h = initialSize.h + deltaH;
            currentSize.w = Math.min(Math.max(currentSize.w, minWidth), dimensions.windowFullScreenWidth);
            currentSize.h = Math.min(Math.max(currentSize.h, minHeight), dimensions.windowFullScreenHeight);
    
            element.setStyles({
              width: currentSize.w + 'px',
              height: currentSize.h + 'px'
            });
          }
    
          const onResizeEnd = () => {
            this.wGame.gui.wBody.removeListener('dom.touchmove', onResize);
            resizing = false;
            element.windowWidth = currentSize.w;
            element.windowHeight = currentSize.h;
            element.emit('resize');
          }
    
          element.resizeHandle.on('dom.touchstart', onResizeStart);
        }
        this.resizeBehavior = resizeBehavior;
    }

    private createWindow(id, name) {
        const windowMaker = this.api.startWaitingForContentSing
        const superClass = this.api.inheritSing

        function myWindow() {
          windowMaker.call(this, {
            className: id,
            title: name,
            plusButton: true,
            minusButton: true,
            positionInfo: {
              left: 'c',
              top: 'c',
              width: '480px',
              height: '370px',
              isDefault: true
            }
          });
          this.status = {
            lastOpenCoords: {},
            lastWindowInfo: {
              x: null,
              y: null,
              w: null,
              h: null,
            },
            initialSizeAndPosition: {
              left: 'c',
              bottom: '3%',
              width: '50%',
              height: '90%'
            }
          }
          this.plusButton.hide();
          this.minusButton.hide();
        }
        superClass(myWindow, windowMaker);
        this.windowManager.addWindow(id, new myWindow());
    }

    private checkFullPods(msg = null) {
        let available_pods;
        if (msg) {
          available_pods = msg.weight == msg.weightMax || (Math.floor(((msg.weight / msg.weightMax) * 100)));
        } else {
          available_pods = this.wGame.gui.playerData.inventory.weight == this.wGame.gui.playerData.inventory.maxWeight || (Math.floor(((this.wGame.gui.playerData.inventory.weight / this.wGame.gui.playerData.inventory.maxWeight) * 100)));
        }
        if (available_pods >= this.wGame.document.querySelector('.kedamaxPods')["value"]) {//.value
          if (this.SELECTED_SLOTS.length > 0 && !this.FULLPODS) {
            this.wGame.gui.openPopup({
              title: "Aïe aïe aïe",
              message: "Il semblerait que tu n'aies plus de place pour récolter ! Il est grand temps de vider ton inventaire (ou d'augmenter la limite de surcharge dans la fenêtre de récolte auto.)."
            });
          }
          this.setBotEnabled(false);
          this.FULLPODS = true;
        } else {
          this.FULLPODS = false;
        }
    }

    private setBotEnabled(enabled) {
      if(this.btnEnable != undefined){
        this.btnEnable.setText(enabled ? "Arrêter" : "Activer");
        if (!enabled) {
          if (this.BotEnabled) {
            this.wGame.gui.chat.logError('🪓 Auto-récolte désactivé 🪓');
            this.Busy = false;
          }
          this.BotEnabled = false;
        }
        else {
          this.BotEnabled = true;
          this.wGame.gui.chat.logMsg('🪓 Auto-récolte activé 🪓');
          this.stepIn();
        }
      }
    }

    public reset() {
        super.reset()
        this.shortcutsHelper.unBindAll()
        this.checkSiMort = true
    }
}