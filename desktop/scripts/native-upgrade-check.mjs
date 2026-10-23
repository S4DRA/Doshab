// Destructive installer tests belong only on an ephemeral GitHub-hosted Windows VM.
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
if (process.env.GITHUB_ACTIONS !== 'true' || process.env.RUNNER_OS !== 'Windows' || process.env.RUNNER_ENVIRONMENT !== 'github-hosted') throw new Error('Run only on an ephemeral GitHub-hosted Windows runner. Never on an existing user installation.');
const root = path.resolve(process.env.RUNNER_TEMP, 'val-upgrade-check');
await fs.mkdir(root, {recursive:true});
const install = path.join(root, 'installed');
const exe = path.join(install, 'VAL.exe');
const report = {checks:[], productionFeedModified:false};
const pass = message => {report.checks.push(message); console.log(`PASS: ${message}`);};
const delay = ms => new Promise(resolve=>setTimeout(resolve, ms));
async function until(check, label, timeout=120_000) {const start=Date.now(); while(Date.now()-start<timeout){const value=await check();if(value)return value;await delay(500);}throw new Error(`Timed out: ${label}`);}
async function verify(dir) {
  const yaml = await fs.readFile(path.join(dir,'latest.yml'),'utf8');
  const version = yaml.match(/^version: (\S+)/m)[1];
  const filename = `VAL-Setup-${version}.exe`;
  const hash = createHash('sha512'); for await (const part of createReadStream(path.join(dir,filename))) hash.update(part);
  assert.equal(hash.digest('base64'),yaml.match(/sha512: (\S+)/)[1]);
  const map=JSON.parse(gunzipSync(await fs.readFile(path.join(dir,`${filename}.blockmap`))));
  assert.ok(map.files.length); for(const file of map.files)assert.equal(file.sizes.length,file.checksums.length);
  pass(`Installer SHA-512 and blockmap verified: ${version}`);return {dir,yaml,version,filename};
}
const candidate=await verify(path.resolve('dist'));
const fixture=await verify(path.resolve('dist-upgrade-fixture'));
assert.notEqual(candidate.version,fixture.version);
let feed=candidate;let delayInstaller=false;const requests=[];
const server=http.createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1));
  requests.push(name);
  if(name==='latest.yml'){res.writeHead(200,{'content-type':'text/yaml','cache-control':'no-store'});res.end(feed.yaml);return;}
  const source=[candidate,fixture].find(item=>name===item.filename||name===`${item.filename}.blockmap`);
  if(!source){res.writeHead(404);res.end();return;}
  if(delayInstaller&&name.endsWith('.exe'))await delay(5000);
  const file=path.join(source.dir,name);const {size}=await fs.stat(file);
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range??'');
  const start=range?Number(range[1]):0;const end=range&&range[2]?Math.min(Number(range[2]),size-1):size-1;
  res.writeHead(range?206:200,{'content-type':'application/octet-stream','content-length':end-start+1,'accept-ranges':'bytes',...(range?{'content-range':`bytes ${start}-${end}/${size}`}:{})});
  createReadStream(file,{start,end}).pipe(res);
}catch(error){res.writeHead(500);res.end(error.message);}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
async function testFeed(){await fs.writeFile(path.join(install,'resources','app-update.yml'),`provider: generic\nurl: http://127.0.0.1:${port}\nupdaterCacheDirName: val-desktop-updater\n`);}
let child;let socket;let serial=0;const waiting=new Map();
async function launch(){
  await testFeed();
  child=spawn(exe,['--inspect=127.0.0.1:19319'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',data=>console.log(String(data).trim()));child.stderr.on('data',data=>console.log(String(data).trim()));
  const endpoint=await until(async()=>{try{return (await(await fetch('http://127.0.0.1:19319/json/list')).json())[0]?.webSocketDebuggerUrl;}catch{return null;}},'main inspector',30_000);
  socket=new WebSocket(endpoint);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=event=>{const result=JSON.parse(event.data);if(result.id){waiting.get(result.id)?.(result);waiting.delete(result.id);}};
  return child;
}
async function evaluate(expression){const id=++serial;const result=await Promise.race([new Promise(resolve=>{waiting.set(id,resolve);socket.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}}));}),delay(20_000).then(()=>{throw new Error('Inspector evaluation timed out');})]);if(result.result?.exceptionDetails)throw new Error(JSON.stringify(result.result.exceptionDetails));return result.result?.result?.value;}
const electron="process.mainModule.require('electron')";
const page=`${electron}.BrowserWindow.getAllWindows()[0]?.webContents`;
async function version(){return evaluate(`${electron}.app.getVersion()`);}
async function platform(){return until(()=>evaluate(`(${page}?.getURL() || '').startsWith('https://doshab.vercel.app/') && !${page}?.isLoading()`),'platform load');}
async function stop(){socket?.close();execFileSync('powershell.exe',['-NoProfile','-Command',`$items = @(Get-Process VAL -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${exe.replaceAll("'","''")}' }); if ($items.Count) { $items | Stop-Process -Force -ErrorAction Stop }; exit 0`],{windowsHide:true});await delay(1500);}
async function installedVersion(){try{return execFileSync('powershell.exe',['-NoProfile','-Command',`(Get-Item -LiteralPath '${exe.replaceAll("'","''")}').VersionInfo.ProductVersion`],{encoding:'utf8',windowsHide:true}).trim().split('.').slice(0,3).join('.');}catch{return '';}}
async function waitReplacement(target){await until(async()=> (await installedVersion()).startsWith(target),'installed '+target);await delay(5000);const running=execFileSync('powershell.exe',['-NoProfile','-Command',`@(Get-Process VAL -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq '${exe.replaceAll("'","''")}' }).Count`],{encoding:'utf8',windowsHide:true});assert.ok(Number(running.trim())>0);pass(`Real NSIS replacement and automatic relaunch: ${target}`);}
try{
  // The previous public installer and metadata are immutable versioned assets.
  const previous='0.1.6';const previousExe=path.join(root,`VAL-Setup-${previous}.exe`);
  const base=`https://github.com/S4DRA/Doshab/releases/download/v${previous}/`;
  const yamlResponse=await fetch(base+'latest.yml');assert.ok(yamlResponse.ok);const previousYaml=await yamlResponse.text();
  const response=await fetch(base+path.basename(previousExe));assert.ok(response.ok);const bytes=Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha512').update(bytes).digest('base64'),previousYaml.match(/sha512: (\S+)/)[1]);await fs.writeFile(previousExe,bytes);
  const installer=spawn(previousExe,['/S',`/D=${install}`],{windowsHide:true,stdio:'inherit'});
  assert.equal(await new Promise(resolve=>installer.on('exit',resolve)),0);await until(async()=>await installedVersion()==='0.1.6','fresh 0.1.6 install');pass('Published 0.1.6 installed silently on clean runner');
  await stop();await launch();assert.equal(await version(),previous);await platform();
  const userData=await evaluate(`${electron}.app.getPath('userData')`);
  await evaluate(`${electron}.session.fromPartition('persist:val').cookies.set({url:'https://example.invalid',name:'val-qa-preservation',value:'preserve-me',expirationDate:Date.now()/1000+86400})`);
  await evaluate(`${page}.executeJavaScript("localStorage.setItem('val-upgrade-qa-settings', 'preserve-me')")`);
  await fs.writeFile(path.join(userData,'val-upgrade-marker.txt'),'preserve-me');
  await evaluate(`globalThis.__valQaDownloaded=false;process.mainModule.require('electron-updater').autoUpdater.once('update-downloaded',()=>{globalThis.__valQaDownloaded=true})`);
  await until(()=>evaluate('globalThis.__valQaDownloaded'),'existing 30-second automatic updater',120_000);pass('0.1.6 automatically downloaded real 0.1.7 through electron-updater');
  // Use the real graceful quit path; killing a process would bypass its cookie flush.
  await evaluate(`setTimeout(()=>${electron}.app.quit(),200);true`);socket.close();
  await waitReplacement(candidate.version);await stop();
  await launch();assert.equal(await version(),candidate.version);await platform();
  assert.equal(await evaluate(`${electron}.session.fromPartition('persist:val').cookies.get({url:'https://example.invalid'}).then(items=>items.find(x=>x.name==='val-qa-preservation')?.value)`),'preserve-me');
  assert.equal(await evaluate(`${page}.executeJavaScript("localStorage.getItem('val-upgrade-qa-settings')")`),'preserve-me');
  assert.equal(await fs.readFile(path.join(userData,'val-upgrade-marker.txt'),'utf8'),'preserve-me');
  pass('Existing cookie, renderer local settings and profile files preserved across upgrade');await stop();
  feed=fixture;delayInstaller=true;await launch();
  await until(()=>evaluate(`(${page}?.getURL() || '').endsWith('/startup.html')`),'local startup update page',10_000);pass('Startup gate shows local update page while a newer installer downloads');socket.close();
  await waitReplacement(fixture.version);await stop();
  feed=fixture;delayInstaller=false;await launch();assert.equal(await version(),fixture.version);await platform();
  assert.equal(await fs.readFile(path.join(userData,'val-upgrade-marker.txt'),'utf8'),'preserve-me');pass('Higher-version fixture passes no-update gate and retains profile');
  report.versions=[previous,candidate.version,fixture.version];report.fixturePublished=false;report.requests=requests;
}finally{
  await stop().catch(()=>{});server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  await fs.writeFile(path.resolve('dist','native-upgrade-result.json'),JSON.stringify(report,null,2));
}
