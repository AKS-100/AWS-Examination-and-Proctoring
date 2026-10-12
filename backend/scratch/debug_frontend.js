import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\Public\\chrome_debug_profile';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  'about:blank',
]);

await new Promise((r) => setTimeout(r, 2000));

const res = await fetch('http://localhost:9222/json');
const targets = await res.json();
const pageTarget = targets.find((t) => t.type === 'page');

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

ws.onopen = () => {
  ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
  ws.send(
    JSON.stringify({
      id: 4,
      method: 'Page.navigate',
      params: { url: 'http://localhost:5173/' },
    })
  );
};

let capturedRootHtml = null;

ws.onmessage = async (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map((a) => a.value || a.description).join(' '));
  } else if (msg.method === 'Runtime.exceptionThrown') {
    console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails);
  }
};

// Wait 3.5s for page to render, then query root HTML
await new Promise((r) => setTimeout(r, 3500));

ws.send(
  JSON.stringify({
    id: 10,
    method: 'Runtime.evaluate',
    params: {
      expression: 'document.getElementById("root").innerHTML',
    },
  })
);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id === 10) {
    capturedRootHtml = msg.result?.result?.value;
    console.log('--- CAPTURED ROOT HTML (First 500 chars) ---');
    console.log(capturedRootHtml ? capturedRootHtml.substring(0, 500) : 'NULL');
    console.log('--- TOTAL HTML LENGTH ---', capturedRootHtml ? capturedRootHtml.length : 0);
  }
};

await new Promise((r) => setTimeout(r, 1500));

chrome.kill();
process.exit(0);
