import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  HardDrive,
  FileText,
  Search,
  Calendar,
  Eye,
  Download,
  Trash2,
  X,
  ExternalLink,
  CheckCircle2,
  Lock,
  Building,
  Mail,
  RefreshCw,
  Image,
  FileSpreadsheet,
  File
} from "lucide-react";
import { UserProfile } from "./AuthModal";
import {
  getAllUsersProfiles,
  getAllFilesForAdmin,
  deleteUserFile,
  UserProfileData,
  UserFileMetadata
} from "../lib/firebase";

interface AdminDashboardProps {
  currentUser: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [allFiles, setAllFiles] = useState<UserFileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfileData | null>(null);
  const [previewFile, setPreviewFile] = useState<UserFileMetadata | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, filesData] = await Promise.all([
        getAllUsersProfiles(),
        getAllFilesForAdmin()
      ]);

      // Ensure current user is in the list if not present
      let mergedUsers = [...usersData];
      if (!mergedUsers.some((u) => u.userId === currentUser.id)) {
        mergedUsers.push({
          userId: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          companyName: currentUser.companyName,
          phone: currentUser.phone || "",
          taxNumber: currentUser.taxNumber || "",
          selectedLogoId: currentUser.selectedLogoId,
          selectedLogoName: currentUser.selectedLogoName,
          selectedLogoUrl: currentUser.selectedLogoUrl,
          role: currentUser.role
        });
      }

      setUsers(mergedUsers);
      setAllFiles(filesData);
    } catch (err) {
      console.error("Admin verileri yüklenirken hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilesForUser = (userId: string) => {
    return allFiles.filter((f) => f.userId === userId);
  };

  const handleDeleteFile = async (file: UserFileMetadata) => {
    if (!window.confirm(`Admin Yetkisi: "${file.fileName}" dosyasını kalıcı olarak silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteUserFile(file.id, file.storagePath);
      setAllFiles((prev) => prev.filter((f) => f.id !== file.id));
      if (previewFile?.id === file.id) {
        setPreviewFile(null);
      }
    } catch (err) {
      console.error("File deletion error:", err);
      alert("Dosya silinirken hata oluştu.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.companyName.toLowerCase().includes(term) ||
      u.userId.toLowerCase().includes(term)
    );
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
      
      {/* Admin Header & Security Badge */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-purple-400/30 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-rose-500 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-xs">
              <ShieldAlert className="w-3.5 h-3.5" />
              ADMIN YÖNETİCİ PANELİ
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Sınırsız Veri Erişim Yetkisi
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" />
            <span>Kullanıcılar & Bulut Dosya Yönetimi</span>
          </h1>

          <p className="text-xs text-purple-200/90 font-medium max-w-2xl">
            Sistemdeki tüm kayıtlı kullanıcıların hesap bilgilerini inceleyebilir, yükledikleri belgelere erişebilir ve veritabanı genel durumunu denetleyebilirsiniz.
          </p>
        </div>

        {/* Refresh & Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadAdminData}
            className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-2xl border border-white/20 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Yenile</span>
          </button>

          <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl text-right space-y-0.5">
            <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Toplam Kayıtlı Kullanıcı</div>
            <div className="text-xl font-black text-emerald-400">{users.length}</div>
          </div>
          
          <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl text-right space-y-0.5">
            <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Toplam Yüklü Evrak</div>
            <div className="text-xl font-black text-purple-300">{allFiles.length}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-purple-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Kullanıcı adı, e-posta veya firma ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
          <span>Gösterilen Kullanıcı:</span>
          <span className="bg-purple-100 text-purple-900 font-black px-2.5 py-0.5 rounded-md">
            {filteredUsers.length} / {users.length}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-purple-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Kullanıcı Listesi & Yüklü Dosya Sayıları</span>
          </h2>
          <span className="text-[11px] text-purple-300 font-medium">Firestore Admin Mode</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-extrabold">Kullanıcı verileri ve dosya sayıları hesaplanıyor...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <p className="text-sm font-bold">Aramanıza uygun kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Kullanıcı / Ad Soyad</th>
                  <th className="p-4">E-posta Adresi</th>
                  <th className="p-4">Firma Unvanı</th>
                  <th className="p-4">Kayıt Tarihi</th>
                  <th className="p-4 text-center">Yüklü Dosya Sayısı</th>
                  <th className="p-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredUsers.map((u) => {
                  const userFiles = getFilesForUser(u.userId);
                  const isCurrentAdmin = u.userId === currentUser.id;

                  return (
                    <tr key={u.userId} className="hover:bg-purple-50/40 transition-colors">
                      <td className="p-4 font-extrabold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-black shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrentAdmin && (
                                <span className="bg-rose-100 text-rose-800 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                                  Siz (Admin)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">ID: {u.userId}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                          <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.companyName || "—"}</span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })
                          : "Yeni Kayıt"}
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                            userFiles.length > 0
                              ? "bg-purple-100 text-purple-900 border border-purple-300"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <HardDrive className="w-3.5 h-3.5" />
                          <span>{userFiles.length} Dosya</span>
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Dosyaları İncele</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* USER FILES INSPECTION MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/30 text-purple-300 flex items-center justify-center font-black">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{selectedUser.name} — Yüklü Dosyalar</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-400/30">
                      Admin İnceleme Modu
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{selectedUser.email} • {selectedUser.companyName}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50">
              {(() => {
                const userFiles = getFilesForUser(selectedUser.userId);
                if (userFiles.length === 0) {
                  return (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                      <HardDrive className="w-12 h-12 text-slate-300 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800">Bu Kullanıcının Henüz Yüklenmiş Dosyası Yok</h4>
                      <p className="text-xs text-slate-500">
                        Kullanıcı dosya yüklediğinde bu panel üzerinden anında görüntülenecektir.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Yüklenen Evraklar ({userFiles.length})</span>
                      <span className="text-slate-400 font-mono">UID: {selectedUser.userId}</span>
                    </div>

                    <div className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                      {userFiles.map((file) => (
                        <div key={file.id} className="p-4 hover:bg-purple-50/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              {getFileIcon(file.fileType)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900 truncate">{file.fileName}</h4>
                                <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                                  {file.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{file.description}</p>
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

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {(file.fileUrl || file.fileData) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreviewFile(file)}
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Önizle</span>
                                </button>

                                <a
                                  href={file.fileUrl || file.fileData}
                                  download={file.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>İndir</span>
                                </a>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Sil (Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

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
