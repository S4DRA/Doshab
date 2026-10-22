const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const framework = path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET', 'Framework64', 'v4.0.30319');
const compiler = path.join(framework, 'csc.exe');
const bin = path.join(root, 'installer', 'bin');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, windowsHide: true, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`VAL setup build exited with ${result.status}.`);
}

if (process.platform !== 'win32' || !fs.existsSync(compiler)) {
  throw new Error('Build VAL setup on Windows with the .NET Framework 4.x compiler installed.');
}
fs.mkdirSync(bin, { recursive: true });
const icons = path.join(bin, 'VAL-IconAssets.exe');
run(compiler, ['/nologo', '/optimize+', '/platform:x64', '/target:exe', `/out:${icons}`,
  `/reference:${path.join(framework, 'System.Drawing.dll')}`, path.join(root, 'installer/native/IconAssets.cs')]);
run(icons, [path.join(root, '../public/brand/val-echo-dark.png'), path.join(root, 'assets')]);

if (!process.argv.includes('--icons-only')) {
  const refs = ['System.dll', 'System.Core.dll', 'System.Xaml.dll', 'System.Drawing.dll', 'System.Windows.Forms.dll',
    'WPF/WindowsBase.dll', 'WPF/PresentationCore.dll', 'WPF/PresentationFramework.dll'];
  const output = path.join(bin, 'VAL-Setup-UI.exe');
  run(compiler, ['/nologo', '/optimize+', '/platform:x64', '/target:winexe', `/out:${output}`,
    `/win32manifest:${path.join(root, 'installer/native/setup.manifest')}`,
    `/win32icon:${path.join(root, 'assets/val.ico')}`,
    ...refs.map((file) => `/reference:${path.join(framework, file)}`),
    `/resource:${path.join(root, 'installer/native/Setup.xaml')},VAL.Setup.xaml`,
    `/resource:${path.join(root, 'assets/val-master.png')},VAL.Logo.png`,
    `/resource:${path.join(root, 'assets/val.ico')},VAL.Icon.ico`,
    path.join(root, 'installer/native/Setup.cs')]);
  console.log(`VAL setup interface compiled (${Math.round(fs.statSync(output).size / 1024)} KB).`);
  const report = path.join(bin, 'setup-checks.json');
  try { run(output, ['--self-test', report]); }
  catch (error) {
    const details = `${report}.error.txt`;
    if (fs.existsSync(details)) console.error(fs.readFileSync(details, 'utf8'));
    throw error;
  }
  const checks = JSON.parse(fs.readFileSync(report, 'utf8').replace(/^\uFEFF/, ''));
  if (!checks.passed || checks.assertions !== 16) throw new Error('VAL setup protocol checks did not complete.');
  console.log(`VAL setup: ${checks.assertions} native protocol checks passed.`);
}
