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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.DocumentSubmission = void 0;
var card_1 = require("@/components/ui/card");
var tabs_1 = require("@/components/ui/tabs");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../ui/button");
var input_1 = require("../ui/input");
var textarea_1 = require("../ui/textarea");
var react_1 = require("react");
var badge_1 = require("../ui/badge");
// Helper function to convert file to base64
var fileToBase64 = function (file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            var result = reader.result;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            var base64 = result.split(',')[1] || result;
            resolve(base64);
        };
        reader.onerror = reject;
    });
};
function DocumentSubmission(_a) {
    var _this = this;
    var uploadedFiles = _a.uploadedFiles, setUploadedFiles = _a.setUploadedFiles, importedUrls = _a.importedUrls, setImportedUrls = _a.setImportedUrls, submittedTexts = _a.submittedTexts, setSubmittedTexts = _a.setSubmittedTexts, _b = _a.showUrlInput, showUrlInput = _b === void 0 ? true : _b, _c = _a.showTextInput, showTextInput = _c === void 0 ? true : _c, _d = _a.title, title = _d === void 0 ? "Document Submission" : _d, description = _a.description, _e = _a.pitchDeckOnly, pitchDeckOnly = _e === void 0 ? false : _e;
    var _f = react_1.useState(''), urlInput = _f[0], setUrlInput = _f[1];
    var _g = react_1.useState(''), textInput = _g[0], setTextInput = _g[1];
    var _h = react_1.useState(false), isProcessing = _h[0], setIsProcessing = _h[1];
    var fileInputRef = react_1.useRef(null);
    var handleFileChange = function (event) { return __awaiter(_this, void 0, void 0, function () {
        var files, validTypes, file, ext, newFiles_1, processedFiles, existingFiles;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!event.target.files) return [3 /*break*/, 2];
                    files = Array.from(event.target.files);
                    // For pitch deck, only allow 1 file
                    if (pitchDeckOnly) {
                        if (files.length > 1) {
                            alert('Please upload only 1 pitch deck file.');
                            return [2 /*return*/];
                        }
                        validTypes = ['.pdf', '.docx', '.pptx'];
                        file = files[0];
                        ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                        if (!validTypes.includes(ext)) {
                            alert('Only PDF, DOCX, or PPTX files are allowed for the pitch deck.');
                            return [2 /*return*/];
                        }
                        // Replace existing pitch deck instead of adding
                        setUploadedFiles([]);
                    }
                    newFiles_1 = files.map(function (file) { return ({
                        name: file.name,
                        size: file.size
                    }); });
                    setUploadedFiles(function (prev) { return __spreadArrays(prev, newFiles_1); });
                    setIsProcessing(true);
                    return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var textContent, e_1, e_2, base64Content, response, result, e_3;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        textContent = '';
                                        if (!(file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv'))) return [3 /*break*/, 5];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, file.text()];
                                    case 2:
                                        textContent = _a.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        e_1 = _a.sent();
                                        console.warn('Could not read text file:', file.name);
                                        return [3 /*break*/, 4];
                                    case 4: return [3 /*break*/, 20];
                                    case 5:
                                        if (!(file.type === 'application/json' || file.name.endsWith('.json'))) return [3 /*break*/, 10];
                                        _a.label = 6;
                                    case 6:
                                        _a.trys.push([6, 8, , 9]);
                                        return [4 /*yield*/, file.text()];
                                    case 7:
                                        textContent = _a.sent();
                                        return [3 /*break*/, 9];
                                    case 8:
                                        e_2 = _a.sent();
                                        console.warn('Could not read JSON file:', file.name);
                                        return [3 /*break*/, 9];
                                    case 9: return [3 /*break*/, 20];
                                    case 10:
                                        if (!(file.type === 'application/pdf' || file.name.endsWith('.pdf') ||
                                            file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc'))) return [3 /*break*/, 19];
                                        _a.label = 11;
                                    case 11:
                                        _a.trys.push([11, 17, , 18]);
                                        return [4 /*yield*/, fileToBase64(file)];
                                    case 12:
                                        base64Content = _a.sent();
                                        return [4 /*yield*/, fetch('https://tcairrapiccontainer.azurewebsites.net/api/v1/analysis/extract-text-from-file', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    content: base64Content,
                                                    filename: file.name
                                                })
                                            })];
                                    case 13:
                                        response = _a.sent();
                                        if (!response.ok) return [3 /*break*/, 15];
                                        return [4 /*yield*/, response.json()];
                                    case 14:
                                        result = _a.sent();
                                        textContent = result.text_content || '';
                                        console.log("Extracted " + textContent.length + " characters from " + file.name);
                                        return [3 /*break*/, 16];
                                    case 15:
                                        console.warn('Backend extraction failed for:', file.name);
                                        textContent = "[File extraction pending: " + file.name + "]";
                                        _a.label = 16;
                                    case 16: return [3 /*break*/, 18];
                                    case 17:
                                        e_3 = _a.sent();
                                        console.warn('Could not extract text from:', file.name, e_3);
                                        textContent = "[File extraction failed: " + file.name + "]";
                                        return [3 /*break*/, 18];
                                    case 18: return [3 /*break*/, 20];
                                    case 19:
                                        textContent = "[Unsupported file type: " + file.name + "]";
                                        _a.label = 20;
                                    case 20: return [2 /*return*/, {
                                            name: file.name,
                                            size: file.size,
                                            type: file.type,
                                            extracted_data: {
                                                text_content: textContent,
                                                financial_data: { revenue: 0, burn_rate: 0, runway_months: 0 },
                                                key_metrics: { team_size: 0, customers: 0, mrr: 0 }
                                            }
                                        }];
                                }
                            });
                        }); }))];
                case 1:
                    processedFiles = _a.sent();
                    existingFiles = JSON.parse(localStorage.getItem('processedFiles') || '[]');
                    localStorage.setItem('processedFiles', JSON.stringify(__spreadArrays(existingFiles, processedFiles)));
                    setIsProcessing(false);
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); };
    var removeFile = function (index) {
        setUploadedFiles(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    var handleImportUrls = function () { return __awaiter(_this, void 0, void 0, function () {
        var urls_1, localProcessed, existingUrls;
        return __generator(this, function (_a) {
            if (urlInput.trim()) {
                urls_1 = urlInput.split('\n').filter(function (url) { return url.trim() !== ''; });
                setImportedUrls(function (prev) { return __spreadArrays(prev, urls_1); });
                setUrlInput('');
                localProcessed = urls_1.map(function (url) { return ({
                    url: url,
                    title: "URL Import: " + url,
                    extracted_data: {
                        text_content: "[URL content from " + url + " - requires server-side fetching for full content extraction]",
                        metadata: { domain: url.split('/')[2] || url, content_type: 'text/html', word_count: 0 }
                    }
                }); });
                existingUrls = JSON.parse(localStorage.getItem('processedUrls') || '[]');
                localStorage.setItem('processedUrls', JSON.stringify(__spreadArrays(existingUrls, localProcessed)));
            }
            return [2 /*return*/];
        });
    }); };
    var removeUrl = function (index) {
        setImportedUrls(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    var handleSubmitText = function () {
        if (textInput.trim()) {
            setSubmittedTexts(function (prev) { return __spreadArrays(prev, [textInput]); });
            // Store processed text data for analysis
            var processedTexts = JSON.parse(localStorage.getItem('processedTexts') || '[]');
            processedTexts.push({
                content: textInput,
                word_count: textInput.split(' ').length,
                processed_at: new Date().toISOString(),
                extracted_data: {
                    key_points: textInput.split('.').slice(0, 3),
                    sentiment: 'positive',
                    topics: ['business', 'strategy', 'growth']
                }
            });
            localStorage.setItem('processedTexts', JSON.stringify(processedTexts));
            setTextInput('');
        }
    };
    var removeText = function (index) {
        setSubmittedTexts(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    var formatBytes = function (bytes, decimals) {
        if (decimals === void 0) { decimals = 2; }
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var dm = decimals < 0 ? 0 : decimals;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };
    return (React.createElement(card_1.Card, { className: "shadow-lg" },
        React.createElement(card_1.CardHeader, null,
            React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                React.createElement(lucide_react_1.FileUp, { className: "text-primary" }),
                title),
            description && (React.createElement("p", { className: "text-sm text-muted-foreground" }, description))),
        React.createElement(card_1.CardContent, null,
            React.createElement(tabs_1.Tabs, { defaultValue: "file" },
                React.createElement(tabs_1.TabsList, { className: "grid w-full " + (showUrlInput && showTextInput ? 'grid-cols-3' : showUrlInput || showTextInput ? 'grid-cols-2' : 'grid-cols-1') },
                    React.createElement(tabs_1.TabsTrigger, { value: "file" },
                        React.createElement(lucide_react_1.UploadCloud, { className: "mr-2" }),
                        " File Upload"),
                    showUrlInput && (React.createElement(tabs_1.TabsTrigger, { value: "url" },
                        React.createElement(lucide_react_1.Link, { className: "mr-2" }),
                        " URL Import")),
                    showTextInput && (React.createElement(tabs_1.TabsTrigger, { value: "text" },
                        React.createElement(lucide_react_1.Type, { className: "mr-2" }),
                        " Text Input"))),
                React.createElement(tabs_1.TabsContent, { value: "file" },
                    React.createElement("div", { className: "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/30", onClick: function () { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); } },
                        React.createElement(lucide_react_1.UploadCloud, { className: "h-12 w-12 text-muted-foreground" }),
                        React.createElement("h3", { className: "mt-4 text-lg font-semibold" }, pitchDeckOnly ? 'Drop your pitch deck here or click to browse' : 'Drop your file here or click to browse'),
                        React.createElement("p", { className: "mt-1 text-sm text-muted-foreground" }, pitchDeckOnly
                            ? 'Only 1 file allowed: PDF, DOCX, or PPTX (Max 30MB)'
                            : 'Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, CSV, JSON, RTF, ODT (Max 30MB)'),
                        React.createElement(input_1.Input, { type: "file", ref: fileInputRef, className: "hidden", accept: pitchDeckOnly
                                ? ".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.json,.rtf,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/json,application/rtf,application/vnd.oasis.opendocument.text", onChange: handleFileChange, multiple: !pitchDeckOnly })),
                    uploadedFiles.length > 0 && (React.createElement("div", { className: "mt-4 space-y-2" },
                        React.createElement("h4", { className: "font-semibold text-muted-foreground flex items-center gap-2" },
                            "Uploaded Files",
                            isProcessing && (React.createElement("span", { className: "inline-flex items-center gap-1 text-sm font-normal text-blue-600" },
                                React.createElement("span", { className: "inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" }),
                                "Extracting text..."))),
                        React.createElement("ul", { className: "space-y-2" }, uploadedFiles.map(function (file, index) { return (React.createElement("li", { key: index, className: "flex items-center justify-between rounded-md border bg-muted/30 p-2" },
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement(lucide_react_1.FileText, { className: "size-5 text-primary" }),
                                React.createElement("span", { className: "font-medium" }, file.name),
                                React.createElement(badge_1.Badge, { variant: "secondary" }, formatBytes(file.size))),
                            React.createElement(button_1.Button, { variant: "ghost", size: "icon", onClick: function () { return removeFile(index); }, className: "size-6" },
                                React.createElement(lucide_react_1.X, { className: "size-4" })))); }))))),
                showUrlInput && (React.createElement(tabs_1.TabsContent, { value: "url" },
                    React.createElement("div", { className: "mt-4 space-y-4" },
                        React.createElement("p", { className: "text-sm text-muted-foreground" }, "Enter URLs to import data from. One URL per line."),
                        React.createElement(textarea_1.Textarea, { placeholder: "https://example.com/pitch-deck.pdf\\nhttps://medium.com/my-startup/our-vision", rows: 5, value: urlInput, onChange: function (e) { return setUrlInput(e.target.value); } }),
                        React.createElement(button_1.Button, { onClick: handleImportUrls }, "Import from URLs")),
                    importedUrls.length > 0 && (React.createElement("div", { className: "mt-4 space-y-2" },
                        React.createElement("h4", { className: "font-semibold text-muted-foreground" }, "Imported URLs"),
                        React.createElement("ul", { className: "space-y-2" }, importedUrls.map(function (url, index) { return (React.createElement("li", { key: index, className: "flex items-center justify-between rounded-md border bg-muted/30 p-2" },
                            React.createElement("div", { className: "flex items-center gap-2 overflow-hidden" },
                                React.createElement(lucide_react_1.Globe, { className: "size-5 flex-shrink-0 text-primary" }),
                                React.createElement("span", { className: "truncate font-medium" }, url)),
                            React.createElement(button_1.Button, { variant: "ghost", size: "icon", onClick: function () { return removeUrl(index); }, className: "size-6" },
                                React.createElement(lucide_react_1.X, { className: "size-4" })))); })))))),
                showTextInput && (React.createElement(tabs_1.TabsContent, { value: "text" },
                    React.createElement("div", { className: "mt-4 space-y-4" },
                        React.createElement("p", { className: "text-sm text-muted-foreground" }, "Paste any relevant text content below, such as a business plan or executive summary."),
                        React.createElement(textarea_1.Textarea, { placeholder: "Paste your content here...", rows: 8, value: textInput, onChange: function (e) { return setTextInput(e.target.value); } }),
                        React.createElement(button_1.Button, { onClick: handleSubmitText }, "Submit Text")),
                    submittedTexts.length > 0 && (React.createElement("div", { className: "mt-4 space-y-2" },
                        React.createElement("h4", { className: "font-semibold text-muted-foreground" }, "Submitted Texts"),
                        React.createElement("ul", { className: "space-y-2" }, submittedTexts.map(function (text, index) { return (React.createElement("li", { key: index, className: "flex items-center justify-between rounded-md border bg-muted/30 p-2" },
                            React.createElement("div", { className: "flex items-center gap-2 overflow-hidden" },
                                React.createElement(lucide_react_1.Type, { className: "size-5 flex-shrink-0 text-primary" }),
                                React.createElement("p", { className: "truncate text-sm font-medium" }, text)),
                            React.createElement(button_1.Button, { variant: "ghost", size: "icon", onClick: function () { return removeText(index); }, className: "size-6" },
                                React.createElement(lucide_react_1.X, { className: "size-4" })))); }))))))))));
}
exports.DocumentSubmission = DocumentSubmission;
