"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeType = exports.Phase = exports.IncomePlatform = void 0;
/**
 * Income platform enum (dropdown options)
 */
var IncomePlatform;
(function (IncomePlatform) {
    IncomePlatform["Online"] = "online";
    IncomePlatform["Instore"] = "in_store";
})(IncomePlatform || (exports.IncomePlatform = IncomePlatform = {}));
/**
 * Phase enum (e.g. Pre-launch, used in Expense, Income)
 */
var Phase;
(function (Phase) {
    Phase["Prelaunch"] = "pre_launch";
    Phase["Launch"] = "launch";
    Phase["PostLaunch"] = "post_launch";
})(Phase || (exports.Phase = Phase = {}));
/**
 * Income type enum
 */
var IncomeType;
(function (IncomeType) {
    IncomeType["Sale"] = "sale";
    IncomeType["Other"] = "other";
})(IncomeType || (exports.IncomeType = IncomeType = {}));
