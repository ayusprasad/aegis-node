# Run AegisNode locally on Windows

Run these commands in PowerShell from the repository root:

```powershell
Set-Location 'C:\Users\ayush\Downloads\aegis-node-main\aegis-node-main'

# This checkout contains a portable Node/npm runtime because the current PC
# does not have npm on PATH. On a normal Node installation this block is skipped.
$localNode = Join-Path (Get-Location) '.local\node-v24.22.1-win-x64'
if (Test-Path (Join-Path $localNode 'node.exe')) {
  $env:Path = "$localNode;$env:Path"
}

npm install --ignore-scripts --workspaces=false
npm --prefix packages\cli install --ignore-scripts
npm --prefix apps\web install --ignore-scripts
npm --prefix packages\cli run build
npm --prefix apps\web run build

$env:Path = "$(Join-Path (Get-Location) 'scripts\local-bin');$env:Path"
$env:AEGISNODE_API_URL = 'http://localhost:3000/api/verify'
$env:AEGISNODE_BLOCKLIST_URL = 'http://localhost:3000/blocklist.json'
```

Start the local frontend and backend (the API is a Next.js route in the same server):

```powershell
$next = Start-Process node `
  -ArgumentList @('apps/web/node_modules/next/dist/bin/next', 'dev', '--webpack', '--port', '3000') `
  -WorkingDirectory (Get-Location) `
  -PassThru

Invoke-RestMethod -Uri 'http://localhost:3000/api/verify' `
  -Method Post -ContentType 'application/json' `
  -Body '{"package":"reactt"}'
```

Open `http://localhost:3000` in a browser and use the Live Scanner. The CLI can be exercised directly without shell hooks:

```powershell
node packages\cli\dist\bin\proxy.js install express --ignore-scripts
node packages\cli\dist\bin\proxy.js install @types\node --ignore-scripts
node packages\cli\dist\bin\proxy.js install crossenv --ignore-scripts
node packages\cli\dist\bin\proxy.js install reactt --ignore-scripts
```

The two `scripts\local-bin\*.cmd` files are the Windows-local equivalent of `npm link`. Add `scripts\local-bin` to `PATH` as shown above, then `aegisnode` and `aegisnode-proxy` work as commands. A managed Windows policy may reject npm’s symlink-based `npm link`; these command shims avoid that restriction.

To install and inspect the reversible shell hooks, back up the profile and any existing CMD AutoRun value first:

```powershell
$profile = (& powershell.exe -NoProfile -Command '$PROFILE').Trim()
if (Test-Path -LiteralPath $profile) {
  Copy-Item -LiteralPath $profile -Destination "$profile.aegis-backup" -Force
}
reg.exe query 'HKCU\Software\Microsoft\Command Processor' /v AutoRun
reg.exe export 'HKCU\Software\Microsoft\Command Processor' "$env:TEMP\aegisnode-cmd-autorun-before.reg" /y

aegisnode init
aegisnode status
```

Open a new interactive PowerShell and CMD window, then run `npm install crossenv`. It must exit with the AegisNode security override before npm starts. DOSKEY hooks apply to interactive CMD windows; `cmd /c` batch commands do not expand DOSKEY macros.

Run the complete local demo and write the real matrix output to `DEMO_OUTPUT.md`:

```powershell
& .\scripts\demo.ps1
```

Stop the development server when finished:

```powershell
Stop-Process -Id $next.Id
```

Remove hooks and restore the recorded shell settings:

```powershell
aegisnode uninstall
```

If the CLI is unavailable, manually restore the profile with `$PROFILE.aegis-backup`, import the saved registry export with `reg.exe import "$env:TEMP\aegisnode-cmd-autorun-before.reg"`, and remove `%LOCALAPPDATA%\AegisNode\cmd_macros.doskey`. The cache and backups are intentionally retained by `aegisnode uninstall` for review.
