// Turkey Location Data (İl, İlçe, Mahalle) and Tax Offices (Vergi Daireleri)

export interface District {
  name: string;
  neighborhoods: string[];
}

export interface Province {
  code: string; // Plaka kodu ör: "34"
  name: string;
  districts: District[];
  taxOffices: string[];
}

export const TURKEY_PROVINCES_DATA: Province[] = [
  {
    code: "01",
    name: "Adana",
    taxOffices: ["5 Ocak V.D.", "Ziyapaşa V.D.", "Yüreğir V.D.", "Seyhan V.D.", "Ceyhan V.D.", "Kozan V.D.", "Karatas V.D."],
    districts: [
      { name: "Seyhan", neighborhoods: ["Cemalpaşa", "Gazipaşa", "Gürselpaşa", "Reşatbey", "Kurtuluş", "Tellidere", "Fatih", "Ziyapaşa", "Pınar"] },
      { name: "Yüreğir", neighborhoods: ["Akdeniz", "Atakent", "Dadaloğlu", "Kışla", "Kazım Karabekir", "Sinanpaşa", "Yavuzlar"] },
      { name: "Çukurova", neighborhoods: ["Güzelyalı", "Beyazevler", "Karslılar", "Mahfesığmaz", "Toros", "Yurt", "Yüzüncüyıl"] },
      { name: "Sarıçam", neighborhoods: ["Beyceli", "Gültepe", "Orhangazi", "Şahintepe", "Yeşiltepe"] },
      { name: "Ceyhan", neighborhoods: ["Büyükkırım", "Cumhuriyet", "İstasyon", "Konakoğlu", "Mithatpaşa", "Namiık Kemal"] },
      { name: "Kozan", neighborhoods: ["Arslanpaşa", "Tavşantepe", "Tufanpaşa", "Yarsuat"] },
      { name: "İmamoğlu", neighborhoods: ["Adalet", "Fatih", "Hürriyet", "Tuna"] },
      { name: "Karataş", neighborhoods: ["Yeni Mahalle", "Karşıyaka"] },
      { name: "Pozantı", neighborhoods: ["Zafer", "İstiklal"] },
    ]
  },
  {
    code: "06",
    name: "Ankara",
    taxOffices: [
      "Başkent V.D.", "Hitit V.D.", "Seğmenler V.D.", "Yenimahalle V.D.", "Ulus V.D.",
      "Kızılay V.D.", "Çankaya V.D.", "Kavaklıdere V.D.", "Maltepe V.D.", "Ostim V.D.",
      "Sincan V.D.", "Gölbaşı V.D.", "Etimesgut V.D.", "Kahramankazan V.D.", "Polatlı V.D.",
      "Keçiören V.D.", "Mamak V.D.", "Dışkapı V.D.", "Yeğenbey V.D."
    ],
    districts: [
      { name: "Çankaya", neighborhoods: ["Bahçelievler", "Kavaklıdere", "Kızılay", "Tunalı Hilmi", "Gaziosmanpaşa", "Ayrancı", "Dikmen", "Balgat", "Çayyolu", "Ümitköy", "Yaşamkent", "Yüzüncüyıl", "Oran", "Söğütözü", "Mutlukent", "Birlik", "Öveçler"] },
      { name: "Yenimahalle", neighborhoods: ["Ostim", "Batıkent", "Demetevler", "Şentepe", "Işınlar", "Macun", "Karakusunlar", "Ergazi", "Çakırlar", "Anadolu"] },
      { name: "Etimesgut", neighborhoods: ["Elvankent", "Eryaman", "Bağlıca", "Alsancak", "Piyade", "Süvari", "Kazım Karabekir", "Göksu"] },
      { name: "Keçiören", neighborhoods: ["Etlik", "İncirli", "Aşağı Eğlence", "Ovacık", "Kalaba", "Kuşcağız", "Sanatoryum", "Ufuktepe", "Ayvalı"] },
      { name: "Mamak", neighborhoods: ["Abidinpaşa", "Akdere", "Tuzluçayır", "Demirlibahçe", "Saimekadın", "Gülveren", "Lalahan"] },
      { name: "Sincan", neighborhoods: ["Fatih", "Yenikent", "Malazgirt", "Plevne", "Tandoğan", "Ulus", "Andiçen"] },
      { name: "Gölbaşı", neighborhoods: ["Bahçelievler", "Şafak", "Karşıyaka", "Örencik", "İncek", "Taşpınar"] },
      { name: "Altındağ", neighborhoods: ["Ulus", "Dışkapı", "Aydınlıkevler", "Hacettepe", "Anafartalar", "Önder", "İskitler", "Karapürçek"] },
      { name: "Kahramankazan", neighborhoods: ["Atatürk", "Kanuni Sultan Süleyman", "Saray"] },
      { name: "Polatlı", neighborhoods: ["Cumhuriyet", "Gazi", "Gülveren", "Şehitlik", "Zafer"] },
      { name: "Cubuk", neighborhoods: ["Atatürk", "Barbaros", "Yıldırım Beyazıt"] }
    ]
  },
  {
    code: "07",
    name: "Antalya",
    taxOffices: [
      "Antalya Kurumlar V.D.", "Üçkapılar V.D.", "Düden V.D.", "Kalekapı V.D.",
      "Alanya V.D.", "Manavgat V.D.", "Serik V.D.", "Kemer V.D.", "Kumluca V.D.", "Kaş V.D.", "Finike V.D."
    ],
    districts: [
      { name: "Muratpaşa", neighborhoods: ["Lara", "Meltem", "Fener", "Şirinyalı", "Kırcami", "Kızılsaray", "Gençlik", "Meydankavağı", "Yeşilbahçe", "Varlık"] },
      { name: "Kepez", neighborhoods: ["Dokuma", "Kütükçü", "Fabrikalar", "Zafer", "Gülveren", "Ahatlı", "Varsak", "Kültür", "Sütçüler"] },
      { name: "Konyaaltı", neighborhoods: ["Liman", "Hurma", "Uncalı", "Gürsu", "Arapsuyu", "Molla Yusuf", "Toros"] },
      { name: "Alanya", neighborhoods: ["Güller Pınarı", "Oba", "Mahmutlar", "Tosmur", "Kestel", "Avsallar", "Konaklı", "Cikcilli"] },
      { name: "Manavgat", neighborhoods: ["Side", "Ilıca", "Sarılar", "Aşağı Pazarcı", "Yukarı Pazarcı", "Çolaklı"] },
      { name: "Serik", neighborhoods: ["Belek", "Kadriye", "Kökez", "Orhangazi", "Merkez"] },
      { name: "Kemer", neighborhoods: ["Göynük", "Beldibi", "Tekirova", "Çamyuva", "Merkez"] },
      { name: "Kaş", neighborhoods: ["Kalkan", "Andifli", "Gökseki", "Çukurbağ"] },
      { name: "Kumluca", neighborhoods: ["Mavikent", "Olympos", "Yeni Mahalle"] }
    ]
  },
  {
    code: "16",
    name: "Bursa",
    taxOffices: [
      "Ertuğrulgazi V.D.", "Osmangazi V.D.", "Nilüfer V.D.", "Setbaşı V.D.", "Yıldırım V.D.",
      "İnegöl V.D.", "Gemlik V.D.", "Mustafakemalpaşa V.D.", "Karacabey V.D.", "Mudanya V.D."
    ],
    districts: [
      { name: "Nilüfer", neighborhoods: ["Ataevler", "Beşevler", "Fethiye", "Görükle", "Işıktepe", "İhsaniye", "Özlüce", "Yüzüncüyıl", "Üçevler", "Balat", "Altınşehir"] },
      { name: "Osmangazi", neighborhoods: ["Altıparmak", "Çarşamba", "Çekirge", "Demirtaş", "Dikkaldırım", "Fatih", "Hürriyet", "Kükürtlü", "Panayır", "Sırameşeler", "Yunuseli"] },
      { name: "Yıldırım", neighborhoods: ["Arabayatağı", "Baruthane", "Duaçınarı", "Ertuğrulgazi", "Millet", "Namazgah", "Prof. Tezok", "Yeşilyayla", "Yediselviler"] },
      { name: "İnegöl", neighborhoods: ["Alanyurt", "Cerrah", "Hamidiye", "Kemalpaşa", "Mesudiye", "Orhaniye", "Yeniceköy"] },
      { name: "Gemlik", neighborhoods: ["Aralık", "Dr. Ziya Kaya", "Eşref Dinçer", "Hamidiye", "Kumla", "Umurbey"] },
      { name: "Mudanya", neighborhoods: ["Güzelyalı", "Halitpaşa", "Ömerbey", "Yıldıztepe", "Tirilye"] }
    ]
  },
  {
    code: "34",
    name: "İstanbul",
    taxOffices: [
      "Marmara Kurumlar V.D.", "Büyük Mükellefler V.D.", "Anadolu Kurumlar V.D.",
      "Kadıköy V.D.", "Ümraniye V.D.", "Erenköy V.D.", "Göztepe V.D.", "Üsküdar V.D.",
      "Maltepe V.D.", "Kartal V.D.", "Pendik V.D.", "Tuzla V.D.", "Beyoğlu V.D.",
      "Mecidiyeköy V.D.", "Şişli V.D.", "Zincirlikuyu V.D.", "Beşiktaş V.D.", "Kağıthane V.D.",
      "İkitelli V.D.", "Fatih V.D.", "Bakırköy V.D.", "Merter V.D.", "Avcılar V.D.",
      "Beylikdüzü V.D.", "Esenyurt V.D.", "Güneşli V.D.", "Haliç V.D.", "Kasımpaşa V.D.",
      "Kocasinan V.D.", "Gaziosmanpaşa V.D.", "Zeytinburnu V.D.", "Silivri V.D.", "Çatalca V.D.",
      "Sultanbeyli V.D.", "Sarıyer V.D."
    ],
    districts: [
      { name: "Kadıköy", neighborhoods: ["Caferağa (Moda)", "Fenerbahçe", "Rasimpaşa", "Suadiye", "Erenköy", "Bostancı", "Göztepe", "Caddebostan", "Koşuyolu", "Acıbadem", "Merdivenköy", "Sahrayıcedid", "Fikirtepe", "Hasanpaşa", "19 Mayıs"] },
      { name: "Şişli", neighborhoods: ["Mecidiyeköy", "Teşvikiye (Nişantaşı)", "Fulya", "Halaskargazi", "Kurtuluş", "Feriköy", "Pangaltı", "Gülbahar", "Esentepe", "Kuştepe", "19 Mayıs", "İnönü"] },
      { name: "Beşiktaş", neighborhoods: ["Bebek", "Etiler", "Levazım", "Levent", "Nispetiye", "Ortaköy", "Sinanpaşa", "Türkali", "Vişnezade", "Akat", "Arnavutköy", "Gayrettepe", "Konaklar", "Yıldız"] },
      { name: "Ümraniye", neighborhoods: ["Atakent", "Atatürk", "Elmalıkent", "Esenevler", "Ihlamurkuyu", "İnkılap", "Madenler", "Parseller", "Sheraton / Finans Şehir", "Site", "Şerifali", "TATLISU", "Yamanevler"] },
      { name: "Ataşehir", neighborhoods: ["Barbaros", "Batı Ataşehir", "Atatürk", "İçerenköy", "Kayışdağı", "Küçükbakkalköy", "Mevlana", "Örnek", "Yeni Çamlıca", "Yenişehir"] },
      { name: "Üsküdar", neighborhoods: ["Altunizade", "Beylerbeyi", "Çengelköy", "Kandilli", "Kuzguncuk", "Mimar Sinan", "Muratreis", "Salacak", "Sultantepe", "Ünalan", "Yavuztürk"] },
      { name: "Bakırköy", neighborhoods: ["Ataköy 1.-11. Kısım", "Florya (Şenlikköy)", "Yeşilköy", "Yeşilyurt", "Zuhuratbaba", "Kartaltepe", "Cevizlik", "Sakızağacı", "Osmaniye"] },
      { name: "Beyoğlu", neighborhoods: ["Cihangir", "Galata (Bereketzade)", "Asmalımescit", "Gümüşsuyu", "Karaköy", "Kasımpaşa", "İstiklal (Kuloğlu)", "Sütlüce", "Hasköy", "Tomtom", "Örnektepe"] },
      { name: "Avcılar", neighborhoods: ["Ambarlı", "Cihangir", "Denizköşkler", "Gümüşpala", "Mustafa Kemal Paşa", "Tahtakale (Ispartakule)", "Üniversite"] },
      { name: "Bahçelievler", neighborhoods: ["Basın Sitesi", "Bahçelievler", "Fevzi Çakmak", "Hürriyet", "Kocasinan", "Siyavuşpaşa", "Soğanlı", "Yenibosna Zafer"] },
      { name: "Başakşehir", neighborhoods: ["Bahçeşehir 1. Kısım", "Bahçeşehir 2. Kısım", "Başakşehir 1. Etap", "Başakşehir 2. Etap", "Ikitelli OSB", "Kayabaşı", "Kayaşehir", "Ziya Gökalp"] },
      { name: "Beylikdüzü", neighborhoods: ["Adnan Kahveci", "Barış", "Büyükşehir", "Cumhuriyet", "Dereağzı", "Gürpınar", "Kavaklı", "Yakuplu (Mermerciler OSB)"] },
      { name: "Esenyurt", neighborhoods: ["Akçaburgaz", "Akevler", "Bağlarçeşme", "Cumhuriyet", "Güzelyurt", "İnönü", "Mehmet Akif Ersoy", "Pınar", "Saadetdere", "Yeşilkent"] },
      { name: "Eyüpsultan", neighborhoods: ["Alibeyköy", "Göktürk Merkez", "Kemerburgaz", "Eyüp Merkez", "Nişancı", "Rami Cuma", "Silahtarağa", "Yeşilpınar"] },
      { name: "Fatih", neighborhoods: ["Aksaray", "Beyazıt", "Cankurtaran (Sultanahmet)", "Eminönü", "Hırka-i Şerif", "Karagümrük", "Kocamustafapaşa", "Molla Gürani", "Sirkeci", "Topkapı"] },
      { name: "Gaziosmanpaşa", neighborhoods: ["Bağlarbaşı", "Barbaros Hayrettin Paşa", "Fevzi Çakmak", "Hürriyet", "Karadeniz", "Mevlana", "Pazariçi", "Yıldıztabya"] },
      { name: "Kağıthane", neighborhoods: ["Çağlayan", "Çeliktepe", "Emniyet Evleri", "Gültepe", "Gürsel", "Hamidiye", "Harmantepe", "Merkez", "Seyrantepe", "Şirintepe", "Talatpaşa"] },
      { name: "Kartal", neighborhoods: ["Atalar", "Cevizli", "Esentepe", "Hürriyet", "Karlıktepe", "Kordonboyu", "Orhantepe", "Soğanlık", "Uğur Mumcu", "Yakupaltı"] },
      { name: "Küçükçekmece", neighborhoods: ["Atakent", "Beşyol", "Cennet", "Fatih", "Gültepe", "Halkalı Merkez", "Inönü", "Kanarya", "Mehmet Akif", "Sefaköy"] },
      { name: "Maltepe", neighborhoods: ["Altıntepe", "Altayçeşme", "Aydınevler", "Büyükbakkalköy", "Cevizli", "Fındıklı", "İdealtepe", "Küçükyalı", "Zümrütevler"] },
      { name: "Pendik", neighborhoods: ["Batı", "Çamlık", "Doğu", "Esenyalı", "Güzelyalı", "Kaynarca", "Kurtköy", "Yenişehir", "Velibaba", "Yayalar"] },
      { name: "Sarıyer", neighborhoods: ["Baltalimanı", "Büyükdere", "Emirgan", "Istinye", "Kireçburnu", "Maslak", "Reşitpaşa", "Rumelihisarı", "Tarabya", "Yeniköy", "Zekeriyaköy"] },
      { name: "Sultanbeyli", neighborhoods: ["Abdurrahmangazi", "Akşemsettin", "Battalgazi", "Fatih", "Hamidiye", "Mimar Sinan", "Turgut Reis"] },
      { name: "Tuzla", neighborhoods: ["Aydınlı", "Cami", "Evliya Çelebi", "İçmeler", "Mimar Sinan", "Orhanlı", "Postane", "Tersaneler / Şifa"] },
      { name: "Zeytinburnu", neighborhoods: ["Beştelsiz", "Çırpıcı", "Gökalp", "Kazlıçeşme", "Maltepe", "Merkezefendi", "Seyitnizam", "Telsiz"] },
      { name: "Büyükçekmece", neighborhoods: ["Albatros", "Atatürk", "Kumburgaz", "Mimaroba", "Sinanoba", "Türkoba"] },
      { name: "Silivri", neighborhoods: ["Alibey", "Gümüşyaka", "Mimar Sinan", "Piri Mehmet Paşa", "Selimpaşa"] }
    ]
  },
  {
    code: "35",
    name: "İzmir",
    taxOffices: [
      "9 Eylül V.D.", "Hasan Tahsin V.D.", "Belkahve V.D.", "Kordon V.D.", "Şirinyer V.D.",
      "Karşıyaka V.D.", "Bornova V.D.", "Yamanlar V.D.", "Balçova V.D.", "Buca V.D.",
      "Gaziemir V.D.", "Konak V.D.", "Çiğli V.D.", "Torbalı V.D.", "Aliağa V.D.",
      "Bergama V.D.", "Ödemiş V.D.", "Tire V.D.", "Urla V.D.", "Menemen V.D.", "Çeşme V.D."
    ],
    districts: [
      { name: "Konak", neighborhoods: ["Alsancak", "Göztepe", "Güzelyalı", "Pasaport", "Basmane", "Kahramanlar", "Karataş", "Mithatpaşa", "Kültür", "Mimar Sinan", "Akdeniz"] },
      { name: "Karşıyaka", neighborhoods: ["Bostanlı", "Mavişehir", "Alaybey", "Bahçelievler", "Demirköprü", "Donanmacı", "Nergiz", "Örnekköy", "Tersane", "Yalı"] },
      { name: "Bornova", neighborhoods: ["Evka 3", "Erzene", "Kazımdirik (Ege Üniv.)", "Küçük Park", "Büyük Park", "Işıkkent OSB", "Çamdibi", "Atatürk", "Doğanlar"] },
      { name: "Buca", neighborhoods: ["Aydoğdu", "Barış", "Buca Koop", "Efeler", "Göksu", "Işılay Saygın", "Şirinyer", "Yıldız", "Aosb"] },
      { name: "Çiğli", neighborhoods: ["Atatürk OSB", "Aydınlıkevler", "Egekent", "Evka 2", "Evka 5", "İstasyon", "Sasalı", "Yeni Mahalle"] },
      { name: "Gaziemir", neighborhoods: ["Aktepe", "Atıfbey", "Binbaşı Reşat Bey", "Dokuz Eylül", "Emrez", "Fatih (Ege Serbest Bölge)", "Irmak", "Sarnıç"] },
      { name: "Balçova", neighborhoods: ["Çetin Emeç", "Eğitim", "Fevzi Çakmak", "İnciraltı", "Korutürk", "Teleferik"] },
      { name: "Narlıdere", neighborhoods: ["Altıevler", "Çamtepe", "Huzur", "Ilıca", "Limanreis", "Narlı"] },
      { name: "Bayraklı", neighborhoods: ["Adalet (Yeni Kent Merkezi)", "Mansuroğlu", "Manavkuyu", "Org. Nafiz Gürman", "Postacılar", "Soğukkuyu"] },
      { name: "Torbalı", neighborhoods: ["Ayrancılar", "Çapraz", "Pancar", "Torbalı Merkez", "Yedi Eylül"] },
      { name: "Çeşme", neighborhoods: ["Alaçatı", "Boyalık", "Dalyan", "Ilıca", "Musalla", "Reisdere"] },
      { name: "Urla", neighborhoods: ["Çeşmealtı", "İskele", "Kalabak", "Torasan", "Yeni Mahalle"] },
      { name: "Aliağa", neighborhoods: ["Helvacı", "Kültür", "Siteler", "Yalı", "Yeni Mahalle"] }
    ]
  },
  {
    code: "41",
    name: "Kocaeli",
    taxOffices: [
      "İlyasbey V.D.", "Gebze V.D.", "İzmit V.D.", "Alemdar V.D.", "Tepecik V.D.",
      "Gölcük V.D.", "Derince V.D.", "Körfez V.D.", "Kartepe V.D."
    ],
    districts: [
      { name: "Gebze", neighborhoods: ["Arapçeşme", "Güzeller", "Hacıhalil", "İnönü", "Köşklü Çeşme", "Mustafapaşa", "Osman Yılmaz", "Tatlıkuyu", "Yenikent", "OSBler"] },
      { name: "İzmit", neighborhoods: ["Akarca", "Alikahya", "Bekirdere", "Cedid", "Cedit", "Gündoğdu", "Kuruçeşme", "MDatetime", "Turgut", "Yahya Kaptan", "Yenişehir"] },
      { name: "Çayırova", neighborhoods: ["Akse", "Çayırova", "Özgürlük", "Şekerpınar", "Yenimahalle"] },
      { name: "Darıca", neighborhoods: ["Abdi İpekçi", "Bayramoğlu", "Cami", "Emek", "Kazım Karabekir", "Nenehatun", "Pirireis"] },
      { name: "Gölcük", neighborhoods: ["Değirmendere", "Donanma", "Halıdere", "Ihsaniye", "Merkez", "Uçevler"] },
      { name: "Körfez", neighborhoods: ["Atalar", "Barbaros", "Çamlıtepe", "Fatih", "Hacı Osman", "Mimar Sinan", "Yarımca"] },
      { name: "Kartepe", neighborhoods: ["Ataşehir", "Fatih Sultan Mehmet", "Istasyon", "Köseköy", "Maşukiye", "Sarımeşe"] }
    ]
  },
  {
    code: "42",
    name: "Konya",
    taxOffices: ["Mevlana V.D.", "Selçuk V.D.", "Meram V.D.", "Alaaddin V.D.", "Akşehir V.D.", "Ereğli V.D."],
    districts: [
      { name: "Selçuklu", neighborhoods: ["Bosna Hersek", "Binkonutlar", "Cumhuriyet", "Işıklar", "Kılınçarslan", "Musalla Bağları", "Sancak", "Şeyh Şamil", "Yazır"] },
      { name: "Meram", neighborhoods: ["Aydoğdu", "Aydoğdu", "Dere", "Gülbahçe", "Harmancık", "Kovanlık", "Lalebahçe", "Yaka", "Zafer"] },
      { name: "Karatay", neighborhoods: ["Akabe", "Fevziçakmak", "Hacıhasan", "Karaaslan", "Kumköprü", "Mengene", "Ozgurler", "Sarıyakup"] },
      { name: "Ereğli", neighborhoods: ["Aydınlar", "Boyacıalı", "Gülbahçe", "Orhaniye", "Talas"] },
      { name: "Akşehir", neighborhoods: ["Anıt", "Gazi", "İstasyon", "Meydan", "Yarenler"] }
    ]
  },
  {
    code: "27",
    name: "Gaziantep",
    taxOffices: ["Gaziantep Kurumlar V.D.", "Şahinbey V.D.", "Şehitkamil V.D.", "Suburcu V.D.", "Gazikent V.D.", "Nizip V.D."],
    districts: [
      { name: "Şahinbey", neighborhoods: ["Akkent", "Akyol", "Beybahçe", "Güneş", "Karataş", "Kavaklık", "Mavikent", "Yeditepe", "Yeditepe"] },
      { name: "Şehitkamil", neighborhoods: ["Batıkent", "Değirmiçem", "Emek", "Fatih", "Gazikent", "İbrahimli", "Merveşehir", "Sarıgüllük", "Şirinevler"] },
      { name: "Nizip", neighborhoods: ["Cumhuriyet", "Fatih", "Mimar Sinan", "Saha", "Sultan Abdülhamit"] }
    ]
  }
];

// Complete fallback generic list of 81 Provinces for dropdowns
export const ALL_81_PROVINCES: { code: string; name: string }[] = [
  { code: "01", name: "Adana" }, { code: "02", name: "Adıyaman" }, { code: "03", name: "Afyonkarahisar" },
  { code: "04", name: "Ağrı" }, { code: "05", name: "Amasya" }, { code: "06", name: "Ankara" },
  { code: "07", name: "Antalya" }, { code: "08", name: "Artvin" }, { code: "09", name: "Aydın" },
  { code: "10", name: "Balıkesir" }, { code: "11", name: "Bilecik" }, { code: "12", name: "Bingöl" },
  { code: "13", name: "Bitlis" }, { code: "14", name: "Bolu" }, { code: "15", name: "Burdur" },
  { code: "16", name: "Bursa" }, { code: "17", name: "Çanakkale" }, { code: "18", name: "Çankırı" },
  { code: "19", name: "Çorum" }, { code: "20", name: "Denizli" }, { code: "21", name: "Diyarbakır" },
  { code: "22", name: "Edirne" }, { code: "23", name: "Elazığ" }, { code: "24", name: "Erzincan" },
  { code: "25", name: "Erzurum" }, { code: "26", name: "Eskişehir" }, { code: "27", name: "Gaziantep" },
  { code: "28", name: "Giresun" }, { code: "29", name: "Gümüşhane" }, { code: "30", name: "Hakkari" },
  { code: "31", name: "Hatay" }, { code: "32", name: "Isparta" }, { code: "33", name: "Mersin" },
  { code: "34", name: "İstanbul" }, { code: "35", name: "İzmir" }, { code: "36", name: "Kars" },
  { code: "37", name: "Kastamonu" }, { code: "38", name: "Kayseri" }, { code: "39", name: "Kırklareli" },
  { code: "40", name: "Kırşehir" }, { code: "41", name: "Kocaeli" }, { code: "42", name: "Konya" },
  { code: "43", name: "Kütahya" }, { code: "44", name: "Malatya" }, { code: "45", name: "Manisa" },
  { code: "46", name: "Kahramanmaraş" }, { code: "47", name: "Mardin" }, { code: "48", name: "Muğla" },
  { code: "49", name: "Muş" }, { code: "50", name: "Nevşehir" }, { code: "51", name: "Niğde" },
  { code: "52", name: "Ordu" }, { code: "53", name: "Rize" }, { code: "54", name: "Sakarya" },
  { code: "55", name: "Samsun" }, { code: "56", name: "Siirt" }, { code: "57", name: "Sinop" },
  { code: "58", name: "Sivas" }, { code: "59", name: "Tekirdağ" }, { code: "60", name: "Tokat" },
  { code: "61", name: "Trabzon" }, { code: "62", name: "Tunceli" }, { code: "63", name: "Şanlıurfa" },
  { code: "64", name: "Uşak" }, { code: "65", name: "Van" }, { code: "66", name: "Yozgat" },
  { code: "67", name: "Zonguldak" }, { code: "68", name: "Aksaray" }, { code: "69", name: "Bayburt" },
  { code: "70", name: "Karaman" }, { code: "71", name: "Kırıkkale" }, { code: "72", name: "Batman" },
  { code: "73", name: "Şırnak" }, { code: "74", name: "Bartın" }, { code: "75", name: "Ardahan" },
  { code: "76", name: "Iğdır" }, { code: "77", name: "Yalova" }, { code: "78", name: "Karabük" },
  { code: "79", name: "Kilis" }, { code: "80", name: "Osmaniye" }, { code: "81", name: "Düzce" }
];

// Common Street & Avenue Name Types in Turkey
export const COMMON_STREET_TYPES = [
  "Atatürk Caddesi",
  "Cumhuriyet Caddesi",
  "İnönü Caddesi",
  "Fatih Bulvarı",
  "Barbaros Bulvarı",
  "Sanayi Caddesi",
  "Gazi Mustafa Kemal Bulvarı",
  "Halaskargazi Caddesi",
  "Nispetiye Caddesi",
  "Büyükdere Caddesi",
  "Mecidiyeköy Yolu Caddesi",
  "Bağdat Caddesi",
  "Alemdağ Caddesi",
  "Eski Büyükdere Caddesi",
  "Mimar Sinan Caddesi",
  "Yıldız Sokak",
  "Gül Sokak",
  "Karanfil Sokak",
  "Lale Sokak",
  "Çiçek Sokak",
  "Okul Sokak",
  "Sanayi Sitesi 1. Blok",
  "Organize Sanayi Bölgesi 2. Cadde"
];

/**
 * Get Districts for a given city/province
 */
export function getDistrictsForProvince(cityName: string): string[] {
  const prov = TURKEY_PROVINCES_DATA.find(
    (p) => p.name.toLowerCase() === cityName.toLowerCase()
  );
  if (prov && prov.districts.length > 0) {
    return Array.from(new Set(prov.districts.map((d) => d.name)));
  }
  // Generic fallback common districts for other cities
  return ["Merkez", "Sanayi", "Organize Sanayi", "Doğu", "Batı", "Kuzey", "Güney", "Yenişehir"];
}

/**
 * Get Neighborhoods for a given city & district
 */
export function getNeighborhoodsForDistrict(cityName: string, districtName: string): string[] {
  const prov = TURKEY_PROVINCES_DATA.find(
    (p) => p.name.toLowerCase() === cityName.toLowerCase()
  );
  if (prov) {
    const dist = prov.districts.find(
      (d) => d.name.toLowerCase() === districtName.toLowerCase()
    );
    if (dist && dist.neighborhoods.length > 0) {
      return Array.from(new Set(dist.neighborhoods));
    }
  }
  return [
    "Merkez Mahallesi",
    "Atatürk Mahallesi",
    "Cumhuriyet Mahallesi",
    "Fatih Mahallesi",
    "Yeni Mahalle",
    "Zafer Mahallesi",
    "İstiklal Mahallesi",
    "Hürriyet Mahallesi",
    "Sanayi Mahallesi",
    "Çarşı Mahallesi"
  ];
}

/**
 * Get Tax Offices (Vergi Daireleri) for a given city
 */
export function getTaxOfficesForProvince(cityName: string): string[] {
  const prov = TURKEY_PROVINCES_DATA.find(
    (p) => p.name.toLowerCase() === cityName.toLowerCase()
  );
  if (prov && prov.taxOffices.length > 0) {
    return Array.from(new Set(prov.taxOffices));
  }
  // Generic standard tax offices for any Turkish city
  return [
    `${cityName} Vergi Dairesi Mdr.`,
    `${cityName} İhtisas Vergi Dairesi`,
    `${cityName} Kurumlar Vergi Dairesi`,
    `${cityName} Birlik Vergi Dairesi`,
    `${cityName} Çarşı Vergi Dairesi`,
    `${cityName} Sanayi Vergi Dairesi`
  ];
}
