"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeLike = escapeLike;
exports.getSafeSearchPattern = getSafeSearchPattern;
function escapeLike(input) {
    if (!input)
        return '';
    return input.replace(/[%_]/g, '\\$&');
}
function getSafeSearchPattern(search, limit = 100) {
    if (!search)
        return null;
    const trimmed = search.trim().substring(0, limit);
    if (!trimmed)
        return null;
    return `%${escapeLike(trimmed)}%`;
}
//# sourceMappingURL=sql.helper.js.map