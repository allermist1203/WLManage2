
import { DB_ACCESS } from './DBControl/DBAccess.js';
import { USE_MODELS } from './DBControl/Model.js';
import { Match, Game, Deck, Tag, } from './models.js';
import { waitReady, isAllTrueForDict } from './common.js';

export async function initializeModels(gameTitle) {
    DB_ACCESS.dbName = gameTitle;
    await USE_MODELS.createTables();
}

export async function registMatchAndGames(matchInfo, gameInfos) {
    // 既存のGame削除（ゲーム数の増減があるのでゲーム情報は一度リセットする）
    var gameIds = gameInfos.map(x => { return x['id']; });
    (await Game.select(
        record => { return gameIds.includes(record.id); }
    )).forEach( record => { record.delete(); });
    var matchId = await registMatch(matchInfo);
    for await (var gameInfo of gameInfos) {
        await registGame(matchId,gameInfo);
    }
    await DB_ACCESS.commit();
}

async function registMatch({ id = '', date = '', tag = '', matchType = '', note = '' }) {
    console.log('registMatch', id, date, tag, matchType, note);
    var match = await Match.selectOne((record) => { return record.matchId == id; });
    if (match == null) match = new Match();
    match.date.value = date;
    match.tagId.value = await getOrCreateTagId(tag);
    match.matchType.value = matchType;
    match.note.value = note;
    match.save();
    return match.id.value;
}

async function registGame(matchId,{ firstPlayer = '', winLose = '', myDeckName = '', enemyDeckName = ''}) {
    console.log(matchId, firstPlayer, winLose, myDeckName, enemyDeckName);
    var game = new Game();
    game.matchId.value = matchId;
    game.firstPlayer.value = firstPlayer;
    game.winLose.value = winLose;
    game.myDeckId.value = await getOrCreateDeckId(myDeckName);
    game.enemyDeckId.value = await getOrCreateDeckId(enemyDeckName);
    game.save();
    return game.id.value;
}

async function getOrCreateTagId( tagName) {
    var tag = await Tag.selectOne((record) => { return record.name == tagName; })
    if (tag == null) {
        tag = new Tag();
        tag.name.value = tagName;
        tag.save();
    }
    return tag.id.value;
}

async function getOrCreateDeckId( deckName) {
    var deck = await Deck.selectOne((record) => { return record.name == deckName; })
    if (deck == null) {
        deck = new Deck();
        deck.name.value = deckName;
        deck.save();
    }
    return deck.id.value;
}

export async function getAllMatchDatas() {
    var selectTargets = [Match, Game, Deck, Tag,];
    var selectResults = {};
    var complateFlags = {};
    selectTargets.forEach(selectTarget => {
        complateFlags[selectTarget.name] = false;
    });
    // 時間短縮のため並列でデータ取得
    selectTargets.forEach(selectTarget => {
        var prop = selectTarget.name;
        selectTarget.selectAll().then(records => {
            selectResults[prop] = records;
            complateFlags[prop] = true;
        });
    });
    await waitReady(
        DB_ACCESS.timeout * selectTargets.length,
        DB_ACCESS.maxWaitLoop * selectTargets.length,
        (complateFlags) => { return !isAllTrueForDict(complateFlags); },
        complateFlags
    );
    var decks = selectResults[Deck.name];
    // データ結合処理
    var matchDatas = new Array();
    selectResults[Match.name].forEach(match => {
        matchDatas.push({
            id: match.id.value,
            date: match.date.value,
            tag: selectResults[Tag.name]
                .find(x => x.id.value == match.tagId.value)
                .name.value,
            matchType: match.matchType.value,
            note: match.note.value,
            games: selectResults[Game.name]
                .filter(game => game.matchId.value == match.id.value)
                .map(game => {
                    return {
                        id: game.id.value,
                        firstPlayer: game.firstPlayer.value,
                        winLose: game.winLose.value,
                        myDeckName: decks
                            .find(x => x.id.value == game.myDeckId.value)
                            .name.value,
                        enemyDeckName: decks
                            .find(x => x.id.value == game.enemyDeckId.value)
                            .name.value,
                    };
                }),
        });
    });
    return matchDatas;
}

async function getMatchAndGames(matchId) {
    return {
        match: await Match.selectOne(record => { return record.id == matchId }),
        games: await Game.select(record => { return record.matchId == matchId }),
    };
}

export async function deleteMatchAndGames(matchId) {
    var datas = await getMatchAndGames(matchId);
    datas.match.delete();
    datas.games.forEach(game => {
        game.delete();
    });
    await DB_ACCESS.commit();
}