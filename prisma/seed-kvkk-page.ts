import { prisma } from "../src/lib/prisma";

const TITLE = "KVKK Aydınlatma Metni";

// Paragraflar \n\n ile ayrılır (public sayfa böyle bölüyor).
// [köşeli parantezli] alanlar firma tarafından doldurulmalıdır.
const BODY = [
  '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, veri sorumlusu sıfatıyla Moniva Otomotiv ve Gıda San. Tic. A.Ş. ("Moniva", "Şirket") olarak kişisel verilerinizin işlenmesine ilişkin sizi bilgilendirmek isteriz.',
  "1. Veri Sorumlusu\nKişisel verileriniz, veri sorumlusu sıfatıyla Moniva Otomotiv ve Gıda San. Tic. A.Ş. tarafından aşağıda açıklanan kapsamda işlenmektedir. Adres: [şirket adresi] · E-posta: [iletişim e-postası] · Telefon: [telefon].",
  "2. İşlenen Kişisel Veriler\nB2B üyelik ve teklif süreçleri kapsamında; kimlik bilgileri (ad, soyad), iletişim bilgileri (e-posta, telefon, adres), firma bilgileri (firma adı, vergi kimlik numarası, ülke, il) ve işlem güvenliği bilgileri işlenebilmektedir.",
  "3. Kişisel Verilerin İşlenme Amaçları\nKişisel verileriniz; üyelik kaydının oluşturulması, B2B hesabının doğrulanması, teklif taleplerinin yönetilmesi, ürün ve hizmetlerin sunulması, müşteri ilişkileri ve iletişim faaliyetlerinin yürütülmesi ile yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenmektedir.",
  "4. Kişisel Verilerin Aktarılması\nKişisel verileriniz, yukarıdaki amaçların gerçekleştirilmesiyle sınırlı olarak; yetkili kamu kurum ve kuruluşlarına, iş ortaklarımıza ve hizmet aldığımız tedarikçilere, KVKK'nın 8. ve 9. maddelerinde belirtilen şartlara uygun olarak aktarılabilir.",
  ' 5. Toplama Yöntemi ve Hukuki Sebep\nKişisel verileriniz; web sitesi üzerinden elektronik ortamda, üyelik ve teklif formları aracılığıyla, KVKK\'nın 5. maddesinde belirtilen "sözleşmenin kurulması veya ifası", "hukuki yükümlülük" ve "meşru menfaat" hukuki sebeplerine dayanılarak toplanmaktadır.'.trim(),
  "6. İlgili Kişinin Hakları\nKVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını öğrenme, eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme, silinmesini veya yok edilmesini isteme ve Kanun'da sayılan diğer haklarınızı kullanma hakkına sahipsiniz.",
  "7. Başvuru\nHaklarınıza ilişkin taleplerinizi [iletişim e-postası] adresine iletebilirsiniz. Başvurularınız, KVKK kapsamında en geç 30 gün içinde sonuçlandırılacaktır.",
  "Bu aydınlatma metni gerektiğinde güncellenebilir. Güncel metne her zaman bu sayfadan ulaşabilirsiniz.",
].join("\n\n");

async function main() {
  const page = await prisma.page.upsert({
    where: { slug: "kvkk" },
    update: { status: "PUBLISHED", showInFooter: true },
    create: { slug: "kvkk", status: "PUBLISHED", showInFooter: true, order: 0 },
  });

  await prisma.pageTranslation.upsert({
    where: { pageId_locale: { pageId: page.id, locale: "TR" } },
    update: { title: TITLE, body: BODY },
    create: { pageId: page.id, locale: "TR", title: TITLE, body: BODY },
  });

  console.log(`OK — /sayfa/kvkk hazır (pageId=${page.id}, status=PUBLISHED, footer=on)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
