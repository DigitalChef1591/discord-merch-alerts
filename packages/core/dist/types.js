"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateStrategy = exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType["NEW"] = "NEW";
    EventType["RESTOCK"] = "RESTOCK";
    EventType["PRICE_DROP"] = "PRICE_DROP";
    EventType["PREORDER"] = "PREORDER";
})(EventType || (exports.EventType = EventType = {}));
var AffiliateStrategy;
(function (AffiliateStrategy) {
    AffiliateStrategy["APPEND_PARAM"] = "APPEND_PARAM";
    AffiliateStrategy["REPLACE_DOMAIN"] = "REPLACE_DOMAIN";
    AffiliateStrategy["CODE_MESSAGE"] = "CODE_MESSAGE";
})(AffiliateStrategy || (exports.AffiliateStrategy = AffiliateStrategy = {}));
//# sourceMappingURL=types.js.map