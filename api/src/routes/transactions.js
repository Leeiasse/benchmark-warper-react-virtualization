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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRoutes = transactionRoutes;
var MAX_LIMIT = 10000;
function transactionRoutes(app, pool) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            app.get("/api/transactions", function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
                var limit, offset, result, countResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            limit = Math.min(parseInt(request.query.limit || "100", 10), MAX_LIMIT);
                            offset = parseInt(request.query.offset || "0", 10);
                            return [4 /*yield*/, pool.query("SELECT * FROM transactions ORDER BY id ASC LIMIT $1 OFFSET $2", [limit, offset])];
                        case 1:
                            result = _a.sent();
                            return [4 /*yield*/, pool.query("SELECT COUNT(*) FROM transactions")];
                        case 2:
                            countResult = _a.sent();
                            reply.send({
                                data: result.rows,
                                total: parseInt(countResult.rows[0].count, 10),
                                limit: limit,
                                offset: offset,
                            });
                            return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/transactions/count", function (_request, reply) { return __awaiter(_this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, pool.query("SELECT COUNT(*) FROM transactions")];
                        case 1:
                            result = _a.sent();
                            reply.send({ count: parseInt(result.rows[0].count, 10) });
                            return [2 /*return*/];
                    }
                });
            }); });
            app.get("/api/transactions/cursor", function (request, reply) { return __awaiter(_this, void 0, void 0, function () {
                var limit, cursor, cursorId, decoded, result, hasMore, data, lastRow, nextCursor;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            limit = Math.min(parseInt(request.query.limit || "100", 10), MAX_LIMIT);
                            cursor = request.query.cursor;
                            cursorId = 0;
                            if (cursor) {
                                try {
                                    decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
                                    cursorId = decoded.id;
                                }
                                catch (_b) {
                                    reply.status(400).send({ error: "Invalid cursor" });
                                    return [2 /*return*/];
                                }
                            }
                            return [4 /*yield*/, pool.query("SELECT * FROM transactions WHERE id > $1 ORDER BY id ASC LIMIT $2", [cursorId, limit + 1])];
                        case 1:
                            result = _a.sent();
                            hasMore = result.rows.length > limit;
                            data = hasMore ? result.rows.slice(0, limit) : result.rows;
                            lastRow = data[data.length - 1];
                            nextCursor = hasMore && lastRow
                                ? Buffer.from(JSON.stringify({ id: lastRow.id })).toString("base64")
                                : null;
                            reply.send({ data: data, nextCursor: nextCursor, hasMore: hasMore });
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
