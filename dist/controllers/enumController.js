"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnumCategory = exports.getEnums = void 0;
const orderEnums_1 = require("../enums/orderEnums");
const statusEnums_1 = require("../enums/statusEnums");
const userEnums_1 = require("../enums/userEnums");
const dropEnums_1 = require("../enums/dropEnums");
const itemEnums_1 = require("../enums/itemEnums");
const reviewEnums_1 = require("../enums/reviewEnums");
const kuwaitEnums_1 = require("../enums/kuwaitEnums");
const transactionEnums_1 = require("../enums/transactionEnums");
const paymentEnums_1 = require("../enums/paymentEnums");
const expenseEnums_1 = require("../enums/expenseEnums");
const flowEnums_1 = require("../enums/flowEnums");
/**
 * Get all enums used in the system
 * Useful for frontend/Retool to dynamically populate dropdowns
 */
const getEnums = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const enums = {
            orderStatus: {
                values: Object.values(orderEnums_1.OrderStatus),
                options: Object.entries(orderEnums_1.OrderStatus).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            itemStatus: {
                values: Object.values(statusEnums_1.ItemStatus),
                options: Object.entries(statusEnums_1.ItemStatus).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            userRole: {
                values: Object.values(userEnums_1.UserRole),
                options: Object.entries(userEnums_1.UserRole).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            dropStatus: {
                values: Object.values(dropEnums_1.DropStatus),
                options: Object.entries(dropEnums_1.DropStatus).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            itemCondition: {
                values: Object.values(itemEnums_1.ItemCondition),
                options: Object.entries(itemEnums_1.ItemCondition).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            reviewStars: {
                values: Object.values(reviewEnums_1.Stars).filter((v) => typeof v === "number"),
                options: [1, 2, 3, 4, 5].map((value) => ({
                    label: `${value} Star${value > 1 ? "s" : ""}`,
                    value: value,
                })),
            },
            kuwaitGovernorate: {
                values: Object.values(kuwaitEnums_1.KuwaitGovernorate),
                options: Object.entries(kuwaitEnums_1.KuwaitGovernorate).map(([key, value]) => ({
                    label: value,
                    value: value,
                })),
            },
            kuwaitCity: {
                values: Object.values(kuwaitEnums_1.KuwaitCity),
                options: Object.entries(kuwaitEnums_1.KuwaitCity).map(([key, value]) => ({
                    label: value,
                    value: value,
                })),
            },
            kuwaitGovernorateCities: Object.entries(kuwaitEnums_1.GovernorateCities).reduce((acc, [governorate, cities]) => {
                acc[governorate] = {
                    governorate: governorate,
                    cities: cities.map((city) => ({
                        label: city,
                        value: city,
                    })),
                    cityValues: cities,
                };
                return acc;
            }, {}),
            transactionStatus: {
                values: Object.values(transactionEnums_1.TransactionStatus),
                options: Object.entries(transactionEnums_1.TransactionStatus).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            paymentMethod: {
                values: Object.values(paymentEnums_1.PaymentMethod),
                options: Object.entries(paymentEnums_1.PaymentMethod).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            expenseType: {
                values: Object.values(expenseEnums_1.ExpenseType),
                options: Object.entries(expenseEnums_1.ExpenseType).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            authenticationStatus: {
                values: Object.values(flowEnums_1.AuthenticationStatus),
                options: Object.entries(flowEnums_1.AuthenticationStatus).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            returnStatus: {
                values: Object.values(flowEnums_1.ReturnStatus),
                options: Object.entries(flowEnums_1.ReturnStatus).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            deliveryStatus: {
                values: Object.values(flowEnums_1.DeliveryStatus),
                options: Object.entries(flowEnums_1.DeliveryStatus).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
            escalationStatus: {
                values: Object.values(flowEnums_1.EscalationStatus),
                options: Object.entries(flowEnums_1.EscalationStatus).map(([key, value]) => ({
                    label: key,
                    value: value,
                })),
            },
        };
        res.json({
            success: true,
            data: enums,
        });
    }
    catch (error) {
        console.error("Error fetching enums:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.getEnums = getEnums;
/**
 * Get specific enum category
 */
const getEnumCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category } = req.params;
        let enumData = null;
        switch (category) {
            case "orderStatus":
                enumData = {
                    values: Object.values(orderEnums_1.OrderStatus),
                    options: Object.entries(orderEnums_1.OrderStatus).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "itemStatus":
                enumData = {
                    values: Object.values(statusEnums_1.ItemStatus),
                    options: Object.entries(statusEnums_1.ItemStatus).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "userRole":
                enumData = {
                    values: Object.values(userEnums_1.UserRole),
                    options: Object.entries(userEnums_1.UserRole).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "dropStatus":
                enumData = {
                    values: Object.values(dropEnums_1.DropStatus),
                    options: Object.entries(dropEnums_1.DropStatus).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "itemCondition":
                enumData = {
                    values: Object.values(itemEnums_1.ItemCondition),
                    options: Object.entries(itemEnums_1.ItemCondition).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "reviewStars":
                enumData = {
                    values: Object.values(reviewEnums_1.Stars).filter((v) => typeof v === "number"),
                    options: [1, 2, 3, 4, 5].map((value) => ({
                        label: `${value} Star${value > 1 ? "s" : ""}`,
                        value: value,
                    })),
                };
                break;
            case "kuwaitGovernorate":
                enumData = {
                    values: Object.values(kuwaitEnums_1.KuwaitGovernorate),
                    options: Object.entries(kuwaitEnums_1.KuwaitGovernorate).map(([key, value]) => ({
                        label: value,
                        value: value,
                    })),
                };
                break;
            case "kuwaitCity":
                enumData = {
                    values: Object.values(kuwaitEnums_1.KuwaitCity),
                    options: Object.entries(kuwaitEnums_1.KuwaitCity).map(([key, value]) => ({
                        label: value,
                        value: value,
                    })),
                };
                break;
            case "kuwaitGovernorateCities":
                enumData = Object.entries(kuwaitEnums_1.GovernorateCities).reduce((acc, [governorate, cities]) => {
                    acc[governorate] = {
                        governorate: governorate,
                        cities: cities.map((city) => ({
                            label: city,
                            value: city,
                        })),
                        cityValues: cities,
                    };
                    return acc;
                }, {});
                break;
            case "transactionStatus":
                enumData = {
                    values: Object.values(transactionEnums_1.TransactionStatus),
                    options: Object.entries(transactionEnums_1.TransactionStatus).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "paymentMethod":
                enumData = {
                    values: Object.values(paymentEnums_1.PaymentMethod),
                    options: Object.entries(paymentEnums_1.PaymentMethod).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "expenseType":
                enumData = {
                    values: Object.values(expenseEnums_1.ExpenseType),
                    options: Object.entries(expenseEnums_1.ExpenseType).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "authenticationStatus":
                enumData = {
                    values: Object.values(flowEnums_1.AuthenticationStatus),
                    options: Object.entries(flowEnums_1.AuthenticationStatus).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "returnStatus":
                enumData = {
                    values: Object.values(flowEnums_1.ReturnStatus),
                    options: Object.entries(flowEnums_1.ReturnStatus).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "deliveryStatus":
                enumData = {
                    values: Object.values(flowEnums_1.DeliveryStatus),
                    options: Object.entries(flowEnums_1.DeliveryStatus).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            case "escalationStatus":
                enumData = {
                    values: Object.values(flowEnums_1.EscalationStatus),
                    options: Object.entries(flowEnums_1.EscalationStatus).map(([key, value]) => ({
                        label: key,
                        value: value,
                    })),
                };
                break;
            default:
                res.status(404).json({
                    success: false,
                    error: `Enum category '${category}' not found`,
                    availableCategories: [
                        "orderStatus",
                        "itemStatus",
                        "userRole",
                        "dropStatus",
                        "itemCondition",
                        "reviewStars",
                        "kuwaitGovernorate",
                        "kuwaitCity",
                        "kuwaitGovernorateCities",
                        "transactionStatus",
                        "paymentMethod",
                        "expenseType",
                        "authenticationStatus",
                        "returnStatus",
                        "deliveryStatus",
                        "escalationStatus",
                    ],
                });
                return;
        }
        res.json({
            success: true,
            category: category,
            data: enumData,
        });
    }
    catch (error) {
        console.error("Error fetching enum category:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.getEnumCategory = getEnumCategory;
