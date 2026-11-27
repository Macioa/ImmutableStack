$ErrorActionPreference = "Stop"

function Invoke-Native {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')"
    }
}

function Update-SessionPath {
    $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $user = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machine;$user;$env:Path"
}

# Check if versions.sh is in the same directory and read it
$versionsPath = Join-Path $PSScriptRoot "versions.sh"
if (-not (Test-Path $versionsPath)) {
    throw "versions.sh not found in the same directory."
}
Write-Output "Reading versions.sh..."
$versions = @{}
foreach ($line in Get-Content $versionsPath) {
    if ($line -match '^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $versions[$Matches[1]] = $Matches[2].Trim().Trim('"', "'")
    }
}
foreach ($name in "NODE_VERSION", "ERLANG_VERSION", "ELIXIR_VERSION", "PHOENIX_VERSION", "MISE_VERSION") {
    if (-not $versions[$name]) { throw "$name is missing from versions.sh." }
}

function Get-MiseVersion {
    if (-not (Get-Command mise -ErrorAction SilentlyContinue)) { return $null }
    return ((& mise --version) -split '\s+')[0]
}

# Install the pinned mise, replacing any other version
Update-SessionPath
$miseVersion = $versions.MISE_VERSION
$installedMise = Get-MiseVersion
if ($installedMise -eq $miseVersion) {
    Write-Output "mise $miseVersion is installed."
} else {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "winget is required to install mise: https://mise.jdx.dev/installing-mise.html"
    }
    Write-Output "Installing mise $miseVersion (found: $(if ($installedMise) { $installedMise } else { 'none' }))..."
    Invoke-Native "winget" @("install", "--id", "jdx.mise", "--exact", "--version", $miseVersion, "--force", "--accept-source-agreements", "--accept-package-agreements")
    Update-SessionPath
    $installedMise = Get-MiseVersion
    if ($installedMise -ne $miseVersion) {
        throw "mise $miseVersion is not on PATH (found: $installedMise)."
    }
}

# Add mise shims to PATH so mix, elixir, and node work from any shell
$shims = Join-Path $env:LOCALAPPDATA "mise\shims"
$env:Path = "$shims;$env:Path"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (($userPath -split ";") -notcontains $shims) {
    Write-Output "Adding mise shims to user PATH..."
    [Environment]::SetEnvironmentVariable("Path", "$shims;$userPath", "User")
}

# Install Erlang, Elixir, and Node.js using mise core tools
Write-Output "Installing Erlang..."
Invoke-Native "mise" @("use", "--global", "erlang@$($versions.ERLANG_VERSION)")

# The Windows OTP zip ships erl.ini with its build machine's paths
$erlangRoot = (Resolve-Path (& mise where "erlang@$($versions.ERLANG_VERSION)")).Path
$ertsBin = (Get-ChildItem $erlangRoot -Directory -Filter "erts-*" | Select-Object -First 1).FullName + "\bin"
$erlIni = "[erlang]`r`nBindir=$($ertsBin -replace '\\', '\\')`r`nProgname=erl`r`nRootdir=$($erlangRoot -replace '\\', '\\')`r`n"
foreach ($dir in $ertsBin, (Join-Path $erlangRoot "bin")) {
    [IO.File]::WriteAllText((Join-Path $dir "erl.ini"), $erlIni, [Text.Encoding]::ASCII)
}

Write-Output "Installing Elixir..."
Invoke-Native "mise" @("use", "--global", "elixir@$($versions.ELIXIR_VERSION)")
Write-Output "Installing Node.js..."
Invoke-Native "mise" @("use", "--global", "node@$($versions.NODE_VERSION)")
Invoke-Native "mise" @("reshim")

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Output "Docker is installed."
} else {
    Write-Output "!!! Please install Docker Desktop manually on Windows: https://www.docker.com/products/docker-desktop/ !!!"
}

# Install pnpm for generated UI projects
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Output "Installing pnpm..."
    Invoke-Native "mise" @("exec", "--", "npm", "install", "-g", "pnpm")
}

# Install Hex and Phoenix
Write-Output "Installing Hex and Phoenix..."
Invoke-Native "mise" @("exec", "--", "mix", "local.hex", "--force")
Invoke-Native "mise" @("exec", "--", "mix", "local.rebar", "--force")
Invoke-Native "mise" @("exec", "--", "mix", "archive.install", "hex", "phx_new", $versions.PHOENIX_VERSION, "--force")

Write-Output "Setup complete."
