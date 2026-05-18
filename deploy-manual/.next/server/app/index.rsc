1:"$Sreact.fragment"
2:I[41402,["4909","static/chunks/4909-e2028a99a0e2b550.js","9118","static/chunks/9118-c936a48018427d4d.js","5663","static/chunks/5663-54bc8e4427bf719b.js","7177","static/chunks/app/layout-abb86df51d6755d1.js"],""]
4:I[9677,["4909","static/chunks/4909-e2028a99a0e2b550.js","9118","static/chunks/9118-c936a48018427d4d.js","5663","static/chunks/5663-54bc8e4427bf719b.js","7177","static/chunks/app/layout-abb86df51d6755d1.js"],"BetaBanner"]
5:I[6266,["4909","static/chunks/4909-e2028a99a0e2b550.js","9118","static/chunks/9118-c936a48018427d4d.js","5663","static/chunks/5663-54bc8e4427bf719b.js","7177","static/chunks/app/layout-abb86df51d6755d1.js"],"CopyProtection"]
6:I[51458,["4909","static/chunks/4909-e2028a99a0e2b550.js","9118","static/chunks/9118-c936a48018427d4d.js","5663","static/chunks/5663-54bc8e4427bf719b.js","7177","static/chunks/app/layout-abb86df51d6755d1.js"],"ThemeProvider"]
7:I[9766,[],""]
8:I[50960,["4909","static/chunks/4909-e2028a99a0e2b550.js","2619","static/chunks/2619-04bc32f026a0d946.js","8039","static/chunks/app/error-433098ad60b3f8cd.js"],"default"]
9:I[98924,[],""]
a:I[52619,["2619","static/chunks/2619-04bc32f026a0d946.js","8974","static/chunks/app/page-cc286f0e2c66a688.js"],""]
b:I[18516,["4909","static/chunks/4909-e2028a99a0e2b550.js","9118","static/chunks/9118-c936a48018427d4d.js","5663","static/chunks/5663-54bc8e4427bf719b.js","7177","static/chunks/app/layout-abb86df51d6755d1.js"],"Toaster"]
10:I[57150,[],""]
:HL["/_next/static/css/d9b6897ceeecb62e.css","style"]
3:T555,
    (function () {
      var KEY = '__tca_hydration_recover_once__';
      var PARAM = '__r';
      function alreadyRecovered() {
        try { return sessionStorage.getItem(KEY) === '1'; } catch (_) { return false; }
      }
      function markRecovered() {
        try { sessionStorage.setItem(KEY, '1'); } catch (_) {}
      }
      function recover() {
        if (alreadyRecovered()) return;
        markRecovered();
        try {
          var url = new URL(window.location.href);
          url.searchParams.set(PARAM, Date.now().toString());
          window.location.replace(url.toString());
        } catch (_) {
          window.location.reload();
        }
      }
      function isHydration418(message) {
        return typeof message === 'string' && message.indexOf('Minified React error #418') !== -1;
      }
      window.addEventListener('error', function (event) {
        var message = event && event.error && event.error.message
          ? event.error.message
          : (event && event.message ? event.message : '');
        if (isHydration418(message)) recover();
      }, true);
      window.addEventListener('unhandledrejection', function (event) {
        var reason = event && event.reason;
        var message = reason && reason.message ? reason.message : '';
        if (isHydration418(message)) recover();
      }, true);
    })();
  0:{"P":null,"b":"ecb4YbKP4ZSwWCFOy1Dmp","p":"","c":["",""],"i":false,"f":[[["",{"children":["__PAGE__",{}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/d9b6897ceeecb62e.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":[["$","$L2",null,{"id":"hydration-recovery","strategy":"beforeInteractive","children":"$3"}],["$","link",null,{"rel":"icon","href":"/icon.jpg","type":"image/jpeg"}],["$","link",null,{"rel":"shortcut icon","href":"/icon.jpg","type":"image/jpeg"}],["$","link",null,{"rel":"preconnect","href":"https://fonts.googleapis.com"}],["$","link",null,{"rel":"preconnect","href":"https://fonts.gstatic.com","crossOrigin":"anonymous"}],["$","link",null,{"href":"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap","rel":"stylesheet"}]]}],["$","body",null,{"className":"font-body antialiased","children":[["$","$L4",null,{}],["$","$L5",null,{}],["$","$L6",null,{"attribute":"class","defaultTheme":"dark","enableSystem":true,"disableTransitionOnChange":true,"children":[["$","main",null,{"children":["$","$L7",null,{"parallelRouterKey":"children","error":"$8","errorStyles":[],"errorScripts":[],"template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen flex items-center justify-center bg-gray-50","children":["$","div",null,{"className":"text-center","children":[["$","h1",null,{"className":"text-6xl font-bold text-gray-900 mb-4","children":"404"}],["$","h2",null,{"className":"text-2xl font-semibold text-gray-700 mb-4","children":"Page Not Found"}],["$","p",null,{"className":"text-gray-600 mb-8","children":"The page you're looking for doesn't exist."}],["$","$La",null,{"href":"/","className":"inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors","children":"Return Home"}]]}]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}]}],["$","$Lb",null,{}]]}]]}]]}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","div",null,{"className":"flex flex-col items-center justify-center min-h-screen bg-background","children":["$","div",null,{"className":"text-center p-8","children":[["$","div",null,{"className":"flex justify-center items-center mb-6","children":["$","img",null,{"src":"/TCAVG-Logo-IRR.png","alt":"TCA Venture Group","className":"h-20 w-auto object-contain"}]}],["$","h1",null,{"className":"text-4xl md:text-5xl font-bold font-headline text-primary tracking-tight","children":"Welcome to TCA Investment Readiness Report"}],["$","p",null,{"className":"mt-4 text-lg text-muted-foreground max-w-2xl mx-auto","children":"AI-Powered Startup Analysis"}],"$Lc"]}]}],null,"$Ld"]}],{},null,false]},["$Le",[],[]],false],"$Lf",false]],"m":"$undefined","G":["$10",[]],"s":false,"S":true}
11:I[24431,[],"OutletBoundary"]
13:I[15278,[],"AsyncMetadataOutlet"]
15:I[24431,[],"ViewportBoundary"]
17:I[24431,[],"MetadataBoundary"]
18:"$Sreact.suspense"
c:["$","div",null,{"className":"mt-8 flex justify-center gap-4","children":[["$","$La",null,{"href":"/login","children":[["$","svg",null,{"ref":"$undefined","xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","strokeWidth":2,"strokeLinecap":"round","strokeLinejoin":"round","className":"lucide lucide-log-in mr-2","children":[["$","path","u53s6r",{"d":"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"}],["$","polyline","1ail0h",{"points":"10 17 15 12 10 7"}],["$","line","v6grx8",{"x1":"15","x2":"3","y1":"12","y2":"12"}],"$undefined"]}],"Sign In"],"className":"inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8","ref":null}],["$","$La",null,{"href":"/signup","children":[["$","svg",null,{"ref":"$undefined","xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","strokeWidth":2,"strokeLinecap":"round","strokeLinejoin":"round","className":"lucide lucide-user-plus mr-2","children":[["$","path","1yyitq",{"d":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["$","circle","nufk8",{"cx":"9","cy":"7","r":"4"}],["$","line","1bvyxn",{"x1":"19","x2":"19","y1":"8","y2":"14"}],["$","line","1shjgl",{"x1":"22","x2":"16","y1":"11","y2":"11"}],"$undefined"]}],"Sign Up"],"className":"inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8","ref":null}]]}]
d:["$","$L11",null,{"children":["$L12",["$","$L13",null,{"promise":"$@14"}]]}]
e:["$","div","l",{"className":"container mx-auto p-4 md:p-8 animate-pulse","children":[["$","div",null,{"className":"flex flex-col items-center justify-center mb-12","children":[["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-10 w-3/4 md:w-1/2"}],["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-4 w-full max-w-lg mt-4"}]]}],["$","div",null,{"className":"space-y-8","children":[["$","div",null,{"ref":"$undefined","className":"rounded-lg border bg-card text-card-foreground shadow-sm","children":[["$","div",null,{"ref":"$undefined","className":"flex flex-col space-y-1.5 p-6","children":["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-6 w-1/4"}]}],["$","div",null,{"ref":"$undefined","className":"p-6 pt-0 space-y-6","children":["$","div",null,{"className":"grid grid-cols-1 md:grid-cols-2 gap-6","children":[["$","div",null,{"className":"space-y-2","children":[["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-4 w-1/4"}],["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-10 w-full"}]]}],["$","div",null,{"className":"space-y-2","children":[["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-4 w-1/4"}],["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-10 w-full"}]]}]]}]}]]}],["$","div",null,{"ref":"$undefined","className":"rounded-lg border bg-card text-card-foreground shadow-sm","children":[["$","div",null,{"ref":"$undefined","className":"flex flex-col space-y-1.5 p-6","children":["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-6 w-1/4"}]}],["$","div",null,{"ref":"$undefined","className":"p-6 pt-0","children":["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-32 w-full"}]}]]}],["$","div",null,{"className":"flex justify-end","children":["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-12 w-32"}]}]]}]]}]
f:["$","$1","h",{"children":[null,[["$","$L15",null,{"children":"$L16"}],null],["$","$L17",null,{"children":["$","div",null,{"hidden":true,"children":["$","$18",null,{"fallback":null,"children":"$L19"}]}]}]]}]
16:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
12:null
1a:I[80622,[],"IconMark"]
14:{"metadata":[["$","title","0",{"children":"TCA-IRR APP"}],["$","meta","1",{"name":"description","content":"AI-powered startup evaluation platform."}],["$","link","2",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"16x16"}],["$","link","3",{"rel":"icon","href":"/icon.svg?91c1d48ce20abd27","type":"image/svg+xml","sizes":"any"}],["$","$L1a","4",{}]],"error":null,"digest":"$undefined"}
19:"$14:metadata"
