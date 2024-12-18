
import { today, hide, show, changeDisplay } from './../utils/common.js'
import { VALID_ERR } from './resource.js'

const FIELD_TYPE = Object.freeze({
    DATE: 1,
    BUTTON: 2,
    OTHER: 99,
});

export class InputField {
    _fieldType = FIELD_TYPE.OTHER;
    #inputDom;
    #fieldName;
    #required;
    #requiredErr = $(`<span class="error">${VALID_ERR.REQUIRED}</span>`);
    #candidatesView;

    constructor(name, type, fieldName='', required=false, classes=[], candidatesView=null) {
        this._inputDom = $(`<input name="${name}" type="${type}" class="${classes.join(' ')}">`);
        this._fieldName = fieldName;
        this.#required = required;
        this.#candidatesView = candidatesView;
    }

    get val() { return this._inputDom.val(); }
    set val(_val) { this._inputDom.val(_val); }
    get name() { return this._inputDom.attr('name'); }
    get isChecked() { return this._inputDom.prop('checked'); }
    get inputDom() { return this._inputDom; }
    get dom() {
        var dom = $('<div class="label field"></div>');
        var labelDom = $(`<div></div>`);
        $(labelDom).append(`<span>${this._fieldName}</span>`);
        $(labelDom).append(this.#requiredErr);
        $(dom).append(labelDom);
        $(this.#requiredErr).hide();
        var inputAreaDom = $(`<div class="inputArea"></div>`);
        $(inputAreaDom).append(this._inputDom);
        if (this.#candidatesView != null) {
            $(inputAreaDom).append(this.#candidatesView.createIcon(this));
        }
        $(dom).append(inputAreaDom);
        return dom;
    }

    setChecked() { this._inputDom.prop('checked', true); }
    
    isValid() {
        var result = true;
        $(this.#requiredErr).hide();
        if (this.#required && this.val == '') {
            console.log(`${this.name} NG`);
            result = false;
            $(this.#requiredErr).show();
        }
        return result;
    }

    setEvent(eventName, params, eventFunc) {
        this._inputDom.on(eventName, params, eventFunc);
    }
}

export class Button extends InputField {
    _fieldType = FIELD_TYPE.BUTTON;
    constructor(name, fieldName='', classes=[]) {
        super(name, 'button', fieldName, false, classes);
    }

    get dom() {
        var dom = $('<div class="label field"></div>');
        this.val = this._fieldName;
        $(dom).append(this._inputDom);
        return dom;
    }
}

export class UpdateButton extends Button{
    constructor(name, fieldName = '', classes = []) {
        classes.push('update');
        super(name, fieldName, classes);
    }
}

export class DestroyButton extends Button{
    constructor(name, fieldName = '', classes = []) {
        classes.push('destroy');
        super(name, fieldName, classes);
    }
}

export class DateField extends InputField{
    _fieldType = FIELD_TYPE.DATE;
    constructor(name, fieldName='', required = false) {
        super(name, 'date', fieldName, required);
        this.val = today();
    }
}

export class ButtonList{
    #dom;
    constructor(buttons) {
        if (!buttons.every(x => x instanceof Button))
            throw new Error('ButtonList require Buttons.')
        this.#dom = $(`<div class="btns"></div>`);
        buttons.forEach(button => {
            this.#dom.append(button.dom);
        });
    }

    get dom() { return this.#dom; }
    hideButtonList() { hide(this.#dom); }
    showButtonList() { show(this.#dom); }
    changeDisplayButtonList() { changeDisplay(this.#dom,true,true); }
}

export class RadioInput{
    #dom;
    #name;
    #radioBoxes = new Array();

    constructor(name, choices) {
        this.#name = name;
        this.#dom = $(`<div class="label field"></div>`);
        choices.forEach(choice => {
            var labelDom = $(`<label></label>`);
            var radioBox = new InputField(name, 'radio');
            radioBox.val = choice.val;
            labelDom.append(radioBox.inputDom);
            labelDom.append($(`<span>${choice.label}</span>`));
            this.#dom.append(labelDom);
            this.#radioBoxes.push(radioBox);
        });
    }

    get dom() { return this.#dom; }
    get val() {
        var _val = '';
        this.#radioBoxes.forEach(radioBox => {
            if (radioBox.isChecked)
                _val = radioBox.val;
        });
        return _val;
    }
    set val(_val) {
        this.#radioBoxes.forEach(radioBox => {
            if (radioBox.val == _val) radioBox.setChecked();
        });
    }
    get name() { return this.#name; }
    isValid() { return this.val != ''; }

    setEvent(eventName, params, eventFunc) {
        this.#radioBoxes.forEach(radioBox => {
            radioBox.setEvent(eventName, params, eventFunc);
        });
    }
}