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
var navigation_1 = require("next/navigation");
var button_1 = require("@/components/ui/button");
var card_1 = require("@/components/ui/card");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var link_1 = require("next/link");
var lucide_react_1 = require("lucide-react");
var use_toast_1 = require("@/hooks/use-toast");
var API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
function ForgotPasswordPage() {
    var _this = this;
    var _a = react_1.useState(''), email = _a[0], setEmail = _a[1];
    var _b = react_1.useState(false), isLoading = _b[0], setIsLoading = _b[1];
    var router = navigation_1.useRouter();
    var toast = use_toast_1.useToast().toast;
    var handlePasswordReset = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!email) {
                        toast({
                            variant: 'destructive',
                            title: 'Request Failed',
                            description: 'Please enter your email address.'
                        });
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch(API_BASE_URL + "/auth/forgot-password", {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ email: email })
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    toast({
                        title: 'Reset Link Sent',
                        description: data.message || 'If an account exists for that email, a password reset link has been sent.'
                    });
                    router.push('/login');
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    // Always show success message to prevent email enumeration
                    toast({
                        title: 'Reset Link Sent',
                        description: 'If an account exists for that email, a password reset link has been sent.'
                    });
                    router.push('/login');
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (React.createElement("div", { className: "flex items-center justify-center min-h-screen bg-background p-4" },
        React.createElement(card_1.Card, { className: "w-full max-w-md shadow-2xl" },
            React.createElement(card_1.CardHeader, { className: "text-center" },
                React.createElement("div", { className: "flex justify-center items-center mb-4" },
                    React.createElement("div", { className: "bg-primary/10 border-2 border-primary/20 p-4 rounded-xl" },
                        React.createElement(lucide_react_1.KeyRound, { className: "text-primary size-8" }))),
                React.createElement(card_1.CardTitle, { className: "text-3xl font-bold tracking-tight" }, "Forgot Password?"),
                React.createElement(card_1.CardDescription, null, "No worries, we'll send you reset instructions.")),
            React.createElement(card_1.CardContent, null,
                React.createElement("form", { onSubmit: handlePasswordReset, className: "space-y-6" },
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement(label_1.Label, { htmlFor: "email" }, "Email Address"),
                        React.createElement("div", { className: "relative" },
                            React.createElement(lucide_react_1.Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
                            React.createElement(input_1.Input, { id: "email", type: "email", placeholder: "Enter your email", required: true, className: "pl-10", value: email, onChange: function (e) { return setEmail(e.target.value); }, disabled: isLoading }))),
                    React.createElement(button_1.Button, { type: "submit", className: "w-full bg-gradient-to-r from-primary to-accent text-lg h-12", disabled: isLoading }, isLoading ? (React.createElement(React.Fragment, null,
                        React.createElement(lucide_react_1.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                        "Sending...")) : ('Send Reset Link'))),
                React.createElement("div", { className: "mt-6 text-center text-sm" },
                    React.createElement(link_1["default"], { href: "/login", className: "font-semibold text-primary hover:underline flex items-center justify-center gap-2" },
                        React.createElement(lucide_react_1.ArrowLeft, { className: "size-4" }),
                        "Back to Sign In"))))));
}
exports["default"] = ForgotPasswordPage;
