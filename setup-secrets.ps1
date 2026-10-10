# Run once in a terminal:  powershell -ExecutionPolicy Bypass -File .\setup-secrets.ps1
# Asks for the 2 client secrets (hidden input), stores them on your Supabase project, and redeploys the proxy.
$ErrorActionPreference = "Stop"
$sb  = Read-Host "Supabase OAuth app CLIENT SECRET (Organization settings > OAuth Apps)" -AsSecureString
$gh  = Read-Host "GitHub App CLIENT SECRET (GitHub > Settings > Developer settings > GitHub Apps > Generate a new client secret)" -AsSecureString
function Plain($s) { [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) }
npx supabase secrets set "OAUTH_CLIENT_ID=f3202af2-0533-40e0-8606-9947ea4661d8" "OAUTH_CLIENT_SECRET=$(Plain $sb)" "GITHUB_CLIENT_ID=Iv23liVY2O0rhKLiNzVO" "GITHUB_CLIENT_SECRET=$(Plain $gh)" --project-ref rvzumdotvyxdrhfsmpjs
npx supabase functions deploy migration-proxy --no-verify-jwt --use-api --project-ref rvzumdotvyxdrhfsmpjs
Write-Host "Done. Now run: npm run dev" -ForegroundColor Green
