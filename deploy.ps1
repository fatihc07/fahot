# FAHOT - Tek Tıkla Canlıya Alış Scripti
# Kullanımı: PowerShell terminalinden .\deploy.ps1 komutunu verin.

Write-Host "🚀 FAHOT Canlıya Dağıtım Başlıyor..." -ForegroundColor Cyan

# 1. Değişiklikleri Ekle
git add .

# 2. Commit Yap (Varsayılan olarak "Otomatik Güncelleme")
$commitMsg = Read-Host -Prompt 'Commit mesajı girin (Boş bırakmak için Enter)'
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Güncelleme: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
}

git commit -m "$commitMsg"

# 3. GitHub'a Gönder (Bu sırada Railway otomatik olarak tetiklenir)
Write-Host "📤 Değişiklikler GitHub'a gönderiliyor..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BAŞARILI: Değişiklikler GitHub'a itildi. Railway üzerinden canlıya alınıyor!" -ForegroundColor Green
    Write-Host "➡ Railway Dashboard: https://railway.com/dashboard" -ForegroundColor Green
} else {
    Write-Error "❌ HATA: GitHub'a gönderilemedi. Lütfen internet bağlantınızı veya Git yetkilerini kontrol edin."
}
