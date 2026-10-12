import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\Public\\chrome_test_ui_profile';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const runBrowserCheck = async () => {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,900',
    'about:blank',
  ]);

  await sleep(2000);

  const res = await fetch('http://localhost:9222/json');
  const targets = await res.json();
  const pageTarget = targets.find((t) => t.type === 'page');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let nextId = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = nextId++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise((r) => {
    ws.onopen = r;
  });

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('1. Navigating to Login Page (http://localhost:5173/login)...');
  await send('Page.navigate', { url: 'http://localhost:5173/login' });
  await sleep(2500);

  // Switch to teacher tab, fill credentials, submit
  console.log('2. Entering Teacher credentials for stasissoftwarepvtltd@gmail.com...');
  await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const setReactValue = (el, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        // Click Teacher button
        const buttons = Array.from(document.querySelectorAll('button'));
        const teacherBtn = buttons.find(b => b.textContent.includes('Teacher'));
        if (teacherBtn) teacherBtn.click();
        
        await new Promise(r => setTimeout(r, 400));
        
        // Fill email and password
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        
        if (emailInput) setReactValue(emailInput, 'stasissoftwarepvtltd@gmail.com');
        if (passInput) setReactValue(passInput, 'Sudhanshu@123');
        
        await new Promise(r => setTimeout(r, 400));
        
        // Click Sign In
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      })();
    `,
  });

  await sleep(4000);

  const teacherUrlRes = await send('Runtime.evaluate', {
    expression: 'window.location.href',
  });
  console.log('Current URL after Teacher Sign In:', teacherUrlRes?.result?.value);

  const teacherScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/teacher_dashboard_verified.png', Buffer.from(teacherScreenshot.data, 'base64'));
  console.log('Saved screenshot: scratch/teacher_dashboard_verified.png');

  // Next, Student Exam Arena test: Sign out teacher first
  console.log('3. Signing out Teacher and logging in as Student...');
  await send('Runtime.evaluate', {
    expression: `
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = 'http://localhost:5173/login';
    `,
  });
  await sleep(2500);

  await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const setReactValue = (el, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        // Select Student tab
        const buttons = Array.from(document.querySelectorAll('button'));
        const studentBtn = buttons.find(b => b.textContent.includes('Student'));
        if (studentBtn) studentBtn.click();
        
        await new Promise(r => setTimeout(r, 400));
        
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        
        if (emailInput) setReactValue(emailInput, 'student@adaptive.edu');
        if (passInput) setReactValue(passInput, 'Student@123');
        
        await new Promise(r => setTimeout(r, 400));
        
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      })();
    `,
  });

  await sleep(3500);

  const studentDashUrl = await send('Runtime.evaluate', {
    expression: 'window.location.href',
  });
  console.log('Current URL after Student Sign In:', studentDashUrl?.result?.value);

  // Navigate to mock exam by clicking the Start Exam link on the student dashboard
  console.log('4. Clicking "Start Exam" link on Student Dashboard...');
  await send('Runtime.evaluate', {
    expression: `
      const links = Array.from(document.querySelectorAll('a'));
      const startExamLink = links.find(a => a.textContent.includes('Start Exam'));
      if (startExamLink) {
        startExamLink.click();
      } else {
        console.error('Start Exam link not found!');
      }
    `,
  });
  await sleep(3500);

  // In exam gate, click "Begin Examination Now"
  console.log('5. Clicking "Begin Examination Now" on Pre-flight Gate...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const beginBtn = buttons.find(b => b.textContent.includes('Begin Examination Now'));
      if (beginBtn) beginBtn.click();
    `,
  });

  await sleep(4000);

  const examArenaScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/student_exam_arena_verified.png', Buffer.from(examArenaScreenshot.data, 'base64'));
  console.log('Saved screenshot: scratch/student_exam_arena_verified.png');

  const examTextRes = await send('Runtime.evaluate', {
    expression: 'document.body.innerText',
  });
  const text = examTextRes?.result?.value || '';
  console.log('Exam Arena Content:\n', text.substring(0, 700));

  chrome.kill();
  console.log('Browser tests completed successfully!');
};

runBrowserCheck().catch((err) => {
  console.error('Browser check failed:', err);
  process.exit(1);
});
