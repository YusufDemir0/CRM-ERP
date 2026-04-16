"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordState = void 0;
var RecordState;
(function (RecordState) {
    RecordState[RecordState["PASSIVE"] = 0] = "PASSIVE";
    RecordState[RecordState["ACTIVE"] = 1] = "ACTIVE";
    RecordState[RecordState["LOCKED"] = 2] = "LOCKED";
    RecordState[RecordState["DRAFT"] = 3] = "DRAFT";
    RecordState[RecordState["ARCHIVED"] = 4] = "ARCHIVED";
})(RecordState || (exports.RecordState = RecordState = {}));
//# sourceMappingURL=record-state.enum.js.map