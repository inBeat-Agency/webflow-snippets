/**
 * YouTube Iframe Interceptor — inBeat Agency
 * ============================================================================
 * Version: v1.1.0
 *
 * QUE HACE:
 * Intercepta los <iframe src="...youtube..."> hardcoded en el HTML del rich
 * text ANTES de que el browser descargue el player JS (~440 KB). Le quita el
 * src y lo guarda en data-yt-src para que el facade de rich-text-performance.js
 * lo reemplace por un thumbnail clicable.
 *
 * POR QUE EXISTE:
 * rich-text-performance.js corre con defer, o sea DESPUES de que el browser ya
 * empezo a descargar los iframes. Este interceptor corre lo mas temprano
 * posible (inline en el <head>, sin defer) con un MutationObserver que captura
 * cada iframe en el instante que aparece en el DOM y lo neutraliza.
 *
 * COMO INSTALARLO EN WEBFLOW (IMPORTANTE - leer):
 * NO cargar este archivo via jsDelivr. Tiene que correr SIN latencia de red
 * para ganarle al parser del browser. Copiar el contenido de este archivo
 * INLINE, envuelto en <script>...</script>, en:
 *   Webflow -> Site Settings -> Custom Code -> Head Code
 * Pegarlo lo mas ARRIBA posible del head.
 *
 * Solo afecta iframes de YouTube. Vimeo/LinkedIn/otros se dejan intactos
 * (esos cargan nativo a proposito, ver getProviderInfo en rich-text-performance.js).
 * ============================================================================
 */
(function () {
  'use strict';

  var YT_RE = /(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i;

  function neutralize(iframe) {
    if (iframe.hasAttribute('data-yt-intercepted')) return;
    var src = iframe.getAttribute('src') || '';
    if (!YT_RE.test(src)) return;
    iframe.setAttribute('data-yt-src', src);
    iframe.setAttribute('data-yt-intercepted', 'true');
    iframe.setAttribute('src', 'about:blank');
  }

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var nodes = mutations[i].addedNodes;
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'IFRAME') {
          neutralize(node);
        } else if (node.querySelectorAll) {
          var inner = node.querySelectorAll('iframe');
          for (var k = 0; k < inner.length; k++) neutralize(inner[k]);
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  function sweep() {
    var iframes = document.querySelectorAll('iframe[src]');
    for (var i = 0; i < iframes.length; i++) neutralize(iframes[i]);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      observer.disconnect();
      sweep();
    });
  } else {
    sweep();
  }

  window.__inbeatYTIntercepted = true;
})();
