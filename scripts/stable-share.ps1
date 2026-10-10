# Stable temporary public share until real hosting.
# Keeps Next.js + SSH tunnel alive; reconnects immediately on drop.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/stable-share.ps1

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$UrlFile = Join-Path $Root "share-url.txt"
$StatusFile = Join-Path $Root "share-status.txt"
$OutFile = Join-Path $Root "share-tunnel.out.log"
$ErrFile = Join-Path $Root "share-tunnel.err.log"
$Port = 3847

function Write-Status([string]$msg) {
  $line = "$(Get-Date -Format 'HH:mm:ss')  $msg"
  Write-Host $line
  Add-Content -Path $StatusFile -Value $line -Encoding utf8
}

function Ensure-Site {
  if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { return }
  Write-Status "Starting site on :$Port"
  Start-Process -FilePath "npm" -ArgumentList "run", "start" -WorkingDirectory $Root -WindowStyle Hidden
  for ($i = 0; $i -lt 50; $i++) {
    Start-Sleep -Seconds 1
    if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
      Write-Status "Site is up"
      return
    }
  }
  throw "Site did not bind :$Port"
}

function Find-UrlInLogs {
  foreach ($f in @($ErrFile, $OutFile)) {
    if (-not (Test-Path $f)) { continue }
    $text = Get-Content $f -Raw -ErrorAction SilentlyContinue
    if ($text -match 'https://([a-zA-Z0-9-]+)\.lhr\.life') {
      return "https://$($Matches[1]).lhr.life"
    }
  }
  return $null
}

function Run-TunnelOnce {
  Ensure-Site
  Write-Status "Connecting tunnel (localhost.run)..."
  "" | Set-Content $OutFile -Encoding utf8
  "" | Set-Content $ErrFile -Encoding utf8

  $p = Start-Process -FilePath "ssh" -ArgumentList @(
    "-o", "StrictHostKeyChecking=no",
    "-o", "ExitOnForwardFailure=yes",
    "-o", "ServerAliveInterval=15",
    "-o", "ServerAliveCountMax=3",
    "-o", "TCPKeepAlive=yes",
    "-R", "80:127.0.0.1:$Port",
    "nokey@localhost.run"
  ) -PassThru -NoNewWindow `
    -RedirectStandardOutput $OutFile `
    -RedirectStandardError $ErrFile

  $urlSeen = $false
  $deadline = (Get-Date).AddSeconds(75)

  while (-not $p.HasExited) {
    Start-Sleep -Seconds 1
    $url = Find-UrlInLogs
    if ($url) {
      Set-Content -Path $UrlFile -Value $url -Encoding utf8
      if (-not $urlSeen) {
        Write-Status "PUBLIC URL: $url"
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  SHARE THIS: $url" -ForegroundColor Green
        Write-Host "  Auto-reconnects if tunnel drops" -ForegroundColor Green
        Write-Host "  Current URL always in share-url.txt" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        $urlSeen = $true
      }
    } elseif (-not $urlSeen -and (Get-Date) -gt $deadline) {
      try { Stop-Process -Id $p.Id -Force } catch {}
      throw "No public URL within 75s - will retry"
    }
  }

  Write-Status "Tunnel exited (code $($p.ExitCode))"
}

"" | Set-Content $StatusFile -Encoding utf8
Write-Status "Blanco stable-share supervisor (Ctrl+C to stop)"

$failStreak = 0
while ($true) {
  try {
    Run-TunnelOnce
    $failStreak = 0
  } catch {
    $failStreak++
    Write-Status "ERROR: $_"
  }
  $wait = [Math]::Min(2 + $failStreak, 6)
  Write-Status "Reconnecting in ${wait}s..."
  Start-Sleep -Seconds $wait
}
