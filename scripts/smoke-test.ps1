<#
  Koffiegesels API smoke test.
  Runs the Phase 2/3 endpoints end-to-end without manual GUID copying.

  Usage:
    ./scripts/smoke-test.ps1
    ./scripts/smoke-test.ps1 -BaseUrl "http://localhost:5082" -Message "Hallo daar"
#>
param(
    [string]$BaseUrl = "http://localhost:5082",
    [string]$Message = "Hallo, wie is jy?"
)

$ErrorActionPreference = "Stop"

function Show($label, $value) {
    Write-Host ("`n=== {0} ===" -f $label) -ForegroundColor Cyan
    $value | ConvertTo-Json -Depth 6 | Write-Host
}

Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow

# A1 - create a conversation
$conv = Invoke-RestMethod -Method Post -Uri "$BaseUrl/conversations" `
    -ContentType "application/json" -Body '{ "title": "Smoke toets" }'
Show "Created conversation" $conv
$id = $conv.id

# A3 - list conversations
$list = Invoke-RestMethod -Method Get -Uri "$BaseUrl/conversations"
Show "Conversation list (newest first)" $list

# A4 - send a message (calls Ollama)
Write-Host "`nSending message to AI (first call can take 15-30s)..." -ForegroundColor Yellow
$send = Invoke-RestMethod -Method Post -Uri "$BaseUrl/conversations/$id/send" `
    -ContentType "application/json" -Body (@{ content = $Message } | ConvertTo-Json)
Show "Send result (user + assistant)" $send

# A5 - get the conversation with messages
$detail = Invoke-RestMethod -Method Get -Uri "$BaseUrl/conversations/$id"
Show "Conversation detail" $detail

Write-Host "`nConversation id: $id" -ForegroundColor Green
Write-Host "To delete it:  Invoke-RestMethod -Method Delete -Uri `"$BaseUrl/conversations/$id`"" -ForegroundColor DarkGray
