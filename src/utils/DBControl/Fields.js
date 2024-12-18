
const FILED_TYPE = Object.freeze({
    Integer: 1,
    String: 2,
});


export class Filed{
    #value = null;
    #isKeyPath;
    #requiredIndex;
    #unique;
    _filedType;
    _autoIncrement = false;

    constructor({isKeyPath = false, requiredIndex = false, unique = false}) {
        if (new.target == Filed) {
            throw new Error('Cannot instantiate an abstract class.');
        } else if (!requiredIndex && unique) {
            throw new Error('If unique is true, requiredIndex must also be true.');
        }
        this.#isKeyPath = isKeyPath;
        this.#requiredIndex = requiredIndex;
        this.#unique = unique;
    }

    get isKeyPath() {
        return this.#isKeyPath;
    }

    get requiredIndex() {
        return this.#requiredIndex;
    }

    get unique() {
        return this.#unique;
    }

    get autoIncrement() {
        return this._autoIncrement;
    }

    get value() {
        return this.#value;
    }

    set value(val) {
        if (this.#value != null && this.#isKeyPath)
            throw new Error("KeyPathValue can't change value.");
        switch (this._filedType) {
            case FILED_TYPE.Integer: {
                if ((val == null) || isNaN(val))
                    throw new Error('value requires Integer.');
                break;
            }
            case FILED_TYPE.String: {
                break;
            }
            default: {
                throw new Error('Require filedType or valid.');
            }
        }
        this.#value = val;
    }

    toString() {
        return this.value;
    }
}

export class IntegerFiled extends Filed{
    _filedType = FILED_TYPE.Integer;
    constructor({isKeyPath = false, requiredIndex = false, unique = false, autoIncrement = false}) {
        if (!isKeyPath && autoIncrement) {
            throw new Error('If autoIncrement is true, isKeyPath must also be true.');
        }
        super({isKeyPath, requiredIndex, unique});
        this._autoIncrement = autoIncrement;
    }
}

export class StringFiled extends Filed{
    _filedType = FILED_TYPE.String;
}