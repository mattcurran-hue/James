# ActivityWatch -> James sync (Windows PowerShell)
#
# Runs hourly on Matt's PC. Reads today's activity from the local ActivityWatch
# server, drops anything on the PRIVATE list, and sends James a summary:
# active time, top apps, top window titles, top sites. Raw data never leaves the PC.
#
# Setup: see integrations/README-activity.md (or the steps Claude gave you).

# ---- Settings -------------------------------------------------------------
$JamesUrl = "https://james-ochre-delta.vercel.app/api/activity"
$Secret   = "PASTE-YOUR-INTAKE_SECRET-HERE"

# Anything whose app, window title, or site contains one of these words is never sent.
# Case-insensitive. Add your own.
$Private = @(
  "bank", "chase", "wells fargo", "capital one", "amex", "paypal", "venmo", "cash app", "zelle",
  "1password", "bitwarden", "lastpass", "password", "incognito", "inprivate",
  "health", "doctor", "pharmacy", "therapy", "dating", "tinder", "hinge", "bumble"
)
# ---------------------------------------------------------------------------

$ErrorActionPreference = "Stop"
$Aw = "http://localhost:5600/api/0"

function Is-Private([string]$text) {
  if (-not $text) { return $false }
  $t = $text.ToLower()
  foreach ($w in $Private) { if ($t.Contains($w.ToLower())) { return $true } }
  return $false
}

function Invoke-AwQuery([string[]]$lines, [string]$period) {
  $body = @{ timeperiods = @($period); query = $lines } | ConvertTo-Json -Depth 5
  $res = Invoke-RestMethod -Method Post -Uri "$Aw/query/" -ContentType "application/json" -Body $body
  return $res[0]
}

$start  = (Get-Date).Date
$end    = Get-Date
$period = "$($start.ToString('o'))/$($end.ToString('o'))"
$date   = $start.ToString("yyyy-MM-dd")

$buckets = (Invoke-RestMethod -Uri "$Aw/buckets/").PSObject.Properties.Name
$hasWeb  = $buckets | Where-Object { $_ -like "aw-watcher-web*" } | Select-Object -First 1

# Window activity, only while you're actually at the computer (not AFK).
$winQuery = @(
  'afk = flood(query_bucket(find_bucket("aw-watcher-afk_")));',
  'active = filter_keyvals(afk, "status", ["not-afk"]);',
  'win = flood(query_bucket(find_bucket("aw-watcher-window_")));',
  'win = filter_period_intersect(win, active);',
  'apps = sort_by_duration(merge_events_by_keys(win, ["app"]));',
  'titles = sort_by_duration(merge_events_by_keys(win, ["app", "title"]));',
  'RETURN = {"apps": apps, "titles": titles, "active": sum_durations(active)};'
)
$w = Invoke-AwQuery $winQuery $period

$apps = @(); $titles = @()
foreach ($e in $w.apps) {
  $name = $e.data.app -replace '\.exe$', ''
  if (-not (Is-Private $name)) { $apps += @{ name = $name; seconds = [double]$e.duration } }
}
foreach ($e in $w.titles) {
  $app = $e.data.app -replace '\.exe$', ''
  $title = "$($e.data.title)"
  if ((Is-Private $app) -or (Is-Private $title)) { continue }
  if ($title.Length -gt 120) { $title = $title.Substring(0, 120) }
  $titles += @{ name = "$app - $title"; seconds = [double]$e.duration }
}

$sites = @()
if ($hasWeb) {
  $webQuery = @(
    "web = flood(query_bucket(""$hasWeb""));",
    'web = split_url_events(web);',
    'RETURN = sort_by_duration(merge_events_by_keys(web, ["$domain"]));'
  )
  foreach ($e in (Invoke-AwQuery $webQuery $period)) {
    $domain = "$($e.data.'$domain')"
    if ($domain -and -not (Is-Private $domain)) { $sites += @{ name = $domain; seconds = [double]$e.duration } }
  }
}

$payload = @{
  date = $date
  active_seconds = [double]$w.active
  apps = $apps | Select-Object -First 25
  titles = $titles | Select-Object -First 40
  sites = $sites | Select-Object -First 25
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri $JamesUrl -ContentType "application/json" `
  -Headers @{ "x-intake-secret" = $Secret } -Body $payload | Out-Null
Write-Output "Sent $date to James: $($apps.Count) apps, $($sites.Count) sites."
