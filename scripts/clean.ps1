param()

Write-Host "Running clean.ps1: removing node_modules, lock files and freeing ports (5173,5174,3000)"

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $root

# Remove node_modules
if (Test-Path node_modules) {
  Write-Host "Removing node_modules..."
  Remove-Item -LiteralPath node_modules -Recurse -Force -ErrorAction SilentlyContinue
} else {
  Write-Host "node_modules not found"
}

# Remove common lockfiles
$locks = @('package-lock.json','yarn.lock','pnpm-lock.yaml','npm-shrinkwrap.json')
foreach ($f in $locks) {
  if (Test-Path $f) { Write-Host "Removing $f"; Remove-Item -LiteralPath $f -Force -ErrorAction SilentlyContinue }
}

# Function to kill processes listening on a TCP port
function Kill-Port($port){
  Write-Host "Checking port $port..."
  try {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
    if ($conns) {
      $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
      foreach ($pid in $pids) {
        try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue; Write-Host ("Killed PID {0} listening on port {1}" -f $pid, $port) } catch { Write-Host ("Failed to kill PID {0}: {1}" -f $pid, $_.Exception.Message) }
      }
    } else {
      Write-Host "No listening connections found via Get-NetTCPConnection for port $port"
    }
  } catch {
  Write-Host ("Get-NetTCPConnection unavailable or failed: {0}. Trying netstat fallback" -f $_.Exception.Message)
    $lines = netstat -ano | Select-String ":$port"
    foreach ($ln in $lines) {
      $parts = -split ($ln -replace '\s+',' ')
      $pid = $parts[-1]
      if ($pid -and $pid -ne '0') {
        try { Stop-Process -Id [int]$pid -Force -ErrorAction SilentlyContinue; Write-Host ("Killed PID {0} (netstat) for port {1}" -f $pid, $port) } catch { Write-Host ("Failed to kill PID {0}: {1}" -f $pid, $_.Exception.Message) }
      }
    }
  }
}

# Ports to free
$ports = @(5173,5174,3000)
foreach ($p in $ports) { Kill-Port $p }

Write-Host "Clean finished." 
