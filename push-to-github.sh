#!/usr/bin/env bash
# ==============================================================================
# Muavin - GitHub Çift Yönlü Senkronizasyon ve Yayınlama (Gönder & Yayınla) Scripti
# ==============================================================================

set -e

COMMIT_MSG="${1:-feat: Mysoft Gelen e-Fatura Entegrasyon Merkezi, orijinal GİB görünümü ve sistem güncellemeleri}"

npx --no-install tsx -e "
import { gitHubSyncService } from './src/services/githubSyncService.ts';
(async () => {
  const res = await gitHubSyncService.publishOrSync({
    commitMessage: process.argv[1],
    pullFirst: true,
    rebuild: true,
  });
  console.log(JSON.stringify(res, null, 2));
  if (!res.success) process.exit(1);
})();
" "$COMMIT_MSG"

