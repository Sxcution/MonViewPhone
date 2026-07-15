param(
    [Parameter(Mandatory = $true)]
    [string]$Serial,
    [string]$AdbPath = "C:\Program Files (x86)\xiaowei\tools\adb.exe",
    [int]$BootTimeoutSeconds = 240
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $rootDir "logs"
$allowlistPath = Join-Path $PSScriptRoot "monspacev2-autostart-serials.txt"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$logPath = Join-Path $logDir ("monspacev2-autostart-" + ($Serial -replace '[^\w.-]', '_') + ".log")

function Write-RunLog {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
    Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
    Write-Host $line
}

function Invoke-Adb {
    param([string[]]$AdbArgs)
    $output = & $AdbPath -s $Serial @AdbArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "adb failed: $($AdbArgs -join ' ')`n$output"
    }
    return $output
}

if (Test-Path -LiteralPath $allowlistPath) {
    $allowed = Get-Content -LiteralPath $allowlistPath |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ -and -not $_.StartsWith("#") }
    if ($Serial -notin $allowed) {
        Write-RunLog "skip ${Serial}: not in allowlist"
        exit 0
    }
}

Write-RunLog "start for $Serial"

& $AdbPath -s $Serial wait-for-device | Out-Null
$deadline = (Get-Date).AddSeconds($BootTimeoutSeconds)
do {
    $bootCompleted = (Invoke-Adb -AdbArgs @("shell", "getprop", "sys.boot_completed") | Out-String).Trim()
    if ($bootCompleted -eq "1") {
        break
    }
    Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)

if ($bootCompleted -ne "1") {
    throw "timed out waiting for sys.boot_completed=1"
}

$userLines = Invoke-Adb -AdbArgs @("shell", "cmd", "user", "list", "-v")
$profiles = foreach ($line in $userLines) {
    if ($line -match '^\s*\d+:\s+id=(\d+),\s+name=(.*?),\s+type=profile\.MANAGED,\s+flags=.*parentId=0') {
        [pscustomobject]@{
            Id = [int]$matches[1]
            Name = $matches[2]
        }
    }
}

$profiles = @($profiles | Where-Object { $_.Name -like "MonSpace*" })
if ($profiles.Count -eq 0) {
    Write-RunLog "no MonSpace managed profiles found"
    exit 0
}

Write-RunLog ("profiles: " + (($profiles | ForEach-Object { "$($_.Id)=$($_.Name)" }) -join ", "))

foreach ($profile in $profiles) {
    $result = (Invoke-Adb -AdbArgs @("shell", "cmd", "activity", "start-user", "$($profile.Id)") | Out-String).Trim()
    Write-RunLog "start-user $($profile.Id): $result"
}

$state = Invoke-Adb -AdbArgs @("shell", "dumpsys", "user")
$state |
    Select-String -Pattern 'UserInfo\{|State:|Started users state' |
    ForEach-Object { Write-RunLog $_.Line.TrimEnd() }

Write-RunLog "done"
