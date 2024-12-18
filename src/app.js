
import { GAMES, APP_MODE } from './utils/enums.js'
import { initializeModels, getAllMatchDatas } from './utils/controler.js'
import { waitReady, isAllTrueForDict, startLoading, endLoading, changeAppMode } from './utils/common.js'
import { MatchInfo } from './views/MatchInfo.js'
import { MatchInfoList } from './views/MatchInfoList.js'
import { Settings } from './views/Settings.js'
import { Candidates } from './views/Candidates.js'
import { RESOURCE } from './views/resource.js'
import { Deck, Tag, } from './utils/models.js';

$('#game_selector').ready(() => {
    var option;
    for (var key in GAMES) {
        option = '<option value="' + key + '">'+GAMES[key]+'</option>';
        $('#game_selector').append(option);
    }
});

$('#mode').ready(() => { 
    $('#mode').change(() => {
        var newMode = $('#mode').val();
        $('.menu').removeClass('selected');
        $(`[data-mode="${newMode}"]`).addClass('selected');
        loadContent($('#game_selector').val(), newMode);
    });
    $('#content').ready(() => {
        // 初期モード設定
        changeAppMode(APP_MODE.NEW);
    });
});

$('#footer').ready(() => {
    const MODES = [
        {'label':RESOURCE.APP_MODE_NEW, 'value':APP_MODE.NEW},
        {'label':RESOURCE.APP_MODE_LIST, 'value':APP_MODE.LIST},
        {'label':RESOURCE.APP_MODE_SETTINGS, 'value':APP_MODE.SETTINGS},
    ]
    MODES.forEach(mode => {
        var menu = $(`<div class="label menu" data-mode="${mode.value}">${mode.label}</div>`);
        menu.on('click', { newMode: mode.value }, (event => {
            changeAppMode(event.data.newMode);
        }));
        $('#footer').append(menu);
    });
});

async function loadContent(game, mode) {
    // 処理中ダイアログ表示
    var content, viewComplates = {};
    startLoading();
    resetContent();
    initializeModels(game).then(() => {
        switch (mode) {
            case APP_MODE.NEW:
                viewComplates[mode] = false;
                loadEditorForm(mode).then(() => {
                    viewComplates[mode] = true;
                });
                break;
            case APP_MODE.LIST:
                viewComplates[mode] = false;
                getAllMatchDatas().then(matchDatas => {
                    content = new MatchInfoList(matchDatas);
                    $('#content').prepend(content.listView);
                    viewComplates[mode] = true;
                }).catch(error => {
                    console.error(error);
                });
                break;
            case APP_MODE.SETTINGS:
                content = new Settings();
                $('#content').prepend(content.view);
            default:
                break;
        }
        waitReady(
            20,
            20,
            (viewComplates) => { return !isAllTrueForDict(viewComplates); },
            viewComplates
        ).then(() => {
            endLoading();
        });
    });
}

async function loadEditorForm( mode) {
    // 新規登録なのでフォームのIDには0を登録
    var content = new MatchInfo(
        mode, '0', ['0', '1', '2'],
        await createTagCandidates(),
        await createDeckCandidates()
    );
    $('#content').prepend(content.editorForm);
}

function resetContent() {
    $('#content').empty();
}

async function createTagCandidates() {
    var tagCandidates = await Candidates.createCandidates(Tag);
    $('#content').append(tagCandidates.listView);
    return tagCandidates;
}

async function createDeckCandidates() {
    var deckCandidates = await Candidates.createCandidates(Deck);
    $('#content').append(deckCandidates.listView);
    return deckCandidates;
}