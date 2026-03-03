'use client';
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
var react_1 = require("react");
var card_1 = require("@/components/ui/card");
var button_1 = require("@/components/ui/button");
var badge_1 = require("@/components/ui/badge");
var tabs_1 = require("@/components/ui/tabs");
var table_1 = require("@/components/ui/table");
var dialog_1 = require("@/components/ui/dialog");
var label_1 = require("@/components/ui/label");
var scroll_area_1 = require("@/components/ui/scroll-area");
var lucide_react_1 = require("lucide-react");
var link_1 = require("next/link");
var use_toast_1 = require("@/hooks/use-toast");
var API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
function StatusBadge(_a) {
    var status = _a.status;
    var variants = {
        completed: { variant: 'default', icon: React.createElement(lucide_react_1.CheckCircle2, { className: "size-3 mr-1" }) },
        failed: { variant: 'destructive', icon: React.createElement(lucide_react_1.XCircle, { className: "size-3 mr-1" }) },
        processing: { variant: 'secondary', icon: React.createElement(lucide_react_1.Loader2, { className: "size-3 mr-1 animate-spin" }) },
        pending: { variant: 'outline', icon: React.createElement(lucide_react_1.Clock, { className: "size-3 mr-1" }) }
    };
    var config = variants[status] || { variant: 'outline', icon: null };
    return (React.createElement(badge_1.Badge, { variant: config.variant, className: "capitalize" },
        config.icon,
        status));
}
function CallbackBadge(_a) {
    var status = _a.status;
    if (!status)
        return React.createElement(badge_1.Badge, { variant: "outline" }, "N/A");
    var variants = {
        sent: 'default',
        failed: 'destructive',
        not_configured: 'secondary'
    };
    return (React.createElement(badge_1.Badge, { variant: variants[status] || 'outline', className: "capitalize" },
        status === 'sent' ? React.createElement(lucide_react_1.Send, { className: "size-3 mr-1" }) : null,
        status.replace('_', ' ')));
}
function formatDuration(ms) {
    if (!ms)
        return 'N/A';
    if (ms < 1000)
        return ms + "ms";
    return (ms / 1000).toFixed(2) + "s";
}
function formatDate(isoString) {
    if (!isoString)
        return 'N/A';
    return new Date(isoString).toLocaleString();
}
function formatBytes(bytes) {
    if (!bytes)
        return 'N/A';
    if (bytes < 1024)
        return bytes + " B";
    if (bytes < 1024 * 1024)
        return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}
function SsdAuditLogPage() {
    var _this = this;
    var _a, _b, _c;
    var _d = react_1.useState([]), logs = _d[0], setLogs = _d[1];
    var _e = react_1.useState(null), stats = _e[0], setStats = _e[1];
    var _f = react_1.useState(true), loading = _f[0], setLoading = _f[1];
    var _g = react_1.useState(false), refreshing = _g[0], setRefreshing = _g[1];
    var _h = react_1.useState(null), selectedLog = _h[0], setSelectedLog = _h[1];
    var _j = react_1.useState(false), detailsOpen = _j[0], setDetailsOpen = _j[1];
    var _k = react_1.useState('all'), filterStatus = _k[0], setFilterStatus = _k[1];
    var toast = use_toast_1.useToast().toast;
    var fetchLogs = function () { return __awaiter(_this, void 0, void 0, function () {
        var statusParam, response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    statusParam = filterStatus !== 'all' ? "?status=" + filterStatus : '';
                    return [4 /*yield*/, fetch(API_BASE + "/api/ssd/audit/logs" + statusParam)];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setLogs(data.logs || []);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to fetch audit logs:', error_1);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to fetch audit logs'
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var fetchStats = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch(API_BASE + "/api/ssd/audit/stats")];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setStats(data);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Failed to fetch stats:', error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var fetchLogDetails = function (trackingId) { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch(API_BASE + "/api/ssd/audit/logs/" + trackingId)];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setSelectedLog(data);
                    setDetailsOpen(true);
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.error('Failed to fetch log details:', error_3);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Failed to fetch log details'
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleRefresh = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setRefreshing(true);
                    return [4 /*yield*/, Promise.all([fetchLogs(), fetchStats()])];
                case 1:
                    _a.sent();
                    setRefreshing(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (trackingId) { return __awaiter(_this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Are you sure you want to delete this audit log and associated report?'))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(API_BASE + "/api/ssd/audit/logs/" + trackingId, { method: 'DELETE' })];
                case 2:
                    _a.sent();
                    toast({ title: 'Deleted', description: 'Audit log deleted successfully' });
                    return [4 /*yield*/, fetchLogs()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _a.sent();
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete audit log' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var copyToClipboard = function (text, label) {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied', description: label + " copied to clipboard" });
    };
    var downloadReport = function (trackingId) { return __awaiter(_this, void 0, void 0, function () {
        var response, data, blob, url, a, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch(API_BASE + "/api/ssd/audit/logs/" + trackingId + "/report")];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    blob = new Blob([JSON.stringify(data.report, null, 2)], { type: 'application/json' });
                    url = URL.createObjectURL(blob);
                    a = document.createElement('a');
                    a.href = url;
                    a.download = "tirr_report_" + trackingId + ".json";
                    a.click();
                    URL.revokeObjectURL(url);
                    return [3 /*break*/, 4];
                case 3:
                    error_5 = _a.sent();
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to download report' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    react_1.useEffect(function () {
        var load = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        return [4 /*yield*/, Promise.all([fetchLogs(), fetchStats()])];
                    case 1:
                        _a.sent();
                        setLoading(false);
                        return [2 /*return*/];
                }
            });
        }); };
        load();
    }, [filterStatus]);
    return (React.createElement("div", { className: "container mx-auto p-4 md:p-8" },
        React.createElement("header", { className: "flex justify-between items-center mb-8" },
            React.createElement("div", null,
                React.createElement(link_1["default"], { href: "/dashboard/reports/configure", className: "flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4" },
                    React.createElement(lucide_react_1.ArrowLeft, { className: "size-4" }),
                    "Back to Report Configuration"),
                React.createElement("h1", { className: "text-3xl font-bold" }, "SSD Integration Audit Logs"),
                React.createElement("p", { className: "text-muted-foreground" }, "Monitor and review SSD \u2192 TCA TIRR integration requests, responses, and reports")),
            React.createElement(button_1.Button, { onClick: handleRefresh, disabled: refreshing },
                React.createElement(lucide_react_1.RefreshCw, { className: "size-4 mr-2 " + (refreshing ? 'animate-spin' : '') }),
                "Refresh")),
        stats && (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" },
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-2" },
                    React.createElement(card_1.CardDescription, null, "Total Requests"),
                    React.createElement(card_1.CardTitle, { className: "text-3xl flex items-center gap-2" },
                        React.createElement(lucide_react_1.Server, { className: "size-6 text-blue-500" }),
                        stats.total_requests))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-2" },
                    React.createElement(card_1.CardDescription, null, "Success Rate"),
                    React.createElement(card_1.CardTitle, { className: "text-3xl flex items-center gap-2" },
                        React.createElement(lucide_react_1.CheckCircle2, { className: "size-6 text-green-500" }),
                        stats.total_requests > 0
                            ? ((stats.status_breakdown.completed / stats.total_requests) * 100).toFixed(1) + "%"
                            : 'N/A'))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-2" },
                    React.createElement(card_1.CardDescription, null, "Avg Processing Time"),
                    React.createElement(card_1.CardTitle, { className: "text-3xl flex items-center gap-2" },
                        React.createElement(lucide_react_1.Activity, { className: "size-6 text-orange-500" }),
                        formatDuration(stats.performance.avg_processing_time_ms)))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, { className: "pb-2" },
                    React.createElement(card_1.CardDescription, null, "Avg TCA Score"),
                    React.createElement(card_1.CardTitle, { className: "text-3xl flex items-center gap-2" },
                        React.createElement(lucide_react_1.TrendingUp, { className: "size-6 text-purple-500" }),
                        stats.scores.avg_final_score.toFixed(1)))))),
        stats && (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" },
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, null,
                    React.createElement(card_1.CardTitle, { className: "text-lg" }, "Processing Status")),
                React.createElement(card_1.CardContent, { className: "flex gap-4" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.CheckCircle2, { className: "size-4 text-green-500" }),
                        React.createElement("span", null,
                            "Completed: ",
                            React.createElement("strong", null, stats.status_breakdown.completed))),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Loader2, { className: "size-4 text-blue-500" }),
                        React.createElement("span", null,
                            "Processing: ",
                            React.createElement("strong", null, stats.status_breakdown.processing))),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.XCircle, { className: "size-4 text-red-500" }),
                        React.createElement("span", null,
                            "Failed: ",
                            React.createElement("strong", null, stats.status_breakdown.failed))))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, null,
                    React.createElement(card_1.CardTitle, { className: "text-lg" }, "Callback Status")),
                React.createElement(card_1.CardContent, { className: "flex gap-4" },
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Send, { className: "size-4 text-green-500" }),
                        React.createElement("span", null,
                            "Sent: ",
                            React.createElement("strong", null, stats.callback_stats.sent))),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.AlertTriangle, { className: "size-4 text-yellow-500" }),
                        React.createElement("span", null,
                            "Failed: ",
                            React.createElement("strong", null, stats.callback_stats.failed))),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(lucide_react_1.Clock, { className: "size-4 text-gray-500" }),
                        React.createElement("span", null,
                            "Not Configured: ",
                            React.createElement("strong", null, stats.callback_stats.not_configured))))))),
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement("div", { className: "flex justify-between items-center" },
                    React.createElement("div", null,
                        React.createElement(card_1.CardTitle, null, "Audit Log Entries"),
                        React.createElement(card_1.CardDescription, null, "All SSD \u2192 TCA TIRR integration requests with full audit trail")),
                    React.createElement("div", { className: "flex gap-2" },
                        React.createElement("select", { value: filterStatus, onChange: function (e) { return setFilterStatus(e.target.value); }, className: "border rounded px-3 py-1 text-sm", "aria-label": "Filter audit logs by status" },
                            React.createElement("option", { value: "all" }, "All Statuses"),
                            React.createElement("option", { value: "completed" }, "Completed"),
                            React.createElement("option", { value: "processing" }, "Processing"),
                            React.createElement("option", { value: "failed" }, "Failed"),
                            React.createElement("option", { value: "pending" }, "Pending"))))),
            React.createElement(card_1.CardContent, null, loading ? (React.createElement("div", { className: "flex items-center justify-center py-8" },
                React.createElement(lucide_react_1.Loader2, { className: "size-8 animate-spin text-muted-foreground" }))) : logs.length === 0 ? (React.createElement("div", { className: "text-center py-8 text-muted-foreground" },
                React.createElement(lucide_react_1.FileText, { className: "size-12 mx-auto mb-4 opacity-50" }),
                React.createElement("p", null, "No audit logs found"),
                React.createElement("p", { className: "text-sm" }, "SSD integration requests will appear here"))) : (React.createElement(table_1.Table, null,
                React.createElement(table_1.TableHeader, null,
                    React.createElement(table_1.TableRow, null,
                        React.createElement(table_1.TableHead, null, "Tracking ID"),
                        React.createElement(table_1.TableHead, null, "Company"),
                        React.createElement(table_1.TableHead, null, "Founder"),
                        React.createElement(table_1.TableHead, null, "Status"),
                        React.createElement(table_1.TableHead, null, "Callback"),
                        React.createElement(table_1.TableHead, null, "Score"),
                        React.createElement(table_1.TableHead, null, "Duration"),
                        React.createElement(table_1.TableHead, null, "Created"),
                        React.createElement(table_1.TableHead, { className: "text-right" }, "Actions"))),
                React.createElement(table_1.TableBody, null, logs.map(function (log) { return (React.createElement(table_1.TableRow, { key: log.tracking_id },
                    React.createElement(table_1.TableCell, { className: "font-mono text-xs" },
                        log.tracking_id.slice(0, 8),
                        "...",
                        React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "h-6 w-6 ml-1", onClick: function () { return copyToClipboard(log.tracking_id, 'Tracking ID'); } },
                            React.createElement(lucide_react_1.Copy, { className: "size-3" }))),
                    React.createElement(table_1.TableCell, { className: "font-medium" }, log.company_name),
                    React.createElement(table_1.TableCell, null,
                        React.createElement("div", { className: "flex items-center gap-1" },
                            React.createElement(lucide_react_1.Users, { className: "size-3 text-muted-foreground" }),
                            log.founder_email)),
                    React.createElement(table_1.TableCell, null,
                        React.createElement(StatusBadge, { status: log.status })),
                    React.createElement(table_1.TableCell, null,
                        React.createElement(CallbackBadge, { status: log.callback_status })),
                    React.createElement(table_1.TableCell, null, log.final_score !== undefined ? (React.createElement(badge_1.Badge, { variant: log.final_score >= 7 ? 'default' : log.final_score >= 5 ? 'secondary' : 'destructive' }, log.final_score.toFixed(1))) : (React.createElement("span", { className: "text-muted-foreground" }, "\u2014"))),
                    React.createElement(table_1.TableCell, null, formatDuration(log.processing_duration_ms)),
                    React.createElement(table_1.TableCell, { className: "text-sm" }, formatDate(log.created_at)),
                    React.createElement(table_1.TableCell, { className: "text-right" },
                        React.createElement("div", { className: "flex justify-end gap-1" },
                            React.createElement(button_1.Button, { variant: "ghost", size: "icon", onClick: function () { return fetchLogDetails(log.tracking_id); } },
                                React.createElement(lucide_react_1.Eye, { className: "size-4" })),
                            log.status === 'completed' && (React.createElement(button_1.Button, { variant: "ghost", size: "icon", onClick: function () { return downloadReport(log.tracking_id); } },
                                React.createElement(lucide_react_1.Download, { className: "size-4" }))),
                            React.createElement(button_1.Button, { variant: "ghost", size: "icon", onClick: function () { return handleDelete(log.tracking_id); } },
                                React.createElement(lucide_react_1.Trash2, { className: "size-4 text-destructive" })))))); })))))),
        React.createElement(dialog_1.Dialog, { open: detailsOpen, onOpenChange: setDetailsOpen },
            React.createElement(dialog_1.DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" },
                React.createElement(dialog_1.DialogHeader, null,
                    React.createElement(dialog_1.DialogTitle, null, "Audit Log Details"),
                    React.createElement(dialog_1.DialogDescription, null,
                        "Full audit trail for tracking ID: ", selectedLog === null || selectedLog === void 0 ? void 0 :
                        selectedLog.tracking_id)),
                selectedLog && (React.createElement(tabs_1.Tabs, { defaultValue: "overview", className: "flex-1 overflow-hidden" },
                    React.createElement(tabs_1.TabsList, null,
                        React.createElement(tabs_1.TabsTrigger, { value: "overview" }, "Overview"),
                        React.createElement(tabs_1.TabsTrigger, { value: "events" },
                            "Event Timeline (",
                            ((_a = selectedLog.events) === null || _a === void 0 ? void 0 : _a.length) || 0,
                            ")"),
                        React.createElement(tabs_1.TabsTrigger, { value: "request" }, "Request Payload"),
                        React.createElement(tabs_1.TabsTrigger, { value: "response" }, "Response Payload")),
                    React.createElement(tabs_1.TabsContent, { value: "overview", className: "space-y-4 overflow-auto" },
                        React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Company"),
                                React.createElement("p", { className: "font-medium" }, selectedLog.company_name)),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Founder Email"),
                                React.createElement("p", { className: "font-medium" }, selectedLog.founder_email)),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Status"),
                                React.createElement("p", null,
                                    React.createElement(StatusBadge, { status: selectedLog.status }))),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Final Score"),
                                React.createElement("p", { className: "font-medium" }, ((_b = selectedLog.final_score) === null || _b === void 0 ? void 0 : _b.toFixed(1)) || 'N/A')),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Recommendation"),
                                React.createElement("p", { className: "font-medium" }, selectedLog.recommendation || 'N/A')),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Processing Time"),
                                React.createElement("p", { className: "font-medium" }, formatDuration(selectedLog.processing_duration_ms))),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Request Payload Size"),
                                React.createElement("p", { className: "font-medium" }, formatBytes(selectedLog.request_payload_size))),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Payload Hash"),
                                React.createElement("p", { className: "font-mono text-xs" }, selectedLog.request_payload_hash || 'N/A')),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Callback URL"),
                                React.createElement("p", { className: "font-mono text-xs truncate" }, selectedLog.callback_url || 'Not configured')),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Callback Status"),
                                React.createElement("p", null,
                                    React.createElement(CallbackBadge, { status: selectedLog.callback_status }))),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Report Path"),
                                React.createElement("p", { className: "font-mono text-xs truncate" }, selectedLog.report_path || 'N/A')),
                            React.createElement("div", null,
                                React.createElement(label_1.Label, { className: "text-muted-foreground" }, "Report Exists"),
                                React.createElement("p", null, selectedLog.report_exists ? React.createElement(lucide_react_1.CheckCircle2, { className: "size-4 text-green-500" }) : React.createElement(lucide_react_1.XCircle, { className: "size-4 text-red-500" }))))),
                    React.createElement(tabs_1.TabsContent, { value: "events", className: "overflow-auto max-h-[60vh]" },
                        React.createElement(scroll_area_1.ScrollArea, { className: "h-full" },
                            React.createElement("div", { className: "space-y-3" }, (_c = selectedLog.events) === null || _c === void 0 ? void 0 : _c.map(function (event, i) { return (React.createElement("div", { key: i, className: "flex gap-4 p-3 border rounded-lg" },
                                React.createElement("div", { className: "flex-shrink-0 w-32" },
                                    React.createElement(badge_1.Badge, { variant: "outline", className: "capitalize" }, event.event_type)),
                                React.createElement("div", { className: "flex-1" },
                                    React.createElement("p", { className: "text-xs text-muted-foreground" }, formatDate(event.timestamp)),
                                    Object.keys(event.details || {}).length > 0 && (React.createElement("pre", { className: "text-xs bg-muted p-2 rounded mt-1 overflow-auto" }, JSON.stringify(event.details, null, 2)))))); })))),
                    React.createElement(tabs_1.TabsContent, { value: "request", className: "overflow-auto max-h-[60vh]" },
                        React.createElement(scroll_area_1.ScrollArea, { className: "h-full" },
                            React.createElement("pre", { className: "text-xs bg-muted p-4 rounded overflow-auto" }, JSON.stringify(selectedLog.request_payload || {}, null, 2)))),
                    React.createElement(tabs_1.TabsContent, { value: "response", className: "overflow-auto max-h-[60vh]" },
                        React.createElement(scroll_area_1.ScrollArea, { className: "h-full" },
                            React.createElement("pre", { className: "text-xs bg-muted p-4 rounded overflow-auto" }, JSON.stringify(selectedLog.response_payload || {}, null, 2))))))))));
}
exports["default"] = SsdAuditLogPage;
