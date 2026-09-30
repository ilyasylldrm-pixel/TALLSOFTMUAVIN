#!/usr/bin/env bash
# ==============================================================================
# Google Cloud Run Maximum-Performance Deployment Script
# Automatically applies Gen2, Startup CPU Boost, Min-Instances=1 & 4GB RAM
# ==============================================================================

set -euo pipefail

SERVICE_NAME="${1:-muavin-muhasebe}"
REGION="${2:-europe-west3}" # Frankfurt / Europe West 3

echo "======================================================================"
echo " Google Cloud Run Yüksek Performanslı Canlıya Alma (Deploy) Başlatılıyor"
echo " Servis: $SERVICE_NAME"
echo " Bölge:  $REGION"
echo "======================================================================"

# Proje ID Kontrolü
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
  echo "Hata: Aktif Google Cloud Projesi bulunamadı. Lütfen 'gcloud config set project <PROJE_ID>' çalıştırın."
  exit 1
fi

echo "Seçili Google Cloud Projesi: $PROJECT_ID"
echo "Gerekli Google Cloud API servisleri etkinleştiriliyor..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

echo "Google Cloud Run servisi optimize edilmiş bayraklarla dağıtılıyor..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 3000 \
  --cpu 2 \
  --memory 4Gi \
  --concurrency 80 \
  --min-instances 1 \
  --max-instances 10 \
  --cpu-boost \
  --execution-environment gen2 \
  --timeout 300s \
  --set-env-vars="NODE_ENV=production,NODE_OPTIONS=--max-old-space-size=3072"

echo "======================================================================"
echo " Dağıtım Başarıyla Tamamlandı!"
echo " Servis Yapılandırması:"
echo " - 1 Adet Sürekli Sıcak Örnek (Min-Instances=1): 0 saniye soğuk başlama!"
echo " - 2 vCPU + 4GB RAM + V8 Heap Optimizasyonu"
echo " - CPU Boost: Başlangıçta 4 kat daha hızlı boot süresi"
echo " - Gen2 Execution Environment: Maksimum I/O & Linux çekirdek hızı"
echo "======================================================================"
