# claudex

> Multi-account, multi-provider Claude Code CLI. **Bring your own keys.**

`claudex`, [Claude Code](https://www.anthropic.com/claude-code)'u tek terminalden birden fazla hesap ve birden fazla model sağlayıcısı (Anthropic, Z.ai, MiniMax, DeepSeek, Moonshot, OpenRouter…) ile kullanmanı sağlar. Tek komutla yeni bir `claudeX` alias'ı eklersin, kendi API key'ini girersin, alias hazır olur.

[English version below ↓](#english)

---

## 🇹🇷 Türkçe

### Neden?

Şu an Claude Code:
- Anthropic abonliğinin rate-limit'ine takılıyor
- DeepSeek / Z.ai / MiniMax gibi **çok daha ucuz veya ücretsiz** modelleri kullanmana izin veriyor (ANTHROPIC_BASE_URL override ile) ama her sağlayıcı için manuel alias yazman gerek
- Multi-account için her terminalde farklı `CLAUDE_CONFIG_DIR` set etmen gerek

`claudex` bu üç problemi tek araçta çözüyor.

### Hızlı kurulum

```bash
npm install -g claudex
claudex init
```

Veya GitHub'dan klonla:
```bash
git clone https://github.com/yourname/claudex.git
cd claudex
npm install && npm run build && npm link
claudex init
```

### Yeni alias ekle (interactive)

```bash
claudex add claude5
```

Sana şunları sorar:
1. **Sağlayıcı seç** (Z.ai, MiniMax, OpenRouter, DeepSeek, Moonshot, Anthropic)
2. **API key** — sağlayıcının site URL'i gösterilir, key'i alıp yapıştırırsın
3. **Ana model** ve **arka plan modeli**
4. **`~/.claude/` ile dosya paylaşımı** (agents, commands, skills, plugins paylaşılır)

Bittiğinde:
```bash
source ~/.zshrc
claude5
```

### Bundled sağlayıcılar (v0.1)

| ID | Tier | Neresi? | Default modeller |
|----|------|---------|------------------|
| `anthropic` | Resmi | Abonlik | (default) |
| `zai` | **ÜCRETSİZ (süresiz)** | [z.ai](https://z.ai) | GLM-4.7-Flash / GLM-4.5-Flash |
| `minimax` | **ÜCRETSİZ deneme** (Kasım 7 2026'a kadar) | [platform.minimax.io](https://platform.minimax.io) | MiniMax-M2.7 |
| `deepseek` | Ucuz ödemeli | [platform.deepseek.com](https://platform.deepseek.com) | deepseek-v4-pro / flash |
| `moonshot` | Ödemeli | [platform.moonshot.ai](https://platform.moonshot.ai) | Kimi K2.5 / K2.6 |
| `openrouter` | 32 ücretsiz model | [openrouter.ai](https://openrouter.ai) | qwen3-coder:free |

Hepsi **Anthropic-uyumlu** endpoint'lere sahip — proxy/router yok, doğrudan Claude Code env var'larıyla çalışır.

### Komutlar

```bash
claudex init                       # ilk kurulum (~/.claudex + shell rc block)
claudex add <isim> [-p <provider>] # yeni alias ekle (interactive)
claudex list                       # tüm profilleri listele
claudex remove <isim>              # alias'ı kaldır
claudex providers                  # mevcut sağlayıcıları gör
claudex providers info <id>        # bir sağlayıcı detayı (key URL + modeller)
claudex doctor                     # kurulumu kontrol et
claudex --lang en                  # İngilizce output
```

### Nasıl çalışıyor?

Claude Code 5 env değişkenine bakar:
- `CLAUDE_CONFIG_DIR` — sessions, history, kullanıcı state'i nereye yazılsın
- `ANTHROPIC_BASE_URL` — API endpoint
- `ANTHROPIC_AUTH_TOKEN` — endpoint'in key'i
- `ANTHROPIC_MODEL` — ana model
- `ANTHROPIC_SMALL_FAST_MODEL` — arka plan görevleri için

`claudex add` her profil için bir shell function üretir. Bu function `.env`'den key'i okur, env'leri set eder, `claude` binary'sini çağırır. Key argv'de görünmez, history'e düşmez.

### Dosya yapısı

```
~/.claudex/
├── config.json                 # tool config
├── profiles.json               # profil listesi
├── profiles/
│   └── <isim>/
│       ├── .env                # API key (mode 0600, kullanıcının kendi key'i)
│       └── (CLAUDE_CONFIG_DIR — symlink veya isolated)
├── generated/aliases.sh        # ~/.zshrc tarafından source edilir
└── backups/                    # her rc edit'inde otomatik backup
```

### Mevcut `~/.claude/` ile paylaşım

`--share` (default) ile yeni profil aşağıdaki dosyaları sembolik link ile ana `~/.claude/`'den alır — yani agents, commands, skills, plugins, projects, CLAUDE.md, settings.json, mcp.json hepsi senkron kalır. Sadece `.claude.json`, `history.jsonl`, sessions per-profile.

`--no-share` ile tamamen izole bir profil yaratırsın (sıfırdan başlangıç).

### Güvenlik

- Key'ler `~/.claudex/profiles/<isim>/.env` içinde **düz metin**, mode 0600
- `claudex` repo'ya hiçbir key commit edilmez (otomatik `.gitignore`)
- v0.2'de macOS Keychain entegrasyonu opt-in olarak gelecek
- Daha fazla detay → [docs/SECURITY.md](docs/SECURITY.md)

### Yeni sağlayıcı eklemek istersen

`src/templates/providers.json`'a JSON entry ekle, PR aç. Kod değiştirmen gerekmez. Detay → [CONTRIBUTING.md](CONTRIBUTING.md).

### Yasal uyarı

`claudex`, **bağımsız** bir açık-kaynak araçtır. Anthropic, Z.ai, MiniMax, DeepSeek, Moonshot, OpenRouter veya başka bir sağlayıcı tarafından desteklenmez veya onaylanmaz. Sadece Claude Code'un kendi env override mekaniklerini kullanır. Sağlayıcı kullanım koşullarına uymak senin sorumluluğun.

---

## English

### Why?

Claude Code today:
- Hits your Anthropic subscription rate limit
- Lets you point at **much cheaper or free** model providers (DeepSeek, Z.ai, MiniMax, OpenRouter…) via `ANTHROPIC_BASE_URL` override — but you have to write each alias by hand
- Needs a different `CLAUDE_CONFIG_DIR` per terminal for multi-account

`claudex` solves all three in one tool.

### Quick install

```bash
npm install -g claudex
claudex init
```

### Add a new alias (interactive)

```bash
claudex add claude5
```

Walks you through provider → key → models → done. Then:
```bash
source ~/.zshrc
claude5
```

### Bundled providers (v0.1)

| ID | Tier | Where to register | Default models |
|----|------|-------------------|----------------|
| `anthropic` | Official | Subscription | (default) |
| `zai` | **FREE FOREVER** | [z.ai](https://z.ai) | GLM-4.7-Flash / GLM-4.5-Flash |
| `minimax` | **FREE TRIAL** (until Nov 7 2026) | [platform.minimax.io](https://platform.minimax.io) | MiniMax-M2.7 |
| `deepseek` | Cheap-paid | [platform.deepseek.com](https://platform.deepseek.com) | deepseek-v4-pro / flash |
| `moonshot` | Paid | [platform.moonshot.ai](https://platform.moonshot.ai) | Kimi K2.5 / K2.6 |
| `openrouter` | 32 free models | [openrouter.ai](https://openrouter.ai) | qwen3-coder:free |

All have **Anthropic-compatible** endpoints — no proxy/router needed.

### Commands

```bash
claudex init                       # initial setup (~/.claudex + shell rc block)
claudex add <name> [-p <provider>] # add a new alias (interactive)
claudex list                       # list all profiles
claudex remove <name>              # remove an alias
claudex providers                  # browse available providers
claudex providers info <id>        # provider detail (key URL + models)
claudex doctor                     # diagnose setup
claudex --lang tr                  # Turkish output
```

### How it works

Claude Code respects 5 env vars: `CLAUDE_CONFIG_DIR`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL`, `ANTHROPIC_SMALL_FAST_MODEL`. `claudex add` generates a shell function per profile that loads the key from a mode-0600 `.env`, sets the env vars, and execs `claude`. The key never appears in argv or shell history.

### Disclaimer

`claudex` is an independent open-source tool. **Not affiliated with, endorsed by, or sponsored by Anthropic, Z.ai, MiniMax, DeepSeek, Moonshot, OpenRouter, or any other provider.** It uses only Claude Code's own env-override mechanics. Compliance with each provider's terms of service is your responsibility.

### License

[MIT](LICENSE)
