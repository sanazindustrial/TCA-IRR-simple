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
exports.TwoPhaseUpload = void 0;
var react_1 = require("react");
var card_1 = require("@/components/ui/card");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var textarea_1 = require("@/components/ui/textarea");
var badge_1 = require("@/components/ui/badge");
var tabs_1 = require("@/components/ui/tabs");
var lucide_react_1 = require("lucide-react");
// Helper function to convert file to base64
var fileToBase64 = function (file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            var result = reader.result;
            var base64 = result.split(',')[1] || result;
            resolve(base64);
        };
        reader.onerror = reject;
    });
};
var formatBytes = function (bytes, decimals) {
    if (decimals === void 0) { decimals = 2; }
    if (bytes === 0)
        return '0 Bytes';
    var k = 1024;
    var dm = decimals < 0 ? 0 : decimals;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
function TwoPhaseUpload(_a) {
    var _this = this;
    var _b, _c;
    var uploadedFiles = _a.uploadedFiles, setUploadedFiles = _a.setUploadedFiles, importedUrls = _a.importedUrls, setImportedUrls = _a.setImportedUrls, submittedTexts = _a.submittedTexts, setSubmittedTexts = _a.setSubmittedTexts, onPhaseComplete = _a.onPhaseComplete, companyName = _a.companyName;
    var _d = react_1.useState(1), currentPhase = _d[0], setCurrentPhase = _d[1];
    var _e = react_1.useState(false), pitchDeckUploaded = _e[0], setPitchDeckUploaded = _e[1];
    var _f = react_1.useState(false), isProcessing = _f[0], setIsProcessing = _f[1];
    var _g = react_1.useState(''), urlInput = _g[0], setUrlInput = _g[1];
    var _h = react_1.useState(''), textInput = _h[0], setTextInput = _h[1];
    var pitchDeckInputRef = react_1.useRef(null);
    var additionalFilesInputRef = react_1.useRef(null);
    // Check if pitch deck is already uploaded
    react_1.useEffect(function () {
        var hasPitchDeck = uploadedFiles.some(function (f) {
            return f.name.toLowerCase().includes('pitch') ||
                f.name.toLowerCase().includes('deck') ||
                f.name.toLowerCase().endsWith('.pdf') ||
                f.name.toLowerCase().endsWith('.pptx');
        });
        if (hasPitchDeck) {
            setPitchDeckUploaded(true);
        }
    }, [uploadedFiles]);
    // Handle pitch deck upload (Phase 1) - Only 1 file: PDF, DOCX, or PPTX
    var handlePitchDeckUpload = function (event) { return __awaiter(_this, void 0, void 0, function () {
        var file, ext, validTypes, newFile, textContent, base64Content, response, result, e_1, pitchDeckData, existingFiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(event.target.files && event.target.files.length > 0)) return [3 /*break*/, 11];
                    file = event.target.files[0];
                    ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                    validTypes = ['.pdf', '.docx', '.pptx'];
                    if (!validTypes.includes(ext)) {
                        alert('Only PDF, DOCX, or PPTX files are allowed for the pitch deck.');
                        return [2 /*return*/];
                    }
                    setIsProcessing(true);
                    // Replace any existing pitch deck file
                    setUploadedFiles([]);
                    newFile = { name: file.name, size: file.size };
                    setUploadedFiles([newFile]);
                    textContent = '';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    if (!(file.type === 'application/pdf' || file.name.endsWith('.pdf') ||
                        file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc') ||
                        file.type.includes('presentation') || file.name.endsWith('.pptx') || file.name.endsWith('.ppt'))) return [3 /*break*/, 6];
                    return [4 /*yield*/, fileToBase64(file)];
                case 2:
                    base64Content = _a.sent();
                    return [4 /*yield*/, fetch('https://tcairrapiccontainer.azurewebsites.net/api/v1/analysis/extract-text-from-file', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                content: base64Content,
                                filename: file.name
                            })
                        })];
                case 3:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, response.json()];
                case 4:
                    result = _a.sent();
                    textContent = result.text_content || '';
                    console.log("[Phase 1] Extracted " + textContent.length + " characters from pitch deck: " + file.name);
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, file.text()];
                case 7:
                    textContent = _a.sent();
                    _a.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    e_1 = _a.sent();
                    console.warn('Pitch deck extraction failed:', e_1);
                    textContent = "[Extraction pending for: " + file.name + "]";
                    return [3 /*break*/, 10];
                case 10:
                    pitchDeckData = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        isPitchDeck: true,
                        extracted_data: {
                            text_content: textContent,
                            financial_data: { revenue: 0, burn_rate: 0, runway_months: 0 },
                            key_metrics: { team_size: 0, customers: 0, mrr: 0 }
                        }
                    };
                    existingFiles = JSON.parse(localStorage.getItem('processedFiles') || '[]');
                    localStorage.setItem('processedFiles', JSON.stringify(__spreadArrays(existingFiles, [pitchDeckData])));
                    setPitchDeckUploaded(true);
                    setIsProcessing(false);
                    onPhaseComplete === null || onPhaseComplete === void 0 ? void 0 : onPhaseComplete(1);
                    _a.label = 11;
                case 11: return [2 /*return*/];
            }
        });
    }); };
    // Handle additional file uploads (Phase 2)
    var handleAdditionalFilesUpload = function (event) { return __awaiter(_this, void 0, void 0, function () {
        var files, newFiles_1, processedFiles, existingFiles;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!event.target.files) return [3 /*break*/, 2];
                    files = Array.from(event.target.files);
                    setIsProcessing(true);
                    newFiles_1 = files.map(function (file) { return ({ name: file.name, size: file.size }); });
                    setUploadedFiles(function (prev) { return __spreadArrays(prev, newFiles_1); });
                    return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var textContent, base64Content, response, result, e_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        textContent = '';
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 9, , 10]);
                                        if (!(file.type === 'application/pdf' || file.name.endsWith('.pdf') ||
                                            file.type.includes('word') || file.name.endsWith('.docx'))) return [3 /*break*/, 6];
                                        return [4 /*yield*/, fileToBase64(file)];
                                    case 2:
                                        base64Content = _a.sent();
                                        return [4 /*yield*/, fetch('https://tcairrapiccontainer.azurewebsites.net/api/v1/analysis/extract-text-from-file', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ content: base64Content, filename: file.name })
                                            })];
                                    case 3:
                                        response = _a.sent();
                                        if (!response.ok) return [3 /*break*/, 5];
                                        return [4 /*yield*/, response.json()];
                                    case 4:
                                        result = _a.sent();
                                        textContent = result.text_content || '';
                                        _a.label = 5;
                                    case 5: return [3 /*break*/, 8];
                                    case 6:
                                        if (!(file.type === 'text/plain' || file.type === 'application/json')) return [3 /*break*/, 8];
                                        return [4 /*yield*/, file.text()];
                                    case 7:
                                        textContent = _a.sent();
                                        _a.label = 8;
                                    case 8: return [3 /*break*/, 10];
                                    case 9:
                                        e_2 = _a.sent();
                                        console.warn('File extraction failed:', file.name, e_2);
                                        return [3 /*break*/, 10];
                                    case 10: return [2 /*return*/, {
                                            name: file.name,
                                            size: file.size,
                                            type: file.type,
                                            isPitchDeck: false,
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
    // Handle URL import
    var handleImportUrls = function () {
        if (urlInput.trim()) {
            var urls_1 = urlInput.split('\n').filter(function (url) { return url.trim() !== ''; });
            setImportedUrls(function (prev) { return __spreadArrays(prev, urls_1); });
            setUrlInput('');
            var localProcessed = urls_1.map(function (url) { return ({
                url: url,
                title: "URL Import: " + url,
                extracted_data: {
                    text_content: "[URL content from " + url + "]",
                    metadata: { domain: url.split('/')[2] || url }
                }
            }); });
            var existingUrls = JSON.parse(localStorage.getItem('processedUrls') || '[]');
            localStorage.setItem('processedUrls', JSON.stringify(__spreadArrays(existingUrls, localProcessed)));
        }
    };
    // Handle text submission
    var handleSubmitText = function () {
        if (textInput.trim()) {
            setSubmittedTexts(function (prev) { return __spreadArrays(prev, [textInput]); });
            var processedTexts = JSON.parse(localStorage.getItem('processedTexts') || '[]');
            processedTexts.push({
                content: textInput,
                word_count: textInput.split(' ').length,
                processed_at: new Date().toISOString()
            });
            localStorage.setItem('processedTexts', JSON.stringify(processedTexts));
            setTextInput('');
        }
    };
    var removeFile = function (index) {
        setUploadedFiles(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    var removeUrl = function (index) {
        setImportedUrls(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    var removeText = function (index) {
        setSubmittedTexts(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    };
    var proceedToPhase2 = function () {
        setCurrentPhase(2);
        onPhaseComplete === null || onPhaseComplete === void 0 ? void 0 : onPhaseComplete(1);
    };
    var goBackToPhase1 = function () {
        setCurrentPhase(1);
    };
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement("div", { className: "flex items-center justify-between px-4 py-3 bg-muted/30 rounded-lg" },
            React.createElement("div", { className: "flex items-center gap-4" },
                React.createElement("div", { className: "flex items-center gap-2 " + (currentPhase === 1 ? 'text-primary font-semibold' : pitchDeckUploaded ? 'text-green-600' : 'text-muted-foreground') },
                    React.createElement("div", { className: "w-8 h-8 rounded-full flex items-center justify-center " + (currentPhase === 1 ? 'bg-primary text-primary-foreground' : pitchDeckUploaded ? 'bg-green-600 text-white' : 'bg-muted') }, pitchDeckUploaded ? React.createElement(lucide_react_1.Check, { className: "h-4 w-4" }) : '1'),
                    React.createElement("span", null, "Pitch Deck")),
                React.createElement(lucide_react_1.ChevronRight, { className: "h-5 w-5 text-muted-foreground" }),
                React.createElement("div", { className: "flex items-center gap-2 " + (currentPhase === 2 ? 'text-primary font-semibold' : 'text-muted-foreground') },
                    React.createElement("div", { className: "w-8 h-8 rounded-full flex items-center justify-center " + (currentPhase === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted') }, "2"),
                    React.createElement("span", null, "Additional Content"))),
            React.createElement("div", { className: "text-sm text-muted-foreground" },
                uploadedFiles.length,
                " files \u2022 ",
                importedUrls.length,
                " URLs \u2022 ",
                submittedTexts.length,
                " texts")),
        currentPhase === 1 && (React.createElement(card_1.Card, { className: "shadow-lg border-2 border-primary/20" },
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                    React.createElement(lucide_react_1.FileText, { className: "text-primary h-6 w-6" }),
                    "Phase 1: Upload Pitch Deck"),
                React.createElement(card_1.CardDescription, null, "Upload your company's pitch deck to auto-populate company information and analysis data. This is the primary document for extraction.")),
            React.createElement(card_1.CardContent, { className: "space-y-4" }, !pitchDeckUploaded ? (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-12 text-center transition-all hover:border-primary hover:bg-primary/10", onClick: function () { var _a; return (_a = pitchDeckInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); } },
                    isProcessing ? (React.createElement(React.Fragment, null,
                        React.createElement(lucide_react_1.Loader2, { className: "h-12 w-12 text-primary animate-spin" }),
                        React.createElement("h3", { className: "mt-4 text-lg font-semibold" }, "Processing Pitch Deck..."),
                        React.createElement("p", { className: "mt-1 text-sm text-muted-foreground" }, "Extracting company information and key data"))) : (React.createElement(React.Fragment, null,
                        React.createElement(lucide_react_1.FileUp, { className: "h-12 w-12 text-primary" }),
                        React.createElement("h3", { className: "mt-4 text-lg font-semibold" }, "Upload Pitch Deck"),
                        React.createElement("p", { className: "mt-1 text-sm text-muted-foreground" }, "PDF, PowerPoint (PPTX), or Word document (DOCX) - Max 30MB"),
                        React.createElement("p", { className: "mt-2 text-xs text-primary" }, "Company name, description, and key metrics will be auto-extracted"))),
                    React.createElement(input_1.Input, { type: "file", ref: pitchDeckInputRef, className: "hidden", accept: ".pdf,.pptx,.docx", onChange: handlePitchDeckUpload })),
                React.createElement("p", { className: "text-center text-sm text-muted-foreground" },
                    "Or ",
                    React.createElement("button", { className: "text-primary underline", onClick: proceedToPhase2 }, "skip to additional content"),
                    " if you don't have a pitch deck"))) : (React.createElement("div", { className: "space-y-4" },
                React.createElement("div", { className: "flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800" },
                    React.createElement(lucide_react_1.Check, { className: "h-6 w-6 text-green-600" }),
                    React.createElement("div", null,
                        React.createElement("p", { className: "font-medium text-green-700 dark:text-green-400" }, "Pitch Deck Uploaded"),
                        React.createElement("p", { className: "text-sm text-green-600 dark:text-green-500" }, ((_b = uploadedFiles.find(function (f) { return f.name.toLowerCase().includes('pitch') || f.name.toLowerCase().endsWith('.pdf'); })) === null || _b === void 0 ? void 0 : _b.name) || ((_c = uploadedFiles[0]) === null || _c === void 0 ? void 0 : _c.name)))),
                companyName && (React.createElement("div", { className: "flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800" },
                    React.createElement(lucide_react_1.Building, { className: "h-6 w-6 text-blue-600" }),
                    React.createElement("div", null,
                        React.createElement("p", { className: "font-medium text-blue-700 dark:text-blue-400" }, "Company Detected"),
                        React.createElement("p", { className: "text-sm text-blue-600 dark:text-blue-500" }, companyName)))),
                React.createElement(button_1.Button, { onClick: proceedToPhase2, className: "w-full gap-2" },
                    "Continue to Additional Content ",
                    React.createElement(lucide_react_1.ChevronRight, { className: "h-4 w-4" }))))))),
        currentPhase === 2 && (React.createElement(card_1.Card, { className: "shadow-lg" },
            React.createElement(card_1.CardHeader, null,
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement("div", null,
                        React.createElement(card_1.CardTitle, { className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.FileSearch, { className: "text-primary h-6 w-6" }),
                            "Phase 2: Additional Content"),
                        React.createElement(card_1.CardDescription, null, "Add more files, URLs, or text to enrich the analysis with supplementary data.")),
                    React.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: goBackToPhase1, className: "gap-1" },
                        React.createElement(lucide_react_1.ArrowLeft, { className: "h-4 w-4" }),
                        " Back"))),
            React.createElement(card_1.CardContent, null,
                React.createElement(tabs_1.Tabs, { defaultValue: "files" },
                    React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-3" },
                        React.createElement(tabs_1.TabsTrigger, { value: "files" },
                            React.createElement(lucide_react_1.UploadCloud, { className: "mr-2 h-4 w-4" }),
                            " Files"),
                        React.createElement(tabs_1.TabsTrigger, { value: "urls" },
                            React.createElement(lucide_react_1.Link, { className: "mr-2 h-4 w-4" }),
                            " URLs"),
                        React.createElement(tabs_1.TabsTrigger, { value: "text" },
                            React.createElement(lucide_react_1.Type, { className: "mr-2 h-4 w-4" }),
                            " Text")),
                    React.createElement(tabs_1.TabsContent, { value: "files", className: "space-y-4" },
                        React.createElement("div", { className: "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30", onClick: function () { var _a; return (_a = additionalFilesInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); } },
                            isProcessing ? (React.createElement(lucide_react_1.Loader2, { className: "h-8 w-8 text-primary animate-spin" })) : (React.createElement(lucide_react_1.UploadCloud, { className: "h-8 w-8 text-muted-foreground" })),
                            React.createElement("h3", { className: "mt-2 text-sm font-medium" }, isProcessing ? 'Processing files...' : 'Upload additional files'),
                            React.createElement("p", { className: "mt-1 text-xs text-muted-foreground" }, "Financial reports, market research, cap tables, etc."),
                            React.createElement(input_1.Input, { type: "file", ref: additionalFilesInputRef, className: "hidden", accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.json", onChange: handleAdditionalFilesUpload, multiple: true })),
                        uploadedFiles.length > 0 && (React.createElement("div", { className: "space-y-2" },
                            React.createElement("p", { className: "text-sm font-medium" },
                                "Uploaded Files (",
                                uploadedFiles.length,
                                ")"),
                            uploadedFiles.map(function (file, index) { return (React.createElement("div", { key: index, className: "flex items-center justify-between p-2 bg-muted/50 rounded-md" },
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement(lucide_react_1.FileText, { className: "h-4 w-4 text-muted-foreground" }),
                                    React.createElement("span", { className: "text-sm" }, file.name),
                                    React.createElement(badge_1.Badge, { variant: "outline", className: "text-xs" }, formatBytes(file.size))),
                                React.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: function () { return removeFile(index); } },
                                    React.createElement(lucide_react_1.X, { className: "h-4 w-4" })))); })))),
                    React.createElement(tabs_1.TabsContent, { value: "urls", className: "space-y-4" },
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement(textarea_1.Textarea, { placeholder: "https://example.com/company-page\nhttps://linkedin.com/company/startup\nhttps://crunchbase.com/organization/startup", value: urlInput, onChange: function (e) { return setUrlInput(e.target.value); }, rows: 4 }),
                            React.createElement(button_1.Button, { onClick: handleImportUrls, disabled: !urlInput.trim(), className: "w-full" },
                                React.createElement(lucide_react_1.Link, { className: "mr-2 h-4 w-4" }),
                                " Import URLs")),
                        importedUrls.length > 0 && (React.createElement("div", { className: "space-y-2" },
                            React.createElement("p", { className: "text-sm font-medium" },
                                "Imported URLs (",
                                importedUrls.length,
                                ")"),
                            importedUrls.map(function (url, index) { return (React.createElement("div", { key: index, className: "flex items-center justify-between p-2 bg-muted/50 rounded-md" },
                                React.createElement("a", { href: url, target: "_blank", rel: "noopener noreferrer", className: "text-sm text-primary hover:underline truncate max-w-[80%]" }, url),
                                React.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: function () { return removeUrl(index); } },
                                    React.createElement(lucide_react_1.X, { className: "h-4 w-4" })))); })))),
                    React.createElement(tabs_1.TabsContent, { value: "text", className: "space-y-4" },
                        React.createElement("div", { className: "space-y-2" },
                            React.createElement(textarea_1.Textarea, { placeholder: "Paste company description, news articles, or any relevant text content here...", value: textInput, onChange: function (e) { return setTextInput(e.target.value); }, rows: 6 }),
                            React.createElement(button_1.Button, { onClick: handleSubmitText, disabled: !textInput.trim(), className: "w-full" },
                                React.createElement(lucide_react_1.Type, { className: "mr-2 h-4 w-4" }),
                                " Add Text Content")),
                        submittedTexts.length > 0 && (React.createElement("div", { className: "space-y-2" },
                            React.createElement("p", { className: "text-sm font-medium" },
                                "Submitted Texts (",
                                submittedTexts.length,
                                ")"),
                            submittedTexts.map(function (text, index) { return (React.createElement("div", { key: index, className: "flex items-center justify-between p-2 bg-muted/50 rounded-md" },
                                React.createElement("span", { className: "text-sm truncate max-w-[80%]" },
                                    text.slice(0, 100),
                                    "..."),
                                React.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: function () { return removeText(index); } },
                                    React.createElement(lucide_react_1.X, { className: "h-4 w-4" })))); }))))),
                React.createElement("div", { className: "mt-6 p-4 bg-muted/30 rounded-lg" },
                    React.createElement("p", { className: "text-sm text-center text-muted-foreground" }, "All content will be analyzed together with the pitch deck for comprehensive company evaluation.")))))));
}
exports.TwoPhaseUpload = TwoPhaseUpload;
