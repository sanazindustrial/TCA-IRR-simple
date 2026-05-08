'use client';
"use strict";
exports.__esModule = true;
exports.SidebarMenuClient = void 0;
var navigation_1 = require("next/navigation");
var sidebar_1 = require("@/components/ui/sidebar");
var lucide_react_1 = require("lucide-react");
var avatar_1 = require("@/components/ui/avatar");
var button_1 = require("@/components/ui/button");
var collapsible_1 = require("@/components/ui/collapsible");
var react_1 = require("react");
var theme_toggle_1 = require("@/components/theme-toggle");
var dropdown_menu_1 = require("@/components/ui/dropdown-menu");
var link_1 = require("next/link");
function SidebarMenuClient(_a) {
    var _b = _a.isFooter, isFooter = _b === void 0 ? false : _b;
    var pathname = navigation_1.usePathname();
    var router = navigation_1.useRouter();
    var _c = react_1.useState(null), user = _c[0], setUser = _c[1];
    var _d = react_1.useState(true), isLoading = _d[0], setIsLoading = _d[1];
    var _e = react_1.useState(pathname.startsWith('/analysis/modules')), modulesOpen = _e[0], setModulesOpen = _e[1];
    react_1.useEffect(function () {
        var updateUser = function () {
            var storedUser = localStorage.getItem('loggedInUser');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            else if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/forgot-password' && pathname !== '/') {
                router.push('/login');
            }
            setIsLoading(false);
        };
        updateUser();
        // Listen for storage changes to update user info
        window.addEventListener('storage', updateUser);
        return function () {
            window.removeEventListener('storage', updateUser);
        };
    }, [router, pathname]);
    if (isLoading && !isFooter) {
        return null; // Don't render main menu during loading to avoid flicker
    }
    if (isFooter && !user) {
        return null; // Don't render footer if no user
    }
    var userRole = (user === null || user === void 0 ? void 0 : user.role.toLowerCase()) || 'user';
    var isPrivilegedUser = userRole === 'admin' || userRole === 'analyst';
    if (isFooter) {
        return (React.createElement(sidebar_1.SidebarMenu, null,
            React.createElement(sidebar_1.SidebarMenuItem, null,
                React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/help", isActive: pathname === '/dashboard/help', tooltip: "Help & Support" },
                    React.createElement(lucide_react_1.HelpCircle, null),
                    React.createElement("span", null, "Help & Support"))),
            React.createElement(sidebar_1.SidebarMenuItem, null,
                React.createElement(dropdown_menu_1.DropdownMenu, null,
                    React.createElement(dropdown_menu_1.DropdownMenuTrigger, { asChild: true },
                        React.createElement(button_1.Button, { variant: "ghost", className: "w-full justify-start gap-2 px-2" },
                            React.createElement(avatar_1.Avatar, { className: "size-6" },
                                React.createElement(avatar_1.AvatarImage, { src: (user === null || user === void 0 ? void 0 : user.avatar) || "https://images.unsplash.com/photo-1513279922550-250c2ce8a813?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjM3NDE5OH0" }),
                                React.createElement(avatar_1.AvatarFallback, null, user === null || user === void 0 ? void 0 : user.name.charAt(0))),
                            React.createElement("span", { className: "text-sidebar-foreground text-sm group-data-[collapsible=icon]:hidden" }, (user === null || user === void 0 ? void 0 : user.name) || 'Current User'))),
                    React.createElement(dropdown_menu_1.DropdownMenuContent, { side: "right", align: "start" },
                        React.createElement(dropdown_menu_1.DropdownMenuItem, { asChild: true },
                            React.createElement(link_1["default"], { href: "/dashboard/profile" },
                                React.createElement(lucide_react_1.User, { className: "mr-2" }),
                                " Profile")),
                        React.createElement(dropdown_menu_1.DropdownMenuItem, { asChild: true },
                            React.createElement(link_1["default"], { href: "/dashboard/settings" },
                                React.createElement(lucide_react_1.Settings, { className: "mr-2" }),
                                " Settings")),
                        React.createElement(dropdown_menu_1.DropdownMenuSeparator, null),
                        React.createElement("div", { className: 'px-2 py-1.5 text-sm' },
                            React.createElement("div", { className: 'w-full flex justify-between items-center' },
                                React.createElement("span", null, "Theme"),
                                React.createElement(theme_toggle_1.ThemeToggle, null)))))),
            React.createElement(sidebar_1.SidebarMenuItem, null,
                React.createElement(sidebar_1.SidebarMenuButton, { href: "/logout", tooltip: "Logout" },
                    React.createElement(lucide_react_1.LogOut, null),
                    React.createElement("span", null, "Logout")))));
    }
    return (React.createElement(sidebar_1.SidebarContent, null,
        React.createElement(sidebar_1.SidebarMenu, null,
            React.createElement(sidebar_1.SidebarMenuItem, null,
                React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard", isActive: pathname === '/dashboard', tooltip: "Dashboard" },
                    React.createElement(lucide_react_1.LayoutDashboard, null),
                    React.createElement("span", null, "Dashboard"))),
            React.createElement(sidebar_1.SidebarMenuItem, null,
                React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/evaluation", isActive: pathname === '/dashboard/evaluation', tooltip: "Company Analysis" },
                    React.createElement(lucide_react_1.Upload, null),
                    React.createElement("span", null, "Company Analysis"))),
            React.createElement(sidebar_1.SidebarMenuItem, null,
                React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/reports", isActive: pathname === '/dashboard/reports', tooltip: "Reports" },
                    React.createElement(lucide_react_1.FileText, null),
                    React.createElement("span", null, "Reports")))),
        React.createElement(sidebar_1.SidebarSeparator, null),
        React.createElement(sidebar_1.SidebarGroup, null,
            React.createElement(sidebar_1.SidebarGroupLabel, null, "Analysis Modules"),
            React.createElement(sidebar_1.SidebarMenu, null,
                React.createElement(collapsible_1.Collapsible, { open: modulesOpen, onOpenChange: setModulesOpen, className: "group/collapsible" },
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(collapsible_1.CollapsibleTrigger, { asChild: true },
                            React.createElement(sidebar_1.SidebarMenuButton, { tooltip: "Analysis Modules" },
                                React.createElement(lucide_react_1.Layers, null),
                                React.createElement("span", null, "Modules"),
                                React.createElement(lucide_react_1.ChevronDown, { className: "ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" }))),
                        React.createElement(collapsible_1.CollapsibleContent, null,
                            React.createElement(sidebar_1.SidebarMenuSub, null,
                                React.createElement(sidebar_1.SidebarMenuSubItem, null,
                                    React.createElement(sidebar_1.SidebarMenuSubButton, { href: "/analysis/modules/tca", isActive: pathname === '/analysis/modules/tca' },
                                        React.createElement(lucide_react_1.BarChart3, { className: "size-4" }),
                                        React.createElement("span", null, "TCA Scorecard"))),
                                React.createElement(sidebar_1.SidebarMenuSubItem, null,
                                    React.createElement(sidebar_1.SidebarMenuSubButton, { href: "/analysis/modules/risk", isActive: pathname === '/analysis/modules/risk' },
                                        React.createElement(lucide_react_1.Shield, { className: "size-4" }),
                                        React.createElement("span", null, "Risk Assessment"))),
                                React.createElement(sidebar_1.SidebarMenuSubItem, null,
                                    React.createElement(sidebar_1.SidebarMenuSubButton, { href: "/analysis/modules/macro", isActive: pathname === '/analysis/modules/macro' },
                                        React.createElement(lucide_react_1.TrendingUp, { className: "size-4" }),
                                        React.createElement("span", null, "Macro Trend Analysis"))),
                                React.createElement(sidebar_1.SidebarMenuSubItem, null,
                                    React.createElement(sidebar_1.SidebarMenuSubButton, { href: "/analysis/modules/team", isActive: pathname === '/analysis/modules/team' },
                                        React.createElement(lucide_react_1.Users2, { className: "size-4" }),
                                        React.createElement("span", null, "Team Assessment"))),
                                React.createElement(sidebar_1.SidebarMenuSubItem, null,
                                    React.createElement(sidebar_1.SidebarMenuSubButton, { href: "/analysis/modules/benchmark", isActive: pathname === '/analysis/modules/benchmark' },
                                        React.createElement(lucide_react_1.Gauge, { className: "size-4" }),
                                        React.createElement("span", null, "Benchmark Comparison"))),
                                React.createElement(sidebar_1.SidebarMenuSubItem, null,
                                    React.createElement(sidebar_1.SidebarMenuSubButton, { href: "/analysis/modules/growth", isActive: pathname === '/analysis/modules/growth' },
                                        React.createElement(lucide_react_1.Target, { className: "size-4" }),
                                        React.createElement("span", null, "Growth Classifier"))),
                                React.createElement(sidebar_1.SidebarMenuSubItem, null,
                                    React.createElement(sidebar_1.SidebarMenuSubButton, { href: "/analysis/modules/gap", isActive: pathname === '/analysis/modules/gap' },
                                        React.createElement(lucide_react_1.Calculator, { className: "size-4" }),
                                        React.createElement("span", null, "Gap Analysis"))),
                                React.createElement(sidebar_1.SidebarMenuSubItem, null,
                                    React.createElement(sidebar_1.SidebarMenuSubButton, { href: "/analysis/modules/founderFit", isActive: pathname === '/analysis/modules/founderFit' },
                                        React.createElement(lucide_react_1.User, { className: "size-4" }),
                                        React.createElement("span", null, "Founder Fit Analysis"))),
                                React.createElement(sidebar_1.SidebarMenuSubItem, null,
                                    React.createElement(sidebar_1.SidebarMenuSubButton, { href: "/analysis/modules/strategicFit", isActive: pathname === '/analysis/modules/strategicFit' },
                                        React.createElement(lucide_react_1.Target, { className: "size-4" }),
                                        React.createElement("span", null, "Strategic Fit Matrix"))),
                                React.createElement(sidebar_1.SidebarMenuSubItem, null,
                                    React.createElement(sidebar_1.SidebarMenuSubButton, { href: "/analysis/what-if", isActive: pathname === '/analysis/what-if' },
                                        React.createElement(lucide_react_1.Lightbulb, { className: "size-4" }),
                                        React.createElement("span", null, "Simulation"))))))))),
        React.createElement(sidebar_1.SidebarGroup, null,
            React.createElement(sidebar_1.SidebarGroupLabel, null, "User Tools"),
            React.createElement(sidebar_1.SidebarMenu, null,
                React.createElement(sidebar_1.SidebarMenuItem, null,
                    React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/request", isActive: pathname === '/dashboard/request', tooltip: "Submit Request to Admin" },
                        React.createElement(lucide_react_1.Send, null),
                        React.createElement("span", null, "Submit Request to Admin"))),
                React.createElement(sidebar_1.SidebarMenuItem, null,
                    React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/my-requests", isActive: pathname === '/dashboard/my-requests', tooltip: "My Requests" },
                        React.createElement(lucide_react_1.Eye, null),
                        React.createElement("span", null, "My Requests"))))),
        isPrivilegedUser && (React.createElement(React.Fragment, null,
            React.createElement(sidebar_1.SidebarGroup, null,
                React.createElement(sidebar_1.SidebarGroupLabel, null, "Analyst Tools"),
                React.createElement(sidebar_1.SidebarMenu, null,
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/analyst", isActive: pathname === '/dashboard/analyst', tooltip: "Analyst Hub" },
                            React.createElement(lucide_react_1.Bell, null),
                            React.createElement("span", null, "Analyst Hub"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/analysis/modules/analyst", isActive: pathname === '/analysis/modules/analyst', tooltip: "Analyst Analysis" },
                            React.createElement(lucide_react_1.MessageSquare, null),
                            React.createElement("span", null, "Analyst Analysis"))))),
            React.createElement(sidebar_1.SidebarGroup, null,
                React.createElement(sidebar_1.SidebarGroupLabel, null, "Administration"),
                React.createElement(sidebar_1.SidebarMenu, null,
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/users", isActive: pathname === '/dashboard/users', tooltip: "User Management" },
                            React.createElement(lucide_react_1.Users, null),
                            React.createElement("span", null, "User Management"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/user-requests", isActive: pathname === '/dashboard/user-requests', tooltip: "User Requests" },
                            React.createElement(lucide_react_1.MessageSquare, null),
                            React.createElement("span", null, "User Requests"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/system-health", isActive: pathname === '/dashboard/system-health', tooltip: "System Health" },
                            React.createElement(lucide_react_1.Activity, null),
                            React.createElement("span", null, "System Health"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/ai-training", isActive: pathname === '/dashboard/ai-training', tooltip: "AI Training" },
                            React.createElement(lucide_react_1.BrainCircuit, null),
                            React.createElement("span", null, "AI Training"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/backup", isActive: pathname === '/dashboard/backup', tooltip: "Backup & Recovery" },
                            React.createElement(lucide_react_1.DatabaseBackup, null),
                            React.createElement("span", null, "Backup & Recovery"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/data-sources", isActive: pathname === '/data-sources', tooltip: "External Links" },
                            React.createElement(lucide_react_1.Link, null),
                            React.createElement("span", null, "External Links"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/cost", isActive: pathname === '/dashboard/cost', tooltip: "Cost Management" },
                            React.createElement(lucide_react_1.DollarSign, null),
                            React.createElement("span", null, "Cost Management"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/database", isActive: pathname === '/dashboard/database', tooltip: "Database Mining" },
                            React.createElement(lucide_react_1.Database, null),
                            React.createElement("span", null, "Database Mining"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/database-integration", isActive: pathname === '/dashboard/database-integration', tooltip: "Database Integration" },
                            React.createElement(lucide_react_1.GitBranch, null),
                            React.createElement("span", null, "Database Integration"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/remote", isActive: pathname === '/dashboard/remote', tooltip: "Remote Integration" },
                            React.createElement(lucide_react_1.GitBranch, null),
                            React.createElement("span", null, "Remote Integration"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/system-config", isActive: pathname === '/dashboard/system-config', tooltip: "System Config" },
                            React.createElement(lucide_react_1.Settings, null),
                            React.createElement("span", null, "System Config"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/module-settings", isActive: pathname === '/dashboard/module-settings', tooltip: "Module Settings" },
                            React.createElement(lucide_react_1.Layers, null),
                            React.createElement("span", null, "Module Settings"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/schema", isActive: pathname === '/dashboard/schema', tooltip: "Schema & Models" },
                            React.createElement(lucide_react_1.FileCode, null),
                            React.createElement("span", null, "Schema & Models"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/reports/configure", isActive: pathname === '/dashboard/reports/configure', tooltip: "Report Configuration" },
                            React.createElement(lucide_react_1.FileText, null),
                            React.createElement("span", null, "Report Configuration"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/ssd-audit", isActive: pathname === '/dashboard/ssd-audit', tooltip: "Startup Steroid Audit" },
                            React.createElement(lucide_react_1.Activity, null),
                            React.createElement("span", null, "Startup Steroid Audit"))),
                    React.createElement(sidebar_1.SidebarMenuItem, null,
                        React.createElement(sidebar_1.SidebarMenuButton, { href: "/dashboard/evaluation/modules", isActive: pathname.startsWith('/analysis/modules'), tooltip: "Complete Admin Config" },
                            React.createElement(lucide_react_1.Settings, null),
                            React.createElement("span", null, "Module Control Deck")))))))));
}
exports.SidebarMenuClient = SidebarMenuClient;
