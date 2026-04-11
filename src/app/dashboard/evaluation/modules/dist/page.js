'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var react_1 = require("react");
var button_1 = require("@/components/ui/button");
var card_1 = require("@/components/ui/card");
var table_1 = require("@/components/ui/table");
var lucide_react_1 = require("lucide-react");
var link_1 = require("next/link");
var switch_1 = require("@/components/ui/switch");
var navigation_1 = require("next/navigation");
var use_toast_1 = require("@/hooks/use-toast");
var input_1 = require("@/components/ui/input");
var dropdown_menu_1 = require("@/components/ui/dropdown-menu");
var allModules = [
    { id: 'tca', name: 'TCA Scorecard', description: 'Central evaluation across fundamental categories.', status: 'active', version: '2.1', link: '/dashboard/evaluation/modules/tca' },
    { id: 'risk', name: 'Risk Assessment', description: 'Risk analysis across 14 domains.', status: 'active', version: '1.8', link: '/dashboard/evaluation/modules/risk' },
    { id: 'benchmark', name: 'Benchmark Comparison', description: 'Performance vs. sector averages.', status: 'active', version: '1.5', link: '/dashboard/evaluation/modules/benchmark' },
    { id: 'macro', name: 'Macro Trend Analysis', description: 'PESTEL analysis and trend scores.', status: 'active', version: '1.2', link: '/dashboard/evaluation/modules/macro' },
    { id: 'gap', name: 'Gap Analysis', description: 'Identify performance gaps.', status: 'active', version: '2.0', link: '/dashboard/evaluation/modules/gap' },
    { id: 'growth', name: 'Growth Classification', description: 'Predict growth potential.', status: 'active', version: '3.1', link: '/dashboard/evaluation/modules/growth' },
    { id: 'founderFit', name: 'Founder Fit Analysis', description: 'Investor matching & readiness.', status: 'active', version: '1.0', link: '/dashboard/evaluation/modules/founderFit' },
    { id: 'team', name: 'Team Assessment', description: 'Analyze founder and team strength.', status: 'active', version: '1.4', link: '/dashboard/evaluation/modules/team' },
    { id: 'strategicFit', name: 'Strategic Fit Matrix', description: 'Align with strategic pathways.', status: 'active', version: '1.1', link: '/dashboard/evaluation/modules/strategicFit' },
];
function ModuleControlDeck() {
    var _this = this;
    var _a = react_1.useState(allModules), modules = _a[0], setModules = _a[1];
    var _b = react_1.useState(''), newModuleName = _b[0], setNewModuleName = _b[1];
    var _c = react_1.useState(''), newModuleDesc = _c[0], setNewModuleDesc = _c[1];
    var _d = react_1.useState(''), addModuleError = _d[0], setAddModuleError = _d[1];
    var router = navigation_1.useRouter();
    var toast = use_toast_1.useToast().toast;
    var _e = react_1.useState(false), isLoading = _e[0], setIsLoading = _e[1];
    var fileInputRef = react_1.useRef(null);
    react_1.useEffect(function () {
        try {
            var savedModules = localStorage.getItem('module-deck-config');
            if (savedModules) {
                setModules(JSON.parse(savedModules));
            }
            else {
                setModules(allModules);
            }
        }
        catch (error) {
            console.error("Failed to parse modules from localStorage", error);
            setModules(allModules);
        }
    }, []);
    var handleToggle = function (id) {
        var _a, _b;
        var updatedModules = modules.map(function (m) {
            return m.id === id
                ? __assign(__assign({}, m), { status: m.status === 'active' ? 'inactive' : 'active' }) : m;
        });
        setModules(updatedModules);
        localStorage.setItem('module-deck-config', JSON.stringify(updatedModules));
        toast({
            title: 'Configuration Updated',
            description: "Module \"" + ((_a = updatedModules.find(function (m) { return m.id === id; })) === null || _a === void 0 ? void 0 : _a.name) + "\" has been " + (((_b = updatedModules.find(function (m) { return m.id === id; })) === null || _b === void 0 ? void 0 : _b.status) === 'active' ? 'activated' : 'deactivated') + "."
        });
    };
    var handleAddModule = function () {
        if (!newModuleName.trim() || !newModuleDesc.trim()) {
            setAddModuleError('Module name and description are required.');
            return;
        }
        setAddModuleError('');
        var newModule = {
            id: "custom-" + Date.now(),
            name: newModuleName,
            description: newModuleDesc,
            status: 'active',
            version: '1.0',
            link: "/dashboard/evaluation/modules/custom-" + Date.now()
        };
        var updatedModules = __spreadArrays([newModule], modules);
        setModules(updatedModules);
        localStorage.setItem('module-deck-config', JSON.stringify(updatedModules));
        setNewModuleName('');
        setNewModuleDesc('');
        toast({ title: 'Module Added', description: newModule.name + " has been added." });
    };
    var handleRemoveModule = function (id) {
        var updatedModules = modules.filter(function (m) { return m.id !== id; });
        setModules(updatedModules);
        localStorage.setItem('module-deck-config', JSON.stringify(updatedModules));
        toast({ title: 'Module Removed', variant: 'destructive' });
    };
    var handleRunAnalysis = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            setIsLoading(true);
            toast({
                title: 'Starting Analysis...',
                description: 'Navigating to run page to process active modules.'
            });
            try {
                // Store framework and navigate to run page (NOT what-if)
                // Run page will load only active modules from settings
                localStorage.setItem('analysisFramework', 'general');
                router.push('/analysis/run');
            }
            catch (error) {
                console.error('Failed to run analysis:', error);
                toast({
                    variant: 'destructive',
                    title: 'Analysis Failed',
                    description: error instanceof Error ? error.message : 'An unknown error occurred.'
                });
            }
            finally {
                setIsLoading(false);
            }
            return [2 /*return*/];
        });
    }); };
    var handleBulkAction = function (action) {
        var newStatus = action === 'activate' ? 'active' : 'inactive';
        var updatedModules = modules.map(function (m) { return (__assign(__assign({}, m), { status: newStatus })); });
        setModules(updatedModules);
        localStorage.setItem('module-deck-config', JSON.stringify(updatedModules));
        toast({
            title: "Bulk Action: " + (action === 'activate' ? 'Activated' : 'Deactivated') + " All",
            description: "All modules have been set to " + newStatus + "."
        });
    };
    var handleFileImport = function (event) {
        var _a;
        var file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        var reader = new FileReader();
        reader.onload = function (e) {
            var _a;
            try {
                var content = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
                var newModule = JSON.parse(content);
                if (newModule.name && newModule.description) {
                    var fullNewModule = __assign({ id: "custom-import-" + Date.now(), status: 'active', version: '1.0', link: "/dashboard/evaluation/modules/custom-import-" + Date.now() }, newModule);
                    var updatedModules = __spreadArrays([fullNewModule], modules);
                    setModules(updatedModules);
                    localStorage.setItem('module-deck-config', JSON.stringify(updatedModules));
                    toast({ title: 'Module Imported', description: "Successfully imported \"" + newModule.name + "\"." });
                }
                else {
                    throw new Error('JSON must contain "name" and "description" fields.');
                }
            }
            catch (error) {
                toast({ variant: 'destructive', title: 'Import Failed', description: error instanceof Error ? error.message : 'Invalid JSON format.' });
            }
        };
        reader.readAsText(file);
    };
    var activeModulesCount = modules.filter(function (m) { return m.status === 'active'; }).length;
    return (React.createElement("div", { className: "container mx-auto p-4 md:p-8" },
        React.createElement("header", { className: "mb-8" },
            React.createElement(link_1["default"], { href: "/dashboard/evaluation", className: "flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4" },
                React.createElement(lucide_react_1.ArrowLeft, { className: "size-4" }),
                "Back to Analysis Setup"),
            React.createElement("div", { className: 'flex items-center justify-between' },
                React.createElement("div", null,
                    React.createElement("h1", { className: "text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight" }, "Module Control Deck & Bulk Editor"),
                    React.createElement("p", { className: "mt-4 text-lg text-muted-foreground max-w-3xl" }, "Manage modules, run analysis, and access advanced configuration tools.")),
                React.createElement("div", { className: 'flex items-center gap-2' },
                    React.createElement(dropdown_menu_1.DropdownMenu, null,
                        React.createElement(dropdown_menu_1.DropdownMenuTrigger, { asChild: true },
                            React.createElement(button_1.Button, { size: "lg", variant: "outline" },
                                React.createElement(lucide_react_1.SlidersHorizontal, null),
                                " Bulk Actions")),
                        React.createElement(dropdown_menu_1.DropdownMenuContent, null,
                            React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: function () { return handleBulkAction('activate'); } }, "Activate All Modules"),
                            React.createElement(dropdown_menu_1.DropdownMenuItem, { onClick: function () { return handleBulkAction('deactivate'); } }, "Deactivate All Modules"))),
                    React.createElement(button_1.Button, { size: "lg", onClick: handleRunAnalysis, disabled: isLoading },
                        React.createElement(lucide_react_1.BrainCircuit, { className: "mr-2" }),
                        " ",
                        isLoading ? 'Analyzing...' : 'Run Full Analysis')))),
        React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" },
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, null,
                    React.createElement(card_1.CardTitle, { className: "text-lg flex items-center gap-2" },
                        React.createElement(lucide_react_1.MessageSquareQuote, null),
                        " Analyst Tools")),
                React.createElement(card_1.CardContent, null,
                    React.createElement(button_1.Button, { asChild: true, className: "w-full justify-start" },
                        React.createElement(link_1["default"], { href: "/analysis/modules/Analyst" },
                            React.createElement(lucide_react_1.MessageSquareQuote, null),
                            " Analyst Analysis & Manual Input")))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, null,
                    React.createElement(card_1.CardTitle, { className: "text-lg flex items-center gap-2" },
                        React.createElement(lucide_react_1.Calculator, null),
                        " Simulation Tools")),
                React.createElement(card_1.CardContent, null,
                    React.createElement(button_1.Button, { asChild: true, className: "w-full justify-start" },
                        React.createElement(link_1["default"], { href: "/analysis/what-if" },
                            React.createElement(lucide_react_1.Calculator, null),
                            " What-If Analysis")))),
            React.createElement(card_1.Card, null,
                React.createElement(card_1.CardHeader, null,
                    React.createElement(card_1.CardTitle, { className: "text-lg flex items-center gap-2" },
                        React.createElement(lucide_react_1.FileCog, null),
                        " Report Tools")),
                React.createElement(card_1.CardContent, null,
                    React.createElement(button_1.Button, { asChild: true, className: "w-full justify-start" },
                        React.createElement(link_1["default"], { href: "/dashboard/reports/configure" },
                            React.createElement(lucide_react_1.FileCog, null),
                            " Report Section Config"))))),
        React.createElement(card_1.Card, { className: "mb-8" },
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "Add New Module"),
                React.createElement(card_1.CardDescription, null, "Add a custom module to the evaluation workflow manually or by importing a JSON file.")),
            React.createElement(card_1.CardContent, null,
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
                    React.createElement(input_1.Input, { placeholder: "Module Name", value: newModuleName, onChange: function (e) { return setNewModuleName(e.target.value); } }),
                    React.createElement(input_1.Input, { placeholder: "Module Description", value: newModuleDesc, onChange: function (e) { return setNewModuleDesc(e.target.value); } }),
                    React.createElement("div", { className: "flex gap-2" },
                        React.createElement(button_1.Button, { onClick: handleAddModule, className: "flex-1" },
                            React.createElement(lucide_react_1.Plus, { className: "mr-2" }),
                            " Add Module"),
                        React.createElement(button_1.Button, { variant: "outline", onClick: function () { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, className: "flex-1" },
                            React.createElement(lucide_react_1.Import, { className: "mr-2" }),
                            " Import JSON"),
                        React.createElement("input", { type: "file", ref: fileInputRef, onChange: handleFileImport, className: "hidden", accept: ".json", "aria-label": "Import module configuration from JSON file" }))),
                addModuleError && React.createElement("p", { className: "text-sm text-destructive mt-2" }, addModuleError))),
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, { className: 'flex justify-between items-center' },
                    React.createElement("span", null, "Analysis Modules"),
                    React.createElement("div", { className: 'flex items-center gap-4 text-sm' },
                        React.createElement("span", { className: 'text-muted-foreground' },
                            "Active Modules: ",
                            activeModulesCount,
                            " / ",
                            modules.length))),
                React.createElement(card_1.CardDescription, null, "Toggle modules on or off for the next analysis run. Click the edit icon to access its specific configuration page.")),
            React.createElement(card_1.CardContent, null,
                React.createElement(table_1.Table, null,
                    React.createElement(table_1.TableHeader, null,
                        React.createElement(table_1.TableRow, null,
                            React.createElement(table_1.TableHead, { className: 'w-[80px]' }, "Status"),
                            React.createElement(table_1.TableHead, null, "Module"),
                            React.createElement(table_1.TableHead, null, "Description"),
                            React.createElement(table_1.TableHead, { className: "text-right" }, "Actions"))),
                    React.createElement(table_1.TableBody, null, modules.map(function (mod) { return (React.createElement(table_1.TableRow, { key: mod.id, className: mod.status === 'inactive' ? 'opacity-40' : '' },
                        React.createElement(table_1.TableCell, null,
                            React.createElement(switch_1.Switch, { checked: mod.status === 'active', onCheckedChange: function () { return handleToggle(mod.id); } })),
                        React.createElement(table_1.TableCell, { className: "font-semibold" },
                            mod.name,
                            React.createElement("span", { className: "ml-2 text-xs text-muted-foreground font-mono" },
                                "v",
                                mod.version)),
                        React.createElement(table_1.TableCell, { className: "text-muted-foreground text-xs" }, mod.description),
                        React.createElement(table_1.TableCell, { className: "text-right" },
                            React.createElement(button_1.Button, { asChild: true, variant: "ghost", size: "icon" },
                                React.createElement(link_1["default"], { href: mod.link },
                                    React.createElement(lucide_react_1.Edit, { className: "size-4" }))),
                            React.createElement(button_1.Button, { variant: "ghost", size: "icon", onClick: function () { return handleRemoveModule(mod.id); } },
                                React.createElement(lucide_react_1.Trash2, { className: "size-4 text-destructive" }))))); })))))));
}
exports["default"] = ModuleControlDeck;
