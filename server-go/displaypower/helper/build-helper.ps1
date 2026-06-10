$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$Root\..\.."
$OutDir = Join-Path $ProjectRoot "displaypower\bin"
$ClassesDir = Join-Path $Root "build\classes"
$SrcDir = Join-Path $Root "src"

$Sdk = $env:ANDROID_HOME
if (-not $Sdk) { $Sdk = $env:ANDROID_SDK_ROOT }
if (-not $Sdk) { $Sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk" }

if (-not (Test-Path $Sdk)) {
    throw "Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT"
}

$Platforms = Get-ChildItem -Directory (Join-Path $Sdk "platforms") -Filter "android-*" | Sort-Object Name -Descending
if (-not $Platforms) {
    throw "No Android platforms found in $Sdk\platforms"
}

$AndroidJar = Join-Path $Platforms[0].FullName "android.jar"
if (-not (Test-Path $AndroidJar)) {
    throw "android.jar not found"
}

$BuildTools = Get-ChildItem -Directory (Join-Path $Sdk "build-tools") | Sort-Object Name -Descending
if (-not $BuildTools) {
    throw "No build-tools found in $Sdk\build-tools"
}
$D8Path = Join-Path $BuildTools[0].FullName "d8.bat"
if (-not (Test-Path $D8Path)) {
    $D8Path = Join-Path $BuildTools[0].FullName "d8"
}

Remove-Item -Recurse -Force $ClassesDir -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $ClassesDir | Out-Null
New-Item -ItemType Directory -Force $OutDir | Out-Null

$Sources = Get-ChildItem -Recurse $SrcDir -Filter "*.java" | ForEach-Object { $_.FullName }
javac -source 1.8 -target 1.8 -bootclasspath $AndroidJar -d $ClassesDir $Sources

$ClassFiles = Get-ChildItem -Recurse $ClassesDir -Filter "*.class" | ForEach-Object { $_.FullName }
$ClassFilesFile = Join-Path $Root "classes_list.txt"
$ClassFiles | Out-File -Encoding ascii $ClassFilesFile

Write-Host "Dexing classes..."
& $D8Path --min-api 21 --lib $AndroidJar --output $ClassesDir "@$ClassFilesFile"

Remove-Item -Force $ClassFilesFile -ErrorAction SilentlyContinue

$JarPath = Join-Path $OutDir "monview-display-power.jar"
Remove-Item -Force $JarPath -ErrorAction SilentlyContinue

# Package the classes.dex into the jar
jar cf $JarPath -C $ClassesDir classes.dex

Write-Host "Built $JarPath"
