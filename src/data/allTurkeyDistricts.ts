// Türkiye 81 İl ve 973 Resmi İlçenin Eksiksiz Veritabanı
export interface ProvinceDistricts {
  code: string;
  name: string;
  districts: string[];
  taxOffices: string[];
  sampleNeighborhoods?: string[];
}

export const ALL_81_PROVINCES_AND_DISTRICTS: ProvinceDistricts[] = [
  {
    code: "01",
    name: "Adana",
    taxOffices: ["5 Ocak V.D.", "Ziyapaşa V.D.", "Yüreğir V.D.", "Seyhan V.D.", "Ceyhan V.D.", "Kozan V.D.", "Karataş V.D."],
    districts: [
      "Seyhan", "Yüreğir", "Çukurova", "Sarıçam", "Ceyhan", "Kozan", "İmamoğlu",
      "Karataş", "Pozantı", "Karaisalı", "Yumurtalık", "Tufanbeyli", "Feke", "Aladağ", "Saimbeyli"
    ],
    sampleNeighborhoods: ["Cemalpaşa", "Gazipaşa", "Gürselpaşa", "Reşatbey", "Kurtuluş", "Tellidere", "Fatih", "Ziyapaşa", "Pınar", "Akdeniz", "Atakent", "Güzelyalı", "Beyazevler", "Mahfesığmaz", "Toros"]
  },
  {
    code: "02",
    name: "Adıyaman",
    taxOffices: ["Adıyaman V.D.", "Kahta V.D.", "Besni V.D."],
    districts: ["Merkez", "Kahta", "Besni", "Gölbaşı", "Gerger", "Sincik", "Çelikhan", "Tut", "Samsat"],
    sampleNeighborhoods: ["Alitaşı", "Bahçelievler", "Cumhuriyet", "Fatih", "Karapınar", "Mimar Sinan", "Sümerevler", "Turgut Reis", "Yenimahalle", "Siteler"]
  },
  {
    code: "03",
    name: "Afyonkarahisar",
    taxOffices: ["Kocatepe V.D.", "Tınaztepe V.D.", "Sandıklı V.D.", "Bolvadin V.D.", "Dinar V.D."],
    districts: [
      "Merkez", "Sandıklı", "Dinar", "Bolvadin", "Sinanpaşa", "Emirdağ", "Şuhut",
      "Çay", "İhsaniye", "İscehisar", "Sultandağı", "Çobanlar", "Dazkırı", "Başmakçı",
      "Hocalar", "Kızılören", "Evciler", "Bayat"
    ],
    sampleNeighborhoods: ["Ali İhsan Paşa", "Burmalı", "Cumhuriyet", "Dervişpaşa", "Dumlupınar", "Erkmen", "Fatih", "Gazi", "Güvenevler", "Kanlıca", "Marulcu", "Sahipata"]
  },
  {
    code: "04",
    name: "Ağrı",
    taxOffices: ["Ağrı V.D.", "Doğubayazıt V.D.", "Patnos V.D."],
    districts: ["Merkez", "Patnos", "Doğubayazıt", "Diyadin", "Eleşkirt", "Tutak", "Taşlıçay", "Hamur"],
    sampleNeighborhoods: ["Abide", "Alpaslan", "Bahçelievler", "Fevzi Çakmak", "Fırat", "Gazi", "Hürriyet", "Kazım Karabekir", "Kurtuluş", "Leylek Pınar", "Mehmet Akif Ersoy", "Yavuz"]
  },
  {
    code: "05",
    name: "Amasya",
    taxOffices: ["Amasya V.D.", "Merzifon V.D.", "Suluova V.D."],
    districts: ["Merkez", "Merzifon", "Suluova", "Taşova", "Gümüşhacıköy", "Göynücek", "Hamamözü"],
    sampleNeighborhoods: ["Akbilek", "Bahçeleriçi", "Beyazıtpaşa", "Dere", "Fethiye", "Gökmedrese", "Hacılar Meydanı", "Hatuniye", "Kirazlıdere", "Kurşunlu", "Pirinççi", "Şehirüstü", "Yüzevler"]
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
      "Çankaya", "Keçiören", "Yenimahalle", "Mamak", "Etimesgut", "Sincan", "Altındağ",
      "Pursaklar", "Gölbaşı", "Polatlı", "Çubuk", "Kahramankazan", "Beypazarı",
      "Elmadağ", "Nallıhan", "Akyurt", "Kızılcahamam", "Bala", "Kalecik",
      "Ayaş", "Güdül", "Haymana", "Çamlıdere", "Evren", "Şereflikoçhisar"
    ],
    sampleNeighborhoods: [
      "Bahçelievler", "Kavaklıdere", "Kızılay", "Tunalı Hilmi", "Gaziosmanpaşa", "Ayrancı", "Dikmen", "Balgat",
      "Çayyolu", "Ümitköy", "Yaşamkent", "Yüzüncüyıl", "Oran", "Söğütözü", "Mutlukent", "Birlik", "Öveçler",
      "Ostim", "Batıkent", "Demetevler", "Şentepe", "Elvankent", "Eryaman", "Bağlica", "Etlik", "İncirli"
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
      "Muratpaşa", "Kepez", "Konyaaltı", "Alanya", "Manavgat", "Serik", "Döşemealtı",
      "Aksu", "Kumluca", "Kaş", "Korkuteli", "Gazipaşa", "Finike", "Kemer",
      "Elmalı", "Demre", "Akseki", "Gündoğmuş", "İbradı"
    ],
    sampleNeighborhoods: [
      "Lara", "Meltem", "Fener", "Şirinyalı", "Kırcami", "Kızılsaray", "Gençlik", "Meydankavağı", "Yeşilbahçe",
      "Dokuma", "Fabrikalar", "Liman", "Hurma", "Uncalı", "Gürsu", "Arapsuyu", "Oba", "Mahmutlar", "Side", "Belek"
    ]
  },
  {
    code: "08",
    name: "Artvin",
    taxOffices: ["Artvin V.D.", "Hopa V.D."],
    districts: ["Merkez", "Hopa", "Borçka", "Yusufeli", "Arhavi", "Şavşat", "Ardanuç", "Murgul", "Kemalpaşa"],
    sampleNeighborhoods: ["Çarşı", "Çayağzı", "Dere", "Orta Mahalle", "Yeni Mahalle", "Balcıoğlu", "Köseler", "Yeniyol"]
  },
  {
    code: "09",
    name: "Aydın",
    taxOffices: ["Efeler V.D.", "Güzelhisar V.D.", "Nazilli V.D.", "Söke V.D.", "Kuşadası V.D.", "Didim V.D."],
    districts: [
      "Efeler", "Nazilli", "Söke", "Kuşadası", "Didim", "İncirliova", "Çine", "Germencik",
      "Bozdoğan", "Köşk", "Kuyucak", "Sultanhisar", "Karacasu", "Buharkent", "Yenipazar", "Karpuzlu"
    ],
    sampleNeighborhoods: ["Cumhuriyet", "Güzelhisar", "Hasanefendi", "Kurtuluş", "Mimar Sinan", "Yedieylül", "Zafer", "Kadınlar Denizi", "Altınkum", "Çamlık"]
  },
  {
    code: "10",
    name: "Balıkesir",
    taxOffices: ["Karesi V.D.", "Kuvayi Milliye V.D.", "Bandırma V.D.", "Edremit V.D.", "Ayvalık V.D.", "Burhaniye V.D.", "Gönen V.D."],
    districts: [
      "Karesi", "Altıeylül", "Bandırma", "Edremit", "Gönen", "Ayvalık", "Burhaniye",
      "Susurluk", "Bigadiç", "Dursunbey", "Sındırgı", "İvrindi", "Erdek", "Havran",
      "Manyas", "Savaştepe", "Balya", "Gömeç", "Marmara", "Kepsut"
    ],
    sampleNeighborhoods: ["Akıncılar", "Bahçelievler", "Dinkçiler", "Hacı İsmâil", "Karaoğlan", "Kuvayi Milliye", "Paşa Alanı", "Ali Hikmet Paşa", "Cunda (Alibey)", "Akçay", "Altınoluk"]
  },
  {
    code: "11",
    name: "Bilecik",
    taxOffices: ["Bilecik V.D.", "Bozüyük V.D."],
    districts: ["Merkez", "Bozüyük", "Osmaneli", "Söğüt", "Gölpazarı", "Pazaryeri", "Yenipazar", "İnhisar"],
    sampleNeighborhoods: ["Bahçelievler", "Cumhuriyet", "Ertuğrulgazi", "Gazipaşa", "Hürriyet", "İsmetpaşa", "İstasyon", "Pelitözü"]
  },
  {
    code: "12",
    name: "Bingöl",
    taxOffices: ["Bingöl V.D.", "Genç V.D."],
    districts: ["Merkez", "Genç", "Solhan", "Karlıova", "Adaklı", "Kiğı", "Yedisu", "Yayladere"],
    sampleNeighborhoods: ["Bahçelievler", "Düzağaç", "İnalı", "İnönü", "Karşıyaka", "Kültür", "Recep Tayyip Erdoğan", "Saray", "Şehit Mustafa Gündoğdu", "Yenişehir"]
  },
  {
    code: "13",
    name: "Bitlis",
    taxOffices: ["Bitlis V.D.", "Tatvan V.D."],
    districts: ["Tatvan", "Merkez", "Güroymak", "Ahlat", "Hizan", "Mutki", "Adilcevaz"],
    sampleNeighborhoods: ["Atatürk", "Beşminare", "Hüsrevpaşa", "İnönü", "Karahasan", "Saraysözü", "Şems-i Bitlis", "Yükseliş", "Kale"]
  },
  {
    code: "14",
    name: "Bolu",
    taxOffices: ["Bolu V.D.", "Gerede V.D."],
    districts: ["Merkez", "Gerede", "Mudurnu", "Göynük", "Mengen", "Yeniçağa", "Dörtdivan", "Seben", "Kıbrıscık"],
    sampleNeighborhoods: ["Akpınar", "Bahçelievler", "Beşkavaklar", "Borazanlar", "Gölyüzü", "İhsaniye", "Karaçayır", "Karamanlı", "Kılıçarslan", "Kültür", "Sağlık", "Sümer", "Tabaklar"]
  },
  {
    code: "15",
    name: "Burdur",
    taxOffices: ["Burdur V.D.", "Bucak V.D."],
    districts: ["Merkez", "Bucak", "Gölhisar", "Yeşilova", "Ağlasun", "Çavdır", "Tefenni", "Karamanlı", "Altınyayla", "Çeltikçi", "Kemer"],
    sampleNeighborhoods: ["Akın", "Armutlu", "Aydınlıkevler", "Bağlar", "Bahçelievler", "Burç", "Değirmenler", "Fevzi Çakmak", "Konak", "Kuyu", "Özgür", "Pazar", "Şirinevler"]
  },
  {
    code: "16",
    name: "Bursa",
    taxOffices: [
      "Ertuğrulgazi V.D.", "Osmangazi V.D.", "Nilüfer V.D.", "Setbaşı V.D.", "Yıldırım V.D.",
      "İnegöl V.D.", "Gemlik V.D.", "Mustafakemalpaşa V.D.", "Karacabey V.D.", "Mudanya V.D.", "Orhangazi V.D."
    ],
    districts: [
      "Osmangazi", "Yıldırım", "Nilüfer", "İnegöl", "Gemlik", "Mustafakemalpaşa",
      "Mudanya", "Gürsu", "Karacabey", "Orhangazi", "Kestel", "Yenişehir",
      "İznik", "Orhaneli", "Keles", "Büyükorhan", "Harmancık"
    ],
    sampleNeighborhoods: [
      "Ataevler", "Beşevler", "Fethiye", "Görükle", "Işıktepe", "İhsaniye", "Özlüce", "Yüzüncüyıl", "Üçevler", "Balat", "Altınşehir",
      "Altıparmak", "Çarşamba", "Çekirge", "Demirtaş", "Dikkaldırım", "Fatih", "Hürriyet", "Kükürtlü", "Panayır", "Sırameşeler", "Yunuseli",
      "Arabayatağı", "Baruthane", "Duaçınarı", "Ertuğrulgazi", "Millet", "Namazgah", "Alanyurt", "Kumla", "Güzelyalı"
    ]
  },
  {
    code: "17",
    name: "Çanakkale",
    taxOffices: ["Çanakkale V.D.", "Biga V.D.", "Gelibolu V.D.", "Çan V.D."],
    districts: [
      "Merkez", "Biga", "Çan", "Gelibolu", "Yenice", "Ayvacık", "Ezine",
      "Bayramiç", "Lapseki", "Eceabat", "Gökçeada", "Bozcaada"
    ],
    sampleNeighborhoods: ["Barbaros", "Cevatpaşa", "Esenler", "Fevzipaşa", "İsmetpaşa", "Kemalpaşa", "Namık Kemal", "Güzelyalı", "Dardanos", "Kepez"]
  },
  {
    code: "18",
    name: "Çankırı",
    taxOffices: ["Çankırı V.D.", "Ilgaz V.D."],
    districts: ["Merkez", "Çerkeş", "Ilgaz", "Orta", "Şabanözü", "Kurşunlu", "Yapraklı", "Kızılırmak", "Eldivan", "Atkaracalar", "Korgun", "Bayramören"],
    sampleNeighborhoods: ["Abdülhalik Renda", "Alibey", "Buğday Pazarı", "Cumhuriyet", "Fatih", "Gazi", "İncili Çeşme", "Karataş", "Tabakhane", "Yeni Mahalle"]
  },
  {
    code: "19",
    name: "Çorum",
    taxOffices: ["Hasanpaşa V.D.", "Sungurlu V.D.", "Osmancık V.D."],
    districts: [
      "Merkez", "Sungurlu", "Osmancık", "İskilip", "Alaca", "Bayat", "Mecitözü",
      "Kargı", "Ortaköy", "Uğurludağ", "Dodurga", "Oğuzlar", "Laçin", "Boğazkale"
    ],
    sampleNeighborhoods: ["Akkent", "Bahçelievler", "Buharaevler", "Çepni", "Gülabibey", "Kale", "Karakeçili", "Kunduzhan", "Mimarsinan", "Ulukavak", "Yavruturna", "Yeniyol"]
  },
  {
    code: "20",
    name: "Denizli",
    taxOffices: ["Pamukkale V.D.", "Saraylar V.D.", "Çınar V.D.", "Gökpınar V.D.", "Acıpayam V.D.", "Çivril V.D.", "Tavas V.D."],
    districts: [
      "Pamukkale", "Merkezefendi", "Çivril", "Acıpayam", "Tavas", "Honaz", "Sarayköy",
      "Buldan", "Kale", "Çal", "Çameli", "Serinhisar", "Bozkurt", "Güney",
      "Çardak", "Bekilli", "Beyağaç", "Babadağ", "Baklan"
    ],
    sampleNeighborhoods: ["Adalet", "Altıntop", "Bahçelievler", "Bereketler", "Çamlaraltı", "Değirmenönü", "Gerzele", "Kınıklı", "Kuşpınar", "Mehmetçik", "Servergazi", "Sırakapılar", "Yenişehir"]
  },
  {
    code: "21",
    name: "Diyarbakır",
    taxOffices: ["Süleyman Nazif V.D.", "Ziya Gökalp V.D.", "Gökalp V.D.", "Ergani V.D.", "Bismil V.D.", "Silvan V.D."],
    districts: [
      "Bağlar", "Kayapınar", "Yenişehir", "Sur", "Ergani", "Bismil", "Silvan",
      "Çınar", "Çermik", "Dicle", "Kulp", "Hani", "Lice", "Eğil", "Hazro", "Kocaköy", "Çüngüş"
    ],
    sampleNeighborhoods: ["Diclekent", "Gaziler", "Huzurevleri", "Medya", "Metropol", "Peyas", "Şehitlik", "Fabrika", "Ofis", "Koşuyolu", "Batıkent", "Bağcılar"]
  },
  {
    code: "22",
    name: "Edirne",
    taxOffices: ["Arda V.D.", "Kırkpınar V.D.", "Keşan V.D.", "Uzunköprü V.D."],
    districts: ["Merkez", "Keşan", "Uzunköprü", "İpsala", "Havsa", "Meriç", "Enez", "Süloğlu", "Lalapaşa"],
    sampleNeighborhoods: ["Abdurrahman", "Babademirtaş", "Barutluk", "Çavuşbey", "Dilaverbey", "Fatih", "İstasyon", "Karaağaç", "Kocasinan", "Medrese Ali Bey", "Menzilahir", "Meydan", "Sabuni", "Şükrüpaşa", "Yancıkçı Şahin"]
  },
  {
    code: "23",
    name: "Elazığ",
    taxOffices: ["Harput V.D.", "Hazar V.D.", "Kovancılar V.D."],
    districts: ["Merkez", "Kovancılar", "Karakoçan", "Palu", "Arıcak", "Baskil", "Maden", "Sivrice", "Keban", "Alacakaya", "Ağın"],
    sampleNeighborhoods: ["Abdullah Paşa", "Akpınar", "Ataşehir", "Bahçelievler", "Cumhuriyet", "Çarşı", "Çaydaçıra", "Doğukent", "Fevzi Çakmak", "Gazi Caddesi", "Hilalkent", "İzzetpaşa", "Kültür", "Nailbey", "Rızaiye", "Sürsürü", "Üniversite"]
  },
  {
    code: "24",
    name: "Erzincan",
    taxOffices: ["Fevzipaşa V.D."],
    districts: ["Merkez", "Tercan", "Üzümlü", "Refahiye", "Çayırlı", "İliç", "Kemah", "Kemaliye", "Otlukbeli"],
    sampleNeighborhoods: ["Akşemsettin", "Arslanlı", "Atatürk", "Bahçelievler", "Barbaros", "Başbağlar", "Cumhuriyet", "Demirkent", "Ergenekon", "Fatih", "Geçit", "Hocabey", "İnönü", "İzzetpaşa", "Karaağaç", "Kazım Karabekir", "Mimar Sinan", "Yavuz Selim"]
  },
  {
    code: "25",
    name: "Erzurum",
    taxOffices: ["Kazım Karabekir V.D.", "Aziziye V.D.", "Oltu V.D.", "Palandöken V.D."],
    districts: [
      "Yakutiye", "Palandöken", "Aziziye", "Horasan", "Oltu", "Pasinler", "Karayazı",
      "Hınıs", "Tekman", "Karaçoban", "Aşkale", "Şenkaya", "Çat", "Köprüköy",
      "İspir", "Tortum", "Narman", "Uzundere", "Olur", "Pazaryolu"
    ],
    sampleNeighborhoods: ["Adnan Menderes", "Cumhuriyet", "Ertuğrulgazi", "Gez", "Hacı Cuma", "Harput", "Hüseyin Avni Ulaş", "Kazım Karabekir", "Lalapaşa", "Muratpaşa", "Ömer Nasuhi Bilmen", "Şükrüpaşa", "Yenişehir", "Yıldızkent", "Ilıca", "Dadaşkent"]
  },
  {
    code: "26",
    name: "Eskişehir",
    taxOffices: ["Battalgazi V.D.", "Taşbaşı V.D.", "2 Eylül V.D.", "Yunus Emre V.D.", "Sivrihisar V.D."],
    districts: [
      "Odunpazarı", "Tepebaşı", "Sivrihisar", "Çifteler", "Seyitgazi", "Alpu",
      "Mihalıççık", "Mahmudiye", "Beylikova", "İnönü", "Günyüzü", "Han", "Mihalgazi", "Sarıcakaya"
    ],
    sampleNeighborhoods: [
      "Bağlar", "Büyükdere", "Çamlıca", "Erenköy", "Eskibağlar", "Gökmeydan", "Güllük", "Hoşnudiye",
      "İstiklal", "Kurtuluş", "Kırmızıtoprak", "Ömerağa", "Şirintepe", "Uluönder", "Vişnelik", "Yenibağlar", "Batıkent"
    ]
  },
  {
    code: "27",
    name: "Gaziantep",
    taxOffices: ["Gaziantep Kurumlar V.D.", "Şahinbey V.D.", "Şehitkamil V.D.", "Suburcu V.D.", "Gazikent V.D.", "Nizip V.D.", "İslahiye V.D."],
    districts: [
      "Şahinbey", "Şehitkamil", "Nizip", "İslahiye", "Nurdağı", "Araban",
      "Oğuzeli", "Yavuzeli", "Karkamış"
    ],
    sampleNeighborhoods: [
      "Akkent", "Akyol", "Beybahçe", "Güneş", "Karataş", "Kavaklık", "Mavikent", "Yeditepe",
      "Batıkent", "Değirmiçem", "Emek", "Fatih", "Gazikent", "İbrahimli", "Merveşehir", "Sarıgüllük", "Şirinevler", "Güvenevler", "Beylerbeyi"
    ]
  },
  {
    code: "28",
    name: "Giresun",
    taxOffices: ["Giresun V.D.", "Bulancak V.D.", "Espiye V.D."],
    districts: [
      "Merkez", "Bulancak", "Espiye", "Görele", "Tirebolu", "Dereli", "Şebinkarahisar",
      "Keşap", "Yağlıdere", "Piraziz", "Eynesil", "Alucra", "Çamoluk", "Güce", "Doğankent", "Çanakçı"
    ],
    sampleNeighborhoods: ["Aksu", "Aydınlar", "Çaykara", "Çitlakkale", "Fevzi Çakmak", "Gedikkaya", "Hacı Hüseyin", "Hacı Miktat", "Kapu", "Nizamettin", "Osmaniye", "Seldeğirmeni", "Şeyhkeramettin", "Teyyaredüzü"]
  },
  {
    code: "29",
    name: "Gümüşhane",
    taxOffices: ["Gümüşhane V.D.", "Kelkit V.D."],
    districts: ["Merkez", "Kelkit", "Şiran", "Kürtün", "Torul", "Köse"],
    sampleNeighborhoods: ["Bağlarbaşı", "Canca", "Çamlıca", "Hacıemin", "Hasanbey", "İnönü", "Karaer", "Karşıyaka", "Özcan", "Süleymaniye", "Yeni Mahalle", "Zafer"]
  },
  {
    code: "30",
    name: "Hakkari",
    taxOffices: ["Hakkari V.D.", "Yüksekova V.D."],
    districts: ["Yüksekova", "Merkez", "Şemdinli", "Çukurca", "Derecik"],
    sampleNeighborhoods: ["Bağlar", "Biçer", "Bulak", "Dağgöl", "Gazi", "Halife Derviş", "Karşıyaka", "Kıran", "Merzan", "Pehlivan", "Sümbül", "Yeni Mahalle"]
  },
  {
    code: "31",
    name: "Hatay",
    taxOffices: ["Antakya V.D.", "23 Temmuz V.D.", "Şükrü Kanatlı V.D.", "İskenderun V.D.", "Sahil V.D.", "Akdeniz V.D.", "Dörtyol V.D.", "Kırıkhan V.D.", "Reyhanlı V.D.", "Samandağ V.D."],
    districts: [
      "Antakya", "İskenderun", "Defne", "Dörtyol", "Samandağ", "Kırıkhan", "Reyhanlı",
      "Arsuz", "Payas", "Erzin", "Hassa", "Belen", "Altınözü", "Kumlu", "Yayladağı"
    ],
    sampleNeighborhoods: ["Akevler", "Akasya", "Altınçay", "Armutlu", "Cebrail", "Cumhuriyet", "Elektrik", "Emek", "General Şükrü Kanatlı", "Harbiye", "Kışlasaray", "Sümerler", "Ürgen Paşa", "Numune", "Denizciler"]
  },
  {
    code: "32",
    name: "Isparta",
    taxOffices: ["Davraz V.D.", "Kaymakkapı V.D.", "Yalvaç V.D.", "Eğirdir V.D."],
    districts: [
      "Merkez", "Yalvaç", "Eğirdir", "Şarkikaraağaç", "Gelendost", "Keçiborlu",
      "Senirkent", "Sütçüler", "Gönen", "Uluborlu", "Atabey", "Aksu", "Yenişarbademli"
    ],
    sampleNeighborhoods: ["Bağlar", "Bahçelievler", "Batıkent", "Binbirevler", "Çünür", "Davraz", "Fatih", "Gazi Kemal", "Gülüstan", "Halıkent", "Hızırbey", "Işıkkent", "İstiklal", "Karaağaç", "Modern Evler", "Pirimehmet", "Sanayi", "Yedişehitler"]
  },
  {
    code: "33",
    name: "Mersin",
    taxOffices: ["İstiklal V.D.", "Uray V.D.", "Toros V.D.", "Liman V.D.", "Tarsus V.D.", "Şehitkerim V.D.", "Erdemli V.D.", "Silifke V.D.", "Anamur V.D.", "Mut V.D."],
    districts: [
      "Tarsus", "Toroslar", "Akdeniz", "Yenişehir", "Mezitli", "Erdemli",
      "Silifke", "Anamur", "Mut", "Bozyazı", "Gülnar", "Aydıncık", "Çamlıyayla"
    ],
    sampleNeighborhoods: [
      "Akkent", "Bahçelievler", "Barbaros", "Cumhuriyet", "Çamlıbel", "Çavak", "Davultepe", "Deniz", "Fatih",
      "Gazi", "Gözne", "Güvenevler", "Kültür", "Limonluk", "Menderes", "Mezitli Merkez", "Palmiye", "Pozcu", "Tece", "Viranşehir"
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
      "Sultanbeyli V.D.", "Sarıyer V.D.", "Sancaktepe V.D.", "Küçükçekmece V.D.", "Beykoz V.D."
    ],
    districts: [
      "Kadıköy", "Beşiktaş", "Şişli", "Üsküdar", "Ümraniye", "Ataşehir", "Bakırköy",
      "Beyoğlu", "Fatih", "Maltepe", "Kartal", "Pendik", "Tuzla", "Sarıyer",
      "Beylikdüzü", "Esenyurt", "Başakşehir", "Küçükçekmece", "Bahçelievler", "Bağcılar",
      "Gaziosmanpaşa", "Eyüpsultan", "Kağıthane", "Zeytinburnu", "Güngören", "Bayrampaşa",
      "Sultangazi", "Sultanbeyli", "Sancaktepe", "Çekmeköy", "Beykoz", "Şile",
      "Büyükçekmece", "Silivri", "Çatalca", "Arnavutköy", "Esenler", "Adalar", "Avcılar"
    ],
    sampleNeighborhoods: [
      "Caferağa (Moda)", "Fenerbahçe", "Rasimpaşa", "Suadiye", "Erenköy", "Bostancı", "Göztepe", "Caddebostan",
      "Koşuyolu", "Acıbadem", "Merdivenköy", "Sahrayıcedid", "Fikirtepe", "Hasanpaşa", "19 Mayıs", "Mecidiyeköy",
      "Teşvikiye (Nişantaşı)", "Fulya", "Halaskargazi", "Kurtuluş", "Feriköy", "Bebek", "Etiler", "Levazım",
      "Levent", "Nispetiye", "Ortaköy", "Atakent", "Ihlamurkuyu", "Şerifali", "Batı Ataşehir", "İçerenköy",
      "Altunizade", "Beylerbeyi", "Çengelköy", "Kuzguncuk", "Ataköy", "Florya (Şenlikköy)", "Yeşilköy", "Cihangir",
      "Galata (Bereketzade)", "Karaköy", "Bahçeşehir", "İkitelli OSB", "Maslak", "Tarabya", "Göktürk Merkez"
    ]
  },
  {
    code: "35",
    name: "İzmir",
    taxOffices: [
      "9 Eylül V.D.", "Hasan Tahsin V.D.", "Belkahve V.D.", "Kordon V.D.", "Şirinyer V.D.",
      "Karşıyaka V.D.", "Bornova V.D.", "Yamanlar V.D.", "Balçova V.D.", "Buca V.D.",
      "Gaziemir V.D.", "Konak V.D.", "Çiğli V.D.", "Torbalı V.D.", "Aliağa V.D.",
      "Bergama V.D.", "Ödemiş V.D.", "Tire V.D.", "Urla V.D.", "Menemen V.D.", "Çeşme V.D.", "Kemalpaşa V.D."
    ],
    districts: [
      "Konak", "Karşıyaka", "Bornova", "Buca", "Çiğli", "Gaziemir", "Balçova",
      "Narlıdere", "Bayraklı", "Karabağlar", "Torbalı", "Menemen", "Kemalpaşa",
      "Menderes", "Aliağa", "Bergama", "Ödemiş", "Tire", "Urla", "Çeşme",
      "Seferihisar", "Dikili", "Foça", "Kınık", "Kiraz", "Beydağ", "Bayındır",
      "Selçuk", "Güzelbahçe", "Karaburun"
    ],
    sampleNeighborhoods: [
      "Alsancak", "Göztepe", "Güzelyalı", "Pasaport", "Basmane", "Kahramanlar", "Karataş", "Mithatpaşa", "Kültür",
      "Bostanlı", "Mavişehir", "Alaybey", "Bahçelievler", "Demirköprü", "Evka 3", "Erzene", "Kazımdirik", "Küçük Park",
      "Işıkkent OSB", "Çamdibi", "Şirinyer", "Atatürk OSB", "Sarnıç", "Alaçatı", "Ilıca", "Çeşmealtı", "Mansuroğlu", "Adalet"
    ]
  },
  {
    code: "36",
    name: "Kars",
    taxOffices: ["Kars V.D.", "Sarıkamış V.D.", "Kağızman V.D."],
    districts: ["Merkez", "Kağızman", "Sarıkamış", "Selim", "Digor", "Arpaçay", "Akyaka", "Susuz"],
    sampleNeighborhoods: ["Ali Ağa", "Atatürk", "Aydınlıkevler", "Bahçelievler", "Bayrampaşa", "Bülbül", "Cumhuriyet", "Fevzi Çakmak", "Hafızpaşa", "İstasyon", "Kale içi", "Ortakapı", "Paşaçayırı", "Şehitler", "Yeni Mahalle", "Yusufpaşa"]
  },
  {
    code: "37",
    name: "Kastamonu",
    taxOffices: ["Kastamonu V.D.", "Tosya V.D.", "Taşköprü V.D.", "İnebolu V.D."],
    districts: [
      "Merkez", "Tosya", "Taşköprü", "Cide", "İnebolu", "Araç", "Devrekani",
      "Bozkurt", "Daday", "Azdavay", "Çatalzeytin", "Küre", "Doğanyurt",
      "İhsangazi", "Pınarbaşı", "Şenpazar", "Abana", "Seydiler", "Hanönü", "Ağlı"
    ],
    sampleNeighborhoods: ["Akmescit", "Aktekke", "Atabey", "Beyçelebi", "Candaroğulları", "Cebrail", "Dere", "Hepkebirler", "Honsalar", "İnönü", "İsmailbey", "Karasu", "Kırkçeşme", "Kuzeykent", "Mehmet Akif Ersoy", "Saraçlar", "Topçuoğlu", "Yavuz Selim"]
  },
  {
    code: "38",
    name: "Kayseri",
    taxOffices: ["Erciyes V.D.", "Gevher Nesibe V.D.", "Mimarsinan V.D.", "Kocasinan V.D.", "Kale V.D.", "Develi V.D."],
    districts: [
      "Melikgazi", "Kocasinan", "Talas", "Develi", "Yahyalı", "Bünyan", "İncesu",
      "Pınarbaşı", "Tomarza", "Yeşilhisar", "Sarıoğlan", "Hacılar", "Sarız",
      "Akkışla", "Felahiye", "Özvatan"
    ],
    sampleNeighborhoods: [
      "Alpaslan", "Bahçelievler", "Battalgazi", "Belsin", "Cumhuriyet", "Erciyesevler", "Fevzi Çakmak", "Gesi",
      "Hunat", "Hürriyet", "İldem", "Kılıçaslan", "Köşk", "Mevlana", "Sahabiye", "Sivas Caddesi", "Tacettin Veli",
      "Talas Anayurt", "Yenimahalle", "Zümrüt", "Organize Sanayi"
    ]
  },
  {
    code: "39",
    name: "Kırklareli",
    taxOffices: ["Kırklareli V.D.", "Lüleburgaz V.D.", "Babaeski V.D."],
    districts: ["Lüleburgaz", "Merkez", "Babaeski", "Vize", "Pınarhisar", "Demirköy", "Pehlivanköy", "Kofçaz"],
    sampleNeighborhoods: ["Akalar", "Bademlik", "Cumhuriyet", "Demirtaş", "Doğu", "Fevzi Çakmak", "Gazi Mustafa Kemal Paşa", "İnönü", "İstasyon", "Karacaibrahim", "Karakaş", "Kocahıdır", "Pınar", "Yayla", "Siteler"]
  },
  {
    code: "40",
    name: "Kırşehir",
    taxOffices: ["Kırşehir V.D.", "Kaman V.D."],
    districts: ["Merkez", "Kaman", "Mucur", "Çiçekdağı", "Akpınar", "Boztepe", "Akçakent"],
    sampleNeighborhoods: ["Ahi Evran", "Ahievran", "Aşıkpaşa", "Bağbaşı", "Bahçelievler", "Çukurçayır", "Gölhisar", "Güldiken", "Helvacılar", "Kervansaray", "Kuşdilli", "Medrese", "Nasuhdede", "Yenice", "Yenidoğan"]
  },
  {
    code: "41",
    name: "Kocaeli",
    taxOffices: [
      "İlyasbey V.D.", "Gebze V.D.", "İzmit V.D.", "Alemdar V.D.", "Tepecik V.D.",
      "Gölcük V.D.", "Derince V.D.", "Körfez V.D.", "Kartepe V.D.", "Karamürsel V.D."
    ],
    districts: [
      "Gebze", "İzmit", "Darıca", "Körfez", "Gölcük", "Derince", "Çayırova",
      "Kartepe", "Başiskele", "Karamürsel", "Kandıra", "Dilovası"
    ],
    sampleNeighborhoods: [
      "Arapçeşme", "Güzeller", "Hacıhalil", "İnönü", "Köşklü Çeşme", "Mustafapaşa", "Osman Yılmaz", "Tatlıkuyu",
      "Yenikent", "OSBler", "Akarca", "Alikahya", "Bekirdere", "Yahya Kaptan", "Yenişehir", "Akse", "Şekerpınar",
      "Bayramoğlu", "Değirmendere", "Yarımca", "Köseköy", "Maşukiye", "Yuvacık", "Kullar"
    ]
  },
  {
    code: "42",
    name: "Konya",
    taxOffices: ["Mevlana V.D.", "Selçuk V.D.", "Meram V.D.", "Alaaddin V.D.", "Akşehir V.D.", "Ereğli V.D.", "Beyşehir V.D.", "Seydişehir V.D.", "Cihanbeyli V.D.", "Kulu V.D."],
    districts: [
      "Selçuklu", "Karatay", "Meram", "Ereğli", "Akşehir", "Beyşehir", "Cihanbeyli",
      "Kulu", "Seydişehir", "Ilgın", "Bozkır", "Karahöyük", "Kadınhanı", "Sarayönü",
      "Çumra", "Doğanhisar", "Hünkar", "Yunak", "Hüyük", "Altınekin", "Hadim",
      "Çeltik", "Güneysınır", "Emirgazi", "Taşkent", "Tuzlukçu", "Akören", "Ahırlı",
      "Derbent", "Halkapınar", "Yalıhüyük"
    ],
    sampleNeighborhoods: [
      "Bosna Hersek", "Binkonutlar", "Cumhuriyet", "Işıklar", "Kılınçarslan", "Musalla Bağları", "Sancak", "Şeyh Şamil",
      "Yazır", "Aydoğdu", "Dere", "Gülbahçe", "Harmancık", "Lalebahçe", "Yaka", "Akabe", "Fevziçakmak", "Mengene", "Sarıyakup"
    ]
  },
  {
    code: "43",
    name: "Kütahya",
    taxOffices: ["30 Ağustos V.D.", "Dumlupınar V.D.", "Tavşanlı V.D.", "Simav V.D.", "Gediz V.D."],
    districts: [
      "Merkez", "Tavşanlı", "Simav", "Gediz", "Emet", "Altıntaş", "Domaniç",
      "Hisarcık", "Aslanapa", "Çavdarhisar", "Şaphane", "Pazarlar", "Dumlupınar"
    ],
    sampleNeighborhoods: ["75. Yıl", "Ağaçköy", "Akent", "Ali Paşa", "Alipaşa", "Bahçelievler", "Balıyköy", "Bölücek", "Cumhuriyet", "Dumlupınar", "Evliya Çelebi", "Fatih", "Gaybiefendi", "Gültepe", "Maltepe", "Meydan", "Paşam Sultan", "Servi", "Yenimahalle", "Zafertepe"]
  },
  {
    code: "44",
    name: "Malatya",
    taxOffices: ["Fırat V.D.", "Beydağı V.D.", "Battalgazi V.D."],
    districts: [
      "Battalgazi", "Yeşilyurt", "Doğanşehir", "Akçadağ", "Darende", "Hekimhan",
      "Pütürge", "Yazıhan", "Arapgir", "Kuluncak", "Arguvan", "Kale", "Doğanyol"
    ],
    sampleNeighborhoods: ["Bostanbaşı", "Cevatpaşa", "Çilesiz", "İnönü", "Karakavak", "Tecde", "Yakupgazi", "Zaviye", "Beydağı", "Cirasun", "Çöşnük", "Fırat", "Göztepe", "Hacı Abdi", "Kernek", "Paşaköşkü", "Saray", "Tandoğan", "Üçbağlar", "Zafer"]
  },
  {
    code: "45",
    name: "Manisa",
    taxOffices: ["Alabey V.D.", "Mesir V.D.", "Akhisar V.D.", "Salihli V.D.", "Turgutlu V.D.", "Soma V.D.", "Alaşehir V.D.", "Kırkağaç V.D."],
    districts: [
      "Yunusemre", "Şehzadeler", "Akhisar", "Turgutlu", "Salihli", "Soma",
      "Alaşehir", "Saruhanlı", "Kula", "Demirci", "Kırkağaç", "Sarıgöl",
      "Gördes", "Selendi", "Ahmetli", "Gölmarmara", "Köprübaşı"
    ],
    sampleNeighborhoods: [
      "Güzelyurt", "Uncubozköy", "Muradiye", "Yeni Mahalle", "Akmescit", "Arda", "Çarşı",
      "Peker", "Yarhasanlar", "1. Anafartalar", "2. Anafartalar", "Şehitler", "Tevfikiye", "Keçiliköy OSB"
    ]
  },
  {
    code: "46",
    name: "Kahramanmaraş",
    taxOffices: ["Aksu V.D.", "Aslanbey V.D.", "Elbistan V.D.", "Afşin V.D.", "Pazarcık V.D."],
    districts: [
      "Onikişubat", "Dulkadiroğlu", "Elbistan", "Afşin", "Türkoğlu", "Pazarcık",
      "Göksun", "Andırın", "Çağlayancerit", "Nurhak", "Ekinözü"
    ],
    sampleNeighborhoods: ["Akif İnan", "Binevler", "Cumhuriyet", "Doğukent", "Haydar Bey", "Hürriyet", "İsmet Paşa", "Menderes", "Mimar Sinan", "Necip Fazıl", "Piri Reis", "Şazi Bey", "Üngüt", "Yamaçtepe", "Yunus Emre"]
  },
  {
    code: "47",
    name: "Mardin",
    taxOffices: ["Mardin V.D.", "Kızıltepe V.D.", "Nusaybin V.D.", "Midyat V.D."],
    districts: ["Kızıltepe", "Artuklu", "Midyat", "Nusaybin", "Derik", "Mazıdağı", "Dargeçit", "Savur", "Yeşilli", "Ömerli"],
    sampleNeighborhoods: ["13 Mart", "Cumhuriyet", "Diyarbakır Kapı", "Eminettin", "Gül", "İstasyon", "Latifiye", "Medrese", "Necmettin", "Nur", "Saraçoğlu", "Şar", "Teker", "Yalım", "Yenimahalle", "Yeniyol"]
  },
  {
    code: "48",
    name: "Muğla",
    taxOffices: ["Muğla V.D.", "Bodrum V.D.", "Fethiye V.D.", "Marmaris V.D.", "Milas V.D.", "Yatağan V.D.", "Ortaca V.D."],
    districts: [
      "Bodrum", "Fethiye", "Milas", "Menteşe", "Marmaris", "Seydikemer", "Ortaca",
      "Yatağan", "Dalaman", "Köyceğiz", "Ula", "Datça", "Kavaklıdere"
    ],
    sampleNeighborhoods: [
      "Emirbeyazıt", "Kötekli", "Muslihittin", "Orhaniye", "Şeyh", "Yeniköy",
      "Gümbet", "Bitez", "Ortakent", "Turgutreis", "Yalıkavak", "Türkbükü", "Gümüşlük",
      "Ölüdeniz", "Göcek", "İçmeler", "Armutalan", "Dalyan", "Akyaka"
    ]
  },
  {
    code: "49",
    name: "Muş",
    taxOffices: ["Muş V.D.", "Malazgirt V.D."],
    districts: ["Merkez", "Bulanık", "Malazgirt", "Varte", "Hasköy", "Korkut"],
    sampleNeighborhoods: ["Bağlar", "Dere", "Hürriyet", "Kale", "Karşıyaka", "Kültür", "Minare", "Muratpaşa", "Saray", "Sunay", "Sütlüce", "Yeşilce", "Zafer"]
  },
  {
    code: "50",
    name: "Nevşehir",
    taxOffices: ["Nevşehir V.D.", "Ürgüp V.D.", "Avanos V.D."],
    districts: ["Merkez", "Ürgüp", "Avanos", "Gülşehir", "Derinkuyu", "Acıgöl", "Kozaklı", "Hacıbektaş"],
    sampleNeighborhoods: ["15 Temmuz", "2000 Evler", "350 Evler", "Bekdik", "Cevher Dudayev", "Emek", "Esentepe", "Fatih Sultan Mehmet", "Güzelyurt", "Hacı Rüştü", "İbrahim Paşa", "Karasoku", "Karasu", "Kapucubaşı", "Kıratlıoğlu", "Mehmet Akif Ersoy", "Ragıp Üner", "Sümer", "Tahta Cami", "Yeni Mahalle"]
  },
  {
    code: "51",
    name: "Niğde",
    taxOffices: ["Niğde V.D.", "Bor V.D."],
    districts: ["Merkez", "Bor", "Çiftlik", "Ulukışla", "Altunhisar", "Çamardı"],
    sampleNeighborhoods: ["Aşağı Kayabaşı", "Yukarı Kayabaşı", "Cumhuriyet", "Dere", "Efendibey", "Eski Saray", "İlhanlı", "İnönü", "Kale", "Kayaardı", "Kumluca", "Nar", "Selçuk", "Sungurbey", "Şahinali", "Şehitler", "Yenice", "Yeşilburç"]
  },
  {
    code: "52",
    name: "Ordu",
    taxOffices: ["Boztepe V.D.", "Köprübaşı V.D.", "Ünye V.D.", "Fatsa V.D."],
    districts: [
      "Altınordu", "Ünye", "Fatsa", "Gölköy", "Perşembe", "Korgan", "Kumru",
      "Aybastı", "Kabadüz", "Gürgentepe", "İkizce", "Ulubey", "Mesudiye",
      "Çatalpınar", "Çaybaşı", "Kabataş", "Akkuş", "Gülyalı", "Çamaş"
    ],
    sampleNeighborhoods: ["Akyazı", "Bahçelievler", "Bucak", "Cumhuriyet", "Durugöl", "Düz Mahalle", "Güzelyalı", "Karapınar", "Karşıyaka", "Kirazlimanı", "Nizamettin", "Öceli", "Saray", "Selimiye", "Şahincili", "Şirinevler", "Taşbaşı", "Yalı", "Yeni Mahalle", "Zaferi Milli"]
  },
  {
    code: "53",
    name: "Rize",
    taxOffices: ["Yeşilçay V.D.", "Kaçkar V.D.", "Çayeli V.D.", "Pazar V.D.,", "Ardeşen V.D."],
    districts: [
      "Merkez", "Çayeli", "Ardeşen", "Pazar", "Fındıklı", "Güneysu", "Kalkandere",
      "İyidere", "Derepazarı", "Çamlıhemşin", "İkizdere", "Hemşin"
    ],
    sampleNeighborhoods: ["Alipaşa", "Bağdatlı", "Boğaz", "Camiönü", "Çarşı", "Çiftekavak", "Dağdibi", "Dağınıksu", "Değirmendere", "Engindere", "Fener", "Gülbahar", "Hamidiye", "Hayrat", "İslampaşa", "Kale", "Mermerdelen", "Müftü", "Paşakuyu", "Piriçelebi", "Reşadiye", "Tophane", "Yağlıtaş", "Yeniköy"]
  },
  {
    code: "54",
    name: "Sakarya",
    taxOffices: ["Gümrükönü V.D.", "Ali Fuat Cebesoy V.D.", "Akyazı V.D.", "Hendek V.D.", "Karasu V.D.", "Geyve V.D."],
    districts: [
      "Adapazarı", "Serdivan", "Akyazı", "Erenler", "Hendek", "Karasu", "Geyve",
      "Arifiye", "Sapanca", "Pamukova", "Ferizli", "Kaynarca", "Kocaali", "Söğütlü",
      "Karapürçek", "Taraklı"
    ],
    sampleNeighborhoods: [
      "Arabacıalanı", "İstiklal", "Bahçelievler", "Kemalpaşa", "Köprübaşı", "Orta Mahalle",
      "Çark Caddesi", "Semerciler", "Tığcılar", "Mithatpaşa", "Yenicami", "Kırkpınar", "Kurtköy"
    ]
  },
  {
    code: "55",
    name: "Samsun",
    taxOffices: ["Gaziler V.D.", "19 Mayıs V.D.", "Zafer V.D.", "Bafra V.D.", "Çarşamba V.D.", "Terme V.D.", "Vezirköprü V.D.", "Havza V.D."],
    districts: [
      "İlkadım", "Atakum", "Canik", "Bafra", "Çarşamba", "Tekkeköy", "Vezirköprü",
      "Terme", "Havza", "Alaçam", "19 Mayıs", "Kavak", "Salıpazarı", "Asarcık",
      "Ladik", "Yakakent", "Ayvacık"
    ],
    sampleNeighborhoods: [
      "Cumhuriyet", "Denizevleri", "Güzelyalı", "İncesu", "Körfez", "Mimar Sinan", "Türkiş", "Yeni Mahalle",
      "Bahçelievler", "Cedit", "Çiftlik", "Fevzi Çakmak", "Hançerli", "İstasyon", "Kaleiçi", "Karasamsun", "Pazar", "Rasathane", "Zafer"
    ]
  },
  {
    code: "56",
    name: "Siirt",
    taxOffices: ["Siirt V.D.", "Kurtalan V.D."],
    districts: ["Merkez", "Kurtalan", "Pervari", "Baykan", "Şirvan", "Eruh", "Tillo"],
    sampleNeighborhoods: ["Afetevleri", "Bahçelievler", "Barış", "Batı", "Conkbayır", "Çal", "Doğan", "Dumlupınar", "İnönü", "Karakol", "Kooperatif", "Sakarya", "Tınaztepe", "Ulus", "Ülkü", "Yeni Mahalle"]
  },
  {
    code: "57",
    name: "Sinop",
    taxOffices: ["Sinop V.D.", "Boyabat V.D.", "Ayancık V.D."],
    districts: ["Merkez", "Boyabat", "Gerze", "Ayancık", "Durağan", "Türkeli", "Erfelek", "Saraydüzü", "Dikmen"],
    sampleNeighborhoods: ["Ada", "Bostancılı", "Camikebir", "Gelincik", "İncedayı", "Kaleyazısı", "Kefevi", "Korucuk", "Meydankapı", "Orduköy", "Osmaniye", "Yalı", "Zeytinlik"]
  },
  {
    code: "58",
    name: "Sivas",
    taxOffices: ["Kale V.D.", "Site V.D.", "Şarkışla V.D."],
    districts: [
      "Merkez", "Şarkışla", "Yıldızeli", "Zara", "Gemerek", "Kangal", "Suşehri",
      "Divriği", "Gürün", "Koyulhisar", "Ulaş", "Hafik", "İmranlı", "Altınyayla",
      "Akıncılar", "Gölova", "Doğanşar"
    ],
    sampleNeighborhoods: [
      "Akdeğirmen", "Alibaba", "Altuntabak", "Aydoğan", "Bağdat Caddesi", "Çarşıbaşı", "Çayyurt", "Danışmentgazi",
      "Demircilerardı", "Diriliş", "Dört Eylül", "Fatih", "Ferhatbostan", "Gökçebostan", "Gültepe", "Kümbet",
      "Mehmet Akif Ersoy", "Mevlana", "Örtülüpınar", "Paşabey", "Sularbaşı", "Şeyh Şamil", "Tuzlugöl", "Yenişehir", "Yiğitler"
    ]
  },
  {
    code: "59",
    name: "Tekirdağ",
    taxOffices: ["Namık Kemal V.D.", "Süleymanpaşa V.D.", "Çorlu V.D.", "Çerkezköy V.D.", "Kapaklı V.D.", "Malkara V.D.", "Hayrabolu V.D."],
    districts: [
      "Çorlu", "Süleymanpaşa", "Çerkezköy", "Kapaklı", "Ergene", "Malkara",
      "Saray", "Hayrabolu", "Şarköy", "Muratlı", "Marmaraereğlisi"
    ],
    sampleNeighborhoods: [
      "Alipaşa", "Cemaliye", "Cumhuriyet", "Çobançeşme", "Esentepe", "Havuzlar", "Hürriyet", "Kazımiye", "Muhittin", "Nusratiye", "Önerler", "Reşadiye", "Rumeli", "Seymen", "Şeyhsinan", "Zafer",
      "100. Yıl", "Altınova", "Barbaros", "Çınarlı", "Değirmenaltı", "Ertuğrul", "Gazi Osman Paşa", "Hürriyet", "Kumbağ", "Ortacami", "Yavuz"
    ]
  },
  {
    code: "60",
    name: "Tokat",
    taxOffices: ["Tokat V.D.", "Erbaa V.D.", "Turhal V.D.", "Niksar V.D.,", "Zile V.D."],
    districts: [
      "Merkez", "Erbaa", "Turhal", "Niksar", "Zile", "Reşadiye", "Almus",
      "Pazar", "Yeşilyurt", "Artova", "Sulusaray", "Başçiftlik"
    ],
    sampleNeighborhoods: ["600 Evler", "Ali Paşa", "Altıyüz Evler", "Bedestenlioğlu", "Büyükbeybağı", "Cemalettin", "Çay", "Devegörmez", "Doğancıbağı", "Erenler", "Gezirlik", "Gülbaharhatun", "Karasamsun", "Karşıyaka", "Kümbet", "Mahmutpaşa", "Mehmetpaşa", "Oğultürk", "Perakende", "Semerkant", "Soğukpınar", "Toptancılar Sitesi", "Yenidoğan", "Yeşilırmak"]
  },
  {
    code: "61",
    name: "Trabzon",
    taxOffices: ["Karadeniz V.D.", "Hızırbey V.D.", "Akçaabat V.D.", "Of V.D."],
    districts: [
      "Ortahisar", "Akçaabat", "Araklı", "Of", "Yomra", "Arsin", "Vakfıkebir",
      "Sürmene", "Maçka", "Beşikdüzü", "Çarşıbaşı", "Tonya", "Düzköy",
      "Çaykara", "Şalpazarı", "Hayrat", "Köprübaşı", "Dernekpazarı"
    ],
    sampleNeighborhoods: [
      "1 No Erdoğdu", "2 No Erdoğdu", "1 No Bostancı", "2 No Bostancı", "Bahçecik", "Boztepe", "Cumhuriyet",
      "Çamoba", "Çarşı", "Çömlekçi", "Değirmendere", "Gazipaşa", "Gülbaharhatun", "Hızırbey", "İnönü", "İskenderpaşa",
      "Kalkınma", "Karşıyaka", "Kemerkaya", "Konaklar", "Kurtuluş", "Pazarkapı", "Sanayi", "Söğütlü", "Yalıncak", "Yenimahalle"
    ]
  },
  {
    code: "62",
    name: "Tunceli",
    taxOffices: ["Tunceli V.D."],
    districts: ["Merkez", "Pertek", "Mazgirt", "Çemişgezek", "Hozat", "Ovacık", "Nazımiye", "Pülümür"],
    sampleNeighborhoods: ["Alibaba", "Alanyazı", "Atatürk", "Cumhuriyet", "Esentepe", "Gazik", "İnönü", "Moğultay", "Sihenk", "Yeni Mahalle"]
  },
  {
    code: "63",
    name: "Şanlıurfa",
    taxOffices: ["Topçu Meydanı V.D.", "Şehitlik V.D.", "Urfa V.D.", "Siverek V.D.", "Viranşehir V.D.", "Birecik V.D."],
    districts: [
      "Haliliye", "Eyyübiye", "Karaköprü", "Siverek", "Viranşehir", "Suruç",
      "Birecik", "Akçakale", "Ceylanpınar", "Harran", "Bozova", "Hilvan", "Halfeti"
    ],
    sampleNeighborhoods: [
      "Ahmet Yesevi", "Akpınar", "Ali Baba", "Atatürk", "Bağlarbaşı", "Bahçelievler", "Bamyasuyu", "Cengiz Topel", "Devteyşti",
      "Direkli", "Ertuğrul Gazi", "Hamidiye", "İpekyol", "Karşıyaka", "Mimar Sinan", "Paşabağı", "Refahiye", "Sancaktar", "Sırrın", "Süleymaniye", "Şair Şevket", "Veysel Karani", "Yenişehir"
    ]
  },
  {
    code: "64",
    name: "Uşak",
    taxOffices: ["Uşak V.D.", "Banaz V.D."],
    districts: ["Merkez", "Banaz", "Eşme", "Sivaslı", "Ulubey", "Karahallı"],
    sampleNeighborhoods: ["Atatürk", "Ayancık", "Bölme", "Cumhuriyet", "Çevre", "Dikilitaş", "Durak", "Elmalıdere", "Fatih", "Fevzi Çakmak", "Hacıkadem", "Işık", "İlyaslı", "İsmetpaşa", "Karaağaç", "Kemalöz", "Köme", "Kurşunluk", "Mehmet Akif Ersoy", "Mustafa Kemal", "Örnek Evler", "Sarayaltı", "Şeref", "Ünalan"]
  },
  {
    code: "65",
    name: "Van",
    taxOffices: ["Van V.D.", "Tuşba V.D.", "İpekyolu V.D.", "Erciş V.D."],
    districts: [
      "İpekyolu", "Tuşba", "Edremit", "Erciş", "Özalp", "Çaldıran", "Başkale",
      "Muradiye", "Gürpınar", "Gevaş", "Saray", "Çatak", "Bahçesaray"
    ],
    sampleNeighborhoods: [
      "Abdurrahman Gazi", "Ali Paşa", "Altıntepe", "Bahçıvan", "Beyüzümü", "Bostaniçi", "Cevdet Paşa", "Cumhuriyet",
      "Esenler", "Hacıbekir", "Hafiziye", "Halilağa", "Hatuniye", "İskele", "Karşıyaka", "Seyit Fehim Arvasi", "Şerefiye", "Vali Mithat Bey", "Yeni Mahalle"
    ]
  },
  {
    code: "66",
    name: "Yozgat",
    taxOffices: ["Yozgat V.D.", "Sorgun V.D.", "Yerköy V.D.", "Boğazlıyan V.D."],
    districts: [
      "Merkez", "Sorgun", "Akdağmadeni", "Yerköy", "Boğazlıyan", "Sarıkaya",
      "Çekerek", "Şefaatli", "Saraykent", "Çayıralan", "Kadışehri", "Aydıncık", "Yenifakılı", "Chandır"
    ],
    sampleNeighborhoods: ["Aşağı Çatak", "Yukarı Çatak", "Aşağı Nohutlu", "Yukarı Nohutlu", "Bahçeşehir", "Bilal Şahin", "Çapanlar", "Çapanoğlu", "Develiseyir", "Divanlı", "Erdoğan Akdağ", "Eskipazar", "Fatih", "İnceçayır", "Karatepe", "Köseoğlu", "Medrese", "Menteşe", "Musabeyli", "Tuzkaya"]
  },
  {
    code: "67",
    name: "Zonguldak",
    taxOffices: ["Uzun Mehmet V.D.", "Karaelmas V.D.", "Karadeniz Ereğli V.D.", "Çaycuma V.D.", "Devrek V.D."],
    districts: ["Merkez", "Karadeniz Ereğli", "Çaycuma", "Devrek", "Kozlu", "Alaplı", "Kilimli", "Gökçebey"],
    sampleNeighborhoods: ["Baştarla", "Birlik", "Çaydamar", "Dilaver", "İncivez", "Karaelmas", "Mithatpaşa", "Meşrutiyet", "Ontemmuz", "Rüzgarlımeşe", "Site", "Soğuksu", "Terakki", "Tepebaşı", "Yayladamı", "Yeşiltepe"]
  },
  {
    code: "68",
    name: "Aksaray",
    taxOffices: ["Aksaray V.D."],
    districts: ["Merkez", "Ortaköy", "Eskil", "Gülağaç", "Güzelyurt", "Ağaçören", "Sultanhanı", "Sarıyahşi"],
    sampleNeighborhoods: ["Aratol Bahçeli", "Aratol İstiklal", "Bahçesaray", "Bayrambaba", "Bedir Muhtar", "Büyük Bölcek", "Cumhuriyet", "Coğlaki", "Çerdiğin", "Dere", "Ereğlikapı", "Fatih", "Hacı Hasanlı", "Hassas", "Hürriyet", "Kılıçaslan", "Kurtuluş", "Meydan", "Minarecik", "Nakkaş", "Pamucak", "Paşacık", "Pınar", "Sanayi", "Somuncu Baba", "Şamlı", "Şeyh Hamit", "Taşpazar", "Tacin", "Yavuz Sultan Selim", "Zincirli"]
  },
  {
    code: "69",
    name: "Bayburt",
    taxOffices: ["Bayburt V.D."],
    districts: ["Merkez", "Demirözü", "Aydıntepe"],
    sampleNeighborhoods: ["Camiikebir", "Çoruh", "Esentepe", "Gençosman", "Kadirgazi", "Kaleardı", "Karataş", "Kızıl Elma", "Mehmet Çelebi", "Şeyhhayran", "Tuzcuzade", "Uzungazi", "Veysel", "Velişaban", "Zahit"]
  },
  {
    code: "70",
    name: "Karaman",
    taxOffices: ["Karaman V.D."],
    districts: ["Merkez", "Ermenek", "Sarıveliler", "Ayrancı", "Kazımkarabekir", "Başyayla"],
    sampleNeighborhoods: ["Abbas", "Ahmet Yesevi", "Alişahane", "Alacasuluk", "Beyazkent", "Cedit", "Cumhuriyet", "Çeltek", "Fenari", "Gevher Hatun", "Hamidiye", "Hürriyet", "İbrahim Hakkı Konyalı", "İmaret", "Kirişçi", "Larende", "Mahmutlar", "Mansur Dede", "Mümine Hatun", "Nefise Sultan", "Piri Reis", "Rauf Denktaş", "Siyahser", "Şeyh Edebali", "Tabduk Emre", "Tapucak", "Topucak", "Üniversite", "Valide Sultan", "Yunus Emre", "Zembilli Ali Efendi"]
  },
  {
    code: "71",
    name: "Kırıkkale",
    taxOffices: ["Kaletepe V.D.", "Irmak V.D."],
    districts: ["Merkez", "Yahşihan", "Keskin", "Delice", "Sulakyurt", "Bahşili", "Balışeyh", "Karakeçili", "Çelebi"],
    sampleNeighborhoods: ["Bağlarbaşı", "Bahçelievler", "Calılıöz", "Cumhuriyet", "Çalılıöz", "Etiler", "Fabrikalar", "Fatih", "Gündoğdu", "Gürler", "Hüseyin Kahya", "Kaletepe", "Karşıyaka", "Kırıkköyü", "Kurtuluş", "Ovacık", "Sanayi", "Tepebaşı", "Yayla", "Yenimahalle", "Yuva"]
  },
  {
    code: "72",
    name: "Batman",
    taxOffices: ["Batman V.D."],
    districts: ["Merkez", "Kozluk", "Sason", "Beşiri", "Gercüş", "Hasankeyf"],
    sampleNeighborhoods: ["19 Mayıs", "Akyürek", "Bağlar", "Bahçelievler", "Bayındır", "Belde", "Camii", "Cudi", "Cumhuriyet", "Çamlıca", "Çamlıtepe", "Fatih", "Gap", "Gültepe", "Güneykent", "Hilal", "Hürriyet", "İkiztepe", "İluh", "Kısmet", "Körçoban", "Kültür", "Meydan", "Pazaryeri", "Petrol", "Petrolkent", "Pınarbaşı", "Raman", "Sağlık", "Seyitler", "Site", "Şafak", "Şirinevler", "Tilmerç", "Yavuz Selim", "Yeni Mahalle", "Yeşiltepe", "Ziya Gökalp"]
  },
  {
    code: "73",
    name: "Şırnak",
    taxOffices: ["Şırnak V.D.", "Cizre V.D.", "Silopi V.D."],
    districts: ["Cizre", "Silopi", "Merkez", "İdil", "Uludere", "Beytüşşebap", "Güçlükonak"],
    sampleNeighborhoods: ["Bahçelievler", "Aydınlıkevler", "Cumhuriyet", "Dicle", "Gazi", "Gündoğdu", "İsmetpaşa", "Şehit Mehmet İşlek", "Vakıfkent", "Yeşilyurt", "Yeni Mahalle", "Şah", "Sur", "Nur", "Yafes"]
  },
  {
    code: "74",
    name: "Bartın",
    taxOffices: ["Bartın V.D."],
    districts: ["Merkez", "Ulus", "Amasra", "Kurucaşile"],
    sampleNeighborhoods: ["Ağdacı", "Aladağ", "Balamba", "Cumhuriyet", "Çaydüzü", "Demirciler", "Esentepe", "Gölbucağı", "Hacıosman", "Hürriyet", "Karasu", "Kemerköprü", "Karaköy", "Kırtepe", "Köroğlu", "Köyortası", "Okulak", "Orta Mahalle", "Şiremir Çavuş", "Tuna", "Yalı"]
  },
  {
    code: "75",
    name: "Ardahan",
    taxOffices: ["Ardahan V.D."],
    districts: ["Merkez", "Göle", "Çıldır", "Hanak", "Posof", "Damal"],
    sampleNeighborhoods: ["Atatürk", "Halilefendi", "İnönü", "Kaptanpaşa", "Karagöl", "Sugözü", "Yeni Mahalle"]
  },
  {
    code: "76",
    name: "Iğdır",
    taxOffices: ["Iğdır V.D."],
    districts: ["Merkez", "Tuzluca", "Aralık", "Karakoyunlu"],
    sampleNeighborhoods: ["14 Kasım", "Alikamerli", "Atatürk", "Bağlar", "Baharlı", "Cumhuriyet", "Emek", "Hakveyis", "Hürriyet", "Karaağaç", "Konaklı", "Özgür", "Pir Sultan Abdal", "Söğütlü", "Topçular", "Yarımca"]
  },
  {
    code: "77",
    name: "Yalova",
    taxOffices: ["Yalova V.D."],
    districts: ["Merkez", "Çiftlikköy", "Çınarcık", "Altınova", "Armutlu", "Termal"],
    sampleNeighborhoods: ["Adnan Menderes", "Bağlarbaşı", "Bayraktepe", "Cumhuriyet", "Dere", "Fevzi Çakmak", "Gazi Osman Paşa", "İsmet Paşa", "Kazım Karabekir", "Mustafa Kemal Paşa", "Paşakent", "Rüstem Paşa", "Süleyman Bey", "Seyrantepe"]
  },
  {
    code: "78",
    name: "Karabük",
    taxOffices: ["Karabük V.D.", "Safranbolu V.D."],
    districts: ["Merkez", "Safranbolu", "Yenice", "Eskipazar", "Eflani", "Ovacık"],
    sampleNeighborhoods: ["100. Yıl", "5000 Evler 75. Yıl", "5000 Evler Bahçelievler", "5000 Evler Cumhuriyet", "Adatepe", "Bayır", "Belentepe", "Cemaller", "Çerçiler", "Ergenekon", "Fevzi Çakmak", "Hürriyet", "İnönü", "Kapullu", "Karabük Köyü", "Kartaltepe", "Kayabaşı", "Kılavuzlar", "Kurtuluş", "Namık Kemal", "Öğlebeli", "Şirinevler", "Üniversite", "Yeni Mahalle", "Yeşil Mahalle"]
  },
  {
    code: "79",
    name: "Kilis",
    taxOffices: ["Kilis V.D."],
    districts: ["Merkez", "Elbeyli", "Musabeyli", "Polateli"],
    sampleNeighborhoods: ["Abdurrahman İyigün", "Akpınar", "Aliağa", "Aşıt", "Atatürk", "Bölük", "Canpolat Paşa", "Cebrail", "Cumhuriyet", "Çaylak", "Deveciler", "Doğan Güreş Paşa", "Ekrem Çetin", "Fasih Kakınç", "Gazi", "Hakverdi", "Hasan Kamil Demirbaş", "Helvacıoğlu", "Hürriyet", "İnönü", "İsmet Paşa", "Kanuni Sultan Süleyman", "Kartalbey", "Kazım Karabekir", "Mareşal Fevzi Çakmak", "Mehmet Rıfat Kazancıoğlu", "Menderes", "Mercidabık", "Meşetlik", "Mimar Sinan", "Mücahitler", "Namık Kemal", "Necmettin Erbakan", "Oruçgazi", "Osman Gazi", "Polateli", "Saraç Mehmet Çavuş", "Şehitler", "Şıh Abdullah", "Şıhlar", "Tabakhane", "Turgut Özal", "Yaşar Aktürk", "Yavuz Sultan Selim", "Yedigöz", "Yenimahalle"]
  },
  {
    code: "80",
    name: "Osmaniye",
    taxOffices: ["Osmaniye V.D.", "Kadirli V.D.,", "Düziçi V.D."],
    districts: ["Merkez", "Kadirli", "Düziçi", "Bahçe", "Toprakkale", "Sumbas", "Hasanbeyli"],
    sampleNeighborhoods: ["Adnan Menderes", "Ahmet Yesevi", "Ali Beyli", "Ali Cami", "Alibeyli", "Baş Mahalle", "Cumhuriyet", "Dr. İhsan Göknal", "Esenevler", "Fakıuşağı", "Fatih", "Gebeli", "Hacı Osmanlı", "Haraz", "İstiklal", "Karaboynlu", "Karamaraş", "Kazım Karabekir", "Kurtuluş", "Mareşal Fevzi Çakmak", "Mehmet Akif Ersoy", "Mimar Sinan", "Rahime Hatun", "Raufbey", "Rızaiye", "Selimiye", "Şaverdi", "Şehit Mustafa Yağız", "Şirinevler", "Ulaşlı", "Yaverpaşa", "Yediocak", "Yenimahalle", "Yeşiltepe", "Yıldırım Beyazıt"]
  },
  {
    code: "81",
    name: "Düzce",
    taxOffices: ["Düzce V.D.", "Akçakoca V.D."],
    districts: ["Merkez", "Akçakoca", "Kaynaşlı", "Gölyaka", "Çilimli", "Yığılca", "Gümüşova", "Cumayeri"],
    sampleNeighborhoods: ["Ağa", "Akınlar", "Arapçiftliği", "Aziziye", "Bahçelievler", "Beyciler", "Burhaniye", "Camikebir", "Cedidiye", "Cumhuriyet", "Çamköy", "Çamlıevler", "Çay", "Darısı", "Dedeler", "Demiryolu", "Dereli Tütüncü", "Doğanlı", "Fatih", "Fevzi Çakmak", "Gökköy", "Gümüşpınar", "Güzelbahçe", "Hamidiye", "Hürriyet", "Kalıcı Konutlar", "Karaca", "Karadere Hasanağa", "Karahacımusa", "Karaköy", "Kazukoğlu", "Kiremitocağı", "Konuralp", "Körpeşler", "Kültür", "Mergiç", "Musababa", "Nusrettin", "Orhangazi", "Ozanlar", "Saraclar", "Sancaklar", "Şerefiye", "Şıralık", "Tepecik", "Terzialiler", "Tokuşlar", "Uzunmustafa", "Yenimahalle", "Yeşiltepe"]
  }
];

// Complete Turkish Cadde / Sokak / Bulvar Patterns & Names
export const COMPREHENSIVE_STREET_DATABASE = [
  // Avenues (Caddeler)
  "Atatürk Caddesi",
  "Cumhuriyet Caddesi",
  "İnönü Caddesi",
  "Fatih Caddesi",
  "İstiklal Caddesi",
  "Gazi Mustafa Kemal Caddesi",
  "Mimar Sinan Caddesi",
  "Bağdat Caddesi",
  "Halaskargazi Caddesi",
  "Büyükdere Caddesi",
  "Nispetiye Caddesi",
  "Alemdağ Caddesi",
  "Barbaros Caddesi",
  "Sanayi Caddesi",
  "Turgut Özal Caddesi",
  "Adnan Menderes Caddesi",
  "Mevlana Caddesi",
  "Yunus Emre Caddesi",
  "Necip Fazıl Kısakürek Caddesi",
  "Mehmet Akif Ersoy Caddesi",
  "Kazım Karabekir Caddesi",
  "Fevzi Çakmak Caddesi",
  "Ziya Gökalp Caddesi",
  "Namık Kemal Caddesi",
  "Mithatpaşa Caddesi",
  "Ali Çetinkaya Caddesi",
  "Talatpaşa Caddesi",
  "Hürriyet Caddesi",
  "İstasyon Caddesi",
  "Hükümet Caddesi",
  "Hastane Caddesi",
  "Okul Caddesi",
  "Bankalar Caddesi",
  "Anafartalar Caddesi",
  "Kıbrıs Şehitleri Caddesi",
  "Gazi Bulvarı",
  "Vatan Caddesi",
  "Millet Caddesi",
  "Organize Sanayi Caddesi",
  "Liman Caddesi",
  "Sahil Yolu Caddesi",
  "Bağlar Caddesi",
  "Çarşı Caddesi",
  "Kordon Boyu Caddesi",
  
  // Boulevards (Bulvarlar)
  "Atatürk Bulvarı",
  "Cumhuriyet Bulvarı",
  "Fatih Sultan Mehmet Bulvarı",
  "Barbaros Hayrettin Paşa Bulvarı",
  "Gazi Mustafa Kemal Bulvarı",
  "Mevlana Bulvarı",
  "İsmet İnönü Bulvarı",
  "Turgut Özal Bulvarı",
  "Adnan Menderes Bulvarı",
  "Dumlupınar Bulvarı",
  "Eskişehir Yolu Bulvarı",
  "Konya Yolu Bulvarı",
  "İstanbul Caddesi",
  "Ankara Caddesi",
  "İzmir Bulvarı",
  "100. Yıl Bulvarı",
  "15 Temmuz Demokrasi Bulvarı",
  
  // Streets (Sokaklar)
  "1. Sokak", "2. Sokak", "3. Sokak", "4. Sokak", "5. Sokak", "6. Sokak", "7. Sokak", "8. Sokak", "9. Sokak", "10. Sokak",
  "101. Sokak", "102. Sokak", "103. Sokak", "104. Sokak", "105. Sokak", "106. Sokak", "107. Sokak", "108. Sokak",
  "Gül Sokak",
  "Karanfil Sokak",
  "Lale Sokak",
  "Papatya Sokak",
  "Menekşe Sokak",
  "Nergis Sokak",
  "Yasemin Sokak",
  "Zambak Sokak",
  "Çiçek Sokak",
  "Çam Sokak",
  "Çınar Sokak",
  "Kavak Sokak",
  "Meşe Sokak",
  "Selvi Sokak",
  "Zeytin Sokak",
  "Defne Sokak",
  "Güneş Sokak",
  "Yıldız Sokak",
  "Hilal Sokak",
  "Bahar Sokak",
  "Yaz Sokak",
  "Huzur Sokak",
  "Barış Sokak",
  "Kardeşlik Sokak",
  "Birlik Sokak",
  "Dostluk Sokak",
  "Sevgi Sokak",
  "Umut Sokak",
  "Zafer Sokak",
  "Gazi Sokak",
  "Şehitler Sokak",
  "Özgürlük Sokak",
  "Demokrasi Sokak",
  "Cami Sokak",
  "Okul Sokak",
  "Park Sokak",
  "Karakol Sokak",
  "Sağlık Sokak",
  "Postane Sokak",
  "Pazar Sokak",
  "Değirmen Sokak",
  "Kuyu Sokak",
  "Çeşme Sokak",
  "Köprü Sokak",
  "Yalı Sokak",
  "Tepe Sokak",
  "Yamaç Sokak",
  "Dere Sokak",
  "Koru Sokak",
  "Bağ Sokak",
  "Bahçe Sokak",
  "Fidan Sokak",
  "Yeşil Sokak",
  "Mavi Sokak",
  "Akasya Sokak",
  "Begonya Sokak",
  "Erguvan Sokak",
  "Ihlamur Sokak",
  "Sümbül Sokak",
  "Nilüfer Sokak",
  "Orkide Sokak",
  "Manolya Sokak",
  "Badem Sokak",
  "Kiraz Sokak",
  "Vişne Sokak",
  "Erik Sokak",
  "Elma Sokak",
  "Ceviz Sokak",
  "Fındık Sokak",
  "İncir Sokak",
  "Nar Sokak",
  "Dut Sokak",
  "Kestane Sokak",
  "Kayın Sokak",
  "Gürgen Sokak",
  "Ladin Sokak",
  "Köknar Sokak",
  "Sedir Sokak",
  "Ardıç Sokak",
  "Şahin Sokak",
  "Kartal Sokak",
  "Doğan Sokak",
  "Atmaca Sokak",
  "Turna Sokak",
  "Kuğu Sokak",
  "Martı Sokak",
  "Güvercin Sokak",
  "Kumru Sokak",
  "Bülbül Sokak",
  "Kanarya Sokak",
  "Keklik Sokak",
  "Sanayi Sitesi 1. Blok",
  "Sanayi Sitesi 2. Blok",
  "Sanayi Sitesi 3. Blok",
  "Organize Sanayi Bölgesi 1. Cadde",
  "Organize Sanayi Bölgesi 2. Cadde",
  "Organize Sanayi Bölgesi 3. Cadde",
  "Demirciler Sitesi",
  "Keresteciler Sitesi",
  "Oto Galericiler Sitesi",
  "Toptancılar Sitesi"
];
