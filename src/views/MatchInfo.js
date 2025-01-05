
import { RESOURCE, MESSAGE } from './resource.js'
import { InputField, DateField, RadioInput, UpdateButton, DestroyButton, ButtonList } from './Fields.js'
import { GameInfo } from './GameInfo.js'
import { MatchType, WinLose, APP_MODE } from './../utils/enums.js'
import { dictMax, dictMin, watchValue, changeAppMode, dialog, confirm, startLoading, endLoading, getAppMode, setAppModeDataId, today, toLocaleDateString } from './../utils/common.js'
import { registMatchAndGames, deleteMatchAndGames } from './../utils/controler.js'

export class MatchInfo {
    static maxGames = dictMax(MatchType);
    static minGame = dictMin(MatchType);
    #areaId;
    #matchId;
    #matchInputBoxes = new Array();
    #gameInfos = new Array();
    #watchValues = {}
    #editorForm = null;
    #matchType = MatchType.BO1;
    #date = today();
    #tag = '';
    #note = '';
    #listId;
    #tagCandidatesView;
    #deckCandidatesView;

    constructor(areaId, matchId, gameIds, tagCandidatesView=null, deckCandidatesView=null) {
        console.log('newMatchInfo', areaId, matchId, gameIds);
        this.#areaId = areaId;
        this.#matchId = matchId;
        this.#tagCandidatesView = tagCandidatesView;
        this.#deckCandidatesView = deckCandidatesView;
        // マッチに紐づいているゲームデータの挿入
        gameIds.forEach(gameId => {
            this.#gameInfos.push(new GameInfo(gameId, this.#watchValues, deckCandidatesView));
        });
        watchValue(this.#watchValues, GameInfo.name, this.winLoseChanged, this);
    }

    get editorForm() {
        if (this.#editorForm == null) {
            this.#editorForm = $(`<div></div>`);
            this.#editorForm.append(this.matchForm);
            var nShortageGameInfos = MatchType.BO3 - this.#gameInfos.length;
            //　最大ゲーム数までゲームの入力欄生成
            for (var i = 0; i < nShortageGameInfos; i++){
                this.#gameInfos.push(new GameInfo(
                    `new_${i}`, this.#watchValues,
                    this.#deckCandidatesView
                ));
            }
            this.#gameInfos.forEach(gameInfo => {
                this.#editorForm.append(gameInfo.gameForm);
            });
            var registBtn = new UpdateButton(`${this.#areaId}_Regist`,RESOURCE.BTN_REGIST);
            registBtn.setEvent('click', { editor: this }, this.registBtnClick);
            var btns = $(`<div class="formParts"></div>`);
            btns.append(registBtn.dom);
            this.#editorForm.append(btns);
            // 初期設定後に画面表示切り替え
            this.winLoseChanged(this);
        }
        return this.#editorForm;
    }

    get matchForm() {
        this.createMatchInputs();
        var formDiv = $(`<div class="formParts"></div>`);
        this.#matchInputBoxes.forEach(inputBox => {
            formDiv.append(inputBox.dom);
        });
        return formDiv;
    }

    get matchFormVals() {
        var propName;
        var vals = {id:this.#matchId,};
        this.#matchInputBoxes.forEach(inputBox => {
            propName = inputBox.name.replace(`_${this.#matchId}`, '');
            vals[propName] = inputBox.val;
        });
        return vals;
    }

    get gameFormVals() {
        var vals = new Array();
        this.#gameInfos.forEach(gameInfo => {
            if(!gameInfo.isHideForm())
                vals.push(gameInfo.formVals);
        });
        return vals;
    }

    get matchType() { return this.#matchType; }
    set matchType(val) { this.#matchType=val; }
    get gameInfos() { return this.#gameInfos; }
    get nHalfGames() { return Math.floor(this.#matchType / 2); }
    get gameInfoWatchValue() { return this.#watchValues[GameInfo.name]; }
    set gameInfoWatchValue(val) { this.#watchValues[GameInfo.name] = val; }

    #createNameTag(fieldName) {
        return `${fieldName}_${this.#matchId}`
    }
    get #newDateInput() {
        var dom = new DateField(this.#createNameTag('date'), '', true);
        dom.val = this.#date;
        return dom;
    }
    get #newTagInput() {
        var dom = new InputField(
            this.#createNameTag('tag'), 'text',
            RESOURCE.LABEL_TAG, true, [],
            this.#tagCandidatesView
        );
        dom.val = this.#tag;
        return dom;
    }
    get #newMatchTypeInput() {
        var matchTypeChoices = [
            { val:MatchType.BO1, label:RESOURCE.LABEL_BO1_MATCH },
            { val:MatchType.BO3, label:RESOURCE.LABEL_BO3_MATCH },
        ]
        var dom = new RadioInput(this.#createNameTag('matchType'), matchTypeChoices);
        dom.val = this.#matchType;
        var eventParams = { editor: this, matchTypeInput: dom, }
        dom.setEvent('change', eventParams, this.matchTypeClick);
        return dom;
    }
    get #newNoteInput() {
        var dom = new InputField(
            this.#createNameTag('note'), 'text',
            RESOURCE.LABEL_NOTE , false
        );
        dom.val = this.#note;
        return dom;
    }
    createMatchInputs() {
        this.#matchInputBoxes.push(this.#newMatchTypeInput);
        this.#matchInputBoxes.push(this.#newDateInput);
        this.#matchInputBoxes.push(this.#newTagInput);
        this.#matchInputBoxes.push(this.#newNoteInput);
    }

    isValidForm() {
        var result = true;
        this.#matchInputBoxes.forEach(inputBox => {
            result &= inputBox.isValid();
        });
        this.#gameInfos.forEach(gameForm => {
            result &= gameForm.isValidForm();
        });
        return result;
    }

    gameInfosFullOpen() {
        this.#gameInfos.forEach(gameInfo => {
            gameInfo.showForm();
        });
    }

    gameInfosHide(startIdx, endIdx) {
        for (var i = startIdx; i <= endIdx; i++)
            this.#gameInfos[i].hideForm();
    }

    gameInfosOpenAndHide(hideStartIdx, hideEndIdx) {
        // 全ゲーム情報オープン
        this.gameInfosFullOpen();
        // 不要なゲーム情報のみ隠す
        this.gameInfosHide(hideStartIdx, hideEndIdx);
    }

    registBtnClick(event) {
        var editor = event.data.editor;
        if (editor.isValidForm()) {
            startLoading();
            var matchFormVals = editor.matchFormVals;
            var gameFormVals = editor.gameFormVals;
            var nextAppMode = getAppMode();
            if (nextAppMode == APP_MODE.UPDATE)
                nextAppMode = APP_MODE.LIST;
            registMatchAndGames(matchFormVals, gameFormVals)
                .then(() => {
                    endLoading();
                    dialog(MESSAGE.DEAL_OK, () => {
                        changeAppMode(nextAppMode);
                    });
                }).catch((error) => {
                    console.error(error);
                    endLoading();
                    dialog(MESSAGE.DEAL_NG, () => {
                        changeAppMode(nextAppMode);
                    });
                })
        }
    }

    matchTypeClick(event) {
        var editor = event.data.editor;
        editor.matchType = event.data.matchTypeInput.val;
        console.log('matchTypeClick', editor.matchType);
        editor.winLoseChanged(editor);
    }

    winLoseChanged(editor) {
        var nWin = 0, nLose = 0;
        var hideStartIdx = MatchInfo.maxGames;
        var nHalfGame = editor.nHalfGames;
        for (var i = 0; i < editor.gameInfos.length; i++){
            var gameInfo = editor.gameInfos[i];
            if (gameInfo.winLose == WinLose.WIN) nWin++;
            else if (gameInfo.winLose == WinLose.LOSE) nLose++;
            console.log('winPointChangedLoop', nHalfGame, nWin, nLose, hideStartIdx);
            if (nWin > nHalfGame || nLose > nHalfGame) {
                hideStartIdx = i + 1;
                break;
            }
        }
        console.log('winPointChanged', nHalfGame, nWin, nLose, hideStartIdx);
        editor.gameInfosOpenAndHide(hideStartIdx, MatchInfo.maxGames-1);
    }
    
    setMatchInfo(matchData,listId='') {
        this.#listId = listId;
        this.#matchType = matchData.matchType;
        this.#date = toLocaleDateString(new Date(matchData.date));
        this.#tag = matchData.tag;
        this.#note = matchData.note;
        for (var i = 0; i < this.#gameInfos.length; i++){
            var gameInfo = this.#gameInfos[i];
            var gameData = matchData.games.find(x => x.id === gameInfo.gameId );
            var gameListId;
            if (this.#matchType == MatchType.BO1) gameListId = '-';
            else gameListId = String(i+1);
            gameInfo.setGameInfo(gameData,gameListId);
        }
    }

    static createMatchInfo(matchData,areaMode,listId='', tagCandidatesView=null, deckCandidatesView=null) {
        var areaId = `${areaMode}_${matchData.id}`;
        var gameIds = matchData.games.map(gameInfo => { return gameInfo.id; });
        var matchInfo = new MatchInfo(areaId,matchData.id,gameIds,tagCandidatesView,deckCandidatesView);
        matchInfo.setMatchInfo(matchData,listId);
        return matchInfo;
    }

    get #listBtns() {
        var editBtn = new UpdateButton(`${this.#matchId}_Delete`, RESOURCE.BTN_EDIT);
        editBtn.setEvent('click', { matchId: this.#matchId }, this.editBtnClick);
        var deleteBtn = new DestroyButton(`${this.#matchId}_Delete`, RESOURCE.BTN_DELETE);
        deleteBtn.setEvent('click', { matchId: this.#matchId }, this.deleteBtnClick);
        var buttonList = new ButtonList([editBtn, deleteBtn]);
        buttonList.hideButtonList();
        return buttonList;
    }
    get listView() {
        var matchArea = $(`<div id="${this.#matchId}" class="matchArea"></div>`);
        var matchInfoLabels = $(`<div class="matchInfo"></div>`);
        matchInfoLabels.append(`<div class="matchNo sLabel">${this.#listId}</div>`);
        var gameInfoLabels = $(`<div class="gameInfos"></div>`);
        this.#gameInfos.reverse().forEach(gameInfo => {
            gameInfoLabels.append(gameInfo.listView);
        });
        matchInfoLabels.append(gameInfoLabels);
        matchArea.append(matchInfoLabels);
        var buttonList = this.#listBtns;
        matchArea.append(buttonList.dom);
        matchInfoLabels.on('click', { btns: buttonList }, (event) => {
            event.data.btns.changeDisplayButtonList();
        });
        return matchArea;
    }

    editBtnClick(event) {
        setAppModeDataId(event.data.matchId);
        changeAppMode(APP_MODE.UPDATE);
    }

    deleteBtnClick(event) {
        var callbackFunc = () => {
            startLoading();
            deleteMatchAndGames(event.data.matchId).then(()=>{
                endLoading();
                dialog(MESSAGE.DEAL_OK, () => {
                    changeAppMode(APP_MODE.LIST);
                });
            });
        }
        confirm(MESSAGE.DELETE_COMFIRM, callbackFunc);
    }
}
