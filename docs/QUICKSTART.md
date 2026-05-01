# Quickstart

3 dakikada Claude Code'u **ücretsiz** bir model üzerinden çalıştır.

## 1. Önkoşullar

```bash
node --version    # 20+
claude --version  # Claude Code yüklü mü
```

Eksikse:
```bash
# Node.js 20+: https://nodejs.org/
npm install -g @anthropic-ai/claude-code
```

## 2. claudex'i kur

```bash
git clone https://github.com/Mattai1/claudex.git
cd claudex
npm install && npm run build && npm link
claudex --version    # 0.2.0
```

## 3. İlk profil — kılavuzlu

```bash
claudex init        # ~/.claudex + shell rc block
claudex quickstart  # 3 ücretsiz sağlayıcı için interactive setup
```

`quickstart` sırayla şunları gezer:
1. **Z.ai (ÜCRETSİZ FOREVER)** — https://z.ai → kayıt → API Keys → key kopyala → yapıştır
2. **MiniMax (ÜCRETSİZ TRIAL → Kasım 7 2026)** — https://platform.minimax.io → User Center → API Keys
3. **OpenRouter (32 ücretsiz model)** — https://openrouter.ai → Settings → Keys

Hangisini kuracağına karar verirken `claudex recommend` komutunu çalıştırıp "ne yapmak istediğine göre" öneri al.

## 4. Kullan

```bash
source ~/.zshrc
claude-zai          # Z.ai GLM-4.7-Flash
claude-minimax      # MiniMax M2.7 (Opus 4.6 seviyesi)
claude-or           # OpenRouter Qwen3-Coder
```

## 5. Sağlık kontrolü

```bash
claudex doctor       # her şey yerinde mi?
claudex validate claude-zai   # key + model çalışıyor mu?
```

## 6. Daha sonra eklemek istersen

```bash
# Belirli bir use-case için en iyi model:
claudex recommend long-context

# Tek satır:
claudex add claude-fast --provider zai

# Manuel kontrol:
claudex add custom --provider openrouter --main-model qwen/qwen3-coder:free
```

## 7. Ekiple paylaşmak

```bash
# Profili template'e dök:
claudex export claude-zai -o my-stack.json
# (içinde key YOK, sadece provider/model/share ayarları)

# Ekibinden biri:
claudex import my-stack.json   # kendi key'ini girer, profil hazır
```

## Sorun giderme

| Problem | Çözüm |
|---|---|
| `claudex: command not found` | `npm link` yapmadın → `cd claudex && npm link` |
| `Claude Code yüklü değil` | `npm install -g @anthropic-ai/claude-code` |
| `claude5: command not found` | `source ~/.zshrc` (veya yeni terminal) |
| `validate ✗ 401` | Key bozuk → `claudex add claude-zai` ile yeniden gir |
| `validate ✗ 404` | Yanlış model id → `claudex providers info zai` ile geçerli liste |

Daha fazla detay → [README](../README.md), [PROVIDERS](PROVIDERS.md), [SECURITY](SECURITY.md).
