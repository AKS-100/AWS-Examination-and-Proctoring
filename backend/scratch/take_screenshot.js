import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\Public\\chrome_debug_profile';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--window-size=1280,900',
  'about:blank',
]);

await new Promise((r) => setTimeout(r, 2000));

const res = await fetch('http://localhost:9222/json');
const targets = await res.json();
const pageTarget = targets.find((t) => t.type === 'page');

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

ws.onopen = () => {
  ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
  ws.send(
    JSON.stringify({
      id: 2,
      method: 'Page.navigate',
      params: { url: 'http://localhost:5173/login' },
    })
  );
};

await new Promise((r) => setTimeout(r, 3500));

ws.send(
  JSON.stringify({
    id: 10,
    method: 'Page.captureScreenshot',
    params: { format: 'png' },
  })
);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id === 10) {
    const buffer = Buffer.from(msg.result.data, 'base64');
    fs.writeFileSync('scratch/login_page_verified.png', buffer);
    console.log('SCREENSHOT SAVED SUCCESSFULLY: scratch/login_page_verified.png');
    chrome.kill();
    process.exit(0);
  }
};
