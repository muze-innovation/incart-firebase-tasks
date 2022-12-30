"use strict";
function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _asyncToGenerator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _objectSpread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _defineProperty(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _objectSpreadProps(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
var __generator = this && this.__generator || function(thisArg, body) {
    var f, y, t, g, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    };
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
};
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = function(target, all) {
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = function(to, from, except, desc) {
    if (from && typeof from === "object" || typeof from === "function") {
        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
        try {
            var _loop = function() {
                var key = _step.value;
                if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
                    get: function() {
                        return from[key];
                    },
                    enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
                });
            };
            for(var _iterator = __getOwnPropNames(from)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true)_loop();
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally{
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            } finally{
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }
    return to;
};
var __toESM = function(mod, isNodeMode, target) {
    return target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
        value: mod,
        enumerable: true
    }) : target, mod);
};
var __toCommonJS = function(mod) {
    return __copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
};
// src/index.ts
var src_exports = {};
__export(src_exports, {
    BackendFirebaseJob: function() {
        return BackendFirebaseJob;
    },
    BackendFirebaseTask: function() {
        return BackendFirebaseTask;
    },
    assertValidTaskStatus: function() {
        return assertValidTaskStatus;
    },
    helpers: function() {
        return helpers;
    },
    inCartFirebaseTaskPaths: function() {
        return inCartFirebaseTaskPaths;
    }
});
module.exports = __toCommonJS(src_exports);
// src/paths/incart.ts
var rootPath = function(stageName) {
    switch(stageName){
        case "production":
            return [
                "prodzone",
                "prod"
            ];
        case "qa":
            return [
                "safezone",
                "qa"
            ];
        case "alpha":
            return [
                "safezone",
                "alpha"
            ];
        default:
            return [
                "safezone",
                "local"
            ];
    }
};
var inCartFirebaseTaskPaths = function(stageName, storeId) {
    var storePath = _toConsumableArray(rootPath(stageName)).concat([
        "stores",
        storeId
    ]);
    return {
        storePath: function() {
            return storePath.join("/");
        },
        activeJobsCollection: function() {
            return _toConsumableArray(storePath).concat([
                "activeJobs"
            ]).join("/");
        },
        activeJobsDocument: function(jobId) {
            return _toConsumableArray(storePath).concat([
                "activeJobs",
                jobId
            ]).join("/");
        },
        activeJobsMetaDocument: function(jobId, metaKey) {
            return _toConsumableArray(storePath).concat([
                "activeJobs",
                jobId,
                "metas",
                metaKey
            ]).join("/");
        },
        activeJobSubTasksCollection: function(jobId) {
            return _toConsumableArray(storePath).concat([
                "activeJobs",
                jobId,
                "tasks"
            ]).join("/");
        },
        activeJobSubTaskDocument: function(jobId, taskId) {
            return _toConsumableArray(storePath).concat([
                "activeJobs",
                jobId,
                "tasks",
                taskId
            ]).join("/");
        }
    };
};
// src/models/index.ts
var TASK_STATUSES = {
    INITIALIZING: "initializing",
    IN_PROGRESS: "in-progress",
    FINISHED: "finished",
    FINISHED_WITH_ERROR: "finished-with-error",
    ERROR: "error",
    CANCEL_TECH: "technical-cancel",
    CANCEL_USER: "user-cancel"
};
var WHITELIST = new Set(Object.values(TASK_STATUSES));
var assertValidTaskStatus = function(status) {
    if (WHITELIST.has(status)) {
        return true;
    }
    throw new Error('Invalid "status" value of '.concat(status, ". Expected ").concat(_toConsumableArray(Object.values(TASK_STATUSES)).join(", ")));
};
// src/BackendFirebaseJob.ts
var import_firebase_admin = require("firebase-admin");
var import_isEmpty = __toESM(require("lodash/isEmpty"));
var import_reduce = __toESM(require("lodash/reduce"));
var FieldValue = import_firebase_admin.firestore.FieldValue;
var helpers = {
    toFirestoreWorkload: function toFirestoreWorkload(workload, workloadKey) {
        if ((0, import_isEmpty.default)(workload)) {
            return {};
        }
        if (workload["$set"]) {
            return _defineProperty({}, workloadKey, workload["$set"]);
        }
        if (workload["$remove"]) {
            var _FieldValue;
            return _defineProperty({}, workloadKey, (_FieldValue = FieldValue).arrayRemove.apply(_FieldValue, _toConsumableArray(workload["$remove"])));
        }
        if (workload["$add"]) {
            var _FieldValue1;
            return _defineProperty({}, workloadKey, (_FieldValue1 = FieldValue).arrayUnion.apply(_FieldValue1, _toConsumableArray(workload["$add"])));
        }
        throw new Error('Invalid usage of "toFirestoreWorkloads". Invalid workloads object: '.concat(JSON.stringify(workload)));
    },
    toFirestoreWorkloads: function toFirestoreWorkloads(workloads) {
        if ((0, import_isEmpty.default)(workloads)) {
            return {};
        }
        return (0, import_reduce.default)(workloads, function(res, val, key) {
            var computed = helpers.toFirestoreWorkload(val, key);
            return _objectSpread({}, res, computed);
        }, {});
    }
};
var BackendFirebaseTask = /*#__PURE__*/ function() {
    function BackendFirebaseTask(parentJob, absPath, taskId) {
        _classCallCheck(this, BackendFirebaseTask);
        this.parentJob = parentJob;
        this.absPath = absPath;
        this.taskId = taskId;
    }
    _createClass(BackendFirebaseTask, [
        {
            key: "publishSubTask",
            value: function publishSubTask(detail) {
                var _this = this;
                return _asyncToGenerator(function() {
                    return __generator(this, function(_state) {
                        return [
                            2,
                            _this.publishProgress(detail)
                        ];
                    });
                })();
            }
        },
        {
            key: "publishProgress",
            value: function publishProgress(detail) {
                var _this = this;
                return _asyncToGenerator(function() {
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                return [
                                    4,
                                    _this.parentJob.firestore.doc(_this.absPath).update(_objectSpreadProps(_objectSpread({}, detail), {
                                        updatedAt: FieldValue.serverTimestamp()
                                    }))
                                ];
                            case 1:
                                _state.sent();
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "publishSuccess",
            value: function publishSuccess() {
                var _this = this;
                return _asyncToGenerator(function() {
                    return __generator(this, function(_state) {
                        return [
                            2,
                            _this.parentJob.deactivateTask(_this, "success")
                        ];
                    });
                })();
            }
        },
        {
            key: "publishFailed",
            value: function publishFailed(failureReason) {
                var _this = this;
                return _asyncToGenerator(function() {
                    return __generator(this, function(_state) {
                        return [
                            2,
                            _this.parentJob.deactivateTask(_this, "failed", failureReason)
                        ];
                    });
                })();
            }
        }
    ]);
    return BackendFirebaseTask;
}();
var BackendFirebaseJob = /*#__PURE__*/ function() {
    function BackendFirebaseJob1(firestore2, paths, jobId) {
        var workloadMetaKey = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "workloads";
        _classCallCheck(this, BackendFirebaseJob1);
        this.firestore = firestore2;
        this.paths = paths;
        this.jobId = jobId;
        this.workloadMetaKey = workloadMetaKey;
    }
    _createClass(BackendFirebaseJob1, [
        {
            key: "publishProgress",
            value: function publishProgress(detail) {
                var workloads = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
                var _this = this;
                return _asyncToGenerator(function() {
                    var status, _detail_currentProgress, currentProgress, _detail_totalProgress, totalProgress, _detail_message, message, jobId, updateDocPath, computedWorkloadChanges, workloadsPath;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                status = detail.status, _detail_currentProgress = detail.currentProgress, currentProgress = _detail_currentProgress === void 0 ? 0 : _detail_currentProgress, _detail_totalProgress = detail.totalProgress, totalProgress = _detail_totalProgress === void 0 ? 100 : _detail_totalProgress, _detail_message = detail.message, message = _detail_message === void 0 ? "" : _detail_message;
                                jobId = _this.jobId;
                                assertValidTaskStatus(status);
                                updateDocPath = _this.paths.activeJobsDocument(jobId);
                                console.log("Updating job on", updateDocPath);
                                return [
                                    4,
                                    _this.firestore.doc(updateDocPath).update({
                                        jobId: jobId,
                                        status: status,
                                        currentProgress: currentProgress,
                                        totalProgress: totalProgress,
                                        message: message,
                                        updatedAt: FieldValue.serverTimestamp()
                                    })
                                ];
                            case 1:
                                _state.sent();
                                computedWorkloadChanges = helpers.toFirestoreWorkloads(workloads);
                                if (!!(0, import_isEmpty.default)(computedWorkloadChanges)) return [
                                    3,
                                    3
                                ];
                                workloadsPath = _this.paths.activeJobsMetaDocument(jobId, _this.workloadMetaKey);
                                console.log("Updating job.workloads on", workloadsPath, computedWorkloadChanges);
                                return [
                                    4,
                                    _this.firestore.doc(workloadsPath).set(_objectSpreadProps(_objectSpread({}, computedWorkloadChanges), {
                                        updatedAt: FieldValue.serverTimestamp()
                                    }), {
                                        merge: true
                                    })
                                ];
                            case 2:
                                _state.sent();
                                _state.label = 3;
                            case 3:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "activateTask",
            value: function activateTask(label, detail) {
                var _this = this;
                return _asyncToGenerator(function() {
                    var docRef, o, updateDocPath;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                return [
                                    4,
                                    _this.firestore.collection(_this.paths.activeJobSubTasksCollection(_this.jobId)).add(_objectSpreadProps(_objectSpread({}, detail || {}), {
                                        label: label,
                                        status: "active",
                                        beginAt: FieldValue.serverTimestamp(),
                                        updatedAt: FieldValue.serverTimestamp()
                                    }))
                                ];
                            case 1:
                                docRef = _state.sent();
                                o = new BackendFirebaseTask(_this, _this.paths.activeJobSubTaskDocument(_this.jobId, docRef.id), docRef.id);
                                console.log("ACTIVATE TASK", docRef.id);
                                updateDocPath = _this.paths.activeJobsDocument(_this.jobId);
                                _this.firestore.doc(updateDocPath).update({
                                    activeTaskCount: FieldValue.increment(1)
                                });
                                return [
                                    2,
                                    o
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "deactivateTask",
            value: function deactivateTask(task, reason, error) {
                var _this = this;
                return _asyncToGenerator(function() {
                    var taskDocPath, payload, aggregateKey, updateDocPath;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                console.log("DEACTIVATE TASK", task.taskId, reason, error);
                                taskDocPath = _this.paths.activeJobSubTaskDocument(_this.jobId, task.taskId);
                                payload = {
                                    reason: reason,
                                    status: "deactive",
                                    endedAt: FieldValue.serverTimestamp()
                                };
                                if (error) {
                                    payload.error = error;
                                }
                                aggregateKey = reason === "failed" ? "failedTaskCount" : "successTaskCount";
                                return [
                                    4,
                                    _this.firestore.doc(taskDocPath).update(payload)
                                ];
                            case 1:
                                _state.sent();
                                updateDocPath = _this.paths.activeJobsDocument(_this.jobId);
                                return [
                                    4,
                                    _this.firestore.doc(updateDocPath).update(_defineProperty({
                                        activeTaskCount: FieldValue.increment(-1)
                                    }, aggregateKey, FieldValue.increment(1)))
                                ];
                            case 2:
                                _state.sent();
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "getActiveTasksCount",
            value: function getActiveTasksCount() {
                var _this = this;
                return _asyncToGenerator(function() {
                    var jobId, docPath, doc, rawData;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                jobId = _this.jobId;
                                docPath = _this.paths.activeJobsDocument(jobId);
                                return [
                                    4,
                                    _this.firestore.doc(docPath).get()
                                ];
                            case 1:
                                doc = _state.sent();
                                rawData = doc.data() || {};
                                return [
                                    2,
                                    rawData.activeTaskCount || 0
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "getWorkloads",
            value: function getWorkloads() {
                var _this = this;
                return _asyncToGenerator(function() {
                    var jobId, docPath, doc, rawData;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                jobId = _this.jobId;
                                docPath = _this.paths.activeJobsMetaDocument(jobId, _this.workloadMetaKey);
                                return [
                                    4,
                                    _this.firestore.doc(docPath).get()
                                ];
                            case 1:
                                doc = _state.sent();
                                if (!doc.exists) {
                                    return [
                                        2,
                                        null
                                    ];
                                }
                                rawData = doc.data() || {};
                                return [
                                    2,
                                    rawData || null
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "cancel",
            value: function cancel(detail) {
                var _this = this;
                return _asyncToGenerator(function() {
                    var updateDocPath;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                assertValidTaskStatus(detail.status);
                                updateDocPath = _this.paths.activeJobsDocument(_this.jobId);
                                console.log("Cancelled job on", updateDocPath);
                                return [
                                    4,
                                    _this.firestore.doc(updateDocPath).update(_objectSpreadProps(_objectSpread({}, detail), {
                                        updatedAt: FieldValue.serverTimestamp(),
                                        cancelledAt: FieldValue.serverTimestamp()
                                    }))
                                ];
                            case 1:
                                _state.sent();
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "publishDone",
            value: function publishDone(detail) {
                var _this = this;
                return _asyncToGenerator(function() {
                    var updateDocPath;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                assertValidTaskStatus(detail.status);
                                updateDocPath = _this.paths.activeJobsDocument(_this.jobId);
                                console.log("Job done on", updateDocPath);
                                return [
                                    4,
                                    _this.firestore.doc(updateDocPath).update(_objectSpread(_objectSpreadProps(_objectSpread({
                                        jobId: _this.jobId
                                    }, detail), {
                                        updatedAt: FieldValue.serverTimestamp()
                                    }), /^finished/.test(detail.status) ? {
                                        currentProgress: 100,
                                        totalProgress: 100,
                                        endedAt: FieldValue.serverTimestamp()
                                    } : {}))
                                ];
                            case 1:
                                _state.sent();
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "isJobCancelled",
            value: function isJobCancelled() {
                var _this = this;
                return _asyncToGenerator(function() {
                    var docPath, docRef, snapshot, raw;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                docPath = _this.paths.activeJobsDocument(_this.jobId);
                                docRef = _this.firestore.doc(docPath);
                                return [
                                    4,
                                    docRef.get()
                                ];
                            case 1:
                                snapshot = _state.sent();
                                raw = snapshot.data();
                                return [
                                    2,
                                    raw && Boolean(raw.cancelledAt) || false
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "isExist",
            value: function isExist() {
                var _this = this;
                return _asyncToGenerator(function() {
                    var docPath, docRef, snapshot;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                docPath = _this.paths.activeJobsDocument(_this.jobId);
                                docRef = _this.firestore.doc(docPath);
                                return [
                                    4,
                                    docRef.get()
                                ];
                            case 1:
                                snapshot = _state.sent();
                                return [
                                    2,
                                    Boolean(snapshot.exists)
                                ];
                        }
                    });
                })();
            }
        }
    ], [
        {
            key: "createNew",
            value: function createNew(fs, paths, jobSlug) {
                var optionalMessage = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
                return _asyncToGenerator(function() {
                    var col, docRef;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                col = paths.activeJobsCollection();
                                console.log("Creating a new job on", col);
                                return [
                                    4,
                                    fs.collection(col).add({
                                        slug: jobSlug,
                                        message: optionalMessage,
                                        beginAt: FieldValue.serverTimestamp()
                                    })
                                ];
                            case 1:
                                docRef = _state.sent();
                                return [
                                    2,
                                    new BackendFirebaseJob(fs, paths, docRef.id)
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "loadJob",
            value: function loadJob(fs, paths, jobId) {
                return _asyncToGenerator(function() {
                    var job, exists;
                    return __generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                job = new BackendFirebaseJob(fs, paths, jobId);
                                return [
                                    4,
                                    job.isExist()
                                ];
                            case 1:
                                exists = _state.sent();
                                if (!exists) {
                                    throw new Error('"jobId" of value '.concat(jobId, " is unknown to given Firestore."));
                                }
                                return [
                                    2,
                                    job
                                ];
                        }
                    });
                })();
            }
        }
    ]);
    return BackendFirebaseJob1;
}();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
    BackendFirebaseJob: BackendFirebaseJob,
    BackendFirebaseTask: BackendFirebaseTask,
    assertValidTaskStatus: assertValidTaskStatus,
    helpers: helpers,
    inCartFirebaseTaskPaths: inCartFirebaseTaskPaths
});
