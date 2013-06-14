var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
var db;
(function () {
    var peopleData = [
        { name: "John Dow", email: "john@company.com" },
        { name: "Don Dow", email: "don@company.com" }
    ];

    function initDb() {
        var request = indexedDB.open("PeopleDB2", 1);
        request.onsuccess = function (evt) {
            db = request.result;
        };

        request.onerror = function (evt) {
            console.log("IndexedDB error: " + evt.target.errorCode);
        };

        request.onupgradeneeded = function (evt) {
            var objectStore = evt.currentTarget.result.createObjectStore(
                     "people2", { keyPath: "id", autoIncrement: true });

            objectStore.createIndex("name", "name", { unique: false });
            objectStore.createIndex("email", "email", { unique: true });

            for (i in peopleData) {
                objectStore.add(peopleData[i]);
            }
        };
    }


    initDb();
})();