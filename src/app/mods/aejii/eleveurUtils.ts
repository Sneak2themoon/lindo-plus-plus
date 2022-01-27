/* eslint-disable @typescript-eslint/no-this-alias */
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

import {ShortcutsHelper} from "@helpers/shortcuts.helper"
//import {API} from "./api"

import * as util from 'util'
import { inspect } from 'util'
import {SettingsService} from "@services/settings.service"
import { TranslateService } from "@ngx-translate/core"
import { API } from ".."

export class EleveurUtils extends Mod{

    public checkSiMort:boolean
    private api:API

    private certiWindow
    private evShow
    private evClose

    private names = []
    private properties = []
    private oldCreateSort
    private changeToNextValSig
    private filters
    private buttons
    private genSerenity
    private oldSetup

    startMod(): void {
        this.checkSiMort = false
        //Logger.info("- base active");
    }

    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api = api
        this.names = [];
        this.properties = [];
        this.utilsEleveur()

        //moune tri
        this.addSorts();
        const module = this;
        this.oldCreateSort = this.api.mover.finder.getSingletonConstructorWithKey("_createSortSelector")[1].prototype._createSortSelector;
        this.api.mover.finder.getSingletonConstructorWithKey("_createSortSelector")[1].prototype._createSortSelector = function (e) {
            const bindedFunc = module.oldCreateSort.bind(this);
            const dofusOriginalResult = bindedFunc(e);
            const t = e._childrenList[e._childrenList.length - 1];
            for (let index in module.names) {
            const name = module.names[index];
            const property = module.properties[index];
            this.sorters.push({ name: name, property: property });
            t.addOption(name, property);
            t.toggleOption({ name: name, property: property });
            }
    
            return dofusOriginalResult;
        }

        this.filters = {};
        this.buttons = {};
        this.genSerenity = {
            1: 1666,
            2: 1333,
            3: 1333,
            4: 1333,
            5: 1000,
            6: 1000,
            7: 1000,
            8: 666,
            9: 666,
            10: 333,
        };
        this.changeToNextValSig = this.api.mover.finder.getSingletonConstructorWithKey("_changeToNextValue")[1]
        this.addFilters();
        this.oldSetup = this.api.mover.finder.getSingletonConstructorWithKey("_setupToggles")[1].prototype._setupToggles;
        this.api.mover.finder.getSingletonConstructorWithKey("_setupToggles")[1].prototype._setupToggles = function (...args) {
        const bindedFunc = module.oldSetup.bind(this);
        const dofusOriginalResult = bindedFunc(...args);
        module.addMountFilters(this);
        module.createButtons(this);
        return dofusOriginalResult;
        };
    }

    getWindow() {
        const manager = this.api.mover.finder.getSingletonObjectWithKey("getWindow")[0]
        return manager.getWindow("breeding");
    }
    
    private createButtons(box) {

        let toggleBtnHandler = (e, t, i) => {
            const box = this.getWindow().mountFilterBox;
            box._enterBatchUpdate();
            var n = this.buttons[e],
              o = n.filterId;
            var or = o + "Reversed";
            switch (i) {
              case 0:
                box._delFilterButton(e), box.mountFilters.removeFilter(or);
                break;
              case 1:
                box._deactivateOppositeToggles(e, []),
                  box._addFilterButton(e, n.label),
                  box.mountFilters.setFilter(o, t);
                break;
              case 2:
                box._delFilterButton(e), box.mountFilters.removeFilter(o);
                box._delFilterButton(e),
                  box._addFilterButton(e, n.label, "reversed"),
                  box.mountFilters.setFilter(or, t);
                break;
              default:
                console.error("invalid valueIndex: " + i);
            }
            box._leaveBatchUpdate();
        }

        let e;
        let cpt = 0;
        for (let index in this.buttons) {
          if (cpt % 2 == 0) {
            e = box.createChild("div", {
              className: "sexBar",
            });
          }
          cpt++;
          const t = index;
          const i = toggleBtnHandler;
          const L = [
              {
                value: null,
              },
              {
                value: !0,
                className: "active",
              },
              {
                value: !1,
                className: "reversed",
              },
            ],
            O = [
              {
                value: null,
              },
              {
                value: !1,
                className: "active",
              },
            ];
          var n,
            o = this.buttons[index];
          var s = o.label;
          var a = o.addIcon;
          o.isReversible ? (n = L) : o.isReversed && (n = O),
            (box[t] = e.appendChild(
              new this.changeToNextValSig(t, i, {
                text: s,
                addIcon: a,
                states: n,
              })
            ));
        }
    }

    private addMountFilters(box) {
        for (let index in this.filters) {
          box.mountFilters.filterMap[index] = this.filters[index];
        }
    }

    private addFilters(){
        const module = this;
        this.addFilter("level", "Niveau <5", function (e, t) {
          var i = this.level;
          return i < 5;
        });
        this.addFilter("necessarySerenity", "Sérénité suffisante", function (e, t) {
          let gen = this.maturityForAdult / 1000;
          if (this.model == 74 || this.model == 18) {
            gen = 1;
          }
          const serenityMax = module.genSerenity[gen];
          const serenity = this.serenity;
          if (this.sex) {
            return serenity > 0 || serenity < -serenityMax;
          } else {
            return serenity > serenityMax || serenity < 0;
          }
        });
    
        this.addFilter("soonExpire", "Expiration < 15", function (e, t) {
          if (this.expiration) {
            const now = new Date().getTime();
            const delay = (this.expiration - now) / 1000 / 60 / 60 / 24;
            return delay < 15;
          } else {
            return false;
          }
        });
        this.addFilter("isRepro", "Reproductrice", function (e, t) {
            let retour = false
            for (let index = 0; index < this.behaviors.length; index++) {
                if(this.behaviors[index] == 3){
                    retour = true
                }
            }
            return retour
        });
    }

    private addFilter(id, label, func) {
        this.filters[id] = {
          id: id,
          name: id + "Box",
          do: func,
        };
        this.filters[id + "Reversed"] = {
          id: id + "Reversed",
          name: id + "Box",
          do: function (e, t) {
            const bindedFunc = func.bind(this);
            return !bindedFunc(e, t);
          },
        };
        this.buttons[id] = {
          filterId: id,
          isReversible: !0,
          label: label,
          isReversed: 0,
        };
    }

    private addSort(name, property) {
        this.names.push(name);
        this.properties.push(property);
    }
    
    private addSorts() {
        this.addSort("Sérénité", "serenity");
        this.addSort("Reproduction", "reproductionCount");
        this.addSort("Temps de fécondation", "fecondationTime");
    }

    //all time load
    private utilsEleveur() {
        
        this.certiWindow = this.api.mover.finder.getSingletonObjectWithKey("getWindow")[0].getWindow("tradeWithPlayerAndNPCInventory")
    
        let createButton = () => {
            let filterbox = this.certiWindow.windowBody._childrenList[0]._childrenList[0]._childrenList[1]._childrenList[0].rootElement
            console.log(this.certiWindow)

            
            let alldd = document.createElement('div')
            alldd.id = 'idalldd'

            let allddButton = document.createElement('button')
            allddButton.innerHTML = "All dd";
            allddButton.classList.add('buttondd')
            allddButton.onclick = () => {
                console.log('click')
                this.echangeAllCerti()
            }
            alldd.appendChild(allddButton)
            filterbox.parentNode.insertBefore(alldd,filterbox);

            let ddlvl1 = document.createElement('div')
            ddlvl1.id = 'idddlvl1'

            let ddlvl1Button = document.createElement('button')
            ddlvl1Button.innerHTML = "dd lvl1";
            ddlvl1Button.classList.add('buttondd')
            ddlvl1Button.onclick = () => {
                console.log('click2')
                this.echangeBBlvl1()
            }
            ddlvl1.appendChild(ddlvl1Button)
            filterbox.parentNode.insertBefore(ddlvl1,filterbox);
        }

        this.evShow = () => {
            createButton()
        }

        this.evClose = () => {
            console.log('close')
            let element = this.wGame.document.getElementById("idalldd")
            if(element)
                element.parentNode.removeChild(element)
            element = this.wGame.document.getElementById("idddlvl1")
            if(element)
                element.parentNode.removeChild(element)
        }
    
        this.certiWindow.on("opened", this.evShow);
        this.certiWindow.on("closed", this.evClose);
        
        

        //////////////////

        /*
        let echangeAllCerti = document.createElement('div')
        echangeAllCerti.appendChild(document.createTextNode('Echange all certi '))

        let echangeAllCertiImput = document.createElement('button')
        echangeAllCertiImput.classList.add('buttondd')
        echangeAllCertiImput.onclick = () => {
            this.echangeAllCerti()
        }
        echangeAllCerti.appendChild(echangeAllCertiImput)
        this.divwindowBody.appendChild(echangeAllCerti)
        /** */
    }

    private echangerDD(uid) {
        return new Promise(async (resolve, reject) => {
            //{"call":"sendMessage","data":{"type":"ExchangeObjectMoveMessage","data":{"objectUID":5051610,"quantity":1}}}
            this.wGame.dofus.sendMessage("ExchangeObjectMoveMessage", {
                objectUID: uid,
                quantity: 1
            })
            setTimeout(() => {
                resolve(1)
            }, this.api.randomIntFromInterval(200,400));
            
        })
    }

    private async echangeAllCerti() {
        Logger.info('debut echangeAllCerti')
        this.certiWindow = this.api.mover.finder.getSingletonObjectWithKey("getWindow")[0].getWindow("tradeWithPlayerAndNPCInventory")

        //l'inventaire de "droite"
        let slotList = this.certiWindow.storageViewer.currentOpenedWindow._childrenList[1]._childrenList[1]._childrenList[0]._childrenList[0]._childrenList[2]._childrenList[0]._childrenList[0]._childrenList
        for (let index = 0; index < slotList.length; index++) {
            const slot = slotList[index];
            if(slot.dbItem.nameId.startsWith('Dragodinde') && this.certiWindow.openState){
                await this.echangerDD(slot.data.objectUID)
                index = -1 //car on fait +1 apres
            }
        }
        Logger.info('fin echangeAllCerti')
    }

    private async echangeBBlvl1() {
        Logger.info('echange bb lvl1')

        this.certiWindow = this.api.mover.finder.getSingletonObjectWithKey("getWindow")[0].getWindow("tradeWithPlayerAndNPCInventory")
        
        let keys = Object.keys(this.wGame.gui.playerData.inventory.objects)
        for (let index = 0; index < keys.length; index++) {
            let obj = this.wGame.gui.playerData.inventory.objects[keys[index]]
            if(obj.effects.length==4){
                
                if(obj.effects[1].text == 'inf' && this.certiWindow.openState){
                    let uid = this.wGame.gui.playerData.inventory.objects[keys[index]].objectUID
                    await this.echangerDD(uid)
                }
            }  
        }
        Logger.info('fin echange bb lvl1')
    }

    public reset() {
        super.reset()
        this.checkSiMort = true
        if (this.certiWindow) {
            this.certiWindow.removeListener("opened", this.evShow);
            this.certiWindow.removeListener("closed", this.evClose);
        }

        if (this.oldCreateSort) {
            this.api.mover.finder.getSingletonConstructorWithKey("_createSortSelector")[1].prototype._createSortSelector = this.oldCreateSort;
            this.oldCreateSort = null;
        }

        if (this.oldSetup) {
            this.api.mover.finder.getSingletonConstructorWithKey("_setupToggles")[1].prototype._setupToggles = this.oldSetup;
            this.oldSetup = null;
        }
        //Logger.info(' - base deactiver')
    }
}