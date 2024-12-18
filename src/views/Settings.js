import { RESOURCE, MESSAGE } from './resource.js'
import { UpdateButton, DestroyButton, ButtonList } from './Fields.js'
import { USE_MODELS } from '../utils/DBControl/Model.js';
import { DB_ACCESS } from '../utils/DBControl/DBAccess.js';
import { dialog, confirm, startLoading, endLoading } from './../utils/common.js'

export class Settings{

    backupBtnClick(event) {
        confirm(MESSAGE.OUTPUT_COMFIRM, () => {
            startLoading();
            USE_MODELS.export().then(datas => {
                jsonDownload(datas, `${DB_ACCESS.dbName}.json`);
                endLoading();
            }).catch(error => {
                console.error(error);
                endLoading();
                dialog(MESSAGE.DEAL_NG);
            });
        });
    }

    restoreBtnClick(event) {
        confirm(MESSAGE.RESTORE_COMFIRM, () => {
            jsonUpload(jsonData => {
                startLoading();
                USE_MODELS.restore(jsonData).then(() => {
                    endLoading();
                    dialog(MESSAGE.DEAL_OK);
                }).catch(error => {
                    console.error(error);
                    endLoading();
                    dialog(MESSAGE.DEAL_NG);
                });
            });
        });
    }

    get #backupButton() {
        var dom = new UpdateButton('backup', RESOURCE.BTN_RESTORE)
        dom.setEvent('click', {}, this.backupBtnClick);
        return dom;
    }
    get #restoreButton() {
        var dom = new DestroyButton('resotore', RESOURCE.BTN_BACKUP)
        dom.setEvent('click', {}, this.restoreBtnClick);
        return dom;
    }
    get #backupRestore() {
        var buttonList = new ButtonList([this.#backupButton, this.#restoreButton]);
        buttonList.hideButtonList();
        var dom = $(`<div class="setting_row"></div>`);
        var label = $(`<div class="label">${RESOURCE.LABEL_BACKUP_RESTORE}</div>`);
        label.on('click', { btns: buttonList }, (event) => {
            event.data.btns.changeDisplayButtonList();
        });
        dom.append(label);
        dom.append(buttonList.dom);
        return dom;
    }
    get view() {
        return this.#backupRestore;
    }
}

function jsonDownload(dlData,jsonName) {
    var blob = new Blob(
        [JSON.stringify(dlData, null, '  ')],
        { type: 'application/json' }
    );
    var downLoadLink = document.createElement("a");
    downLoadLink.download = jsonName;
    downLoadLink.href = URL.createObjectURL(blob);
    downLoadLink.click();
    URL.revokeObjectURL(downLoadLink.href);
}

async function jsonUpload( callbackFunc){
    const { value: file } = await Swal.fire({
        width: '80%',
        input: "file",
        inputAttributes: {
            "accept": "application/json",
        }
    });
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            callbackFunc(JSON.parse(e.target.result));
        };
        reader.readAsText(file);
    }
}