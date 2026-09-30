#!/usr/bin/env bash
# ==============================================================================
# Muavin - GitHub'a Otomatik Proje Aktarım Scripti
# ==============================================================================

set -e

REPO_URL="${1:-}"

if [ -z "$REPO_URL" ]; then
  echo "======================================================================"
  echo " GitHub Repository Aktarımı"
  echo "======================================================================"
  echo "Kullanım:"
  echo "  ./push-to-github.sh <GITHUB_REPO_URL>"
  echo ""
  echo "Örnek (Token ile - En Çok Tercih Edilen):"
  echo "  ./push-to-github.sh https://<GITHUB_TOKEN>@github.com/<KULLANICI_ADI>/<REPO_ADI>.git"
  echo ""
  echo "Örnek (Standart HTTPS):"
  echo "  ./push-to-github.sh https://github.com/<KULLANICI_ADI>/<REPO_ADI>.git"
  echo "======================================================================"
  exit 1
fi

# 1. Git deposu yoksa otomatik başlat ve commit oluştur
if [ ! -d ".git" ]; then
  echo "Git deposu başlatılıyor (git init)..."
  git init
  git config user.name "Muavin"
  git config user.email "ilyasylldrm@gmail.com"
  git branch -M main
  echo "Dosyalar sahneleniyor (git add)..."
  git add .
  echo "İlk commit oluşturuluyor..."
  git commit -m "feat: Muavin Ön Muhasebe, İnşaat Maliyetlendirme ve Üretim Yönetimi"
fi

# 2. Remote origin ayarla
echo "Remote 'origin' yapılandırılıyor: $REPO_URL"
if git remote | grep -q "^origin$"; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

# 3. Dalı main olarak doğrula
git branch -M main

# 4. GitHub'a zorlamalı/temiz gönder (push)
echo "GitHub'a gönderiliyor (git push -u origin main --force)..."
git push -u origin main --force

echo "======================================================================"
echo " Başarıyla GitHub'a aktarıldı!"
echo "======================================================================"
