"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthYearDateRange = void 0;
const getMonthYearDateRange = (yearValue, monthValue) => {
    if (yearValue === undefined && monthValue === undefined) {
        return { range: null };
    }
    if (yearValue === undefined || yearValue === null || yearValue === "") {
        return { range: null, error: "year is required when month is provided" };
    }
    const year = Number(yearValue);
    if (!Number.isInteger(year)) {
        return { range: null, error: "year must be an integer" };
    }
    if (monthValue === undefined || monthValue === null || monthValue === "") {
        const start = new Date(Date.UTC(year, 0, 1));
        const end = new Date(Date.UTC(year + 1, 0, 1));
        return { range: { $gte: start, $lt: end } };
    }
    const month = Number(monthValue);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        return { range: null, error: "month must be an integer between 1 and 12" };
    }
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return { range: { $gte: start, $lt: end } };
};
exports.getMonthYearDateRange = getMonthYearDateRange;
