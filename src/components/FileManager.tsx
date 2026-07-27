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
      
      {/* Header & Security Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-purple-200/40 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='42' viewBox='0 0 24 42'%3E%3Cg fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 0l12 7v14l-12 7L0 21V7z' stroke='%23a855f7' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "20px 35px",
          }}
        />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 rounded-full text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Firestore Güvenli Dosya Depolama Servisi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-purple-400" />
            <span>Bulut Dosya & Evrak Deposu</span>
          </h1>
          <p className="text-xs text-purple-200/90 font-medium">
            Tüm muhasebe evraklarınız, fatura görselleriniz ve sözleşmeleriniz sadece sizin erişiminize özel Firestore veritabanında saklanır.
          </p>
        </div>

        {/* User Auth ID & Firestore Security Rules Tag */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-purple-300/30 p-3.5 rounded-2xl flex flex-col gap-1.5 shrink-0 max-w-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kullanıcıya Özel Güvenlik Kuralı (UID)</span>
          </div>
          <div className="text-[11px] font-mono bg-slate-950/60 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30 truncate">
            UID: {currentUser.id}
          </div>
          <div className="text-[10px] text-slate-300 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Her kullanıcı yalnızca kendi yüklediği dosyalara erişebilir.</span>
          </div>
        </div>
      </div>

      {/* Upload Box & File List Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* UPLOAD FORM */}
        <div className="bg-white p-5 rounded-3xl border border-purple-200/80 shadow-xs space-y-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-purple-600" />
              <span>Yeni Evrak / Dosya Yükle</span>
            </h2>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              Firestore Sync
            </span>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* File Drop Area */}
            <div className="relative border-2 border-dashed border-purple-300/80 hover:border-purple-600 bg-purple-50/40 hover:bg-purple-50 p-6 rounded-2xl text-center transition-all cursor-pointer group">
              <input
                type="file"
                required
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    {selectedFile ? selectedFile.name : "Tıklayın veya Dosyayı Buraya Sürükleyin"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    {selectedFile ? formatBytes(selectedFile.size) : "PDF, PNG, JPG, Excel, Word (Max 10MB)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                <span>Evrak Kategori Türü</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
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
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-purple-600" />
                <span>Dosya Açıklaması / Not</span>
              </label>
              <input
                type="text"
                placeholder="Örn: 2026 Temmuz Ayı Kira Kontratı"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Firestore'a Yükleniyor...</span>
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
          <div className="bg-white p-4 rounded-3xl border border-purple-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Dosya adı veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
              <Filter className="w-3.5 h-3.5 text-purple-600 shrink-0 hidden sm:block" />
              {FILE_CATEGORIES.slice(0, 4).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-purple-700 text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Files List Table / Grid */}
          <div className="bg-white rounded-3xl border border-purple-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Yüklü Evraklar ({filteredFiles.length})
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Kullanıcı: <strong className="text-purple-900">{currentUser.name}</strong>
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-extrabold">Firestore verileri getiriliyor...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-400 flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Henüz Dosya Yüklenmedi</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Sol taraftaki yükleme kutusunu kullanarak faturanıza veya firmanıza ait belgeleri güvenle yükleyebilirsiniz.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 hover:bg-purple-50/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900 truncate">
                            {file.fileName}
                          </h4>
                          <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                            {file.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {file.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(file.uploadDate).toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{formatBytes(file.fileSize)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {(file.fileUrl || file.fileData) && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewFile(file)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-800 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Görüntüle / Önizle"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-700" />
                            <span className="hidden sm:inline">Önizle</span>
                          </button>

                          <a
                            href={file.fileUrl || file.fileData}
                            download={file.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Dosyayı İndir"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-700" />
                            <span className="hidden sm:inline">İndir</span>
                          </a>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {getFileIcon(previewFile.fileType)}
                <div>
                  <h3 className="text-xs font-black text-white">{previewFile.fileName}</h3>
                  <p className="text-[10px] text-slate-400">{previewFile.category} • {formatBytes(previewFile.fileSize)}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer"
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
