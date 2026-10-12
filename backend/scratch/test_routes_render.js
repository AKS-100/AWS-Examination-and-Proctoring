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

const errors = [];
ws.onopen = () => {
  ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
  ws.send(
    JSON.stringify({
      id: 3,
      method: 'Page.navigate',
      params: { url: 'http://localhost:5173/' },
    })
  );
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Runtime.exceptionThrown') {
    errors.push(msg.params.exceptionDetails);
    console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
  }
};

await new Promise((r) => setTimeout(r, 3000));

ws.send(
  JSON.stringify({
    id: 10,
    method: 'Runtime.evaluate',
    params: {
      expression: 'document.getElementById("root").innerText',
    },
  })
);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id === 10) {
    console.log('LOGIN RENDERED TEXT:');
    console.log(msg.result?.result?.value);
    console.log('TOTAL EXCEPTION COUNT:', errors.length);
    chrome.kill();
    process.exit(0);
  }
};
