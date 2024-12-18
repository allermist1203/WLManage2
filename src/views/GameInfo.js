
import { RESOURCE } from './resource.js'
import { InputField, RadioInput } from './Fields.js'
import { WinLose, FirstPlayer } from '../utils/enums.js'
import { hide, show} from '../utils/common.js'
import { registMatchAndGames, deleteMatchAndGames } from '../utils/controler.js'


export class GameInfo{
    #gameId;
    #inputBoxes = new Array();
    #formDiv = null;
    #watchValues;
    #watchValueProp;
    #firstPlayer = FirstPlayer.MYSELF;
    #winLose = WinLose.WIN;
    #myDeckName = '';
    #enemyDeckName = '';
    #listId;
    #deckCandidatesView;

    constructor(gameId,watchValues=null, deckCandidatesView=null) {
        this.#gameId = gameId;
        if (watchValues != null) {
            this.#watchValues = watchValues;
            this.#watchValueProp = new.target.name;
        }
        this.#deckCandidatesView = deckCandidatesView;
    }

    get gameId() { return this.#gameId; }
    get firstPlayer() { return this.#firstPlayer; }
    get winLose() { return this.#winLose; }
    set winLose(val) { this.#winLose=val; }
    get myDeckName() { return this.#myDeckName; }
    get enemyDeckName() { return this.#enemyDeckName; }

    get gameForm() {
        if (this.#formDiv == null) {
            this.createGameInputs();
            this.#formDiv = $(`<div class="formParts"></div>`);
            this.#inputBoxes.forEach(inputBox => {
                this.#formDiv.append(inputBox.dom);
            });
        }
        return this.#formDiv;
    }

    get formVals() {
        var propName;
        var vals = {id:this.#gameId,};
        this.#inputBoxes.forEach(inputBox => {
            propName = inputBox.name.replace(`_${this.#gameId}`, '');
            vals[propName] = inputBox.val;
        });
        return vals;
    }
    #createNameTag(fieldName) {
        return `${fieldName}_${this.#gameId}`
    }
    get #newFirstPlayerInput() {
        var firstPlayerChoices = [
            { val: FirstPlayer.MYSELF, label: RESOURCE.LABEL_FIRST_PLAYER },
            { val: FirstPlayer.ENEMY, label: RESOURCE.LABEL_SECOND_PLAYER },
        ]
        var dom = new RadioInput(this.#createNameTag('firstPlayer'), firstPlayerChoices);
        dom.val = this.#firstPlayer;
        return dom;
    }
    get #newWinLoseInput() {
        var winLoseChoices = [
            { val: WinLose.WIN, label: RESOURCE.LABEL_GAME_WIN },
            { val: WinLose.LOSE, label: RESOURCE.LABEL_GAME_LOSE },
        ]
        var dom = new RadioInput(this.#createNameTag('winLose'), winLoseChoices);
        dom.val = this.#winLose;
        var eventParams = {
            gemeInfo: this,
            winLoseInput: dom,
            watchValues: this.#watchValues,
            watchValueProp: this.#watchValueProp,
        }
        dom.setEvent('change', eventParams, this.winLoseClick);
        return dom;
    }
    get #newMyDeckInput() {
        var dom = new InputField(
            this.#createNameTag('myDeckName'), 'text',
            RESOURCE.LABEL_MY_DECK, true, [],
            this.#deckCandidatesView
        );
        dom.val = this.#myDeckName;
        return dom;
    }
    get #newEnemyDeckInput() {
        var dom = new InputField(
            this.#createNameTag('enemyDeckName'), 'text',
            RESOURCE.LABEL_ENEMY_DECK , true, [],
            this.#deckCandidatesView
        );
        dom.val = this.#enemyDeckName;
        return dom;
    }
    createGameInputs() {
        this.#inputBoxes.push(this.#newFirstPlayerInput);
        this.#inputBoxes.push(this.#newWinLoseInput);
        this.#inputBoxes.push(this.#newMyDeckInput);
        this.#inputBoxes.push(this.#newEnemyDeckInput);
    }

    isHideForm() {
        return $(this.#formDiv).is(":hidden");
    }

    isValidForm() {
        if (this.isHideForm())
            return true;
        var result = true;
        this.#inputBoxes.forEach(inputBox => {
            result &= inputBox.isValid();
        });
        return result;
    }

    hideForm() {
        if (this.#formDiv != null)
            hide(this.#formDiv);
    }

    showForm() {
        if (this.#formDiv != null) 
            show(this.#formDiv);
    }

    winLoseClick(event) {
        event.data.gemeInfo.winLose = event.data.winLoseInput.val;
        var watchValues = event.data.watchValues;
        var watchValueProp = event.data.watchValueProp;
        if (Object.keys(watchValues).includes(watchValueProp))
            watchValues[watchValueProp]++;
        else
            watchValues[watchValueProp] = 0;
    }

    get #myDeckView() {
        var dom = $('<div class="deckName"></div>');
        $(dom).append(`<div>${RESOURCE.LABEL_MY_DECK}</div>`);
        $(dom).append(`<div>${this.#myDeckName}</div>`);
        return dom;
    }
    get #enemyDeckView() {
        var dom = $('<div class="deckName"></div>');
        $(dom).append(`<div>${RESOURCE.LABEL_ENEMY_DECK}</div>`);
        $(dom).append(`<div>${this.#enemyDeckName}</div>`);
        return dom;
    }
    get #deckView() {
        var dom = $('<div class="decks sLabel"></div>');
        $(dom).append(this.#myDeckView);
        $(dom).append(this.#enemyDeckView);
        return dom;
    }
    get #firstPlayerView() {
        var text;
        if (this.#firstPlayer == FirstPlayer.MYSELF)
            text = RESOURCE.LABEL_FIRST_PLAYER_SHORT;
        else if (this.#firstPlayer == FirstPlayer.ENEMY)
            text = RESOURCE.LABEL_SECOND_PLAYER_SHORT;
        return $(`<div class="firstPlayer sLabel">${text}</div>`);
    }
    get #winLoseView() {
        var text;
        if (this.#winLose == WinLose.WIN)
            text = RESOURCE.LABEL_GAME_WIN_SHORT;
        else if (this.#winLose == WinLose.LOSE)
            text = RESOURCE.LABEL_GAME_LOSE_SHORT;
        return $(`<div class="winLose sLabel">${text}</div>`);
    }
    get listView() {
        var dom = $('<div class="gameArea"></div>');
        $(dom).append(`<div class="gameNo sLabel">${this.#listId}</div>`);
        $(dom).append(this.#deckView);
        $(dom).append(this.#firstPlayerView);
        $(dom).append(this.#winLoseView);
        return dom;
    }

    setGameInfo(gameData,listId='') {
        this.#listId = listId;
        this.#firstPlayer = gameData.firstPlayer;
        this.#winLose = gameData.winLose;
        this.#myDeckName = gameData.myDeckName;
        this.#enemyDeckName = gameData.enemyDeckName;
    }
}