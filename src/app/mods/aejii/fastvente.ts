import { Mod } from "../mod"
import {SettingsService} from "@services/settings.service"
import { TranslateService } from "@ngx-translate/core"
import { API } from ".."

export class FastVente extends Mod{

    public checkSiMort:boolean
    private api:API

    private windowManager
    private touchended
    private Debug
    private quantities = [1, 10, 100];

    private evOnTradeClose
    private evOnTradeOpen
    private evTradeOpenStd

    startMod(): void {
        this.checkSiMort = false
    }

    constructor(wGame: any,settings: SettingsService,translate: TranslateService, api:API){
        super(wGame, settings, translate);
        this.api = api
        this.Debug = true
        this.windowManager = this.api.mover.finder.getSingletonObjectWithKey("getWindow")[0]
        this.addMinusOneKamaSellingButton();
        this.addLongTapEventOnSellButton();
    }

    log(msg) {
        if (this.Debug) {
          console.log(msg);
        }
    }

    private addMinusOneKamaSellingButton() {
        const tradingWindow = this.sellingWindow();
        const DTButton = this.api.mover.finder.singleton("DofusButton");
    
        let sellTimeout;
        //Used for long tap only
        const proceedToSell = () => {
          try {
            //Prevent infinit loop, when the concurrency threading occure during clearTimeout operation
            if (this.touchended) {
              this.touchended = false;
              return;
            }
            const qty = this.itemToSellQuantity();
            const uid = this.sellingSettingsWindow().item.objectUID;
            if (!qty || !uid) return;
    
            this.wGame.dofus.connectionManager.once(
              'ExchangeBidHouseItemAddOkMessage',
              (response) => {
                const soldQty = response.itemInfo.quantity;
                const newQty = this.itemToSellQuantity() - soldQty;
        
                if (this.currentSellingQuantity() > 1)
                  while (newQty < this.currentSellingQuantity()) this.changeQuantity(-1);
        
                sellTimeout = setTimeout(() => proceedToSell(), 300);
            });
    
            this.sellItem(
              this.sellingSettingsWindow().item.objectUID, 
              this.currentSellingQuantity(), 
              this.currentItemPrice() === 1 ? 1 : this.currentItemPrice() - 1);
          } catch (ex) {
            console.error(ex);
          }
        };
    
        const minusOneKamaButton = new DTButton({
          className: ['greenButton', 'mirage-minus-one-kama'],
          text: '-1 K',
          tooltip: `Met l'objet en vente au même prix que la quantité sélectionnée -1 k`,
        });
    
        minusOneKamaButton.addListener('tap', () => {
          this.sellCurrentItemAtCurrentPriceForCurrentQuantity();
          minusOneKamaButton.disable();
          setTimeout(() => minusOneKamaButton.enable(), 300);
        });
    
        minusOneKamaButton.addListener('longtap', () => {
          this.touchended = false;
          proceedToSell();
          minusOneKamaButton.once('dom.touchend', () => {
            this.touchended = true;
            clearTimeout(sellTimeout);
          });
        });
    
        tradingWindow?.addListener('open', this.evOnTradeOpen = () => {
          const sellBtn = tradingWindow?.bidHouseSellerBox?.sellBtn?.rootElement;
          sellBtn?.after?.(minusOneKamaButton.rootElement);
        });
    
        tradingWindow?.addListener('close', this.evOnTradeClose = () => {
          minusOneKamaButton.rootElement.remove();
        });
    }

    private sellCurrentItemAtCurrentPriceForCurrentQuantity() {
     this.wGame.dofus.connectionManager.on(
       'ExchangeBidHouseItemAddOkMessage',
       (response) => {
         const soldQty = response.itemInfo.quantity;
         const newQty = this.itemToSellQuantity() - soldQty;
 
         if (this.currentSellingQuantity() > 1)
           while (newQty < this.currentSellingQuantity()) this.changeQuantity(-1);
 
         this.wGame.dofus.connectionManager.removeListener('ExchangeBidHouseItemAddOkMessage', listener);
     });
 
     const listener = this.wGame.dofus.connectionManager.eventHandlers.ExchangeBidHouseItemAddOkMessage.slice(-1)[0];
 
     this.sellItem(
       this.sellingSettingsWindow().item.objectUID, 
       this.currentSellingQuantity(), 
       this.currentItemPrice() === 1 ? 1 : this.currentItemPrice() - 1);
    }

    private sellItem(objectUID, quantity, price) {
        this.wGame.dofus.sendMessage('ExchangeObjectMovePricedMessage', { objectUID, quantity, price });
    }

    private changeQuantity(indexShift) {
        this.sellingSettingsWindow().quantitySelect.setValue(
          this.quantities[
            this.quantities.indexOf(this.currentSellingQuantity()) + indexShift
          ],
        );
        this.sellingSettingsWindow().quantitySelect.emit(
          'change',
          this.quantities[
            this.quantities.indexOf(this.currentSellingQuantity()) + indexShift
          ],
        );
    }

    private addLongTapEventOnSellButton() {
        const tradingWindow = this.sellingWindow();
    
        let sellTimeout;
        const proceedToSell = () => {
          try {
            //Prevent infinit loop, when the concurrency threading occure during clearTimeout operation
            if (this.touchended) {
              this.touchended = false;
              return;
            }
            const price = this.currentItemPriceLotSettle();
            const qty = this.currentSellingQuantity();
            const uid = this.sellingSettingsWindow().item.objectUID;
            this.log("Try sell item " + uid + ", qty: " + qty + ", price: " + price);
            if (!price || !qty || !uid) return;
      
            this.wGame.dofus.connectionManager?.once(
              'ExchangeBidHouseItemAddOkMessage',
              () => (sellTimeout = setTimeout(() => proceedToSell(), 300))
            );
      
            this.wGame.dofus?.sendMessage('ExchangeObjectMovePricedMessage', {
              objectUID: uid,
              quantity: qty,
              price: price,
            });
          } catch (ex) {
            console.error(ex);
          }
        };
    
        tradingWindow.on('open', this.evTradeOpenStd = () => {
          const sellBtn = this.sellingSettingsWindow().sellBtn;
          if(sellBtn != undefined){
              sellBtn.addListener('longtap', () => {
                this.touchended = false;
                proceedToSell();
                sellBtn.once('dom.touchend', () => {
                  this.touchended = true;
                  clearTimeout(sellTimeout);
                });
              });
    
            const listener = sellBtn?._events?.longtap?.slice?.(-1)?.[0] || sellBtn?._events?.longtap;
            tradingWindow.once('close', () => sellBtn?.removeListener('longtap', listener));
          }
        });
    }

    private currentItemPriceLotSettle() {
        return this.sellingSettingsWindow().price;
      }
    
    private currentItemPrice() {
        const price = this.sellingSettingsWindow().minPricesCache?.[
          this.sellingSettingsWindow().item.objectGID
        ]?.[this.quantities.indexOf(this.currentSellingQuantity())];
    
        return price ?? 1;
      }
    
    private sellingWindow() {
        return this.windowManager.getWindow('tradeItem');
    }
    
    private currentSellingQuantity() {
        const quantity = this.sellingSettingsWindow().quantity;
        return quantity ?? 0;
    }
    
    private itemToSellQuantity() {
        return this.sellingSettingsWindow().item.quantity ?? 0;
    }
    
      /**
       * Window with the price, quantity, fees, etc
       */
    private sellingSettingsWindow() {
        return this.sellingWindow().bidHouseSellerBox;
    }

    public reset() {
        super.reset()
        const tradingWindow = this.sellingWindow();
        if (this.evOnTradeOpen) tradingWindow.removeListener('open', this.evOnTradeOpen);
        if (this.evOnTradeClose) tradingWindow.removeListener('close', this.evOnTradeClose);
        if (this.evTradeOpenStd) tradingWindow.removeListener('open', this.evTradeOpenStd);
        this.log("Disabled");
        this.checkSiMort = true
    }
}
