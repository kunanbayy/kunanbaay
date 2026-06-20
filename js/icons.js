/* ===========================================================================
   Shyraq icon system — dependency-free, Radix/Lucide-style line icons.
   Static-site equivalent of `import { StarIcon } from "@radix-ui/react-icons"`.

   Usage:
     1) Declarative:  <i data-icon="search"></i>
                      <i data-icon="star" class="ix-lg text-gold"></i>
     2) Automatic:    any known emoji in the page is swapped for a clean SVG.

   All icons inherit `currentColor` and size to 1em (or .ix-sm/.ix-lg/.ix-xl).
   =========================================================================== */
(function () {
  "use strict";

  // inner markup for a 24x24 stroke icon (Lucide-derived, MIT)
  var P = {
    search:        '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    star:          '<path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9L12 3z"/>',
    heart:         '<path d="M12 20s-7-4.4-9.3-8.5C1 8.1 2.6 4.5 6 4.5c2 0 3.2 1.1 4 2.2.8-1.1 2-2.2 4-2.2 3.4 0 5 3.6 3.3 7C19 15.6 12 20 12 20z"/>',
    person:        '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    users:         '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.3 3-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/><path d="M16 5.2A3.5 3.5 0 0 1 16 12"/><path d="M18 14.6c2.4.6 4 2.5 4 5.4"/>',
    gear:          '<circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    clipboard:     '<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/>',
    list:          '<path d="M8 6h12M8 12h12M8 18h12"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    "bar-chart":   '<path d="M4 20V10M9 20V4M14 20v-7M19 20v-11"/>',
    "trending-up": '<path d="M3 17l6-6 4 4 7-7"/><path d="M17 8h4v4"/>',
    check:         '<path d="M5 12.5l4.5 4.5L19 7"/>',
    "check-circle":'<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5.5"/>',
    target:        '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    infinity:      '<path d="M6.5 8.5c-2 0-3.5 1.6-3.5 3.5s1.5 3.5 3.5 3.5c2.6 0 4-3.5 5.5-3.5s2.9 3.5 5.5 3.5c2 0 3.5-1.6 3.5-3.5s-1.5-3.5-3.5-3.5c-2.6 0-4 3.5-5.5 3.5s-2.9-3.5-5.5-3.5z"/>',
    globe:         '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
    code:          '<path d="M9 8l-4 4 4 4"/><path d="M15 8l4 4-4 4"/>',
    "file-text":   '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    zap:           '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
    headphones:    '<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="7" rx="1.5"/><rect x="17" y="13" width="4" height="7" rx="1.5"/>',
    "help-circle": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 3.7 2.1c0 1.5-2.2 2-2.2 2.4"/><path d="M12 17h.01"/>',
    key:           '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3"/><path d="M16 7l3 3M14 9l2 2"/>',
    "arrow-up-right":'<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    mail:          '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
    ban:           '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    link:          '<path d="M9 14a4 4 0 0 0 5.7.4l3-3A4 4 0 0 0 12 5.7l-1.5 1.4"/><path d="M15 10a4 4 0 0 0-5.7-.4l-3 3A4 4 0 0 0 12 18.3l1.4-1.4"/>',
    palette:       '<path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2 0-1.4-1-1.6-1-2.7 0-.7.6-1.3 1.3-1.3H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="10" cy="7.5" r="1" fill="currentColor"/><circle cx="14.5" cy="7.5" r="1" fill="currentColor"/>',
    lock:          '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    "credit-card": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h3"/>',
    sun:           '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    sparkles:      '<path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4L12 3z"/><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z"/>',
    bell:          '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    bookmark:      '<path d="M6 4h12v17l-6-4-6 4V4z"/>',
    "graduation-cap":'<path d="M12 4 2 9l10 5 10-5-10-5z"/><path d="M5 11v5c0 1.5 3.1 3 7 3s7-1.5 7-3v-5"/>',
    book:          '<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2V4z"/><path d="M5 18h13"/>',
    trophy:        '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5c0 3 1.5 4.5 3.5 4.7M16 6h3c0 3-1.5 4.5-3.5 4.7"/><path d="M10 14h4M9 20h6M12 14v6"/>',
    lightbulb:     '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 1 4 10.5c-.7.6-1 1.2-1 2.5H9c0-1.3-.3-1.9-1-2.5A6 6 0 0 1 12 3z"/>',
    phone:         '<path d="M5 4h3l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    "message":     '<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>',
    rocket:        '<path d="M12 3c3 1 5 4 5 8l-2.5 2.5h-5L7 11c0-4 2-7 5-8z"/><circle cx="12" cy="9" r="1.4"/><path d="M9.5 16c-1 1-1.2 3-1.2 3s2-.2 3-1.2M14.5 16c1 1 1.2 3 1.2 3s-2-.2-3-1.2"/>',
    "map-pin":     '<path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    compass:       '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13 13l-4.5 2.5L11 11l4.5-2.5z"/>',
    bank:          '<path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9"/><path d="M3 21h18"/>',
    wallet:        '<path d="M4 8a2 2 0 0 1 2-2h11v3"/><path d="M4 8v9a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V10a1 1 0 0 0-1-1H6"/><circle cx="16.5" cy="13.5" r="1.2" fill="currentColor"/>',
    eye:           '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    instagram:     '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/>',
    telegram:      '<path d="M21.5 4.5 2.8 11.2c-.8.3-.8 1.4 0 1.6l4.6 1.4 1.8 5.4c.2.6 1 .8 1.5.3l2.5-2.4 4.4 3.3c.6.4 1.4 0 1.5-.7l3-14.4c.2-.8-.6-1.5-1.4-1.2z"/><path d="m7.4 14.2 9.5-6.2-7.2 7"/>',
    youtube:       '<rect x="2.5" y="6" width="19" height="12" rx="4"/><path d="m10 9.2 5 2.8-5 2.8z" fill="currentColor" stroke="none"/>',
    facebook:      '<path d="M15 8h2.5V4.5H15a4 4 0 0 0-4 4V11H8.5v3.5H11V21h3.5v-6.5H17l.6-3.5H14.5V8.6c0-.4.2-.6.5-.6z"/>',
    "arrow-left":  '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'
  };

  // emoji → icon-name map (only clearly iconographic emoji are swapped)
  var EMOJI = {
    "👥": "users", "🧑": "person", "👤": "person",
    "📋": "clipboard", "📝": "file-text", "🗂": "clipboard", "📄": "file-text",
    "📊": "bar-chart", "📈": "trending-up", "📉": "bar-chart",
    "✅": "check-circle", "☑": "check-circle", "✔": "check",
    "🎯": "target", "♾": "infinity", "🌐": "globe", "💻": "code",
    "⚡": "zap", "🎧": "headphones", "❓": "help-circle", "🔑": "key",
    "↗": "arrow-up-right", "✉": "mail", "📧": "mail", "🚫": "ban",
    "🔗": "link", "🎨": "palette", "🔒": "lock", "🔐": "lock",
    "💳": "credit-card", "☀": "sun", "🔆": "sun", "✨": "sparkles",
    "🔔": "bell", "🔖": "bookmark", "🎓": "graduation-cap", "📚": "book",
    "🏆": "trophy", "💡": "lightbulb", "📱": "phone", "📞": "phone",
    "💬": "message", "⚙": "gear", "🚀": "rocket", "📍": "map-pin", "🧭": "compass",
    "🔍": "search", "⭐": "star", "🌟": "star", "❤": "heart", "♥": "heart",
    "🏛": "bank", "🏦": "bank", "💰": "wallet", "💵": "wallet", "💸": "wallet",
    "👁": "eye", "👀": "eye"
  };

  function svgString(name, extraClass) {
    var inner = P[name];
    if (!inner) return null;
    return '<svg class="ix' + (extraClass ? " " + extraClass : "") +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      inner + '</svg>';
  }

  function makeSvg(name, extraClass) {
    var s = svgString(name, extraClass);
    if (!s) return null;
    var tpl = document.createElement("template");
    tpl.innerHTML = s.trim();
    return tpl.content.firstChild;
  }

  // 1) declarative <i data-icon="name">  (preserves inline style / size / label)
  function renderDeclarative(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      var node = makeSvg(el.getAttribute("data-icon"), el.className || "");
      if (!node) return;
      var st = el.getAttribute("style");
      if (st) node.setAttribute("style", st);
      var lbl = el.getAttribute("aria-label");
      if (lbl) { node.setAttribute("aria-label", lbl); node.removeAttribute("aria-hidden"); }
      el.replaceWith(node);
    });
  }

  // 2) auto-swap known emoji inside text nodes
  var keys = Object.keys(EMOJI);
  // variation selectors / ZWJ are stripped so "⚙️" matches "⚙"
  var emojiRe = new RegExp("(" + keys.map(function (k) {
    return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("|") + ")[\\uFE00-\\uFE0F]?", "g");

  function swapEmoji(root) {
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.parentNode) return NodeFilter.FILTER_REJECT;
        var tag = n.parentNode.nodeName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") return NodeFilter.FILTER_REJECT;
        emojiRe.lastIndex = 0;
        return emojiRe.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);

    nodes.forEach(function (node) {
      var text = node.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
      emojiRe.lastIndex = 0;
      while ((m = emojiRe.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var icon = makeSvg(EMOJI[m[1]], "ix-emoji");
        if (icon) frag.appendChild(icon);
        else frag.appendChild(document.createTextNode(m[0]));
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function run() {
    renderDeclarative(document);
    swapEmoji(document.body);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  // expose for dynamically injected content (e.g. JS-built cards/FAQ)
  window.ShyraqIcons = { render: renderDeclarative, swapEmoji: swapEmoji, svg: svgString };
})();
