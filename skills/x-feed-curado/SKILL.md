---
name: x-feed-curado
description: Use when user says 'cura mi feed', 'filtra mi X', 'digest curado', 'curate feed', 'x-feed', or wants to filter and rank their X/Twitter digest from Readwise Reader into a curated summary of only the most interesting posts.
---

# X Feed Curado

Extrae el digest completo de tu lista de Twitter desde Readwise Reader, filtra los tweets mas relevantes via Claude, y sube el resumen curado de vuelta a Reader como articulo premium.

**Announce at start:** "Curando tu feed de X..."

## When to Use

- Usuario dice `/x-feed-curado`, "cura mi feed", "filtra X", "digest curado"
- Cuando quiere un resumen filtrado de su timeline de X
- Despues de que Readwise Reader haya generado un digest de la lista "Mi Feed Completo"

**When NOT to use:**
- No hay digest disponible en Reader (la lista aun no ha generado edicion)
- El usuario quiere ver TODOS los tweets sin filtrar

## Quick Reference

| Campo | Valor |
|-------|-------|
| Lista X | `Mi Feed Completo` (ID: `2040078195655909434`) |
| Feed source | Readwise Reader (categoria `rss`, location `feed`) |
| CLI | `readwise` en `/opt/homebrew/bin/readwise` |
| Output | Articulo HTML en Reader inbox, tags: `curado`, `x-feed`, `claude-code` |
| URL pattern | `https://claude-code.local/x-feed-curado/{YYYY-MM-DD}-{am\|pm}` |

## Pipeline

```
Fetch latest digest → Parse tweets → Claude filters & ranks → Build HTML → Upload to Reader
```

## Paso 1: Obtener el ultimo digest

Busca el digest mas reciente de la lista de Twitter en Reader:

```bash
readwise reader-list-documents --location feed --json 2>&1 | python3 -c "
import sys, json
data = json.load(sys.stdin)
digest = None
for doc in data['results']:
    if 'Mi Feed Completo' in doc.get('title', '') or 'feed completo' in doc.get('title', '').lower():
        digest = doc
        break
if digest:
    print(json.dumps({'id': digest['id'], 'title': digest['title']}))
else:
    print('NO_DIGEST_FOUND')
"
```

Si `NO_DIGEST_FOUND`: responde "No encuentro un digest reciente de tu lista de X. Verifica que Readwise Reader tenga el feed 'Mi Feed Completo' activo."

## Paso 2: Extraer contenido

```bash
readwise reader-get-document-details --document-id {DIGEST_ID} --json 2>&1 | python3 -c "
import sys, json
data = json.load(sys.stdin)
content = data.get('content', '')
with open('/tmp/digest_raw.md', 'w') as f:
    f.write(content)
import re
tweets = re.findall(r'Posted .+?\d{4}', content)
print(f'{len(tweets)} tweets, {len(content)} chars')
"
```

## Paso 3: Filtrar y rankear

Lee `/tmp/digest_raw.md` y analiza TODOS los tweets. Selecciona los **10-15 mas valiosos** usando estos criterios:

**Incluir (alto valor):**
- Noticias sustantivas, analisis con datos
- Desarrollos AI/tech con impacto real
- Opiniones fundamentadas con razonamiento
- Informacion unica no facilmente accesible
- Hilos largos con profundidad

**Excluir (bajo valor):**
- Contenido promocional, spam
- Posts de solo imagen sin contexto
- Reacciones genericas, memes
- Retweets de bajo esfuerzo
- Guias de videojuegos rutinarias, polls

Para cada tweet seleccionado, genera:
- **Score** (6-10)
- **@username**
- **Topic** (una linea)
- **Why interesting** (una frase)
- **Quote** (2-3 lineas max)
- **Link al tweet**

Al final, escribe un **TL;DR del dia** en 3 lineas resumiendo los temas principales.

Guarda en `/tmp/digest_curated.md`.

## Paso 4: Generar HTML premium

Convierte el digest curado a HTML con estilos inline (Reader no carga CSS externo).

### Estructura del HTML

```
Header con titulo y stats (N tweets → M seleccionados)
TL;DR del dia
Seccion 9/10 - Top picks (fondo ambar)
Seccion 8/10 - Muy relevantes (fondo verde)
Seccion 7/10 - Interesantes (fondo azul)
Seccion 6/10 - Notables (fondo gris)
Footer con fecha y stats
```

### Estilos por score

| Score | Color borde | Background | Label |
|-------|-------------|------------|-------|
| 9-10 | `#f59e0b` | `#fffbeb` | Top picks del dia |
| 8 | `#22c55e` | `#f0fdf4` | Muy relevantes |
| 7 | `#3b82f6` | `#eff6ff` | Interesantes |
| 6 | `#9ca3af` | `#f9fafb` | Notables |

### Cada tweet

```html
<h3 style="font-size: 16px; font-weight: 600; margin: 24px 0 8px; color: #333;">
  @username — Titulo del topic
</h3>
<p style="margin: 8px 0; font-size: 13px; color: #6b7280;">Why interesting</p>
<blockquote style="border-left: 3px solid #d1d5db; padding-left: 16px; color: #6b7280; margin: 16px 0; font-style: italic;">
  "Quote del tweet"
</blockquote>
<p style="margin: 8px 0;">
  <a href="{tweet_url}" style="color: #2563eb; text-decoration: none; font-size: 13px;">Ver tweet →</a>
</p>
```

Guarda HTML completo en `/tmp/digest_html.html`.

## Paso 5: Subir a Readwise Reader

Determina si es edicion AM o PM segun la hora actual (antes de 14:00 = AM, despues = PM).

```bash
EDITION=$(python3 -c "from datetime import datetime; print('AM' if datetime.now().hour < 14 else 'PM')")
TODAY=$(date +%Y-%m-%d)
TITLE="X Feed Curado — $(date +'%-d %b %Y') $EDITION"

readwise reader-create-document \
  --url "https://claude-code.local/x-feed-curado/${TODAY}-$(echo $EDITION | tr '[:upper:]' '[:lower:]')" \
  --title "$TITLE" \
  --author "Claude Code" \
  --category "article" \
  --tags "curado,x-feed,claude-code" \
  --summary "$(head -5 /tmp/digest_curated.md | tail -1)" \
  --html "$(cat /tmp/digest_html.html)" \
  --published-date "$TODAY" \
  2>&1
```

## Paso 6: Output al usuario

```
Subido a Readwise Reader:
  Titulo: {titulo}
  Stats: {N} tweets → {M} seleccionados · {T} min lectura
  Tags: curado, x-feed, claude-code
  → {reader_url}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Token OAuth expirado | La CLI hace refresh automatico. Usar siempre `readwise` CLI, no curl directo |
| No hay digest disponible | Reader genera 2/dia. Si no hay, esperar o verificar feed en Manage feeds |
| HTML con CSS externo | Reader ignora `<style>` tags. Todo debe ser inline |
| Subir digest duplicado | Usar URL unica con fecha+edicion para evitar colisiones |
| Filtrar demasiado agresivo | Mantener 10-15 tweets. Menos de 8 pierde valor, mas de 20 pierde el punto |
