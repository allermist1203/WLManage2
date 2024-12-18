import { MatchInfo } from './MatchInfo.js';
import { includesDictKeys, getKeyByValue } from './../utils/common.js';
import { MatchType, } from './../utils/enums.js'

export class MatchInfoList {
    static #matchInfoArea = 'list'
    #matchInfoList = {};

    constructor(matchDatas) {
        matchDatas.forEach(matchData => {
            var matchTitle = this.#createMatchTitle(matchData);
            if (!includesDictKeys(this.#matchInfoList, matchTitle))
                this.#matchInfoList[matchTitle] = new Array();
            var matchInfo = MatchInfo.createMatchInfo(
                matchData,
                MatchInfoList.#matchInfoArea,
                String(this.#matchInfoList[matchTitle].length + 1)
            )
            this.#matchInfoList[matchTitle].push(matchInfo);
        });
    }

    #createMatchTitle(matchData) {
        var matchTypeName = getKeyByValue(MatchType, matchData.matchType);
        return `${matchData.date} ${matchTypeName} ${matchData.tag}`;
    }

    get listView() {
        var dom = $(`<div></div>`);
        Object.keys(this.#matchInfoList).forEach(matchTitle => {
            dom.append(`<div class="matchTitle sLabel">${matchTitle}</div>`);
            this.#matchInfoList[matchTitle].reverse().forEach(matchInfo => {
                dom.append(matchInfo.listView);
            });
        });
        return dom;
    }
}