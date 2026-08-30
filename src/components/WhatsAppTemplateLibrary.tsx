import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Star,
  Copy,
  Edit2,
  Trash2,
  CopyPlus,
  Send,
  Sparkles,
  Check,
  X,
  Code,
  Tag,
  Smile,
  Download,
  Upload,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Eye,
  Info,
  CheckCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { WhatsAppTemplate } from '../types';

interface WhatsAppTemplateLibraryProps {
  templates: WhatsAppTemplate[];
  onUpdateTemplates: (templates: WhatsAppTemplate[]) => void;
  onSelectForSend: (templateId: string, customPhone?: string, customName?: string) => void;
}

const AVAILABLE_VARIABLES = [
  { key: 'MUSTERI_ADI', label: 'Müşteri / Cari Adı', example: 'Korkmazlar Otomotiv Ltd.', category: 'Genel' },
  { key: 'PERSONEL_ADI', label: 'Personel Adı Soyadı', example: 'Ahmet Yılmaz', category: 'İK' },
  { key: 'SIRKET_ADI', label: 'Şirket Ünvanı', example: 'MUAVİN ERP TİCARET A.Ş.', category: 'Genel' },
  { key: 'TUTAR', label: 'İşlem Tutarı (TL)', example: '45.850,00', category: 'Finans' },
  { key: 'FATURA_NO', label: 'Fatura Numarası', example: 'FTR202600000142', category: 'Fatura' },
  { key: 'VADE_TARIHI', label: 'Vade Tarihi', example: '31.08.2026', category: 'Finans' },
  { key: 'TARIH', label: 'Bugünün Tarihi', example: new Date().toLocaleDateString('tr-TR'), category: 'Genel' },
  { key: 'BAKIYE_TUTARI', label: 'Güncel Bakiye', example: '142.800,00', category: 'Finans' },
  { key: 'NET_MAAS', label: 'Net Maaş Tutarı', example: '42.500,00', category: 'İK' },
  { key: 'DONEM', label: 'Maaş / İşlem Dönemi', example: 'Ağustos 2026', category: 'İK' },
  { key: 'TEKLIF_NO', label: 'Teklif Numarası', example: 'TKL-2026-441', category: 'Satış' },
  { key: 'SIPARIS_NO', label: 'Sipariş Numarası', example: 'SIP-2026-883', category: 'Satış' },
  { key: 'TERMIN_TARIHI', label: 'Termin / Teslim Tarihi', example: '05.09.2026', category: 'Satış' },
  { key: 'IRSALIYE_NO', label: 'İrsaliye Numarası', example: 'IRS20260000098', category: 'Lojistik' },
  { key: 'SEVK_KODU', label: 'Kargo / Sevk Kodu', example: 'TRK-99482-IST', category: 'Lojistik' },
  { key: 'TASIYICI', label: 'Kargo / Taşıyıcı Firma', example: 'Yurtiçi Kargo', category: 'Lojistik' },
  { key: 'URUN_ADI', label: 'Ürün / Malzeme Adı', example: 'Bosch Fren Balatası Seti', category: 'Stok' },
  { key: 'STOK_KODU', label: 'Stok Kodu', example: 'STK-BRK-009', category: 'Stok' },
  { key: 'KALAN_MIKTAR', label: 'Kalan Stok Miktarı', example: '3', category: 'Stok' },
  { key: 'KRITIK_ESIK', label: 'Kritik Stok Eşiği', example: '15', category: 'Stok' },
  { key: 'SERVIS_KODU', label: 'Servis Takip Kodu', example: 'SRV-9402', category: 'Servis' },
  { key: 'CIHAZ_BILGISI', label: 'Cihaz / Araç Bilgisi', example: '34 ABC 789 - Ford Transit', category: 'Servis' },
  { key: 'GUNLUK_CIRO', label: 'Günlük Ciro', example: '284.500,00', category: 'Admin' }
];

const EMOJI_PALETTE = ['👋', '✅', '⚠️', '💼', '📊', '🧾', '💰', '📅', '🚚', '📦', '🔧', '🏢', '📱', '🔔', '🔒', '🎉', '⏳', '📌'];

export const WhatsAppTemplateLibrary: React.FC<WhatsAppTemplateLibraryProps> = ({
  templates,
  onUpdateTemplates,
  onSelectForSend
}) => {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'usage'>('default');

  // Modal State for New / Edit Template
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<WhatsAppTemplate['category']>('custom');
  const [formText, setFormText] = useState('');
  const [formShortcut, setFormShortcut] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Feedback Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Variable replacement in preview
  const previewResolvedText = useMemo(() => {
    let res = formText;
    AVAILABLE_VARIABLES.forEach(v => {
      const regex = new RegExp(`{{${v.key}}}`, 'g');
      res = res.replace(regex, v.example);
    });
    return res;
  }, [formText]);

  // Detected variables in formText
  const detectedVariables = useMemo(() => {
    const matches = formText.match(/{{([A-Z0-9_]+)}}/g);
    if (!matches) return [];
    const unique = Array.from(new Set(matches.map(m => m.replace(/[{}]/g, ''))));
    return unique;
  }, [formText]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormCategory('custom');
    setFormText('Sayın {{MUSTERI_ADI}},\n\n');
    setFormShortcut('');
    setFormDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (tmpl: WhatsAppTemplate) => {
    setEditingTemplate(tmpl);
    setFormTitle(tmpl.title);
    setFormCategory(tmpl.category);
    setFormText(tmpl.text);
    setFormShortcut(tmpl.shortcut || '');
    setFormDescription(tmpl.description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save or Update Template
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Lütfen şablon için bir başlık belirleyin.');
      return;
    }
    if (!formText.trim()) {
      setFormError('Lütfen şablon mesaj içeriğini girin.');
      return;
    }

    if (editingTemplate) {
      // Update existing
      const updated = templates.map(t => {
        if (t.id === editingTemplate.id) {
          return {
            ...t,
            title: formTitle.trim(),
            category: formCategory,
            text: formText,
            shortcut: formShortcut.trim() ? (formShortcut.startsWith('/') ? formShortcut : `/${formShortcut}`) : undefined,
            description: formDescription.trim() || undefined,
            variables: detectedVariables,
            isCustom: t.isCustom !== false
          };
        }
        return t;
      });
      onUpdateTemplates(updated);
      showToast('Şablon başarıyla güncellendi.');
    } else {
      // Create new
      const newTmpl: WhatsAppTemplate = {
        id: `tmpl_custom_${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        text: formText,
        variables: detectedVariables,
        isCustom: true,
        isFavorite: false,
        shortcut: formShortcut.trim() ? (formShortcut.startsWith('/') ? formShortcut : `/${formShortcut}`) : undefined,
        description: formDescription.trim() || undefined,
        usageCount: 0,
        lastUsedAt: new Date().toLocaleDateString('tr-TR')
      };
      onUpdateTemplates([newTmpl, ...templates]);
      showToast('Yeni mesaj şablonu kütüphaneye eklendi.');
    }

    setIsModalOpen(false);
  };

  // Clone Template
  const handleCloneTemplate = (tmpl: WhatsAppTemplate) => {
    const clone: WhatsAppTemplate = {
      ...tmpl,
      id: `tmpl_clone_${Date.now()}`,
      title: `${tmpl.title} (Kopya)`,
      isCustom: true,
      usageCount: 0,
      shortcut: tmpl.shortcut ? `${tmpl.shortcut}_kopya` : undefined
    };
    onUpdateTemplates([clone, ...templates]);
    showToast(`"${tmpl.title}" şablonu başarıyla çoğaltıldı.`);
  };

  // Delete Template
  const handleDeleteTemplate = (id: string, title: string) => {
    if (confirm(`"${title}" şablonunu silmek istediğinize emin misiniz?`)) {
      onUpdateTemplates(templates.filter(t => t.id !== id));
      showToast('Şablon silindi.');
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    const updated = templates.map(t => {
      if (t.id === id) {
        return { ...t, isFavorite: !t.isFavorite };
      }
      return t;
    });
    onUpdateTemplates(updated);
  };

  // Copy Template Text to Clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Şablon metni panoya kopyalandı.');
  };

  // Append variable to formText
  const handleInsertVariable = (varKey: string) => {
    setFormText(prev => `${prev}{{${varKey}}}`);
  };

  // Append formatting
  const handleInsertFormatting = (prefix: string, suffix: string) => {
    setFormText(prev => `${prev}${prefix}metin${suffix}`);
  };

  // Append emoji
  const handleInsertEmoji = (emoji: string) => {
    setFormText(prev => `${prev}${emoji}`);
  };

  // Export templates as JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templates, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `WhatsApp_Sablon_Kutuphanesi_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Şablon kütüphanesi JSON dosyası olarak indirildi.');
  };

  // Filter and Sort templates
  const filteredTemplates = useMemo(() => {
    let list = templates.filter(tmpl => {
      // Category filter
      if (selectedCategory === 'custom' && !tmpl.isCustom) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'custom' && tmpl.category !== selectedCategory) {
        // Handle alias
        if (selectedCategory === 'edocuments' && tmpl.category === 'invoice') return true;
        if (selectedCategory === 'invoices' && tmpl.category === 'quote') return true;
        return false;
      }

      // Favorite filter
      if (showOnlyFavorites && !tmpl.isFavorite) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = tmpl.title.toLowerCase().includes(q);
        const matchesText = tmpl.text.toLowerCase().includes(q);
        const matchesShortcut = tmpl.shortcut?.toLowerCase().includes(q);
        const matchesVar = tmpl.variables.some(v => v.toLowerCase().includes(q));
        if (!matchesTitle && !matchesText && !matchesShortcut && !matchesVar) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    } else if (sortBy === 'usage') {
      list = [...list].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    }

    return list;
  }, [templates, selectedCategory, showOnlyFavorites, searchQuery, sortBy]);

  // Statistics
  const customTemplatesCount = templates.filter(t => t.isCustom).length;
  const favoriteTemplatesCount = templates.filter(t => t.isFavorite).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Mesaj Şablonları & Hızlı Yanıt Kütüphanesi
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {templates.length} Aktif Şablon
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Sık gönderilen müşteri bildirimleri, İK bordro iletileri, finans makbuzları ve e-faturalar için dinamik değişkenli şablonlar oluşturun, düzenleyin veya tek tıkla doğrudan WhatsApp üzerinden gönderin.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-xs"
            title="Şablonları JSON Olarak İndir"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Dışa Aktar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Şablon Oluştur</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Toplam Şablon</p>
            <p className="text-lg font-bold text-slate-900">{templates.length}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Özel Şablonlarım</p>
            <p className="text-lg font-bold text-slate-900">{customTemplatesCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Favori Şablonlar</p>
            <p className="text-lg font-bold text-slate-900">{favoriteTemplatesCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Kullanılabilir Değişken</p>
            <p className="text-lg font-bold text-slate-900">{AVAILABLE_VARIABLES.length} Parametre</p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Sorting */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Şablon başlığı, mesaj metni, /kısayol veya değişken ara..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Favorite Filter Toggle & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
              showOnlyFavorites
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-white' : 'text-amber-500'}`} />
            <span>Sadece Favoriler</span>
          </button>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-[11px] text-slate-400 font-medium">Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="default">Varsayılan Sıralama</option>
              <option value="name">Şablon Adı (A-Z)</option>
              <option value="usage">En Çok Kullanılan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'all', label: 'Tüm Şablonlar' },
          { id: 'custom', label: '⭐ Özel Şablonlarım' },
          { id: 'hr', label: 'İnsan Kaynakları' },
          { id: 'finance', label: 'Finans Yönetimi' },
          { id: 'edocuments', label: 'E-Dönüşüm / E-Fatura' },
          { id: 'contacts', label: 'Cari & CRM' },
          { id: 'quote', label: 'Satış & Teklif' },
          { id: 'products', label: 'Stok & Depo' },
          { id: 'service', label: 'Teknik Servis' },
          { id: 'admin', label: 'Admin & Sistem' }
        ].map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedCategory(f.id)}
            className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all ${
              selectedCategory === f.id
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Templates Grid View */}
      {filteredTemplates.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Eşleşen Mesaj Şablonu Bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Arama kriterlerinizi değiştirebilir veya hızlıca yeni bir özel mesaj şablonu oluşturabilirsiniz.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Şablon Ekle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((tmpl) => {
            const isCustom = tmpl.isCustom;
            return (
              <div
                key={tmpl.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isCustom
                    ? 'bg-purple-50/20 border-purple-200 hover:border-purple-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top: Title, Badge, Favorite */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-slate-800 text-sm">{tmpl.title}</h3>
                        {isCustom && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            ÖZEL
                          </span>
                        )}
                        {tmpl.shortcut && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {tmpl.shortcut}
                          </span>
                        )}
                      </div>
                      {tmpl.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">{tmpl.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(tmpl.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          tmpl.isFavorite
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                        }`}
                        title={tmpl.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                      >
                        <Star className={`w-4 h-4 ${tmpl.isFavorite ? 'fill-amber-500' : ''}`} />
                      </button>

                      {/* Category Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                        tmpl.category === 'hr' ? 'bg-purple-100 text-purple-700' :
                        tmpl.category === 'finance' ? 'bg-blue-100 text-blue-700' :
                        tmpl.category === 'edocuments' || tmpl.category === 'invoice' ? 'bg-emerald-100 text-emerald-700' :
                        tmpl.category === 'contacts' ? 'bg-cyan-100 text-cyan-700' :
                        tmpl.category === 'quote' || tmpl.category === 'invoices' ? 'bg-indigo-100 text-indigo-700' :
                        tmpl.category === 'products' ? 'bg-amber-100 text-amber-700' :
                        tmpl.category === 'service' ? 'bg-orange-100 text-orange-700' :
                        tmpl.category === 'admin' ? 'bg-rose-100 text-rose-700' :
                        tmpl.category === 'custom' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {tmpl.category === 'hr' ? 'İK' :
                         tmpl.category === 'finance' ? 'Finans' :
                         tmpl.category === 'edocuments' || tmpl.category === 'invoice' ? 'E-Dönüşüm' :
                         tmpl.category === 'contacts' ? 'Cari/CRM' :
                         tmpl.category === 'quote' || tmpl.category === 'invoices' ? 'Satış' :
                         tmpl.category === 'products' ? 'Stok' :
                         tmpl.category === 'service' ? 'Servis' :
                         tmpl.category === 'admin' ? 'Admin' :
                         tmpl.category === 'custom' ? 'Özel' : tmpl.category}
                      </span>
                    </div>
                  </div>

                  {/* Message Bubble (WhatsApp Style) */}
                  <div className="relative bg-[#E7FFDB] text-slate-900 p-3 rounded-xl rounded-tl-none border border-[#c4eab3] shadow-xs text-xs whitespace-pre-wrap font-sans leading-relaxed">
                    <p>{tmpl.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-500 font-mono">
                      <span>12:00</span>
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Variables & Action Bar */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {/* Variables pills */}
                  {tmpl.variables && tmpl.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] text-slate-400 font-medium">Değişkenler:</span>
                      {tmpl.variables.map((v, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono text-[10px]"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons Toolbar */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="flex items-center gap-1">
                      {/* Copy Text */}
                      <button
                        type="button"
                        onClick={() => handleCopyText(tmpl.text)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Metni Panoya Kopyala"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Clone Template */}
                      <button
                        type="button"
                        onClick={() => handleCloneTemplate(tmpl)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Şablonu Çoğalt / Klonla"
                      >
                        <CopyPlus className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Template */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(tmpl)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Şablonu Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Template */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tmpl.id, tmpl.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Şablonu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Launch Template for Send */}
                    <button
                      type="button"
                      onClick={() => onSelectForSend(tmpl.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Send className="w-3 h-3" />
                      <span>Bu Şablonla Gönder</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Yeni Şablon Oluştur / Düzenle                                      */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base">
                    {editingTemplate ? 'Şablonu Düzenle' : 'Yeni Hızlı Mesaj Şablonu Oluştur'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Özelleştirilebilir dinamik değişkenlerle parametrik WhatsApp mesajı tasarlayın
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveTemplate} className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Title */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Şablon Başlığı *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Örn: Hafta Sonu Özel İndirim & Kampanya Bildirimi"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Modül / Kategori *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
                  >
                    <option value="custom">⭐ Özel Şablon</option>
                    <option value="hr">İnsan Kaynakları (İK)</option>
                    <option value="finance">Finans Yönetimi</option>
                    <option value="edocuments">E-Dönüşüm / E-Fatura</option>
                    <option value="contacts">Cari & CRM</option>
                    <option value="quote">Satış & Teklif</option>
                    <option value="products">Stok & Depo</option>
                    <option value="service">Teknik Servis</option>
                    <option value="admin">Admin & Yönetici</option>
                  </select>
                </div>
              </div>

              {/* Shortcut & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Hızlı Kısayol Komutu (Opsiyonel)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Örn: /kampanya, /bordro</span>
                  </label>
                  <input
                    type="text"
                    value={formShortcut}
                    onChange={(e) => setFormShortcut(e.target.value)}
                    placeholder="/kampanya"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Kısa Açıklama / Not</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Bu şablon ne zaman kullanılır..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic Variables Palette */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dinamik Değişken Ekle (Tıklayarak Metne Yerleştirin)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Mesaj gönderilirken bu alanlar otomatik doldurulur
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                  {AVAILABLE_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      className="px-2 py-1 text-[11px] font-mono font-semibold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg shadow-2xs transition-all flex items-center gap-1"
                      title={`${v.label} (Örnek: ${v.example})`}
                    >
                      <Plus className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{`{{${v.key}}}`}</span>
                      <span className="text-[9px] text-slate-400 font-sans">({v.label})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Formatting & Emojis Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Biçimlendirme:</span>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting('*', '*')}
                    className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
                    title="*Kalın Metin*"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting('_', '_')}
                    className="px-2 py-1 text-xs italic font-serif bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
                    title="_İtalik Metin_"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting('~', '~')}
                    className="px-2 py-1 text-xs line-through bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
                    title="~Üstü Çizili Metin~"
                  >
                    S
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting('```', '```')}
                    className="px-2 py-1 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
                    title="```Kod / Monospace```"
                  >
                    {`</>`}
                  </button>
                </div>

                {/* Emoji Bar */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Hızlı Emoji:</span>
                  {EMOJI_PALETTE.slice(0, 10).map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => handleInsertEmoji(em)}
                      className="p-1 text-xs hover:scale-125 transition-transform"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor & Live Preview Two Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Textarea Editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Şablon Mesaj Metni *</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formText.length} Karakter
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="Mesaj metnini buraya yazın veya yukarıdaki değişken butonlarını kullanın..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
                    required
                  />
                </div>

                {/* Column 2: Live WhatsApp Preview */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Canlı WhatsApp Görünümü (Değişkenler Çözülmüş)</span>
                  </label>

                  <div className="h-[180px] p-4 bg-[#E5DDD5] rounded-xl border border-slate-300 overflow-y-auto flex flex-col justify-end">
                    <div className="bg-[#E7FFDB] text-slate-900 p-3 rounded-xl rounded-tl-none border border-[#c4eab3] shadow-xs text-xs whitespace-pre-wrap font-sans leading-relaxed">
                      <p>{previewResolvedText || 'Mesaj metni yazıldığında burada gerçek hali canlı görünecektir...'}</p>
                      <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-500 font-mono">
                        <span>14:30</span>
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detected Variables in this Template */}
              {detectedVariables.length > 0 && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-emerald-800">Şablonda Tanımlı Değişkenler:</span>
                  {detectedVariables.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-semibold text-[11px]">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTemplate ? 'Değişiklikleri Kaydet' : 'Şablonu Kütüphaneye Ekle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
