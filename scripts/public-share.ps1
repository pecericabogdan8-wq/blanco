# Persistent public share for Blanco local server.
# Requires: cloudflared (winget install Cloudflare.cloudflared), npm run start on :3847
# Usage: powershell -ExecutionPolicy Bypass -File scripts/public-share.ps1

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$UrlFile = Join-Path $Root "share-url.txt"
$LogFile = Join-Path $Root "share-tunnel.log"
$Port = 3847

function Ensure-Site {
  $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($listening) { return }
  Write-Host "Starting Next.js on :$Port ..."
  Start-Process -FilePath "npm" -ArgumentList "run", "start" -WorkingDirectory $Root -WindowStyle Hidden
  $deadline = (Get-Date).AddSeconds(40)
  do {
    Start-Sleep -Seconds 1
    $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  } while (-not $listening -and (Get-Date) -lt $deadline)
  if (-not $listening) { throw "Site failed to bind :$Port" }
}

function Start-Tunnel {
  Ensure-Site
  Write-Host "Opening Cloudflare quick tunnel (auto-restart on drop)..."
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "cloudflared"
  $psi.Arguments = "tunnel --url http://127.0.0.1:$Port --protocol http2"
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()

  $urlFound = $false
  while (-not $p.HasExited) {
    $line = $p.StandardError.ReadLine()
    if ($null -eq $line) {
      Start-Sleep -Milliseconds 200
      continue
    }
    Add-Content -Path $LogFile -Value $line
    if ($line -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
      $url = $Matches[0]
      Set-Content -Path $UrlFile -Value $url -Encoding utf8
      if (-not $urlFound) {
        Write-Host ""
        Write-Host "PUBLIC URL: $url" -ForegroundColor Green
        Write-Host "Also saved to share-url.txt"
        Write-Host ""
        $urlFound = $true
      }
    }
  }
  return $p.ExitCode
}

Write-Host "Blanco public share supervisor. Ctrl+C to stop."
Write-Host "This keeps a Cloudflare tunnel alive; free quick tunnels still rotate the hostname on each restart."
Write-Host "For a permanent domain, deploy (Vercel/Railway) — see docs/public-share.md"
"" | Set-Content $LogFile

while ($true) {
  try {
    $code = Start-Tunnel
    Write-Host "Tunnel exited ($code). Restarting in 3s..."
  } catch {
    Write-Host $_
  }
  Start-Sleep -Seconds 3
}
