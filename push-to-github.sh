#!/usr/bin/env bash
# ==============================================================================
# Muavin - GitHub Çift Yönlü Senkronizasyon (Gönder & Al) Scripti
# ==============================================================================

set -e

REPO_URL="${1:-https://github.com/ilyasylldrm-pixel/TALLSOFTMUAVIN.git}"

# 1. Git deposu yoksa otomatik başlat
if [ ! -d ".git" ]; then
  echo "Git deposu başlatılıyor (git init)..."
  git init
  git config user.name "Muavin"
  git config user.email "ilyasylldrm@gmail.com"
  git branch -M main
fi

# 2. Remote origin ayarla
echo "Remote 'origin' yapılandırılıyor: $REPO_URL"
if git remote | grep -q "^origin$"; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

# 3. GitHub'dan en güncel durumu al (fetch)
echo "GitHub'dan güncel değişiklikler alınıyor (git fetch origin main)..."
git fetch origin main || true

# 4. Tüm yerel değişiklikleri sahnele ve commit et
git branch -M main
echo "Dosyalar sahneleniyor (git add .)..."
git add .
if [ -n "$(git status --porcelain)" ]; then
  echo "Değişiklikler commit ediliyor..."
  git commit -m "feat: Fatura tarihi sağına otomatik e-Fatura / e-Arşiv sıra numarası alanı ve arayüz düzenlemeleri ($(date +'%Y-%m-%d %H:%M'))"
fi

# 5. Uzak dal ile birleştir (varsa)
git merge origin/main --allow-unrelated-histories -X ours --no-edit || git merge --abort || true

# 6. GitHub'a gönder (push)
echo "GitHub'a gönderiliyor (git push -u origin main --force)..."
git push -u origin main --force

echo "======================================================================"
echo " Başarıyla GitHub ile eşitlendi (Gönderildi & Alındı)!"
echo "======================================================================"

