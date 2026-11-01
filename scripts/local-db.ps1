param([string]$PostgresBin = $env:POSTGRES_BIN)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$clusterPath = Join-Path $projectRoot '.local/pgdata'
$localFolder = Join-Path $projectRoot '.local'
$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
  $line = Get-Content -LiteralPath (Join-Path $projectRoot '.env') | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
  $dbUrl = ($line -split '=', 2)[1].Trim('"')
}
$dbUri = [uri]$dbUrl
if ($dbUri.Host -notin @('localhost', '127.0.0.1')) { throw 'Local database helper only supports localhost.' }
if (-not $PostgresBin) {
  $install = Get-ChildItem -LiteralPath 'C:/Program Files/PostgreSQL' -Directory | Sort-Object Name -Descending | Select-Object -First 1
  if (-not $install) { throw 'Install PostgreSQL or set POSTGRES_BIN to its bin directory.' }
  $PostgresBin = Join-Path $install.FullName 'bin'
}
$databasePort = if ($dbUri.Port -gt 0) { $dbUri.Port } else { 5432 }
$dbParts = $dbUri.UserInfo -split ':', 2
$dbUser = [uri]::UnescapeDataString($dbParts[0])
$dbPassword = [uri]::UnescapeDataString($dbParts[1])
$dbName = $dbUri.AbsolutePath.TrimStart('/')
& (Join-Path $PostgresBin 'pg_isready.exe') -h 127.0.0.1 -p $databasePort | Out-Null
if ($LASTEXITCODE -ne 0) {
  New-Item -ItemType Directory -Force -Path $localFolder | Out-Null
  $passwordFile = Join-Path $localFolder 'pg-init-password'
  try {
    if (-not (Test-Path -LiteralPath (Join-Path $clusterPath 'PG_VERSION'))) {
      [IO.File]::WriteAllText($passwordFile, $dbPassword)
      & (Join-Path $PostgresBin 'initdb.exe') -D $clusterPath -U $dbUser --auth=scram-sha-256 --pwfile=$passwordFile --encoding=UTF8 --locale=C
      if ($LASTEXITCODE -ne 0) { throw 'Could not initialize PostgreSQL.' }
    }
  } finally { if (Test-Path -LiteralPath $passwordFile) { Remove-Item -LiteralPath $passwordFile } }
  & (Join-Path $PostgresBin 'pg_ctl.exe') -D $clusterPath -l (Join-Path $localFolder 'postgres.log') -o "-h 127.0.0.1 -p $databasePort" -w start
  if ($LASTEXITCODE -ne 0) { throw 'Could not start PostgreSQL. Check .local/postgres.log.' }
}
$previousPassword = $env:PGPASSWORD
try {
  $env:PGPASSWORD = $dbPassword
  $databases = & (Join-Path $PostgresBin 'psql.exe') -h 127.0.0.1 -p $databasePort -U $dbUser -d postgres -tAc 'SELECT datname FROM pg_database'
  if ($LASTEXITCODE -ne 0) { throw 'Cannot authenticate to PostgreSQL. Check DATABASE_URL.' }
  if ($databases -notcontains $dbName) {
    & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p $databasePort -U $dbUser $dbName
    if ($LASTEXITCODE -ne 0) { throw 'Could not create database. Check DATABASE_URL.' }
  }
} finally { $env:PGPASSWORD = $previousPassword }
Write-Output 'Local PostgreSQL ready.'
