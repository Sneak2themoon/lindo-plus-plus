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

import {API} from "./api"

import {SettingsService} from "@services/settings.service"
import { TranslateService } from "@ngx-translate/core"

export class DdGestion extends Mod{

    private api: API
    public checkSiMort: boolean

    startMod(): void {
        return
    }
    
    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api = api
        this.checkSiMort = false
        Logger.info("- DdGestion active");
    }

    public async startDD() {
        let retour = await this.checkPositionAvantDD()
        if(retour == 1){
            let retourMap = await this.api.mover.changeMapAsync('bottom')
            //let retourMap = await this.api.changeMapAsync('bottom')
            if(retourMap == 1){
                this.ouvrirEnclos(417580,190)//baffleur
                let retourBaff = await this.algoBaffeur()
                this.api.fermerFenetre()

                let retourMap2 = await this.api.mover.changeMapAsync('right')
                if(retourMap2 == 1){
                    this.ouvrirEnclos(78803,263)//foudroyeur
                    let retourFoud = await this.algoFoudroyeur()
                    this.api.fermerFenetre()

                    let retourMap3 = await this.api.mover.changeMapAsync('right')
                    if(retourMap3 == 1){
                        this.ouvrirEnclos(417389,412)//caresseur
                        let retourCaress = await this.algoCaresseur()
                        this.api.fermerFenetre()

                        let retourMap4 = await this.api.mover.changeMapAsync('top')
                        if(retourMap4 == 1){
                            this.ouvrirEnclos(417512,396)//dragofesse
                            let retourCaress = await this.algoDragofesse()
                            this.api.fermerFenetre()
                            let retourMap5 = await this.api.mover.changeMapAsync('left')
                            if(retourMap5 == 1){
                                this.ouvrirEnclos(79206,343)//abreuvoire
                                let retourCaress = await this.algoAbreuvoir()
                                this.api.fermerFenetre()
                                let retourMap6 = await this.api.mover.changeMapAsync('left')
                                this.api.betterLogger('fini, tu peux deco et te reco d\'ici 20 minutes')
                                this.reset()
                            }
                        }
                    }
                }
            }
        }//sinon fail
    }

    private checkPositionAvantDD() {
        return new Promise(async (resolve, reject) => {
            //id item potion brack : 6964
            if(this.wGame.isoEngine.mapRenderer.mapId == 13631488){//arrivé popo brack : 13631488
                //prendre "zaapi" - enclos public
                let retourzaapi = await this.api.prendreZaapi(147493)
                resolve(1)
            }else{
                let mapEnclos = [147493,147494,146982,146981,146469,146470]
                //map : mangeoire : 147493
                //baffeur : 147494
                //eclair : 146982
                //abreuvoir : 146981
                //dragofesse : 146469
                //carresseur : 146470
                let indexFinal = -1
                for (let xwcxc = 0; xwcxc < mapEnclos.length; xwcxc++) {
                    if(mapEnclos[xwcxc] == this.wGame.isoEngine.mapRenderer.mapId){
                        indexFinal = xwcxc
                    }
                }
                if(indexFinal!=-1){
                    switch (indexFinal) {
                        case 0://baffeur
                            //on est bon
                            resolve(1)
                            break
                        case 1://baffeur
                            //go une map top
                            let retour = await this.api.mover.changeMapAsync('top')
                            resolve(1)
                            break
                        case 2://eclair
                            //go une map left
                            let retourl = await this.api.mover.changeMapAsync('left')
                            //go une map top
                            let retourt = await this.api.mover.changeMapAsync('top')
                            resolve(1)
                            break
                        case 3://abreuvoir
                            //go une map left
                            let retourll = await this.api.mover.changeMapAsync('left')
                            resolve(1)
                            break
                        case 4://dragofesse
                            //go left, feft
                            let retourlll = await this.api.mover.changeMapAsync('left')
                            let retourllll = await this.api.mover.changeMapAsync('left')
                            resolve(1)
                            break
                        case 5://carresseur
                            //go top, left, feft
                            let retourtt = await this.api.mover.changeMapAsync('top')
                            let retourlllll = await this.api.mover.changeMapAsync('left')
                            let retourllllll = await this.api.mover.changeMapAsync('left')
                            resolve(1)
                            break
                        default:
                            break;
                    }
                }else{
                    Logger.info('popo brack')//on utilise popo brack car on est perdu
                    let retour = this.api.utiliserItem(6964)
                    setTimeout(async () => {
                        //le temps que la map charge, sale
                        let retourzaapi = await this.api.prendreZaapi(147493)
                        resolve(1)
                    }, this.api.randomIntFromInterval(4000,5000))
                }
            }
        })
    }

    private ouvrirEnclos(idElem, cellId) {
        let allInteractive = this.wGame.isoEngine._getAllInteractives()
        let interas = this.wGame.isoEngine.mapRenderer.interactiveElements
        for (const elem of allInteractive) {
            if(interas[elem.id] != undefined)
                if(interas[elem.id]._name == 'Enclos'){
                    if(interas[elem.id].enabledSkills.length>0){
                        if(interas[elem.id].enabledSkills[0]._name == 'Accéder'){
                            //on a l'enclos gg a nous
                            if(interas[elem.id].elementId == idElem){
                                console.log(interas[elem.id])
                                this.api.mover.useInteractive(interas[elem.id].elementId,this.api.getRandomAvailableCellOnMap(), cellId)
                                //this.wGame.isoEngine._useInteractive(interas[elem.id].elementId,interas[elem.id].enabledSkills[0].skillInstanceUid)
                            }
                        }
                    }
                }
        }
    }

    private algoBaffeur() {
        return new Promise(async (resolve, reject) => {
            this.once(this.wGame.dofus.connectionManager, 'ExchangeStartOkMountMessage', async (e: any) => {
                setTimeout(async() => {
                    let nombreMontureDansEnclos = e.paddockedMountsDescription.length
                    //en théorie soit l'un soit l'autre, mais humain peut passer par la et tout casser
                    let nombreMontureDansEnclosMale = 0
                    let nombreMontureDansEnclosFemelle = 0
                    //calcul nombreMontureDansEnclosMale/femelle
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        if(e.paddockedMountsDescription[jjiklhg].sex == 0){
                            nombreMontureDansEnclosMale++
                        }else{
                            nombreMontureDansEnclosFemelle++
                        }
                    }

                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = 0

                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale = 0
                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle = 0

                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMaleNONFECONDE = 0
                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelleNONFECONDE = 0
                    //calcule de nombreMontureDansEtableQuiOntBesoinDallerDansLenclos
                    for (let jjiklhg = 0; jjiklhg < e.stabledMountsDescription.length; jjiklhg++) {
                        if(e.stabledMountsDescription[jjiklhg].stamina<10000){
                            //et que la serénité est supérieur a -500 pour les femelle ou 0 pour les males
                            if((e.stabledMountsDescription[jjiklhg].serenity > -500 && e.stabledMountsDescription[jjiklhg].sex)||
                            (e.stabledMountsDescription[jjiklhg].serenity > 0 && !e.stabledMountsDescription[jjiklhg].sex)){
                                //si la fatique est inférieur a 240
                                if(e.stabledMountsDescription[jjiklhg].boostLimiter < 240){
                                    //ne pas mettre si besoin d'amour et serenité positif
                                    if(!(e.stabledMountsDescription[jjiklhg].love<10000 && e.stabledMountsDescription[jjiklhg].serenity > 0)){
                                        //c'est un enfant
                                        if(e.stabledMountsDescription[jjiklhg].maturity<e.stabledMountsDescription[jjiklhg].maturityForAdult){
                                            if(e.stabledMountsDescription[jjiklhg].serenity>2000){
                                                if(e.stabledMountsDescription[jjiklhg].sex == 1){
                                                    nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle++
                                                    if(this.mauvaisSexMaisNonFecondable(e.stabledMountsDescription[jjiklhg],'baffeur')){
                                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelleNONFECONDE++
                                                    }
                                                }else{
                                                    nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale++
                                                    if(this.mauvaisSexMaisNonFecondable(e.stabledMountsDescription[jjiklhg],'baffeur')){
                                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMaleNONFECONDE++
                                                    }
                                                }
                                            }//else on ne met pas l'enfant
                                        }else{
                                            if(e.stabledMountsDescription[jjiklhg].sex == 1){
                                                nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle++
                                                if(this.mauvaisSexMaisNonFecondable(e.stabledMountsDescription[jjiklhg],'baffeur')){
                                                    nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelleNONFECONDE++
                                                }
                                            }else{
                                                nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale++
                                                if(this.mauvaisSexMaisNonFecondable(e.stabledMountsDescription[jjiklhg],'baffeur')){
                                                    nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMaleNONFECONDE++
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }else{
                            //si enfant male ou femelle
                            if(e.stabledMountsDescription[jjiklhg].maturity<e.stabledMountsDescription[jjiklhg].maturityForAdult){
                                if(e.stabledMountsDescription[jjiklhg].serenity>2000){
                                    if(e.stabledMountsDescription[jjiklhg].sex == 1){
                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle++
                                        if(this.mauvaisSexMaisNonFecondable(e.stabledMountsDescription[jjiklhg],'baffeur')){
                                            nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelleNONFECONDE++
                                        }
                                    }else{
                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale++
                                        if(this.mauvaisSexMaisNonFecondable(e.stabledMountsDescription[jjiklhg],'baffeur')){
                                            nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMaleNONFECONDE++
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale+' male qui ont besoin enclos baffeur')
                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle+' femelle qui ont besoin enclos baffeur')

                    //calcul quelle sex on va mettre dans l'enclos
                    let totalMale = parseInt(nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale.toString())+parseInt(nombreMontureDansEnclosMale.toString())
                    let totalFemele = parseInt(nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle.toString())+parseInt(nombreMontureDansEnclosFemelle.toString())
                    let boolSex = 1
                    if(totalMale>totalFemele){
                        boolSex = 0
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos += nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelleNONFECONDE
                    }else{
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos += nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMaleNONFECONDE
                    }
                    
                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclos+' monture sex opposé qui ont besoin enclos')

                    //enclos on vire le "mauvais" sex (fécondable) qui est deja dans l'enclos
                    Logger.info('check monture dans enclos')
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        if(e.paddockedMountsDescription[jjiklhg].sex != boolSex){
                            //si mauvais sex mais non fécdondable, on la laisse
                            if(!this.mauvaisSexMaisNonFecondable(e.paddockedMountsDescription[jjiklhg],'baffeur')){
                                nombreMontureDansEnclos--
                                Logger.info('mauvais sex monture:'+e.paddockedMountsDescription[jjiklhg].sex+', nouveau sex:'+boolSex)
                                let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                                e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                                e.paddockedMountsDescription.splice(jjiklhg,1)
                            }
                        }
                    }


                    //enclos
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        //on remette dans etable si la serenité est "bien"
                        if((e.paddockedMountsDescription[jjiklhg].serenity < -1500 && e.paddockedMountsDescription[jjiklhg].sex) || (e.paddockedMountsDescription[jjiklhg].serenity < 0 && !e.paddockedMountsDescription[jjiklhg].sex)){
                            nombreMontureDansEnclos--
                            Logger.info('sérénité ok, on remet monture dans etable')
                            let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                            e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                            e.paddockedMountsDescription.splice(jjiklhg,1)
                        }else{
                            //on vérifie si il faut faire de la place pour optimisé utilisation fatigue
                            if(nombreMontureDansEtableQuiOntBesoinDallerDansLenclos>5-nombreMontureDansEnclos
                                && e.paddockedMountsDescription[jjiklhg].boostLimiter >= 240){
                                Logger.info('on optimise la fatique :'+nombreMontureDansEtableQuiOntBesoinDallerDansLenclos+'/'+(5-nombreMontureDansEnclos))
                                nombreMontureDansEnclos--
                                let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                                e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                                e.paddockedMountsDescription.splice(jjiklhg,1)
                            }
                        }
                    }
                    //etable
                    for (let jjiklhg = 0; jjiklhg < e.stabledMountsDescription.length; jjiklhg++) {
                        if(nombreMontureDansEnclos<5){
                            //Logger.info('nombreMontureDansEnclos:'+nombreMontureDansEnclos)
                            if(e.stabledMountsDescription[jjiklhg].sex == boolSex || this.mauvaisSexMaisNonFecondable(e.stabledMountsDescription[jjiklhg],'baffeur')){
                                if(e.stabledMountsDescription[jjiklhg].stamina<10000){
                                    //et que la serénité est supérieur a -500 pour les femelle ou 0 pour les males
                                    if((e.stabledMountsDescription[jjiklhg].serenity > -500 && e.stabledMountsDescription[jjiklhg].sex)||
                                    (e.stabledMountsDescription[jjiklhg].serenity > 0 && !e.stabledMountsDescription[jjiklhg].sex)){
                                        //si la fatique est inférieur a 240
                                        if(e.stabledMountsDescription[jjiklhg].boostLimiter < 240){
                                            //ne pas mettre si besoin d'amour et serenité positif
                                            if(!(e.stabledMountsDescription[jjiklhg].love<10000 && e.stabledMountsDescription[jjiklhg].serenity > 0)){
                                                
                                                if(e.stabledMountsDescription[jjiklhg].maturity<e.stabledMountsDescription[jjiklhg].maturityForAdult){
                                                    if(e.stabledMountsDescription[jjiklhg].serenity>2000){
                                                        nombreMontureDansEnclos++
                                                        //on déplace monture ENFANT etable -> enclos
                                                        let retourMove = await this.moveDD(e.stabledMountsDescription[jjiklhg].id,6,e.stabledMountsDescription[jjiklhg].name)
                                                        e.paddockedMountsDescription.push(e.stabledMountsDescription[jjiklhg])
                                                        e.stabledMountsDescription.splice(jjiklhg,1)
                                                    }else{//else on ne dépalce pas l'enfant
                                                        //Logger.info('c est un bebe mais il faut monter sa maturité')
                                                    }
                                                }else{
                                                    nombreMontureDansEnclos++
                                                    //on déplace monture etable -> enclos
                                                    //Logger.info('on ajoute dd')
                                                    let retourMove = await this.moveDD(e.stabledMountsDescription[jjiklhg].id,6,e.stabledMountsDescription[jjiklhg].name)
                                                    e.paddockedMountsDescription.push(e.stabledMountsDescription[jjiklhg])
                                                    e.stabledMountsDescription.splice(jjiklhg,1)
                                                    //Logger.info('on ajoute dd fini')
                                                }
                                            }else{
                                                //Logger.info('hmmm il faut d abort monte l amour')
                                            }
                                        }else{
                                            //Logger.info('trop fatigué')
                                        }
                                    }else{
                                        //Logger.info('serenité deja prete')
                                    }
                                }else{
                                    //Logger.info('stamina au max')
                                    //si enfant male ou femelle
                                    if(e.stabledMountsDescription[jjiklhg].maturity<e.stabledMountsDescription[jjiklhg].maturityForAdult){
                                        if(e.stabledMountsDescription[jjiklhg].serenity>2000){
                                            let retourMove = await this.moveDD(e.stabledMountsDescription[jjiklhg].id,6,e.stabledMountsDescription[jjiklhg].name)
                                            e.paddockedMountsDescription.push(e.stabledMountsDescription[jjiklhg])
                                            e.stabledMountsDescription.splice(jjiklhg,1)
                                        }
                                    }
                                }
                            }else{
                                //Logger.info('pas le bon sex')
                            }
                        }else{
                            //Logger.info('deja 5 montures')
                        }
                    }
                    setTimeout(() => {
                        resolve(1)
                    }, this.api.randomIntFromInterval(700,1000))
                }, this.api.randomIntFromInterval(1000,2000))
            })
        })
    }

    private algoCaresseur() {
        return new Promise(async (resolve, reject) => {
            this.once(this.wGame.dofus.connectionManager, 'ExchangeStartOkMountMessage', async (e: any) => {
                setTimeout(async() => {
                    let nombreMontureDansEnclos = e.paddockedMountsDescription.length
                    //en théorie soit l'un soit l'autre, mais humain peut passer par la et tout casser
                    let nombreMontureDansEnclosMale = 0
                    let nombreMontureDansEnclosFemelle = 0
                    //calcul nombreMontureDansEnclosMale/femelle
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        if(e.paddockedMountsDescription[jjiklhg].sex == 0){
                            nombreMontureDansEnclosMale++
                        }else{
                            nombreMontureDansEnclosFemelle++
                        }
                    }


                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = 0
                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale = 0
                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle = 0
                    //calcule de nombreMontureDansEtableQuiOntBesoinDallerDansLenclos
                    for (let jjiklhg = 0; jjiklhg < e.stabledMountsDescription.length; jjiklhg++) {
                        //on a besoin de love
                        if(e.stabledMountsDescription[jjiklhg].love<10000){
                            //et que la serénité est supérieur a 500 pour les males ou 0 pour les femelles
                            if((e.stabledMountsDescription[jjiklhg].serenity < 500 && !e.stabledMountsDescription[jjiklhg].sex)||
                            (e.stabledMountsDescription[jjiklhg].serenity < 0 && e.stabledMountsDescription[jjiklhg].sex)){
                                //si la fatique est inférieur a 240
                                if(e.stabledMountsDescription[jjiklhg].boostLimiter < 240){
                                    //ne pas mettre si besoin d'endurance et serenité negative
                                    if(!(e.stabledMountsDescription[jjiklhg].stamina<10000 && e.stabledMountsDescription[jjiklhg].serenity < 0)){
                                        //c'est un enfant
                                        if(e.stabledMountsDescription[jjiklhg].maturity<e.stabledMountsDescription[jjiklhg].maturityForAdult){
                                            if(e.stabledMountsDescription[jjiklhg].serenity<2000){
                                                if(e.stabledMountsDescription[jjiklhg].sex == 1){
                                                    nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle++
                                                }else{
                                                    nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale++
                                                }
                                            }//else on ne met pas l'enfant
                                        }else{
                                            if(e.stabledMountsDescription[jjiklhg].sex == 1){
                                                nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle++
                                            }else{
                                                nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale++
                                            }
                                        }
                                    }
                                }
                            }
                        }else{
                            //si enfant male ou femelle
                            if(e.stabledMountsDescription[jjiklhg].maturity<e.stabledMountsDescription[jjiklhg].maturityForAdult){
                                if(e.stabledMountsDescription[jjiklhg].serenity<-2000){
                                    if(e.stabledMountsDescription[jjiklhg].sex == 1){
                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle++
                                    }else{
                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale++
                                    }
                                }
                            }
                        }
                    }

                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale+' male qui ont besoin enclos caresseur')
                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle+' femelle qui ont besoin enclos caresseur')

                    //calcul quelle sex on va mettre dans l'enclos
                    let totalMale = parseInt(nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale.toString())+parseInt(nombreMontureDansEnclosMale.toString())
                    let totalFemele = parseInt(nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle.toString())+parseInt(nombreMontureDansEnclosFemelle.toString())
                    let boolSex = 1
                    if(totalMale>totalFemele){
                        boolSex = 0
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale
                    }else{
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle
                    }

                    //enclos on vire le "mauvais" sex qui est deja dans l'enclos
                    Logger.info('check monture dans enclos')
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        if(e.paddockedMountsDescription[jjiklhg].sex != boolSex){
                            nombreMontureDansEnclos--
                            let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                            Logger.info('mauvais sex monture:'+e.paddockedMountsDescription[jjiklhg].sex+', nouveau sex:'+boolSex)
                            e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                            e.paddockedMountsDescription.splice(jjiklhg,1)
                        }else{
                            Logger.info('sex monture OK:'+e.paddockedMountsDescription[jjiklhg].sex+', nouveau sex:'+boolSex)
                        }
                    }

                    //enclos
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        //on remette dans etable si la serenité est "bien" (sup a 1500 pour male et sup a 0 pour femelle)
                        if((e.paddockedMountsDescription[jjiklhg].serenity > 1500 && !e.paddockedMountsDescription[jjiklhg].sex) || (e.paddockedMountsDescription[jjiklhg].serenity > 0 && e.paddockedMountsDescription[jjiklhg].sex)){
                            nombreMontureDansEnclos--
                            Logger.info('sérénité ok, on remet monture dans etable')
                            let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                            e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                            e.paddockedMountsDescription.splice(jjiklhg,1)
                        }else{
                            //on vérifie si il faut faire de la place pour optimisé utilisation fatigue
                            if(nombreMontureDansEtableQuiOntBesoinDallerDansLenclos>5-nombreMontureDansEnclos
                                && e.paddockedMountsDescription[jjiklhg].boostLimiter >= 240){
                                Logger.info('on optimise la fatique :'+nombreMontureDansEtableQuiOntBesoinDallerDansLenclos+'/'+(5-nombreMontureDansEnclos))
                                nombreMontureDansEnclos--
                                let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                                e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                                e.paddockedMountsDescription.splice(jjiklhg,1)
                            }
                        }
                    }

                    //etable
                    for (let jjiklhg = 0; jjiklhg < e.stabledMountsDescription.length; jjiklhg++) {
                        if(nombreMontureDansEnclos<5){
                            //Logger.info('nombreMontureDansEnclos:'+nombreMontureDansEnclos)
                            if(e.stabledMountsDescription[jjiklhg].sex == boolSex){
                                if(e.stabledMountsDescription[jjiklhg].love<10000){
                                    //et que la serénité est supérieur a 500 pour les males ou 0 pour les femelles
                                    if((e.stabledMountsDescription[jjiklhg].serenity < 500 && !e.stabledMountsDescription[jjiklhg].sex)||
                                    (e.stabledMountsDescription[jjiklhg].serenity < 0 && e.stabledMountsDescription[jjiklhg].sex)){
                                        //si la fatique est inférieur a 240
                                        if(e.stabledMountsDescription[jjiklhg].boostLimiter < 240){
                                            //ne pas mettre si besoin d'endurance et serenité negative
                                            if(!(e.stabledMountsDescription[jjiklhg].stamina<10000 && e.stabledMountsDescription[jjiklhg].serenity < 0)){
                                                
                                                if(e.stabledMountsDescription[jjiklhg].maturity<e.stabledMountsDescription[jjiklhg].maturityForAdult){
                                                    if(e.stabledMountsDescription[jjiklhg].serenity<2000){
                                                        nombreMontureDansEnclos++
                                                        //on déplace monture ENFANT etable -> enclos
                                                        let retourMove = await this.moveDD(e.stabledMountsDescription[jjiklhg].id,6,e.stabledMountsDescription[jjiklhg].name)
                                                        e.paddockedMountsDescription.push(e.stabledMountsDescription[jjiklhg])
                                                        e.stabledMountsDescription.splice(jjiklhg,1)
                                                    }else{//else on ne dépalce pas l'enfant
                                                        //Logger.info('c est un bebe mais il faut monter sa maturité')
                                                    }
                                                }else{
                                                    nombreMontureDansEnclos++
                                                    //on déplace monture etable -> enclos
                                                    //Logger.info('on ajoute dd')
                                                    let retourMove = await this.moveDD(e.stabledMountsDescription[jjiklhg].id,6,e.stabledMountsDescription[jjiklhg].name)
                                                    e.paddockedMountsDescription.push(e.stabledMountsDescription[jjiklhg])
                                                    e.stabledMountsDescription.splice(jjiklhg,1)
                                                    //Logger.info('on ajoute dd fini')
                                                }
                                            }else{
                                                //Logger.info('hmmm il faut d abort monte l amour')
                                            }
                                        }else{
                                            //Logger.info('trop fatigué')
                                        }
                                    }else{
                                        //Logger.info('serenité deja prete')
                                    }
                                }else{
                                    //Logger.info('love au max')
                                    //si enfant male ou femelle
                                    if(e.stabledMountsDescription[jjiklhg].maturity<e.stabledMountsDescription[jjiklhg].maturityForAdult){
                                        if(e.stabledMountsDescription[jjiklhg].serenity<-2000){
                                            let retourMove = await this.moveDD(e.stabledMountsDescription[jjiklhg].id,6,e.stabledMountsDescription[jjiklhg].name)
                                            e.paddockedMountsDescription.push(e.stabledMountsDescription[jjiklhg])
                                            e.stabledMountsDescription.splice(jjiklhg,1)
                                        }
                                    }
                                }
                            }else{
                                //Logger.info('pas le bon sex')
                            }
                        }else{
                            //Logger.info('deja 5 montures')
                        }
                    }
                    setTimeout(() => {
                        resolve(1)
                    }, this.api.randomIntFromInterval(700,1000))
                }, this.api.randomIntFromInterval(1000,2000))
            })
        })
    }

    private algoFoudroyeur() {
        return new Promise(async (resolve, reject) => {
            this.once(this.wGame.dofus.connectionManager, 'ExchangeStartOkMountMessage', async (e: any) => {
                setTimeout(async() => {
                    let nombreMontureDansEnclos = e.paddockedMountsDescription.length
                    //en théorie soit l'un soit l'autre, mais humain peut passer par la et tout casser
                    let nombreMontureDansEnclosMale = 0
                    let nombreMontureDansEnclosFemelle = 0
                    //calcul nombreMontureDansEnclosMale/femelle
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        if(e.paddockedMountsDescription[jjiklhg].sex == 0){
                            nombreMontureDansEnclosMale++
                        }else{
                            nombreMontureDansEnclosFemelle++
                        }
                    }


                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = 0
                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale = 0
                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle = 0
                    //calcule de nombreMontureDansEtableQuiOntBesoinDallerDansLenclos
                    for (let jjiklhg = 0; jjiklhg < e.stabledMountsDescription.length; jjiklhg++) {
                        //besoin d'endurance
                        if(e.stabledMountsDescription[jjiklhg].stamina<10000){
                            //que la serénité est inférieur 0
                            if(e.stabledMountsDescription[jjiklhg].serenity < 0){
                                //si la fatique est inférieur a 240
                                if(e.stabledMountsDescription[jjiklhg].boostLimiter < 240){
                                    if(e.stabledMountsDescription[jjiklhg].sex == 1){
                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle++
                                    }else{
                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale++
                                    }
                                }
                            }
                        }
                    }
                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale+' male qui ont besoin enclos foudroyeur')
                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle+' femelle qui ont besoin enclos foudroyeur')

                    //calcul quelle sex on va mettre dans l'enclos
                    let totalMale = parseInt(nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale.toString())+parseInt(nombreMontureDansEnclosMale.toString())
                    let totalFemele = parseInt(nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle.toString())+parseInt(nombreMontureDansEnclosFemelle.toString())
                    let boolSex = 1
                    if(totalMale>totalFemele){
                        boolSex = 0
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale
                    }else{
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle
                    }

                    //enclos on vire le "mauvais" sex qui est deja dans l'enclos
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        if(e.paddockedMountsDescription[jjiklhg].sex != boolSex){
                            nombreMontureDansEnclos--
                            Logger.info('mauvais sex:'+e.paddockedMountsDescription[jjiklhg].sex+', nouveau sex:'+boolSex)
                            let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                            e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                            e.paddockedMountsDescription.splice(jjiklhg,1)
                        }else{
                            Logger.info('sex monture OK:'+e.paddockedMountsDescription[jjiklhg].sex+', nouveau sex:'+boolSex)
                        }
                    }

                    //enclos
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        //on remette dans etable si l'endurance est "bien"
                        if(e.paddockedMountsDescription[jjiklhg].stamina == 10000){
                            nombreMontureDansEnclos--
                            Logger.info('stamina ok, on remet monture dans etable')
                            let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                            e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                            e.paddockedMountsDescription.splice(jjiklhg,1)
                        }else{
                            //on vérifie si il faut faire de la place pour optimisé utilisation fatigue
                            if(nombreMontureDansEtableQuiOntBesoinDallerDansLenclos>5-nombreMontureDansEnclos
                                && e.paddockedMountsDescription[jjiklhg].boostLimiter >= 240){
                                Logger.info('on optimise la fatique :'+nombreMontureDansEtableQuiOntBesoinDallerDansLenclos+'/'+(5-nombreMontureDansEnclos))
                                nombreMontureDansEnclos--
                                let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                                e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                                e.paddockedMountsDescription.splice(jjiklhg,1)
                            }
                        }
                    }

                    //etable
                    for (let jjiklhg = 0; jjiklhg < e.stabledMountsDescription.length; jjiklhg++) {
                        if(nombreMontureDansEnclos<5){
                            //Logger.info('nombreMontureDansEnclos:'+nombreMontureDansEnclos)
                            if(e.stabledMountsDescription[jjiklhg].stamina<10000){
                                //que la serénité est inférieur 0
                                if(e.stabledMountsDescription[jjiklhg].serenity < 0){
                                    //si la fatique est inférieur a 240
                                    if(e.stabledMountsDescription[jjiklhg].boostLimiter < 240){
                                        if(e.stabledMountsDescription[jjiklhg].sex == boolSex){
                                            nombreMontureDansEnclos++
                                            //on déplace monture etable -> enclos
                                            //Logger.info('on ajoute dd')
                                            let retourMove = await this.moveDD(e.stabledMountsDescription[jjiklhg].id,6,e.stabledMountsDescription[jjiklhg].name)
                                            e.paddockedMountsDescription.push(e.stabledMountsDescription[jjiklhg])
                                            e.stabledMountsDescription.splice(jjiklhg,1)
                                            //Logger.info('on ajoute dd fini')
                                        }else{
                                            Logger.info('pas le bon sex')
                                        }
                                    }else{
                                        Logger.info('fatigué')
                                    }
                                }else{
                                    Logger.info('sérénité supérieur a 0') 
                                }
                            }else{
                                Logger.info('endurance deja maxé') 
                            }
                        }else{
                            Logger.info('deja 5 dd')
                        }
                    }
                    setTimeout(() => {
                        resolve(1)
                    }, this.api.randomIntFromInterval(700,1000))
                }, this.api.randomIntFromInterval(1000,2000))
            })
        })
    }

    private algoDragofesse() {
        return new Promise(async (resolve, reject) => {
            this.once(this.wGame.dofus.connectionManager, 'ExchangeStartOkMountMessage', async (e: any) => {
                setTimeout(async() => {
                    let nombreMontureDansEnclos = e.paddockedMountsDescription.length
                    //en théorie soit l'un soit l'autre, mais humain peut passer par la et tout casser
                    let nombreMontureDansEnclosMale = 0
                    let nombreMontureDansEnclosFemelle = 0
                    //calcul nombreMontureDansEnclosMale/femelle
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        if(e.paddockedMountsDescription[jjiklhg].sex == 0){
                            nombreMontureDansEnclosMale++
                        }else{
                            nombreMontureDansEnclosFemelle++
                        }
                    }

                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = 0
                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale = 0
                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle = 0
                    //calcule de nombreMontureDansEtableQuiOntBesoinDallerDansLenclos
                    for (let jjiklhg = 0; jjiklhg < e.stabledMountsDescription.length; jjiklhg++) {
                        //besoin d'endurance
                        if(e.stabledMountsDescription[jjiklhg].love<10000){
                            //que la serénité est inférieur 0
                            if(e.stabledMountsDescription[jjiklhg].serenity > 0){
                                //si la fatique est inférieur a 240
                                if(e.stabledMountsDescription[jjiklhg].boostLimiter < 240){
                                    if(e.stabledMountsDescription[jjiklhg].sex == 1){
                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle++
                                    }else{
                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale++
                                    }
                                }
                            }
                        }
                    }
                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale+' male qui ont besoin enclos dragofesse')
                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle+' femelle qui ont besoin enclos dragofesse')

                    //calcul quelle sex on va mettre dans l'enclos
                    let totalMale = parseInt(nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale.toString())+parseInt(nombreMontureDansEnclosMale.toString())
                    let totalFemele = parseInt(nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle.toString())+parseInt(nombreMontureDansEnclosFemelle.toString())
                    let boolSex = 1
                    if(totalMale>totalFemele){
                        boolSex = 0
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale
                    }else{
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle
                    }

                    //enclos on vire le "mauvais" sex qui est deja dans l'enclos
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        if(e.paddockedMountsDescription[jjiklhg].sex != boolSex){
                            nombreMontureDansEnclos--
                            Logger.info('mauvais sex:'+e.paddockedMountsDescription[jjiklhg].sex+', nouveau sex:'+boolSex)
                            let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                            e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                            e.paddockedMountsDescription.splice(jjiklhg,1)
                        }else{
                            Logger.info('sex monture OK:'+e.paddockedMountsDescription[jjiklhg].sex+', nouveau sex:'+boolSex)
                        }
                    }

                    //enclos
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        //on remette dans etable si l'endurance est "bien"
                        if(e.paddockedMountsDescription[jjiklhg].love == 10000){
                            nombreMontureDansEnclos--
                            Logger.info('love ok, on remet monture dans etable')
                            let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                            e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                            e.paddockedMountsDescription.splice(jjiklhg,1)
                        }else{
                            //on vérifie si il faut faire de la place pour optimisé utilisation fatigue
                            if(nombreMontureDansEtableQuiOntBesoinDallerDansLenclos>5-nombreMontureDansEnclos
                                && e.paddockedMountsDescription[jjiklhg].boostLimiter >= 240){
                                Logger.info('on optimise la fatique :'+nombreMontureDansEtableQuiOntBesoinDallerDansLenclos+'/'+(5-nombreMontureDansEnclos))
                                nombreMontureDansEnclos--
                                let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                                e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                                e.paddockedMountsDescription.splice(jjiklhg,1)
                            }
                        }
                    }

                    //etable
                    for (let jjiklhg = 0; jjiklhg < e.stabledMountsDescription.length; jjiklhg++) {
                        if(nombreMontureDansEnclos<5){
                            //Logger.info('nombreMontureDansEnclos:'+nombreMontureDansEnclos)
                            if(e.stabledMountsDescription[jjiklhg].love<10000){
                                //que la serénité est inférieur 0
                                if(e.stabledMountsDescription[jjiklhg].serenity > 0){
                                    //si la fatique est inférieur a 240
                                    if(e.stabledMountsDescription[jjiklhg].boostLimiter < 240){
                                        if(e.stabledMountsDescription[jjiklhg].sex == boolSex){
                                            nombreMontureDansEnclos++
                                            //on déplace monture etable -> enclos
                                            //Logger.info('on ajoute dd')
                                            let retourMove = await this.moveDD(e.stabledMountsDescription[jjiklhg].id,6,e.stabledMountsDescription[jjiklhg].name)
                                            e.paddockedMountsDescription.push(e.stabledMountsDescription[jjiklhg])
                                            e.stabledMountsDescription.splice(jjiklhg,1)
                                            //Logger.info('on ajoute dd fini')
                                        }else{
                                            Logger.info('pas le bon sex')
                                        }
                                    }else{
                                        Logger.info('fatigué')
                                    }
                                }else{
                                    Logger.info('sérénité supérieur a 0') 
                                }
                            }else{
                                Logger.info('endurance deja maxé') 
                            }
                        }else{
                            Logger.info('deja 5 dd')
                        }
                    }
                    setTimeout(() => {
                        resolve(1)
                    }, this.api.randomIntFromInterval(700,1000))
                }, this.api.randomIntFromInterval(1000,2000))
            })
        })
    }

    private algoAbreuvoir() {
        return new Promise(async (resolve, reject) => {
            this.once(this.wGame.dofus.connectionManager, 'ExchangeStartOkMountMessage', async (e: any) => {
                setTimeout(async() => {
                    let nombreMontureDansEnclos = e.paddockedMountsDescription.length
                    //en théorie soit l'un soit l'autre, mais humain peut passer par la et tout casser
                    let nombreMontureDansEnclosMale = 0
                    let nombreMontureDansEnclosFemelle = 0
                    //calcul nombreMontureDansEnclosMale/femelle
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        if(e.paddockedMountsDescription[jjiklhg].sex == 0){
                            nombreMontureDansEnclosMale++
                        }else{
                            nombreMontureDansEnclosFemelle++
                        }
                    }

                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = 0
                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale = 0
                    let nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle = 0
                    //calcule de nombreMontureDansEtableQuiOntBesoinDallerDansLenclos
                    for (let jjiklhg = 0; jjiklhg < e.stabledMountsDescription.length; jjiklhg++) {
                        //besoin de maturité
                        if(e.stabledMountsDescription[jjiklhg].maturity<e.stabledMountsDescription[jjiklhg].maturityForAdult){
                            //que la serénité est entre -2000 et 2000
                            if(e.stabledMountsDescription[jjiklhg].serenity > -2000 && e.stabledMountsDescription[jjiklhg].serenity <2000){
                                //si la fatique est inférieur a 240
                                if(e.stabledMountsDescription[jjiklhg].boostLimiter < 240){
                                    if(e.stabledMountsDescription[jjiklhg].sex == 1){
                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle++
                                    }else{
                                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale++
                                    }
                                }
                            }
                        }
                    }
                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale+' male qui ont besoin enclos dragofesse')
                    Logger.info('il y a '+nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle+' femelle qui ont besoin enclos dragofesse')

                    //calcul quelle sex on va mettre dans l'enclos
                    let totalMale = parseInt(nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale.toString())+parseInt(nombreMontureDansEnclosMale.toString())
                    let totalFemele = parseInt(nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle.toString())+parseInt(nombreMontureDansEnclosFemelle.toString())
                    let boolSex = 1
                    if(totalMale>totalFemele){
                        boolSex = 0
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = nombreMontureDansEtableQuiOntBesoinDallerDansLenclosMale
                    }else{
                        nombreMontureDansEtableQuiOntBesoinDallerDansLenclos = nombreMontureDansEtableQuiOntBesoinDallerDansLenclosFemelle
                    }

                    //enclos on vire le "mauvais" sex qui est deja dans l'enclos
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        if(e.paddockedMountsDescription[jjiklhg].sex != boolSex){
                            nombreMontureDansEnclos--
                            Logger.info('mauvais sex:'+e.paddockedMountsDescription[jjiklhg].sex+', nouveau sex:'+boolSex)
                            let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                            e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                            e.paddockedMountsDescription.splice(jjiklhg,1)
                        }else{
                            Logger.info('sex monture OK:'+e.paddockedMountsDescription[jjiklhg].sex+', nouveau sex:'+boolSex)
                        }
                    }

                    //enclos
                    for (let jjiklhg = 0; jjiklhg < e.paddockedMountsDescription.length; jjiklhg++) {
                        //on remette dans etable si maturité est "bien"
                        if(e.paddockedMountsDescription[jjiklhg].maturity == e.stabledMountsDescription[jjiklhg].maturityForAdult){
                            nombreMontureDansEnclos--
                            Logger.info('maturité ok, on remet monture dans etable')
                            let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                            e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                            e.paddockedMountsDescription.splice(jjiklhg,1)
                        }else{
                            //on vérifie si il faut faire de la place pour optimisé utilisation fatigue
                            if(nombreMontureDansEtableQuiOntBesoinDallerDansLenclos>5-nombreMontureDansEnclos
                                && e.paddockedMountsDescription[jjiklhg].boostLimiter >= 240){
                                Logger.info('on optimise la fatique :'+nombreMontureDansEtableQuiOntBesoinDallerDansLenclos+'/'+(5-nombreMontureDansEnclos))
                                nombreMontureDansEnclos--
                                let retourMove = await this.moveDD(e.paddockedMountsDescription[jjiklhg].id,7,e.paddockedMountsDescription[jjiklhg].name)
                                e.stabledMountsDescription.push(e.paddockedMountsDescription[jjiklhg])
                                e.paddockedMountsDescription.splice(jjiklhg,1)
                            }
                        }
                    }

                    //etable
                    for (let jjiklhg = 0; jjiklhg < e.stabledMountsDescription.length; jjiklhg++) {
                        if(nombreMontureDansEnclos<5){
                            //Logger.info('nombreMontureDansEnclos:'+nombreMontureDansEnclos)
                            //besoin de maturité
                            if(e.stabledMountsDescription[jjiklhg].maturity<e.stabledMountsDescription[jjiklhg].maturityForAdult){
                                //que la serénité est entre -2000 et 2000
                                if(e.stabledMountsDescription[jjiklhg].serenity > -2000 && e.stabledMountsDescription[jjiklhg].serenity <2000){
                                    //si la fatique est inférieur a 240
                                    if(e.stabledMountsDescription[jjiklhg].boostLimiter < 240){
                                        if(e.stabledMountsDescription[jjiklhg].sex == boolSex){
                                            nombreMontureDansEnclos++
                                            //on déplace monture etable -> enclos
                                            //Logger.info('on ajoute dd')
                                            let retourMove = await this.moveDD(e.stabledMountsDescription[jjiklhg].id,6,e.stabledMountsDescription[jjiklhg].name)
                                            e.paddockedMountsDescription.push(e.stabledMountsDescription[jjiklhg])
                                            e.stabledMountsDescription.splice(jjiklhg,1)
                                            //Logger.info('on ajoute dd fini')
                                        }else{
                                            Logger.info('pas le bon sex')
                                        }
                                    }else{
                                        Logger.info('fatigué')
                                    }
                                }else{
                                    Logger.info('sérénité pas dans la fourchete') 
                                }
                            }else{
                                Logger.info('maturité deja maxé') 
                            }
                        }else{
                            Logger.info('deja 5 dd')
                        }
                    }
                    setTimeout(() => {
                        resolve(1)
                    }, this.api.randomIntFromInterval(700,1000))
                
                }, this.api.randomIntFromInterval(1000,2000))
            })
        })
    }

    /**
     * moveDD 
     * enclos vers etable : actionType=7
     * etable vers enclos : actionType=6
     */
    private async moveDD(rideId,actionType,name) {
        //enclos vers etable {"call":"sendMessage","data":{"type":"ExchangeHandleMountStableMessage","data":{"actionType":7,"rideId":"4156584"}}}
        //etable vers enclos {"call":"sendMessage","data":{"type":"ExchangeHandleMountStableMessage","data":{"actionType":6,"rideId":"4156584"}}}
        return new Promise(async (resolve, reject) => {
            let idenclos = this.getIdEnclosActuel()
            this.wGame.dofus.sendMessage("ExchangeHandleMountStableMessage", {
                actionType: actionType,
                rideId: rideId
            })
            setTimeout(() => {
                resolve(1)
            }, this.api.randomIntFromInterval(1000,2000))
        })
    }

    private mauvaisSexMaisNonFecondable(monture, enclos){
        if(monture.level<5){
            return true
        }
        if (enclos == 'baffeur' || enclos == 'caresseur') {
            if(monture.stamina<7500 || monture.love<7500){
                return true
            }
        }
        switch (enclos) {
            case 'dragofesse':
                if(monture.stamina<7500){
                    return true
                }
                break;
            case 'foudroyeur':
                if(monture.love<7500){
                    return true
                }
                break;
            default:
                break;
        }
        return false
    }

    private getIdEnclosActuel() {
        let allInteractive = this.wGame.isoEngine._getAllInteractives()
        let interas = this.wGame.isoEngine.mapRenderer.interactiveElements
        for (const elem of allInteractive) {
            if(interas[elem.id] != undefined)
                if(interas[elem.id]._name == 'Enclos'){
                    
                    if(interas[elem.id].enabledSkills.length>0){
                        if(interas[elem.id].enabledSkills[0]._name == 'Accéder'){
                            //on a l'enclos gg a nous
                            let listeEnclosConnu = [417580,438860,78803,417389,417512,79206]
                            for (let frgswdsfwzs = 0; frgswdsfwzs < listeEnclosConnu.length; frgswdsfwzs++) {
                                if(interas[elem.id].elementId == listeEnclosConnu[frgswdsfwzs]){
                                    return interas[elem.id].elementId
                                }
                            }
                        }
                    }
                }
        }
    }

    private checkEnclosOuvert() {
        for (let i = this.wGame.gui.windowsContainer._childrenList.length - 1; i >= 0; i--) {
            let win = this.wGame.gui.windowsContainer._childrenList[i];
            if (win.isVisible()) {
                if(win.openedRoom != undefined){
                    if(win.openedRoom.name == 'Enclos' || win.openedRoom.name == 'Etable' || win.openedRoom.name == 'Certificats'){
                        return true
                    }
                }
                break;
            }
        }
        return false
    }

    public reset() {
        super.reset()
        this.checkSiMort = true
        Logger.info(' - DdGestion deactiver')
    }
}