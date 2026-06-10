$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$Root"
$SourcesDir = Join-Path $ProjectRoot "scrcpy-decompiled\sources"
$ClassesDir = Join-Path $ProjectRoot "scrcpy-decompiled\build\classes"
$RepackDir = Join-Path $ProjectRoot "scrcpy-repack"

$Sdk = $env:ANDROID_HOME
if (-not $Sdk) { $Sdk = $env:ANDROID_SDK_ROOT }
if (-not $Sdk) { $Sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk" }

if (-not (Test-Path $Sdk)) {
    throw "Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT"
}

# Find Android platforms android.jar
$Platforms = Get-ChildItem -Directory (Join-Path $Sdk "platforms") -Filter "android-*" | Sort-Object Name -Descending
if (-not $Platforms) {
    throw "No Android platforms found in $Sdk\platforms"
}
$AndroidJar = Join-Path $Platforms[0].FullName "android.jar"
if (-not (Test-Path $AndroidJar)) {
    throw "android.jar not found"
}

# Find d8.bat
$BuildTools = Get-ChildItem -Directory (Join-Path $Sdk "build-tools") | Sort-Object Name -Descending
if (-not $BuildTools) {
    throw "No Build Tools found in $Sdk\build-tools"
}
$D8Path = Join-Path $BuildTools[0].FullName "d8.bat"
if (-not (Test-Path $D8Path)) {
    throw "d8.bat not found"
}

Remove-Item -Recurse -Force $ClassesDir -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $ClassesDir | Out-Null

if (-not (Test-Path $RepackDir)) {
    New-Item -ItemType Directory -Force $RepackDir | Out-Null
}
if (-not (Test-Path (Join-Path $RepackDir "AndroidManifest.xml")) -or -not (Test-Path (Join-Path $RepackDir "resources.arsc"))) {
    Write-Host "Extracting AndroidManifest.xml and resources.arsc from existing scrcpy-server.jar..."
    if (Test-Path (Join-Path $ProjectRoot "scrcpy-server.jar")) {
        $PrevDir = Get-Location
        Set-Location $RepackDir
        & "jar" xf (Join-Path $ProjectRoot "scrcpy-server.jar") AndroidManifest.xml resources.arsc
        Set-Location $PrevDir
    } else {
        throw "Existing scrcpy-server.jar not found to extract metadata files."
    }
}

Write-Host "Using Android SDK: $Sdk"
Write-Host "Using android.jar: $AndroidJar"
Write-Host "Using d8: $D8Path"

Write-Host "Compiling Java sources..."
$Sources = Get-ChildItem -Recurse $SourcesDir -Filter "*.java" | ForEach-Object { $_.FullName }
$SourcesFile = Join-Path $ProjectRoot "sources.txt"
$Sources | Out-File -Encoding ascii $SourcesFile

javac -encoding UTF-8 -source 1.8 -target 1.8 -bootclasspath $AndroidJar -d $ClassesDir "@$SourcesFile"
Remove-Item -Force $SourcesFile

Write-Host "Converting class files to dex..."
$ClassFiles = Get-ChildItem -Recurse $ClassesDir -Filter "*.class" | ForEach-Object { $_.FullName }
$ClassFilesFile = Join-Path $ProjectRoot "classes_list.txt"
$ClassFiles | Out-File -Encoding ascii $ClassFilesFile

# Run d8
& $D8Path --output $RepackDir "@$ClassFilesFile"
Remove-Item -Force $ClassFilesFile

Write-Host "Packaging jar..."
$JarPath = Join-Path $ProjectRoot "scrcpy-server.jar"
Remove-Item -Force $JarPath -ErrorAction SilentlyContinue

Push-Location $RepackDir
& "jar" cf $JarPath classes.dex AndroidManifest.xml resources.arsc
Pop-Location

Write-Host "Built $JarPath successfully!"
