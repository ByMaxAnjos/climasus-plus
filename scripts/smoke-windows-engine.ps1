$ErrorActionPreference = 'Stop'

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$resourceDir = Join-Path $env:RUNNER_TEMP 'climasus+ Studio smoke'
New-Item -ItemType Directory -Path $resourceDir -Force | Out-Null
New-Item -ItemType Junction -Path (Join-Path $resourceDir 'r') -Target (Join-Path $repo 'src-tauri/resources/r') | Out-Null
New-Item -ItemType Junction -Path (Join-Path $resourceDir 'engine') -Target (Join-Path $repo 'engine') | Out-Null
New-Item -ItemType Junction -Path (Join-Path $resourceDir 'spatial-seed') -Target (Join-Path $repo 'src-tauri/resources/spatial-seed') | Out-Null

$binDir = Join-Path $resourceDir 'r/bin'
$rscript = Join-Path $binDir 'Rscript.exe'
if (-not (Test-Path $rscript)) { throw "Bundled Rscript.exe not found: $rscript" }

@('R_HOME', 'R_LIBS', 'R_LIBS_SITE', 'R_LIBS_USER') | ForEach-Object {
  Remove-Item "Env:$_" -ErrorAction SilentlyContinue
}
$env:PATH = "$(Join-Path $binDir 'x64');$binDir;$env:PATH"
$env:CLIMASUS_BUNDLED = '1'
$env:CLIMASUS_RESOURCE_DIR = $resourceDir
$env:CLIMASUS_TOKEN = 'ci-smoke-test'

$stdout = Join-Path $env:RUNNER_TEMP 'climasus-engine-stdout.log'
$stderr = Join-Path $env:RUNNER_TEMP 'climasus-engine-stderr.log'
$port = 8877
$proc = Start-Process -FilePath $rscript -ArgumentList @('.\engine\start.R', "$port") -WorkingDirectory $resourceDir -RedirectStandardOutput $stdout -RedirectStandardError $stderr -WindowStyle Hidden -PassThru
try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 90; $attempt++) {
    $proc.Refresh()
    if ($proc.HasExited) { throw "Bundled R exited before /health responded (code $($proc.ExitCode))" }
    try {
      $response = Invoke-WebRequest "http://127.0.0.1:$port/health" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  if (-not $ready) { throw 'Bundled R did not respond on /health within 90 attempts' }
  Write-Host "Bundled R responded on port $port from a path containing spaces."
} finally {
  if (-not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  if (Test-Path $stdout) { Get-Content $stdout -Tail 30 }
  if (Test-Path $stderr) { Get-Content $stderr -Tail 30 }
}
