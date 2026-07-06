import { QuoteStatus } from "@prisma/client";

// Satış temsilcisinin WhatsApp'tan tek tıkla göndereceği hazır mesaj senaryoları.
export type WaScenario =
  | "unopened" // gönderildi, henüz açılmadı
  | "viewed" // açtı, karar yok
  | "revision" // revizyon istedi
  | "expiring" // geçerlilik süresi doluyor / doldu
  | "approved" // onayladı
  | "generic"; // link yok / diğer

export function scenarioForStatus(
  status: QuoteStatus,
  isExpiringSoon = false,
): WaScenario {
  switch (status) {
    case QuoteStatus.QUOTED:
      return isExpiringSoon ? "expiring" : "unopened";
    case QuoteStatus.VIEWED:
      return isExpiringSoon ? "expiring" : "viewed";
    case QuoteStatus.REVISION_REQUESTED:
      return "revision";
    case QuoteStatus.APPROVED:
      return "approved";
    case QuoteStatus.EXPIRED:
      return "expiring";
    default:
      return "generic";
  }
}

export type WaMessageInput = {
  scenario: WaScenario;
  greetName: string; // müşteri iletişim kişisi (yoksa firma adı)
  ref: string;
  link?: string | null; // mutlak /teklif/[token] linki
  validUntilLabel?: string | null;
};

const SIGN = "Moniva Ağır Vasıta & Treyler Yedek Parça";

export function buildWhatsAppMessage({
  scenario,
  greetName,
  ref,
  link,
  validUntilLabel,
}: WaMessageInput): string {
  const hi = `Merhaba ${greetName.trim() || "yetkili"},`;
  const seeLink = link ? `\n\nTeklifi görüntüleyin: ${link}` : "";

  switch (scenario) {
    case "unopened":
      return `${hi}\n\n${ref} numaralı fiyat teklifimizi hazırladık. İncelemeniz için aşağıdaki bağlantıyı iletiyoruz. Sorularınız olursa yardımcı olmaktan memnuniyet duyarız.${seeLink}\n\n${SIGN}`;
    case "viewed":
      return `${hi}\n\n${ref} numaralı teklifimizi incelediğinizi gördük. Aklınıza takılan bir konu ya da güncellemek istediğiniz bir nokta varsa çekinmeden yazın; birlikte netleştirelim.${seeLink}\n\n${SIGN}`;
    case "revision":
      return `${hi}\n\n${ref} numaralı teklif için revizyon talebinizi aldık. Güncellenmiş teklifi en kısa sürede hazırlayıp tarafınıza ileteceğiz. İlginiz için teşekkür ederiz.\n\n${SIGN}`;
    case "expiring":
      return `${hi}\n\n${ref} numaralı teklifimizin geçerlilik süresi${
        validUntilLabel ? ` ${validUntilLabel} tarihinde` : " yakında"
      } doluyor. Fiyatların geçerli olduğu bu süre içinde değerlendirmenizi rica ederiz. Dilerseniz süreyi uzatabiliriz.${seeLink}\n\n${SIGN}`;
    case "approved":
      return `${hi}\n\n${ref} numaralı teklifi onayladığınız için teşekkür ederiz. Sipariş sürecini başlatmak için sizinle iletişime geçiyoruz.\n\n${SIGN}`;
    default:
      return `${hi}\n\n${ref} numaralı teklifiniz hakkında sizinle iletişime geçmek istedik. Nasıl yardımcı olabiliriz?\n\n${SIGN}`;
  }
}

// Ham telefonu wa.me'nin beklediği uluslararası biçime çevirir (+/boşluk/tire yok).
// null → kullanılabilir telefon yok.
export function normalizePhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("5")) return `90${digits}`;
  return digits;
}

export function waHref(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
