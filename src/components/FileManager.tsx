import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  File,
  Image,
  FileSpreadsheet,
  Trash2,
  Download,
  Eye,
  Search,
  Lock,
  ShieldCheck,
  Calendar,
  HardDrive,
  FolderOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Tag,
  Info
} from "lucide-react";
import { UserProfile } from "./AuthModal";
import {
  saveUserFile,
  getUserFiles,
  deleteUserFile,
  uploadFileToStorage,
  UserFileMetadata
} from "../lib/firebase";

interface FileManagerProps {
  currentUser: UserProfile;
}

const FILE_CATEGORIES = [
  "Tümü",
  "Fatura & Fişler",
  "Sözleşmeler & Protokoller",
  "Vergi Beyannameleri",
  "Banka & Dekontlar",
  "İnsan Kaynakları",
  "Genel Belgeler"
];

export const FileManager: React.FC<FileManagerProps> = ({ currentUser }) => {
  const [files, setFiles] = useState<UserFileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [previewFile, setPreviewFile] = useState<UserFileMetadata | null>(null);

  // Upload Form State
  const [category, setCategory] = useState("Fatura & Fişler");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load user files from Firestore
  useEffect(() => {
    loadFiles();
  }, [currentUser.id]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const userFiles = await getUserFiles(currentUser.id);
      setFiles(userFiles);
    } catch (err) {
      console.error("Dosyalar yüklenirken hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);

    try {
      let fileUrl = "";
      let storagePath = "";
      let base64Data: string | undefined = undefined;

      // 1. Try uploading to Firebase Storage
      try {
        const uploadResult = await uploadFileToStorage(currentUser.id, selectedFile);
        fileUrl = uploadResult.fileUrl;
        storagePath = uploadResult.storagePath;
      } catch (storageErr) {
        console.warn("Firebase Storage upload failed or not enabled yet, falling back to Base64:", storageErr);
        // Fallback to Base64 DataURL if storage is restricted or failing
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(selectedFile);
        });
      }

      // 2. Save metadata to Firestore user_files collection
      const fileData: Omit<UserFileMetadata, "id"> = {
        userId: currentUser.id,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || "application/octet-stream",
        uploadDate: new Date().toISOString(),
        category,
        description: description || `${selectedFile.name} evrak yüklemesi`,
        ...(fileUrl ? { fileUrl } : {}),
        ...(storagePath ? { storagePath } : {}),
        ...(base64Data ? { fileData: base64Data } : {})
      };

      const newId = await saveUserFile(fileData);

      const newFileEntry: UserFileMetadata = {
        id: newId,
        ...fileData
      };

      setFiles((prev) => [newFileEntry, ...prev]);
      setSelectedFile(null);
      setDescription("");
    } catch (err) {
      console.error("Dosya yükleme hatası:", err);
      alert("Dosya yüklenirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: UserFileMetadata) => {
    if (!window.confirm(`"${file.fileName}" dosyasını ve tüm kayıtlarını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteUserFile(file.id, file.storagePath);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      if (previewFile?.id === file.id) {
        setPreviewFile(null);
      }
    } catch (err) {
      console.error("Dosya silme hatası:", err);
      alert("Dosya silinemedi. Güvenlik yetkilerini kontrol edin.");
    }
  };

  // Filtered Files
  const filteredFiles = files.filter((f) => {
    const matchesCategory =
      selectedCategory === "Tümü" || f.category === selectedCategory;
    const matchesSearch =
      f.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-5 h-5 text-purple-600" />;
    if (type.includes("pdf")) return <FileText className="w-5 h-5 text-rose-600" />;
    if (type.includes("sheet") || type.includes("excel") || type.includes("csv"))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    return <File className="w-5 h-5 text-indigo-600" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header Controls (Lila Bal Peteği & Geometrik Desen - Cari Hesaplar Tasarımı) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-fuchsia-50/40 to-slate-50/80 rounded-2xl p-5 border border-purple-200/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Lila Bal Peteği ve Geometrik Desen Kaplaması */}
        <div
          className="absolute inset-0 pointer-events-none opacity-15 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z M12 21l12 7v14l-12 7L0 42V28z' stroke='%239333ea' stroke-width='1' stroke-opacity='0.4'/%3E%3Cpath d='M0 7l12 7 12-7 M0 28l12 7 12-7 M12 0v14 M12 21v14' stroke='%23a855f7' stroke-width='0.7' stroke-opacity='0.3' stroke-dasharray='2,2'/%3E%3Cpath d='M0 0l24 42 M24 0L0 42' stroke='%23c084fc' stroke-width='0.4' stroke-opacity='0.2'/%3E%3Ccircle cx='12' cy='14' r='1.2' fill='%237e22ce' fill-opacity='0.5' stroke='none'/%3E%3Ccircle cx='0' cy='21' r='1' fill='%23a855f7' fill-opacity='0.5' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        {/* Dekoratif Geometrik Vektör Şekiller */}
        <svg
          className="absolute -right-6 -bottom-10 w-48 h-48 pointer-events-none text-purple-400/10"
          viewBox="0 0 200 200"
          fill="none"
        >
          <polygon points="100,10 180,55 180,145 100,190 20,145 20,55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="100,35 155,67 155,133 100,165 45,133 45,67" stroke="currentColor" strokeWidth="1" />
          <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="55" x2="180" y2="145" stroke="currentColor" strokeWidth="0.8" />
          <line x1="20" y1="145" x2="180" y2="55" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="25" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        </svg>

        <svg
          className="absolute -left-10 -top-12 w-40 h-40 pointer-events-none text-fuchsia-500/20"
          viewBox="0 0 160 160"
          fill="none"
        >
          <polygon points="80,10 150,80 80,150 10,80" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="80,30 130,80 80,130 30,80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="80" y1="10" x2="80" y2="150" stroke="currentColor" strokeWidth="0.6" />
          <line x1="10" y1="80" x2="150" y2="80" stroke="currentColor" strokeWidth="0.6" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/10 text-emerald-800 border border-emerald-300/60 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Firestore Güvenli Depolama
            </span>
            <span className="bg-purple-100/80 text-purple-900 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-purple-700" />
              Özel Şifreli Erişim
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-purple-700" />
            <span>Bulut Dosya & Evrak Deposu</span>
          </h2>
          <p className="text-xs font-semibold text-purple-950/90 mt-1 leading-relaxed">
            Muhasebe belgeleriniz, fatura görselleriniz ve sözleşmeleriniz sadece sizin erişiminize özel Firestore veritabanında saklanır.
          </p>
        </div>

        {/* User Auth ID & Security Card */}
        <div className="relative z-10 bg-white/80 backdrop-blur-md border border-purple-200/80 p-3 rounded-xl flex flex-col gap-1 shrink-0 max-w-xs shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-950">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kullanıcı Güvenlik Kuralı</span>
          </div>
          <div className="text-[10px] font-mono bg-purple-50 text-purple-900 px-2 py-0.5 rounded border border-purple-200/60 truncate">
            UID: {currentUser.id}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Kişiselleştirilmiş güvenli evrak klasörü</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Upload Box & File List Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* UPLOAD FORM */}
        <div className="bg-slate-50/60 p-4 rounded-2xl border border-purple-200/60 shadow-2xs space-y-4 h-fit">
          <div className="flex items-center justify-between pb-2.5 border-b border-purple-200/50">
            <h2 className="text-xs font-extrabold text-purple-950 flex items-center gap-2 uppercase tracking-wider">
              <UploadCloud className="w-4 h-4 text-purple-700" />
              <span>Yeni Evrak Yükle</span>
            </h2>
            <span className="text-[10px] font-bold text-purple-800 bg-purple-100/80 border border-purple-200 px-2 py-0.5 rounded-md">
              Firestore Sync
            </span>
          </div>

          <form onSubmit={handleUpload} className="space-y-3.5">
            {/* File Drop Area */}
            <div className="relative border-2 border-dashed border-purple-300/80 hover:border-purple-600 bg-white hover:bg-purple-50/50 p-5 rounded-xl text-center transition-all cursor-pointer group shadow-2xs">
              <input
                type="file"
                required
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200/80 text-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <UploadCloud className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block group-hover:text-purple-950">
                    {selectedFile ? selectedFile.name : "Dosya Seçin veya Sürükleyin"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                    {selectedFile ? formatBytes(selectedFile.size) : "PDF, PNG, JPG, Excel, Word (Max 10MB)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                <span>Evrak Kategori Türü</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-purple-200/80 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all"
              >
                {FILE_CATEGORIES.filter((c) => c !== "Tümü").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-purple-600" />
                <span>Dosya Açıklaması / Not</span>
              </label>
              <input
                type="text"
                placeholder="Örn: 2026 Temmuz Ayı Kira Kontratı"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-purple-200/80 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Yükleniyor...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Buluta Yükle & Kaydet</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* FILE LISTING & METADATA SECTION */}
        <div className="lg:col-span-2 space-y-4">

          {/* Search and Category Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-purple-50/50 p-1.5 rounded-xl border border-purple-200/50 text-xs font-semibold shadow-2xs overflow-x-auto custom-scrollbar">
              <Filter className="w-3.5 h-3.5 text-purple-600 ml-1 shrink-0 hidden sm:block" />
              {FILE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-white text-purple-950 font-bold shadow-2xs border border-purple-200/60"
                      : "text-purple-900/70 hover:text-purple-950"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Dosya adı veya not ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Files List Container */}
          <div className="bg-slate-50/60 rounded-2xl border border-purple-200/60 p-3 shadow-2xs space-y-2.5">
            <div className="px-1 pb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-extrabold text-purple-950 uppercase tracking-wider">
                  Yüklü Evraklar ({filteredFiles.length})
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Firma Yetkilisi: <strong className="text-purple-900">{currentUser.name}</strong>
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-purple-100/80 space-y-2">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-extrabold">Firestore verileri getiriliyor...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-xl border border-purple-100/80 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center mx-auto border border-purple-200/60">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">Henüz Dosya Yüklenmedi</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                    Sol taraftaki yükleme kutusunu kullanarak faturanıza veya firmanıza ait belgeleri güvenle yükleyebilirsiniz.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white hover:bg-gradient-to-r hover:from-purple-50/90 hover:via-fuchsia-50/60 hover:to-purple-50/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-xl p-3 border border-purple-200/50 hover:border-purple-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-purple-950 truncate">
                            {file.fileName}
                          </h4>
                          <span className="bg-purple-50 border border-purple-200 text-purple-900 text-[9px] font-bold px-2 py-0.2 rounded shrink-0">
                            {file.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {file.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            {new Date(file.uploadDate).toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-purple-700/70">{formatBytes(file.fileSize)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {(file.fileUrl || file.fileData) && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Görüntüle / Önizle"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-700" />
                            <span>Önizle</span>
                          </button>

                          <a
                            href={file.fileUrl || file.fileData}
                            download={file.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            title="Dosyayı İndir"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-700" />
                            <span>İndir</span>
                          </a>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        className="p-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Dosyayı Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-4 flex items-center justify-between border-b border-purple-800/40">
              <div className="flex items-center gap-2.5">
                {getFileIcon(previewFile.fileType)}
                <div>
                  <h3 className="text-xs font-black text-white">{previewFile.fileName}</h3>
                  <p className="text-[10px] text-purple-200/80">{previewFile.category} • {formatBytes(previewFile.fileSize)}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100">
              {previewFile.fileType.startsWith("image/") ? (
                <img
                  src={previewFile.fileUrl || previewFile.fileData}
                  alt={previewFile.fileName}
                  className="max-h-[60vh] max-w-full object-contain rounded-2xl shadow-md border border-slate-200"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 max-w-md space-y-4">
                  <FileText className="w-12 h-12 text-purple-600 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{previewFile.fileName}</h4>
                    <p className="text-xs text-slate-500 mt-1">{previewFile.description}</p>
                  </div>
                  <a
                    href={previewFile.fileUrl || previewFile.fileData}
                    download={previewFile.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-purple-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-purple-800 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Dosyayı İndir</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
