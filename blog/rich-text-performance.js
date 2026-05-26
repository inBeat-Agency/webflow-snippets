/**
 * Rich Text Performance — inBeat Agency
 * ============================================================================
 * Optimizaciones de performance para contenido CMS Rich Text de Webflow.
 *
 * APLICA A: Templates CMS que tengan campo Rich Text (.w-richtext)
 *   - Blog Post Template
 *   - Author Template
 *   - Cualquier otro CMS Collection con rich text editorial
 *
 * COMO CARGARLO EN WEBFLOW:
 *   Designer → [Template Page] → Settings → Custom Code → Before </body> tag:
 *
 *     <script src="https://cdn.jsdelivr.net/gh/inBeat-Agency/webflow-snippets@v1.0.0/blog/rich-text-performance.js" defer></script>
 *
 *   (Reemplazar @v1.0.0 con la version actual del repo)
 *
 * QUE HACE:
 *   1. Lazy load + decoding async en imagenes del rich text
 *   2. fetchpriority="low" en imagenes below-the-fold (mejora LCP)
 *   3. Setea style.aspectRatio desde naturalWidth/naturalHeight (mitiga unsized-images sin pisar el sizing de Webflow)
 *   4. Facade para YouTube (placeholder + iframe on-click)
 *   5. Facade para Vimeo, Loom, Frame.io, LinkedIn, Wistia, Spotify
 *   6. Facade para TikTok (intercepta blockquote antes de que embed.js corra)
 *   7. Facade para Instagram (intercepta blockquote + bloquea embed.js)
 *
 * IMPORTANTE - PRECONDICIONES:
 *   Si tenes Embeds con scripts globales de TikTok o Instagram en el template
 *   (<script async src="https://www.tiktok.com/embed.js">), REMOVELOS antes de
 *   activar este script. El facade los reemplaza. Si embed.js corre primero,
 *   este script no puede deshacer el daño.
 *
 * COMO VERIFICAR DESPUES DE PUBLICAR:
 *   1. DevTools Console: no debe haber errores
 *   2. Embeds de YouTube/Vimeo/TikTok/Instagram aparecen como placeholder hasta click
 *   3. npm run analyze -- <url> deberia mostrar mejor score y LCP
 * ============================================================================
 */

(function () {
  'use strict';

  // ===========================================================================
  // 1. IMAGENES DEL RICH TEXT
  // ===========================================================================
  // Aplicamos varias optimizaciones a cada <img> dentro de .w-richtext:
  //   - loading=lazy: el browser pospone descarga hasta que se acerque al viewport
  //   - decoding=async: el browser decodifica off-main-thread, no bloquea render
  //   - fetchpriority=low EN imagenes below-the-fold: desprioriza el download
  //     para que el browser priorice el LCP element
  //   - style.aspectRatio desde naturalWidth/naturalHeight: reserva espacio post-load
  //     sin pisar el width:100% / height:auto que Webflow le da al .w-richtext img
  //
  // Caveat honesto: setear aspect-ratio POST-LOAD no resuelve CLS inicial
  // (el espacio ya se computo mal antes). Solo ayuda a evitar CLS en navegacion
  // interna donde el browser cachea las dimensiones aprendidas.
  //
  // Historia (v1.0.0): originalmente seteabamos los atributos HTML width/height
  // con las dimensiones naturales. Eso rompia el sizing en blog posts donde el
  // HTML inicial traia width="100%" como atributo: el script no podia setear
  // width (ya estaba), pero si seteaba height=<naturalHeight> en px, y el browser
  // interpretaba height como px fijos -> imagenes estiradas vertical. Fixed en
  // v1.0.1 usando style.aspectRatio.
  // ===========================================================================
  function optimizeRichTextImages() {
    var images = document.querySelectorAll('.w-richtext img');
    var viewportHeight = window.innerHeight;

    images.forEach(function (img, index) {
      // Loading + decoding
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');

      // fetchpriority="low" para imagenes below-the-fold
      // (las primeras ~2 imagenes podrian ser above-the-fold del rich text)
      var rect = img.getBoundingClientRect();
      var topAbsolute = rect.top + window.scrollY;
      if (topAbsolute > viewportHeight * 1.5) {
        img.setAttribute('fetchpriority', 'low');
      }

      // Reservar espacio via CSS aspect-ratio (no via atributos width/height).
      // Usar atributos pisaba el sizing de Webflow (.w-richtext img tiene
      // width:100%; height:auto) cuando el HTML traia width="100%" como
      // atributo: el script seteaba height="<naturalHeight>" como px fijos
      // y la imagen quedaba estirada vertical. Con aspect-ratio en style,
      // reservamos espacio para CLS sin tocar el flujo de sizing del CSS.
      if (img.complete && img.naturalWidth > 0) {
        applyNaturalDimensions(img);
      } else {
        img.addEventListener('load', function () {
          applyNaturalDimensions(img);
        }, { once: true });
      }
    });
  }

  function applyNaturalDimensions(img) {
    if (
      img.naturalWidth > 0 &&
      img.naturalHeight > 0 &&
      !img.style.aspectRatio
    ) {
      img.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
    }
  }

  // ===========================================================================
  // 2. YOUTUBE FACADE
  // ===========================================================================
  // YouTube embed pesa ~500KB de JS para la UI del player + thumbnails + ads.
  // Reemplazamos el iframe con un placeholder de imagen y boton de play.
  // El iframe real se carga unicamente cuando el usuario hace click.
  // ===========================================================================
  function getYouTubeId(src) {
    var match = src.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  var youtubeFallbacks = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'];

  function setYoutubeThumbnail(img, id, index) {
    if (index >= youtubeFallbacks.length) return;
    img.src = 'https://img.youtube.com/vi/' + id + '/' + youtubeFallbacks[index] + '.jpg';
    img.onerror = function () {
      setYoutubeThumbnail(img, id, index + 1);
    };
    img.onload = function () {
      // El placeholder generico de YouTube es 120x90 — si lo recibimos, saltar al siguiente
      if (img.naturalWidth === 120 && img.naturalHeight === 90) {
        setYoutubeThumbnail(img, id, index + 1);
      }
    };
  }

  function applyYoutubeFacades() {
    var iframes = document.querySelectorAll('.w-richtext iframe[src*="youtube"]');
    iframes.forEach(function (iframe) {
      var id = getYouTubeId(iframe.src);
      if (!id) return;

      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:relative;cursor:pointer;background:#1a1a1a;aspect-ratio:16/9;width:100%;overflow:hidden;';

      var thumb = document.createElement('img');
      thumb.alt = 'Video thumbnail';
      thumb.setAttribute('loading', 'lazy');
      thumb.setAttribute('decoding', 'async');
      thumb.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:center;position:absolute;top:0;left:0;';
      setYoutubeThumbnail(thumb, id, 0);

      var playBtn = document.createElement('div');
      playBtn.innerHTML = '&#9654;';
      playBtn.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,0,0,0.85);color:#fff;font-size:24px;width:64px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:8px;pointer-events:none;z-index:1;';

      wrapper.appendChild(thumb);
      wrapper.appendChild(playBtn);

      wrapper.addEventListener('click', function () {
        var realIframe = document.createElement('iframe');
        realIframe.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
        realIframe.setAttribute('frameborder', '0');
        realIframe.setAttribute('allow', 'autoplay; encrypted-media');
        realIframe.setAttribute('allowfullscreen', '');
        realIframe.style.cssText = 'width:100%;height:100%;aspect-ratio:16/9;';
        wrapper.replaceWith(realIframe);
      });

      iframe.replaceWith(wrapper);
    });
  }

  // ===========================================================================
  // 3. OTROS IFRAMES (Vimeo, LinkedIn, Loom, Frame.io, Wistia, Spotify)
  // ===========================================================================
  // Estrategia comun:
  //   - Detectar provider por hostname
  //   - Vimeo: thumbnail real via oEmbed (API publica)
  //   - Resto: placeholder con titulo del iframe o nombre del provider
  //   - Preservar TODOS los atributos del iframe original al activar
  // ===========================================================================
  function getProviderInfo(src) {
    try {
      var url = new URL(src);
      var host = url.hostname.replace(/^www\./, '');
      // Vimeo: ratio NO fijo. Se deriva del oEmbed response (width/height del video real).
      // Esto cubre videos verticales (Reels-style 9:16), cuadrados, etc. Sin esto, videos
      // verticales se aplastan en una caja 16/9 con object-fit: cover destruyendo el encuadre.
      if (host.indexOf('vimeo.com') >= 0) return { name: 'Vimeo', ratio: null, supportsThumb: true };
      if (host.indexOf('linkedin.com') >= 0) return { name: 'LinkedIn', ratio: null, supportsThumb: false };
      if (host.indexOf('loom.com') >= 0) return { name: 'Loom', ratio: '16/9', supportsThumb: false };
      if (host.indexOf('frame.io') >= 0) return { name: 'Frame.io', ratio: '16/9', supportsThumb: false };
      if (host.indexOf('wistia.') >= 0 || host.indexOf('wistia.net') >= 0) return { name: 'Wistia', ratio: '16/9', supportsThumb: false };
      if (host.indexOf('spotify.com') >= 0) return { name: 'Spotify', ratio: null, supportsThumb: false };
      // Google Drive / Docs / Slides — los embeds suelen venir con `width="100%"` que
      // rompe el calculo de ratio (parseInt("100%") -> 100). Fijar 16/9 como default
      // razonable; para PDFs verticales el usuario puede pegar el iframe con width/height
      // numericos explicitos si necesita un ratio distinto.
      if (host.indexOf('drive.google.com') >= 0) return { name: 'Google Drive', ratio: '16/9', supportsThumb: false };
      if (host.indexOf('docs.google.com') >= 0) return { name: 'Google Docs', ratio: '16/9', supportsThumb: false };
      return { name: 'Embed', ratio: null, supportsThumb: false };
    } catch (e) {
      return { name: 'Embed', ratio: null, supportsThumb: false };
    }
  }

  function fetchVimeoMetadata(src, callback) {
    // Pedir oEmbed con `width=1280` para que el thumbnail venga en HD. Sin esto
    // Vimeo devuelve la version mas chica (~200x150) que renderizada a 700+px se
    // pixela y el `object-fit: cover` destruye el encuadre cuando el ratio del
    // thumbnail no coincide con el del wrapper.
    //
    // Tambien devolvemos width/height del video real (response.width/.height) para
    // que el wrapper use el ratio correcto. Caso comun: Reels-style verticales
    // (ej: 240x426, 9:16) que con el viejo wrapper 16/9 + object-fit:cover quedaban
    // recortados y aplastados.
    //
    // Callback recibe { thumbUrl, ratio } o null si fallo el fetch. Ratio es string
    // tipo "16/9" o "9/16" listo para CSS, derivado del response. Si el video es
    // privado/unlisted, oEmbed funciona si el caller pasa la URL completa con `?h=`.
    var oembedUrl = 'https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(src) + '&width=1280';
    fetch(oembedUrl)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) { callback(null); return; }
        var ratio = null;
        if (data.width > 0 && data.height > 0) {
          ratio = data.width + '/' + data.height;
        }
        callback({ thumbUrl: data.thumbnail_url || null, ratio: ratio });
      })
      .catch(function () { callback(null); });
  }

  function applyOtherIframeFacades() {
    var iframes = document.querySelectorAll('.w-richtext iframe:not([src*="youtube"])');
    iframes.forEach(function (iframe) {
      var src = iframe.src;
      if (!src) return;

      var provider = getProviderInfo(src);

      // Resolver aspect-ratio del wrapper:
      //   1. Provider con ratio fijo (Loom, Google Drive, etc): usarlo directo.
      //   2. Provider con ratio dinamico (Vimeo): empezar con 16/9 placeholder y dejar
      //      que fetchVimeoMetadata lo corrija cuando llegue el oEmbed. Hay un mini-CLS
      //      potencial al cambiar (~200ms) pero el fondo negro hace el ajuste discreto.
      //   3. Sin info de provider: derivar de width/height del iframe original SOLO si son
      //      numericos puros (sin "%", "em", etc). parseInt("100%") devuelve 100, lo que
      //      producia ratios destruyendo el layout (ver v1.0.2 fix).
      //   4. Fallback final: 16/9 (mas seguro que romper el layout con un ratio invalido).
      var wrapperRatio = provider.ratio;
      if (!wrapperRatio) {
        // Para Vimeo el ratio real llega async via oEmbed. Usar 16/9 temporal.
        if (provider.name === 'Vimeo') {
          wrapperRatio = '16/9';
        } else {
          var wAttr = iframe.getAttribute('width');
          var hAttr = iframe.getAttribute('height');
          var w = /^\d+$/.test(wAttr || '') ? parseInt(wAttr, 10) : NaN;
          var h = /^\d+$/.test(hAttr || '') ? parseInt(hAttr, 10) : NaN;
          if (w > 0 && h > 0) wrapperRatio = w + '/' + h;
          else wrapperRatio = '16/9';
        }
      }

      // Preservar TODOS los atributos del iframe original
      var preservedAttrs = {};
      for (var i = 0; i < iframe.attributes.length; i++) {
        var attr = iframe.attributes[i];
        preservedAttrs[attr.name] = attr.value;
      }

      var wrapper = document.createElement('div');
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('tabindex', '0');
      wrapper.setAttribute('aria-label', 'Play ' + provider.name + ' embed');
      wrapper.style.cssText = [
        'position:relative',
        'cursor:pointer',
        'background:#1a1a1a',
        'aspect-ratio:' + wrapperRatio,
        'width:100%',
        'overflow:hidden',
        'display:flex',
        'align-items:center',
        'justify-content:center'
      ].join(';');

      // Thumbnail + ratio dinamico solo Vimeo (oEmbed publico).
      // fetchVimeoMetadata pide thumbnail HD (width=1280) y devuelve tambien el ratio
      // real del video, para que el wrapper se ajuste si es vertical/cuadrado.
      var thumb = null;
      if (provider.supportsThumb) {
        thumb = document.createElement('img');
        thumb.alt = provider.name + ' thumbnail';
        thumb.setAttribute('loading', 'lazy');
        thumb.setAttribute('decoding', 'async');
        // object-fit: contain en vez de cover. Con el ratio del wrapper igual al ratio
        // del video, ambos dan el mismo resultado. Mientras llega el oEmbed con el ratio
        // real (skeleton 16/9), contain evita recortar agresivamente videos verticales.
        thumb.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;';
        wrapper.appendChild(thumb);
        fetchVimeoMetadata(src, function (meta) {
          if (!meta) return;
          if (meta.thumbUrl) thumb.src = meta.thumbUrl;
          if (meta.ratio) {
            // Ajustar el wrapper al ratio real del video. Si era vertical (9:16) la altura
            // sube respecto al placeholder 16/9 inicial. Es un CLS pequeno aceptado para
            // resolver el problema mayor de aplastamiento.
            wrapper.style.aspectRatio = meta.ratio;

            // Caso especial verticales (h > w): width:100% en un container de 700px daria
            // un wrapper de ~1250px de alto, mas alto que el viewport. Limitar la altura
            // a 60vh y dejar que el width se ajuste para mantener el ratio, centrado
            // horizontalmente. Para horizontales/cuadrados el wrapper queda como estaba
            // (width:100%, sin maxHeight).
            //
            // 60vh elegido despues de probar 80vh (todavia se sentia "demasiado grande"
            // segun feedback del usuario en marketing-agency-metrics-guide). 60vh deja al
            // lector ver mas contexto del blog post arriba y abajo del video, manteniendo
            // el video lo bastante grande para identificar contenido a primera vista.
            var parts = meta.ratio.split('/');
            var vw = parseInt(parts[0], 10);
            var vh = parseInt(parts[1], 10);
            if (vh > vw) {
              wrapper.style.maxHeight = '60vh';
              wrapper.style.width = 'auto';
              wrapper.style.margin = '0 auto';
            }
          }
        });
      }

      // Overlay con icono play + label
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:8px;color:#fff;text-align:center;padding:16px;';

      var playIcon = document.createElement('div');
      playIcon.innerHTML = '&#9654;';
      playIcon.setAttribute('aria-hidden', 'true');
      playIcon.style.cssText = 'font-size:42px;background:rgba(0,0,0,0.5);width:72px;height:50px;border-radius:8px;display:flex;align-items:center;justify-content:center;text-shadow:0 1px 4px rgba(0,0,0,0.6);';

      var label = document.createElement('div');
      var titleAttr = iframe.getAttribute('title');
      label.textContent = titleAttr ? titleAttr : ('Play ' + provider.name);
      label.style.cssText = 'font-size:14px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,0.6);max-width:280px;';

      overlay.appendChild(playIcon);
      overlay.appendChild(label);
      wrapper.appendChild(overlay);

      function activateEmbed() {
        var realIframe = document.createElement('iframe');
        for (var attrName in preservedAttrs) {
          if (preservedAttrs.hasOwnProperty(attrName)) {
            realIframe.setAttribute(attrName, preservedAttrs[attrName]);
          }
        }
        // Forzar autoplay para Vimeo
        if (provider.name === 'Vimeo' && realIframe.src.indexOf('autoplay=') === -1) {
          realIframe.src += (realIframe.src.indexOf('?') >= 0 ? '&' : '?') + 'autoplay=1';
        }
        realIframe.style.display = 'block';
        realIframe.style.maxWidth = '100%';
        wrapper.replaceWith(realIframe);
      }

      wrapper.addEventListener('click', activateEmbed);
      wrapper.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateEmbed();
        }
      });

      iframe.replaceWith(wrapper);
    });
  }

  // ===========================================================================
  // 4. TIKTOK FACADE
  // ===========================================================================
  // TikTok usa <blockquote class="tiktok-embed"> + script externo embed.js
  // (~618 KiB + ~890ms scripting). Interceptamos el blockquote antes que
  // embed.js lo procese y reemplazamos por un facade ligero.
  //
  // PRECONDICION: el <script async src="https://www.tiktok.com/embed.js">
  // debe estar removido del template (sino el script descarga 618KB inutilmente).
  // ===========================================================================
  function applyTikTokFacades() {
    var blockquotes = document.querySelectorAll('.w-richtext blockquote.tiktok-embed');
    blockquotes.forEach(function (blockquote) {
      var videoId = blockquote.getAttribute('data-video-id');
      var cite = blockquote.getAttribute('cite') || '';
      if (!videoId) return;

      var userMatch = cite.match(/@([^\/]+)\//);
      var username = userMatch ? '@' + userMatch[1] : '@tiktok';

      var rawText = (blockquote.textContent || '').trim();
      var description = rawText.slice(0, 180);
      if (rawText.length > 180) description += '…';

      var wrapper = document.createElement('div');
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('tabindex', '0');
      wrapper.setAttribute('aria-label', 'Play TikTok video by ' + username);
      wrapper.style.cssText = [
        'position:relative',
        'cursor:pointer',
        'background:linear-gradient(135deg,#000 0%,#25F4EE 50%,#FE2C55 100%)',
        'aspect-ratio:9/16',
        'max-width:325px',
        'width:100%',
        'margin:1rem auto',
        'border-radius:8px',
        'overflow:hidden',
        'display:flex',
        'flex-direction:column',
        'justify-content:flex-end',
        'padding:16px',
        'box-sizing:border-box',
        'color:#fff',
        'font-family:-apple-system,system-ui,sans-serif'
      ].join(';');

      var icon = document.createElement('div');
      icon.innerHTML = '&#9654;';
      icon.setAttribute('aria-hidden', 'true');
      icon.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;opacity:0.95;pointer-events:none;text-shadow:0 2px 8px rgba(0,0,0,0.4);';

      var userLabel = document.createElement('div');
      userLabel.textContent = username;
      userLabel.style.cssText = 'font-weight:700;font-size:16px;margin-bottom:8px;text-shadow:0 1px 4px rgba(0,0,0,0.6);';

      var desc = document.createElement('div');
      desc.textContent = description;
      desc.style.cssText = 'font-size:13px;line-height:1.4;text-shadow:0 1px 4px rgba(0,0,0,0.6);max-height:60px;overflow:hidden;';

      var cta = document.createElement('div');
      cta.textContent = '▶ Play TikTok video';
      cta.style.cssText = 'margin-top:12px;font-size:13px;font-weight:600;background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:8px 12px;border-radius:6px;text-align:center;';

      wrapper.appendChild(icon);
      wrapper.appendChild(userLabel);
      wrapper.appendChild(desc);
      wrapper.appendChild(cta);

      function activateEmbed() {
        var realIframe = document.createElement('iframe');
        realIframe.src = 'https://www.tiktok.com/embed/v2/' + videoId;
        realIframe.setAttribute('frameborder', '0');
        realIframe.setAttribute('allow', 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        realIframe.setAttribute('allowfullscreen', '');
        realIframe.setAttribute('title', 'TikTok video by ' + username);
        realIframe.style.cssText = 'width:100%;max-width:325px;aspect-ratio:9/16;border:none;display:block;margin:1rem auto;';
        wrapper.replaceWith(realIframe);
      }

      wrapper.addEventListener('click', activateEmbed);
      wrapper.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateEmbed();
        }
      });

      blockquote.replaceWith(wrapper);
    });
  }

  // ===========================================================================
  // 5. INSTAGRAM FACADE
  // ===========================================================================
  // Instagram usa blockquote.instagram-media + script embed.js (~33 KiB)
  // que escanea el DOM y reemplaza el blockquote por iframe pesado.
  // Tambien causa CLS porque el iframe final tiene altura distinta al blockquote.
  //
  // 1. Removemos el script de embed.js si esta presente
  // 2. Neutralizamos window.instgrm.Embeds.process() si embed.js ya cargo
  // 3. Reemplazamos cada blockquote con facade ligero
  // ===========================================================================
  function applyInstagramFacades() {
    // Bloquear embed.js si todavia no se descargo
    var instagramScripts = document.querySelectorAll('script[src*="instagram.com/embed.js"]');
    instagramScripts.forEach(function (s) {
      s.remove();
    });
    // Neutralizar si ya esta cargado
    if (window.instgrm && window.instgrm.Embeds) {
      window.instgrm.Embeds.process = function () { /* no-op */ };
    }

    var blockquotes = document.querySelectorAll('blockquote.instagram-media, blockquote.instagram-media-registered');
    blockquotes.forEach(function (blockquote) {
      var permalink = blockquote.getAttribute('data-instgrm-permalink');
      if (!permalink) return;

      var idMatch = permalink.match(/\/p\/([^\/?]+)/) || permalink.match(/\/reel\/([^\/?]+)/);
      if (!idMatch) return;
      var postId = idMatch[1];
      var isReel = permalink.indexOf('/reel/') >= 0;

      var userMatch = permalink.match(/instagram\.com\/([^\/]+)\/(p|reel)\//);
      var username = userMatch ? '@' + userMatch[1] : '@instagram';

      var wrapper = document.createElement('div');
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('tabindex', '0');
      wrapper.setAttribute('aria-label', 'Play Instagram post by ' + username);

      var aspectRatio = isReel ? '9/16' : '1/1';
      wrapper.style.cssText = [
        'position:relative',
        'cursor:pointer',
        'background:linear-gradient(135deg,#405DE6 0%,#5851DB 25%,#833AB4 50%,#C13584 75%,#E1306C 100%)',
        'aspect-ratio:' + aspectRatio,
        'max-width:350px',
        'width:100%',
        'margin:1rem auto',
        'border-radius:8px',
        'overflow:hidden',
        'display:flex',
        'flex-direction:column',
        'justify-content:flex-end',
        'padding:16px',
        'box-sizing:border-box',
        'color:#fff',
        'font-family:-apple-system,system-ui,sans-serif'
      ].join(';');

      var icon = document.createElement('div');
      icon.innerHTML = '&#9654;';
      icon.setAttribute('aria-hidden', 'true');
      icon.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;opacity:0.95;pointer-events:none;text-shadow:0 2px 8px rgba(0,0,0,0.4);';

      var brand = document.createElement('div');
      brand.textContent = 'Instagram';
      brand.style.cssText = 'position:absolute;top:12px;right:14px;font-weight:600;font-size:12px;letter-spacing:0.5px;text-transform:uppercase;text-shadow:0 1px 4px rgba(0,0,0,0.6);opacity:0.95;';

      var userLabel = document.createElement('div');
      userLabel.textContent = username;
      userLabel.style.cssText = 'font-weight:700;font-size:16px;margin-bottom:8px;text-shadow:0 1px 4px rgba(0,0,0,0.6);';

      var cta = document.createElement('div');
      cta.textContent = isReel ? '▶ Play Instagram reel' : '▶ View Instagram post';
      cta.style.cssText = 'font-size:13px;font-weight:600;background:rgba(255,255,255,0.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:8px 12px;border-radius:6px;text-align:center;';

      wrapper.appendChild(brand);
      wrapper.appendChild(icon);
      wrapper.appendChild(userLabel);
      wrapper.appendChild(cta);

      function activateEmbed() {
        var realIframe = document.createElement('iframe');
        realIframe.src = 'https://www.instagram.com/' + (isReel ? 'reel' : 'p') + '/' + postId + '/embed/';
        realIframe.setAttribute('frameborder', '0');
        realIframe.setAttribute('scrolling', 'no');
        realIframe.setAttribute('allowtransparency', 'true');
        realIframe.setAttribute('allowfullscreen', '');
        realIframe.setAttribute('title', 'Instagram post by ' + username);
        realIframe.style.cssText = 'width:100%;max-width:350px;aspect-ratio:' + aspectRatio + ';border:none;display:block;margin:1rem auto;background:#fff;';
        wrapper.replaceWith(realIframe);
      }

      wrapper.addEventListener('click', activateEmbed);
      wrapper.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateEmbed();
        }
      });

      blockquote.replaceWith(wrapper);
    });
  }

  // ===========================================================================
  // ENTRY POINT
  // ===========================================================================
  // Con <script defer>, este codigo corre cuando el HTML termino de parsear
  // pero ANTES de DOMContentLoaded. Eso es ideal: el DOM ya esta listo y
  // los embeds estan en su estado inicial (antes de que TikTok/Instagram
  // embed.js los procese, si esos scripts todavia no corrieron).
  //
  // Para defensa adicional contra timing issues, escuchamos DOMContentLoaded
  // y tambien window.load para asegurar que corremos en cualquier escenario.
  // ===========================================================================
  function run() {
    optimizeRichTextImages();
    applyYoutubeFacades();
    applyOtherIframeFacades();
    applyTikTokFacades();
    applyInstagramFacades();
  }

  // Si el DOM ya esta listo (defer garantiza esto), correr inmediatamente.
  // Sino, esperar a DOMContentLoaded.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
