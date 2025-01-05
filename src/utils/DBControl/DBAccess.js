async function wait(second) {
    return new Promise(resolve => setTimeout(resolve, 1000 * second));
}

async function waitReady( maxWaitTime, maxWaitLoop, waitCondtionFunc, waitCondtionParam) {
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

class DBAccess{
    static KEY_TABLENAME = 'TABLE_NAME'
    static KEY_KEYPATH = 'KEYPATH'
    static KEY_INDEXES = 'INDEXES'
    #dbName = 'sample'
    #dbVersion = 1;
    #timeout = 5; // [sec]
    #maxWaitLoop = 5;
    #createTables = new Array();
    #operatedTables  = new Array();
    #clearedTables  = new Array();
    #insertDatas = {};
    #updateDatas = {};
    #deleteDatas = {};

    get timeout() { return this.#timeout; }
    get maxWaitLoop() { return this.#maxWaitLoop; }

    get dbName() { return this.#dbName; }
    set dbName(val) { this.#dbName = val; }

    #clear() {
        this.#createTables = new Array();
        this.#operatedTables  = new Array();
        this.#clearedTables  = new Array();
        this.#insertDatas = {};
        this.#deleteDatas = {};
    }

    createTable(tableName, keyPath, indexes) {
        this.#createTables.push({
            [DBAccess.KEY_TABLENAME] : tableName,
            [DBAccess.KEY_KEYPATH] : keyPath,
            [DBAccess.KEY_INDEXES] : indexes,
        });
    }

    #createTable(db) {
        this.#createTables.forEach((item) => {
            var tableName = item[DBAccess.KEY_TABLENAME];
            var indexes = item[DBAccess.KEY_INDEXES];
            // キーパスとobjectStore作成
            var opt = {
                keyPath: item[DBAccess.KEY_KEYPATH],
            }
            var objectStore = db.createObjectStore(tableName, opt);
            // インデックス作成
            for (var key in indexes) {
                console.log( key, indexes[key]);
                objectStore.createIndex(key, key, {unique:indexes[key]});
            };
            objectStore.transaction.oncomplete = (event) => {
                console.log(`Created: ${tableName}`);
            };
            objectStore.transaction.onerror = (event) => {
                throw new Error(`Failed to create ${tableName}.`);
            }
        });
    }

    insertData(tableName, record) {
        if (!Object.keys(this.#insertDatas).includes(tableName))
            this.#insertDatas[tableName] = new Array();
        this.#insertDatas[tableName].push(record);
        this.#addOperatedTables(tableName);
    }

    #insertData(transaction) {
        Object.keys(this.#insertDatas).forEach(tableName => {
            console.log(`INSERT START: ${tableName}`)
            var objectStore = transaction.objectStore(tableName);
            this.#insertDatas[tableName].forEach(record => {
                console.log('INSERT: ',record);
                objectStore.add(record);
            });
            console.log(`INSERT FIN: ${tableName}`)
        })
    }

    updateData(tableName, keyPath, keyValue, record) {
        if (!Object.keys(this.#updateDatas).includes(tableName)) {
            this.#updateDatas[tableName] = {
                'keyPath': keyPath,
                'records': {},
            };
        }
        this.#updateDatas[tableName]['records'][keyValue] = record;
        this.#addOperatedTables(tableName);
    }

    async #updateData(transaction) {
        Object.keys(this.#updateDatas).forEach(tableName => {
            console.log(`UPDATE START: ${tableName}`)
            var updateDatas = this.#updateDatas[tableName];
            var keyPath = updateDatas['keyPath'];
            var records = updateDatas['records']
            var recordKeys = Object.keys(records);
            var objectStore = transaction.objectStore(tableName);
            objectStore.openCursor().onsuccess = (event) => {
                var cursor = event.target.result;
                if (cursor) {
                    var keyValue = String(cursor.value[keyPath])
                    if (recordKeys.includes(keyValue)) {
                        Object.keys(records[keyValue]).forEach(fieldName => {
                            cursor.value[fieldName] = records[keyValue][fieldName];
                        });
                        console.log('UPDATE: ', cursor.value);
                        cursor.update(cursor.value);
                    }
                    cursor.continue();
                }
            };
            console.log(`UPDATE FIN: ${tableName}`)
        });
    }

    deleteData(tableName, deleteKey) {
        if (!Object.keys(this.#deleteDatas).includes(tableName))
            this.#deleteDatas[tableName] = new Array();
        this.#deleteDatas[tableName].push(deleteKey);
        this.#addOperatedTables(tableName);
    }

    #deleteData(transaction) {
        Object.keys(this.#deleteDatas).forEach(tableName => {
            console.log(`DELETE START: ${tableName}`)
            var objectStore = transaction.objectStore(tableName);
            this.#deleteDatas[tableName].forEach(deleteKey => {
                console.log('DELETE: ',deleteKey);
                objectStore.delete(deleteKey);
            });
            console.log(`DELETE FIN: ${tableName}`)
        });
    }

    #addOperatedTables(tableName) {
        if (!this.#operatedTables.includes(tableName))
            this.#operatedTables.push(tableName);
    }

    clearTable(tableName) {
        if (!this.#clearedTables.includes(tableName))
            this.#clearedTables.push(tableName);
        this.#addOperatedTables(tableName);
    }

    #clearTable(transaction) {
        this.#clearedTables.forEach(tableName => {
            console.log(`CLEAR START: ${tableName}`)
            transaction.objectStore(tableName).clear();
            console.log(`CLEAR FIN: ${tableName}`)
        });
    }

    async commit() {
        var complateFlag = {
            'upgrade': true,
            'request': false,
        };
        var connection = window.indexedDB.open(this.#dbName, this.#dbVersion);
        connection.onerror = (event) => {
            throw new Error(`Failed to connect ${DBAccess.dbName}.`);
        };
        connection.onupgradeneeded = (event) => { 
            complateFlag['upgrade'] = false;
            this.#createTable(event.target.result);
            complateFlag['upgrade'] = true;
        }
        connection.onsuccess = (event) => {
            if (this.#operatedTables.length > 0) {
                var transaction = event.target.result.transaction(
                    this.#operatedTables,
                    "readwrite"
                );
                this.#clearTable(transaction);
                this.#deleteData(transaction);
                this.#updateData(transaction);
                this.#insertData(transaction);
                transaction.oncomplete = (event) => {
                    complateFlag['request'] = true;
                };
                transaction.onerror = (event) => {
                    complateFlag['request'] = true;
                    console.error(event);
                    throw new Error('DB Access Error.');
                }
            } else {
                complateFlag['request'] = true;
            }
        }
        var waitCondtionFunc = (complateFlag) => {
            return !complateFlag['upgrade'] || !complateFlag['request'];
        }
        await this.waitReady(waitCondtionFunc, complateFlag);
        this.#clear();
    }

    async getDatas(tableName, filterFunc = (record) => {return true}, orderFunc = null) {
        var request, cursor;
        var results = new Array();
        var complateFlag = {'request': false,};
        var connection = window.indexedDB.open(this.#dbName, this.#dbVersion);
        connection.onerror = (event) => {
            throw new Error(`Failed to connect ${DBAccess.dbName}.`);
        };
        connection.onsuccess = (event) => {
            console.log(`SELECT: ${tableName}`);
            request =
                (event.target.result)
                    .transaction(tableName, 'readonly')
                    .objectStore(tableName)
                    .openCursor();
            request.onsuccess = async (event) => {
                cursor = event.target.result;
                if (cursor) {
                    if (filterFunc(cursor.value)) {
                        results.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    // 最後の結果まで読み切ったら実行される
                    complateFlag['request'] = true;
                }
            };
        }
        var waitCondtionFunc = (complateFlag) => {
            return !complateFlag['request'];
        }
        await this.waitReady(waitCondtionFunc, complateFlag);
        if(Object.keys(this.#insertDatas).includes(tableName))
            this.#insertDatas[tableName].forEach(record => {
                if (filterFunc(record))
                    results.push(record);
            });
        if (orderFunc != null)
            results.sort(orderFunc)
        return results;
    }

    async waitReady(waitCondtionFunc, complateFlag) {
        await waitReady(
            this.#timeout,
            this.#maxWaitLoop,
            waitCondtionFunc,
            complateFlag
        );
    }
}


export const DB_ACCESS = new DBAccess();
