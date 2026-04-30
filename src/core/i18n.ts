export type Lang = "tr" | "en";

const STRINGS = {
  tr: {
    "init.start": "claudex kuruluyor…",
    "init.created": "✓ Yaratıldı",
    "init.rcAdded": "✓ Shell rc'ye managed block eklendi",
    "init.rcExists": "✓ Shell rc'de managed block mevcut (atlandı)",
    "init.next": "Yeni terminal aç veya: source",
    "init.noClaude": "⚠ Claude Code bulunamadı. Önce yükle:\n   npm install -g @anthropic-ai/claude-code",
    "add.pickProvider": "Sağlayıcı seç:",
    "add.keyUrl": "Key almak için:",
    "add.keyPrompt": "API key (gizli):",
    "add.mainModel": "Ana model:",
    "add.smallModel": "Hızlı/arka plan modeli:",
    "add.share": "~/.claude/ ile dosya paylaşımı (agents, commands, plugins, skills)?",
    "add.success": "✓ Profil yazıldı:",
    "add.aliasGen": "✓ Alias oluşturuldu:",
    "add.rcUpdated": "✓ Shell rc güncellendi",
    "add.runIt": "▶ Yeni terminal aç veya bunu çalıştır:",
    "add.exists": "Bu isimde profil zaten var. Üzerine yazılsın mı?",
    "add.collision": "⚠ Bu isimde manuel alias zaten var. Başka isim seç.",
    "add.invalidName": "İsim sadece harf/rakam/tire/altçizgi içerebilir.",
    "list.empty": "Henüz profil yok. 'claudex add <isim>' ile başla.",
    "list.header": "Profiller:",
    "remove.confirm": "Profil silinsin mi?",
    "remove.keepData": "Profil verisi tutulsun mu (alias kalkar, dosyalar kalır)?",
    "remove.success": "✓ Silindi:",
    "remove.notFound": "Profil bulunamadı:",
    "providers.header": "Mevcut sağlayıcılar:",
    "providers.notFound": "Sağlayıcı bulunamadı:",
    "doctor.header": "claudex doctor",
    "doctor.claudeOk": "✓ Claude Code yüklü",
    "doctor.claudeMissing": "✗ Claude Code yüklü değil → npm install -g @anthropic-ai/claude-code",
    "doctor.rcOk": "✓ Shell rc'de claudex block var",
    "doctor.rcMissing": "✗ Shell rc'de claudex block yok → claudex init",
    "doctor.profileOk": "✓ Profil çalışır:",
    "doctor.trialWarn": "⚠ Trial bitiyor:",
    "common.yes": "evet",
    "common.no": "hayır",
    "common.cancelled": "İptal edildi.",
    "tier.free": "ÜCRETSİZ",
    "tier.trial": "DENEME",
    "tier.paid": "ÖDEMELİ",
  },
  en: {
    "init.start": "Setting up claudex…",
    "init.created": "✓ Created",
    "init.rcAdded": "✓ Added managed block to shell rc",
    "init.rcExists": "✓ Managed block already in shell rc (skipped)",
    "init.next": "Open a new terminal or: source",
    "init.noClaude": "⚠ Claude Code not found. Install first:\n   npm install -g @anthropic-ai/claude-code",
    "add.pickProvider": "Pick provider:",
    "add.keyUrl": "Get a key at:",
    "add.keyPrompt": "API key (hidden):",
    "add.mainModel": "Main model:",
    "add.smallModel": "Small/background model:",
    "add.share": "Share files with ~/.claude/ (agents, commands, plugins, skills)?",
    "add.success": "✓ Profile written:",
    "add.aliasGen": "✓ Alias generated:",
    "add.rcUpdated": "✓ Shell rc updated",
    "add.runIt": "▶ Open a new terminal or run:",
    "add.exists": "A profile with this name already exists. Overwrite?",
    "add.collision": "⚠ A manual alias with this name already exists. Pick another.",
    "add.invalidName": "Name may only contain letters, digits, dash, underscore.",
    "list.empty": "No profiles yet. Start with 'claudex add <name>'.",
    "list.header": "Profiles:",
    "remove.confirm": "Remove profile?",
    "remove.keepData": "Keep profile data (alias removed, files stay)?",
    "remove.success": "✓ Removed:",
    "remove.notFound": "Profile not found:",
    "providers.header": "Available providers:",
    "providers.notFound": "Provider not found:",
    "doctor.header": "claudex doctor",
    "doctor.claudeOk": "✓ Claude Code installed",
    "doctor.claudeMissing": "✗ Claude Code not installed → npm install -g @anthropic-ai/claude-code",
    "doctor.rcOk": "✓ claudex block in shell rc",
    "doctor.rcMissing": "✗ claudex block missing in shell rc → claudex init",
    "doctor.profileOk": "✓ Profile works:",
    "doctor.trialWarn": "⚠ Trial ending:",
    "common.yes": "yes",
    "common.no": "no",
    "common.cancelled": "Cancelled.",
    "tier.free": "FREE",
    "tier.trial": "TRIAL",
    "tier.paid": "PAID",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["en"];

let currentLang: Lang = "tr";

export function setLang(lang: Lang): void {
  currentLang = lang;
}

export function getLang(): Lang {
  return currentLang;
}

export function detectLang(): Lang {
  const env = (process.env.CLAUDEX_LANG ?? process.env.LANG ?? "").toLowerCase();
  if (env.startsWith("tr")) return "tr";
  if (env.startsWith("en")) return "en";
  return "tr";
}

export function t(key: StringKey, lang: Lang = currentLang): string {
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
}
