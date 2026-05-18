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
c:I[81959,[],"ClientPageRoot"]
d:I[70017,["4909","static/chunks/4909-e2028a99a0e2b550.js","2619","static/chunks/2619-04bc32f026a0d946.js","9708","static/chunks/9708-78c06c142fbdf5ad.js","2186","static/chunks/2186-b39826d7a647fe50.js","4520","static/chunks/app/login/page-f33bc642cd93a0e5.js"],"default"]
10:I[24431,[],"OutletBoundary"]
12:I[15278,[],"AsyncMetadataOutlet"]
17:I[57150,[],""]
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
  0:{"P":null,"b":"ecb4YbKP4ZSwWCFOy1Dmp","p":"","c":["","login"],"i":false,"f":[[["",{"children":["login",{"children":["__PAGE__",{}]}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/d9b6897ceeecb62e.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"en","suppressHydrationWarning":true,"children":[["$","head",null,{"children":[["$","$L2",null,{"id":"hydration-recovery","strategy":"beforeInteractive","children":"$3"}],["$","link",null,{"rel":"icon","href":"/icon.jpg","type":"image/jpeg"}],["$","link",null,{"rel":"shortcut icon","href":"/icon.jpg","type":"image/jpeg"}],["$","link",null,{"rel":"preconnect","href":"https://fonts.googleapis.com"}],["$","link",null,{"rel":"preconnect","href":"https://fonts.gstatic.com","crossOrigin":"anonymous"}],["$","link",null,{"href":"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap","rel":"stylesheet"}]]}],["$","body",null,{"className":"font-body antialiased","children":[["$","$L4",null,{}],["$","$L5",null,{}],["$","$L6",null,{"attribute":"class","defaultTheme":"dark","enableSystem":true,"disableTransitionOnChange":true,"children":[["$","main",null,{"children":["$","$L7",null,{"parallelRouterKey":"children","error":"$8","errorStyles":[],"errorScripts":[],"template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[["$","div",null,{"className":"min-h-screen flex items-center justify-center bg-gray-50","children":["$","div",null,{"className":"text-center","children":[["$","h1",null,{"className":"text-6xl font-bold text-gray-900 mb-4","children":"404"}],["$","h2",null,{"className":"text-2xl font-semibold text-gray-700 mb-4","children":"Page Not Found"}],["$","p",null,{"className":"text-gray-600 mb-8","children":"The page you're looking for doesn't exist."}],["$","$La",null,{"href":"/","className":"inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors","children":"Return Home"}]]}]}],[]],"forbidden":"$undefined","unauthorized":"$undefined"}]}],["$","$Lb",null,{}]]}]]}]]}]]}],{"children":["login",["$","$1","c",{"children":[null,["$","$L7",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L9",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","$Lc",null,{"Component":"$d","searchParams":{},"params":{},"promises":["$@e","$@f"]}],null,["$","$L10",null,{"children":["$L11",["$","$L12",null,{"promise":"$@13"}]]}]]}],{},null,false]},null,false]},[["$","div","l",{"className":"container mx-auto p-4 md:p-8 animate-pulse","children":[["$","div",null,{"className":"flex flex-col items-center justify-center mb-12","children":[["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-10 w-3/4 md:w-1/2"}],"$L14"]}],"$L15"]}],[],[]],false],"$L16",false]],"m":"$undefined","G":["$17",[]],"s":false,"S":true}
18:I[24431,[],"ViewportBoundary"]
1a:I[24431,[],"MetadataBoundary"]
1b:"$Sreact.suspense"
14:["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-4 w-full max-w-lg mt-4"}]
15:["$","div",null,{"className":"space-y-8","children":[["$","div",null,{"ref":"$undefined","className":"rounded-lg border bg-card text-card-foreground shadow-sm","children":[["$","div",null,{"ref":"$undefined","className":"flex flex-col space-y-1.5 p-6","children":["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-6 w-1/4"}]}],["$","div",null,{"ref":"$undefined","className":"p-6 pt-0 space-y-6","children":["$","div",null,{"className":"grid grid-cols-1 md:grid-cols-2 gap-6","children":[["$","div",null,{"className":"space-y-2","children":[["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-4 w-1/4"}],["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-10 w-full"}]]}],["$","div",null,{"className":"space-y-2","children":[["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-4 w-1/4"}],["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-10 w-full"}]]}]]}]}]]}],["$","div",null,{"ref":"$undefined","className":"rounded-lg border bg-card text-card-foreground shadow-sm","children":[["$","div",null,{"ref":"$undefined","className":"flex flex-col space-y-1.5 p-6","children":["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-6 w-1/4"}]}],["$","div",null,{"ref":"$undefined","className":"p-6 pt-0","children":["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-32 w-full"}]}]]}],["$","div",null,{"className":"flex justify-end","children":["$","div",null,{"className":"animate-pulse rounded-md bg-muted h-12 w-32"}]}]]}]
16:["$","$1","h",{"children":[null,[["$","$L18",null,{"children":"$L19"}],null],["$","$L1a",null,{"children":["$","div",null,{"hidden":true,"children":["$","$1b",null,{"fallback":null,"children":"$L1c"}]}]}]]}]
e:{}
f:"$0:f:0:1:2:children:2:children:1:props:children:0:props:params"
19:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
11:null
1d:I[80622,[],"IconMark"]
13:{"metadata":[["$","title","0",{"children":"TCA-IRR APP"}],["$","meta","1",{"name":"description","content":"AI-powered startup evaluation platform."}],["$","link","2",{"rel":"icon","href":"/favicon.ico","type":"image/x-icon","sizes":"16x16"}],["$","link","3",{"rel":"icon","href":"/icon.svg?91c1d48ce20abd27","type":"image/svg+xml","sizes":"any"}],["$","$L1d","4",{}]],"error":null,"digest":"$undefined"}
1c:"$13:metadata"
