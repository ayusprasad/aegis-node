$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $repoRoot 'apps\web'
$cliRoot = Join-Path $repoRoot 'packages\cli'
$proxyPath = Join-Path $cliRoot 'dist\bin\proxy.js'
$localNodeRoot = Join-Path $repoRoot '.local\node-v24.22.1-win-x64'
$demoOutputPath = Join-Path $repoRoot 'DEMO_OUTPUT.md'
$runtimeLogDir = Join-Path $repoRoot '.local'

New-Item -ItemType Directory -Force -Path $runtimeLogDir | Out-Null

if (Test-Path (Join-Path $localNodeRoot 'node.exe')) {
  $nodeExe = Join-Path $localNodeRoot 'node.exe'
  $npmCmd = Join-Path $localNodeRoot 'npm.cmd'
  $env:Path = "$localNodeRoot;$env:Path"
} else {
  $nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
  $npmCmd = (Get-Command npm.cmd -ErrorAction Stop).Source
}

$env:Path = "$(Join-Path $repoRoot 'scripts\local-bin');$env:Path"
$env:AEGISNODE_API_URL = 'http://localhost:3000/api/verify'
$env:AEGISNODE_BLOCKLIST_URL = 'http://localhost:3000/blocklist.json'

@(
  '# AegisNode end-to-end demo output',
  '',
  "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')",
  "Repository: $repoRoot",
  ''
) | Set-Content -LiteralPath $demoOutputPath -Encoding utf8

function Write-DemoLine([string]$line = '') {
  Add-Content -LiteralPath $demoOutputPath -Value $line -Encoding utf8
  Write-Output $line
}

function Invoke-Proxy([string]$label, [string[]]$proxyArgs, [string]$cacheOverride = '') {
  Write-DemoLine "### $label"
  Write-DemoLine ('`node packages/cli/dist/bin/proxy.js ' + ($proxyArgs -join ' ') + '`')
  $previousCacheOverride = $env:AEGISNODE_CACHE_PATH
  if ($cacheOverride) { $env:AEGISNODE_CACHE_PATH = $cacheOverride }
  $token = [Guid]::NewGuid().ToString('N')
  $stdoutPath = Join-Path $runtimeLogDir "proxy-$token.stdout.log"
  $stderrPath = Join-Path $runtimeLogDir "proxy-$token.stderr.log"
  $process = Start-Process -FilePath $nodeExe `
    -ArgumentList (@($proxyPath) + $proxyArgs) `
    -WorkingDirectory (Get-Location) `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -Wait `
    -PassThru
  $exitCode = $process.ExitCode
  $stdout = if (Test-Path $stdoutPath) { Get-Content -Raw -LiteralPath $stdoutPath -Encoding utf8 } else { '' }
  $stderr = if (Test-Path $stderrPath) { Get-Content -Raw -LiteralPath $stderrPath -Encoding utf8 } else { '' }
  $captured = ($stdout + $stderr).TrimEnd()
  Remove-Item -LiteralPath $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
  if ($previousCacheOverride) {
    $env:AEGISNODE_CACHE_PATH = $previousCacheOverride
  } else {
    Remove-Item Env:AEGISNODE_CACHE_PATH -ErrorAction SilentlyContinue
  }
  if ($captured) { Write-DemoLine '```text'; Write-DemoLine $captured; Write-DemoLine '```' }
  Write-DemoLine "Exit code: $exitCode"
  Write-DemoLine ''
  Write-Output $captured
  return $exitCode
}

function Invoke-ApiCheck([string]$packageName) {
  $body = @{ package = $packageName } | ConvertTo-Json -Compress
  $result = Invoke-RestMethod -Uri $env:AEGISNODE_API_URL -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 30
  Write-DemoLine "API ${packageName}: $($result | ConvertTo-Json -Compress)"
}

$serverOut = Join-Path $runtimeLogDir 'demo-next.stdout.log'
$serverErr = Join-Path $runtimeLogDir 'demo-next.stderr.log'
$server = $null
$cachePath = Join-Path $env:LOCALAPPDATA 'AegisNode\cache.json'
$cacheBackupPath = Join-Path $runtimeLogDir 'demo-cache-before.json'
$cacheExisted = Test-Path -LiteralPath $cachePath

try {
  Write-DemoLine '## Server startup'
  $server = Start-Process -FilePath $nodeExe `
    -ArgumentList @('node_modules/next/dist/bin/next', 'dev', '--webpack', '--port', '3000') `
    -WorkingDirectory $webRoot `
    -RedirectStandardOutput $serverOut `
    -RedirectStandardError $serverErr `
    -PassThru

  $ready = $false
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
      $health = Invoke-WebRequest -Uri 'http://localhost:3000/' -UseBasicParsing -TimeoutSec 2
      if ($health.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
  }
  if (-not $ready) { throw 'Next.js did not become ready within 60 seconds.' }
  Write-DemoLine 'Next.js dev server ready at http://localhost:3000'
  Write-DemoLine ''

  Write-DemoLine '## Direct API checks'
  Invoke-ApiCheck 'express'
  Invoke-ApiCheck '@types/node'
  Invoke-ApiCheck 'crossenv'
  Invoke-ApiCheck 'reactt'
  Invoke-ApiCheck 'aegisnode-zz-nonexistent-48213'
  Invoke-ApiCheck 'express-router-util'
  Write-DemoLine ''

  $sandbox = Join-Path $env:TEMP ('aegis-demo-sandbox-' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
  New-Item -ItemType Directory -Force -Path $sandbox | Out-Null
  Push-Location $sandbox
  try {
    & $npmCmd init -y --ignore-scripts | Out-Null

    Write-DemoLine '## Proxy test matrix (safe installs use --ignore-scripts)'
    Invoke-Proxy '1. express - safe real install' @('install', 'express', '--ignore-scripts') | Out-Null
    Invoke-Proxy '2. react - exact match safe' @('install', 'react', '--ignore-scripts') | Out-Null
    Invoke-Proxy '3. @types/node - scoped package safe' @('install', '@types/node', '--ignore-scripts') | Out-Null
    Invoke-Proxy '4. express@4.18.2 with -D - safe' @('install', '-D', 'express@4.18.2', '--ignore-scripts') | Out-Null
    Invoke-Proxy '5. crossenv - local blocklist blocked' @('install', 'crossenv', '--ignore-scripts') | Out-Null
    Invoke-Proxy '6. reactt - TYPOSQUAT blocked' @('install', 'reactt', '--ignore-scripts') | Out-Null
    Invoke-Proxy '7. nonexistent package - HALLUCINATED blocked' @('install', 'aegisnode-zz-nonexistent-48213', '--ignore-scripts') | Out-Null

    $realLocalAppData = $env:LOCALAPPDATA
    if ($cacheExisted) { Copy-Item -LiteralPath $cachePath -Destination $cacheBackupPath -Force }
    $testCachePath = Join-Path $runtimeLogDir 'demo-offline-cache.json'
    $fakePackage = 'aegisnode-demo-offline-48213'
    $fetchedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    $cacheJson = '{"known_malicious":[{"name":"' + $fakePackage + '","reason":"DEMO_OFFLINE_BLOCK","severity":"HIGH"}],"last_updated":"' + $fetchedAt + '","version":"demo","fetched_at":"' + $fetchedAt + '"}'
    Set-Content -LiteralPath $testCachePath -Value $cacheJson -Encoding ascii

    $env:AEGISNODE_CACHE_PATH = $testCachePath
    $env:AEGISNODE_API_URL = 'http://127.0.0.1:9/api/verify'
    Invoke-Proxy '8. API off + fake cached entry - offline blocked' @('install', $fakePackage, '--ignore-scripts') $testCachePath | Out-Null
    Invoke-Proxy '9. API off + clean package - fail-open allowed' @('install', 'is-number', '--ignore-scripts', '--no-save') $testCachePath | Out-Null
    Remove-Item Env:AEGISNODE_CACHE_PATH -ErrorAction SilentlyContinue
    $env:AEGISNODE_API_URL = 'http://localhost:3000/api/verify'

    Invoke-Proxy '10a. npm -v - pass-through' @('-v') | Out-Null
    Invoke-Proxy '10b. npm install with no package - pass-through' @('install', '--ignore-scripts') | Out-Null
    Invoke-Proxy '11. README example express-router-util - HALLUCINATED' @('install', 'express-router-util', '--ignore-scripts') | Out-Null
    Invoke-Proxy '12. crossenv and mongose - explicit/cache blocks' @('install', 'crossenv', 'mongose', '--ignore-scripts') | Out-Null
    $env:LOCALAPPDATA = $realLocalAppData
  } finally {
    Pop-Location
    if ($realLocalAppData) { $env:LOCALAPPDATA = $realLocalAppData }
    if ($cacheExisted -and (Test-Path $cacheBackupPath)) {
      Copy-Item -LiteralPath $cacheBackupPath -Destination $cachePath -Force
    } elseif (-not $cacheExisted -and (Test-Path $cachePath)) {
      Remove-Item -LiteralPath $cachePath -Force
    }
  }

  Write-DemoLine '## Notes'
  Write-DemoLine "Safe-install sandbox: $sandbox"
  Write-DemoLine 'All real installs in this demo used --ignore-scripts; blocked cases never spawned npm.'
  Write-DemoLine "Next.js stdout: $serverOut"
  Write-DemoLine "Next.js stderr: $serverErr"
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
}

Write-Output "Demo output written to $demoOutputPath"
