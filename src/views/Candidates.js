import { DB_ACCESS } from '../utils/DBControl/DBAccess.js';
import { hide, show, changeDisplay } from '../utils/common.js'

export class Candidates{
    #model;
    #fieldName = 'name';
    #listView;
    #viewId;
    #candidatesPanel;
    #inputFields = new Array();
    #openedPanelId = null;

    constructor(model) {
        this.#model = model;
        this.#viewId = `${model.name}Candidates`;
    }

    static async createCandidates(model) {
        var candidates = new this(model);
        await candidates.#createListView();
        return candidates;
    }

    async #createListView() {
        this.#listView = $(`<div id="${this.#viewId}" class="display_lock"></div>`);
        this.#listView.on('click', {candidates:this}, this.closeListView);
        hide(this.#listView);
        this.#candidatesPanel = $(`<div class="candidatePanel"></div>`);
        this.#candidatesPanel.append(`<div class="door_bar"></div>`);
        hide(this.#candidatesPanel);
        var checkedUniqueList = new Array();
        (await (this.#model).selectAll()).forEach(record => {
            var candidateValue = record[this.#fieldName].value;
            if (!checkedUniqueList.includes(candidateValue)) {
                checkedUniqueList.push(candidateValue);
                var candidate = $(`<div class="label">${candidateValue}</div>`);
                var eventParam = {
                    candidates: this,
                    selectedValue: candidateValue,
                }
                candidate.on('click', eventParam, this.clickCandidate);
                this.#candidatesPanel.append(candidate);
            }
        });
        this.#listView.append(this.#candidatesPanel);
    }

    get viewId() { return this.#viewId; }
    get listView() { return this.#listView; }
    get panel() { return this.#candidatesPanel; }
    get openedPanelId() { return this.#openedPanelId; }
    set openedPanelId(_val) { this.#openedPanelId = _val; }
    get insertedValue() { return this.#inputFields[this.#openedPanelId].val; }
    set insertedValue(_val) { this.#inputFields[this.#openedPanelId].val=_val; }

    clickCandidate(event) {
        var candidates = event.data.candidates;
        var selectedValue = event.data.selectedValue;
        candidates.insertedValue = selectedValue;
    }

    closeListView(event) {
        var candidates = event.data.candidates;
        hide(candidates.panel, true, true, () => {
            hide(candidates.listView);
        });
        candidates.openedPanelId = null;
    }

    openListView(event) {
        var candidates = event.data.candidates;
        show(candidates.listView);
        show(candidates.panel, true, true);
        candidates.openedPanelId = event.data.openedPanelId;
    }
    
    createIcon(inputField) {
        // 各所で共通利用するDOMについては都度生成が必要
        var icon = $(`<div class="triangle"></div>`);
        var eventParam = {
            candidates: this,
            openedPanelId: this.#inputFields.length
        }
        icon.on('click', eventParam, this.openListView);
        this.#inputFields.push(inputField);
        return icon;
    }
}