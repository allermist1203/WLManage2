
export async function confirm(msg,callbackFunc) {
    Swal.fire({
        html: msg,
        showCancelButton: true,
        width: '80%',
        allowOutsideClick: false,
        allowEscapeKey: false,
    }).then((result) => {
        if (result.isConfirmed) callbackFunc();
    });
}

export async function dialog(msg, callbackFunc = () => { }) {
    Swal.fire({
        html: msg,
        width: '80%',
        allowOutsideClick: false,
        allowEscapeKey: false,
    }).then((result) => {
        if (result.isConfirmed) callbackFunc();
    });
}

export function dictMax(dict) {
    var val = null;
    Object.keys(dict).forEach(key => {
        if (val == null || val < dict[key])
            val = dict[key];
    });
    return val;
}

export function dictMin(dict) {
    var val = null;
    Object.keys(dict).forEach(key => {
        if (val == null || val > dict[key])
            val = dict[key];
    });
    return val;
}

export function aryMin(ary) {
    if (ary.length == 0) return 0;
    else return ary.reduce((a, b) => { return Math.min(a, b) });
}

export function aryMax( ary) {
    if (ary.length == 0) return 0;
    else return ary.reduce((a, b) => { return Math.max(a, b) });
}

export function watchValue(obj, propertyName, callback, ...callbackArgs) {
    let value = obj[propertyName];
    Object.defineProperty(obj, propertyName, {
        get: () => value,
        set: newValue => {
            value = newValue
            callback(...callbackArgs);
        },
        enumerable: true,
        configurable: true,
    })
}

export function today() {
    return toLocaleDateString(new Date());
}

export function toLocaleDateString(date) {
    var params = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }
    return date.toLocaleDateString("ja-JP", params).replaceAll('/', '-');
}

async function wait(second) {
    return new Promise(resolve => setTimeout(resolve, 1000 * second));
}

export async function waitReady( maxWaitTime, maxWaitLoop, waitCondtionFunc, waitCondtionParam) {
    var waitLoop = 0;
    var waitSecondPerLoop = maxWaitTime / maxWaitLoop;
    while (waitCondtionFunc(waitCondtionParam)) {
        await wait(waitSecondPerLoop);
        console.log(`wait.. ${waitLoop} `,waitCondtionParam);
        if (waitLoop == maxWaitLoop) {
            throw new Error('Exceed wait limit.');
        }
        waitLoop++;
    }
}

export function isAllTrueForDict(dict) {
    return Object.keys(dict).every(key => dict[key]);
}

export function includesDictKeys( dict, searchedKey) {
    return Object.keys(dict).includes(searchedKey);
}

export function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] == value);
}

export function changeAppMode(nextAppMode){
    $('#mode').val(nextAppMode);
    $('#mode').change();
}

export function hide( dom, slide = false, down=false, callbackFunc = () =>{}) {
    if (slide && down) dom.slideDown(callbackFunc());
    else if(slide && !down) dom.slideUp(callbackFunc());
    else dom.hide(callbackFunc());
}

export function show( dom, slide = false, down=false, callbackFunc = () =>{}) {
    if (slide && down) dom.slideDown(callbackFunc());
    else if(slide && !down) dom.slideUp(callbackFunc());
    else dom.show(callbackFunc());
}

export function changeDisplay(dom, otherClose = false, slide = false) {
    if (slide) dom.slideToggle();
    else dom.toggle();
    if (otherClose) {
        $(`.${dom.attr('class')}`).not(dom).slideUp();
    }
}

export function startLoading() {
    show($('#loading'));
}

export function endLoading() {
    hide($('#loading'));
}