import { Model, USE_MODELS } from './DBControl/Model.js';
import { IntegerFiled, StringFiled } from './DBControl/Fields.js';

export class Match extends Model{
    id = new IntegerFiled({ isKeyPath: true, autoIncrement: true });
    date = new StringFiled({ requiredIndex:true, });
    tagId = new IntegerFiled({requiredIndex:true,});
    matchType = new IntegerFiled({requiredIndex:true,});
    note = new StringFiled({});
}

export class Game extends Model{
    id = new IntegerFiled({ isKeyPath: true, autoIncrement: true });
    matchId = new IntegerFiled({requiredIndex:true,});
    firstPlayer = new StringFiled({});
    winLose = new IntegerFiled({requiredIndex:true,});
    myDeckId = new IntegerFiled({requiredIndex:true,});
    enemyDeckId = new IntegerFiled({requiredIndex:true,});
}

export class Deck extends Model{
    id = new IntegerFiled({ isKeyPath: true, autoIncrement: true });
    name = new StringFiled({requiredIndex:true,});
}

export class Tag extends Model{
    id = new IntegerFiled({ isKeyPath: true, autoIncrement: true });
    name = new StringFiled({requiredIndex:true,});
}

USE_MODELS.useModels = [
    Match,
    Game,
    Deck,
    Tag,
]
