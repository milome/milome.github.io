/* Same-origin RAG widget client. The chat API endpoint is provided by data-endpoint. */

(() => {
  const current = document.currentScript;
  const endpoint = current?.dataset?.endpoint || new URL(current?.src || location.href).origin;
  const configUrl = current?.dataset?.configUrl || "";
  const initialLocale = (document.documentElement.lang || "zh-CN").toLowerCase();
  const defaultUiByLocale = {
    "zh-CN": {
      locale: "zh-CN",
      title: "Ask Hualin",
      subtitle: "基于 Hualin 的个人知识库回答",
      placeholder: "输入你的问题，我会结合知识库回答",
      quickQuestions: [],
      answerKeywords: ["RAG", "AI-TDD", "AI 工程化", "召回", "引用", "评估", "量化交易", "Python", "Java", "Cloudflare", "Qwen"],
      answerFormatContract: "请使用 Markdown 输出：标题、列表、**关键术语**、inline code，并使用 [source-N] 标注引用。",
      footer: "Powered by Qwen, built with Cloudflare.",
      buttonLabel: "Ask Hualin",
      send: "发送",
      close: "关闭",
      thinking: "正在思考...",
      requestFailed: "请求失败，请稍后再试。",
      noAnswer: "未从 Hualin 的个人知识库找到充分依据回答这个问题。",
      sourcesTitle: "来源",
      networkErrorCode: "network_or_cors_error",
      networkDiagnostic: "当前网络可能无法连接 AI 服务，请切换网络后重试。",
    },
    en: {
      locale: "en",
      title: "Ask Hualin",
      subtitle: "Answers from Hualin's personal knowledge hub",
      placeholder: "Ask anything; I will answer with the knowledge hub",
      quickQuestions: [],
      answerKeywords: ["RAG", "AI-TDD", "retrieval", "citations", "evaluation", "AI engineering", "Cloudflare", "Qwen", "Python", "Java", "quant trading"],
      answerFormatContract: "Use Markdown consistently: headings, lists, **key terms**, inline code, and [source-N] citations.",
      footer: "Powered by Qwen, built with Cloudflare.",
      buttonLabel: "Ask Hualin",
      send: "Send",
      close: "Close",
      thinking: "Thinking...",
      requestFailed: "Request failed. Please try again later.",
      noAnswer: "I could not find enough evidence in Hualin's personal knowledge hub to answer this.",
      sourcesTitle: "Sources",
      networkErrorCode: "network_or_cors_error",
      networkDiagnostic: "Your current network may be unable to reach the AI service. Try another network and retry.",
    }
  };
  const pickDefaultUi = (locale) => String(locale || "").toLowerCase().startsWith("en")
    ? defaultUiByLocale.en
    : defaultUiByLocale["zh-CN"];
  let defaultUi = pickDefaultUi(initialLocale);

  const sessionIdKey = "milome-rag-session-id";
  const getSessionId = () => {
    try {
      const existing = localStorage.getItem(sessionIdKey);
      if (existing) return existing;
      const generated = "anon_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      localStorage.setItem(sessionIdKey, generated);
      return generated;
    } catch {
      return "anonymous";
    }
  };

  const button = document.createElement("button");
  button.id = "milome-rag-button";
  button.type = "button";
  button.innerHTML = '<span class="milome-rag-button-mark" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5.5 7.5c0-2 1.7-3.5 3.8-3.5h5.4c2.1 0 3.8 1.6 3.8 3.5v3.4c0 2-1.7 3.5-3.8 3.5h-2.6l-4.1 3.4v-3.4c-1.5-.4-2.5-1.8-2.5-3.5V7.5Z"></path><path d="M9 8.8h6M9 11.4h4"></path></svg></span><span class="milome-rag-button-label"></span>';
  button.setAttribute("aria-label", defaultUi.title);
  button.setAttribute("aria-expanded", "false");

  const windowEl = document.createElement("section");
  windowEl.id = "milome-rag-window";
  windowEl.setAttribute("aria-live", "polite");
  windowEl.innerHTML = [
    '<header class="milome-rag-header">',
    '  <span class="milome-rag-brand-mark">H</span>',
     '  <span class="milome-rag-heading">',
     '    <strong id="milome-rag-title"></strong>',
     '    <small id="milome-rag-subtitle"></small>',
     '  </span>',
     '  <button id="milome-rag-prompt-trigger" type="button" aria-expanded="false" aria-controls="milome-rag-prompt-drawer" hidden></button>',
     '  <button id="milome-rag-close" type="button"></button>',
     '</header>',
     '<section id="milome-rag-prompt-drawer" aria-labelledby="milome-rag-prompt-title" hidden>',
     '  <div class="milome-rag-prompt-head">',
     '    <strong id="milome-rag-prompt-title"></strong>',
     '    <small id="milome-rag-prompt-subtitle"></small>',
     '  </div>',
     '  <div id="milome-rag-quick"></div>',
     '</section>',
     '<div id="milome-rag-messages"></div>',
    '<form id="milome-rag-form">',
    '  <textarea id="milome-rag-input" maxlength="1000" rows="1"></textarea>',
    '  <button id="milome-rag-send" type="submit"></button>',
    '</form>',
    '<footer id="milome-rag-footer"></footer>'
  ].join("");

  const style = document.createElement("style");
  style.textContent = `
    #milome-rag-button{position:fixed;right:28px;bottom:calc(96px + env(safe-area-inset-bottom,0px) + var(--milome-rag-visual-bottom,0px));min-width:154px;height:56px;display:inline-flex;align-items:center;justify-content:center;gap:10px;border:0;border-radius:999px;background:linear-gradient(135deg,#0f766e,#0ea5e9);color:#fff;font:700 15px/1.1 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 16px 38px rgba(14,165,233,.28),0 4px 14px rgba(15,118,110,.24);z-index:2147483647;cursor:pointer;isolation:isolate;overflow:visible;animation:milome-rag-button-breathe 2.8s ease-in-out infinite;transition:transform .2s ease,box-shadow .2s ease}
    #milome-rag-button::before{content:"";position:absolute;inset:-7px;border-radius:999px;background:linear-gradient(135deg,rgba(45,212,191,.72),rgba(14,165,233,.5),rgba(34,211,238,.32));filter:blur(9px);opacity:.72;z-index:-1;animation:milome-rag-button-aura 2.8s ease-in-out infinite}
    #milome-rag-button::after{content:"";position:absolute;inset:-3px;border:1px solid rgba(125,211,252,.72);border-radius:999px;opacity:.58;z-index:-1;animation:milome-rag-button-ring 2.8s cubic-bezier(.2,.8,.2,1) infinite}
    #milome-rag-button:hover{transform:scale(1.1);box-shadow:0 20px 48px rgba(14,165,233,.36),0 8px 18px rgba(15,118,110,.28)}
    #milome-rag-button:active{transform:scale(.95)}
    .milome-rag-button-mark{position:relative;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.34),0 0 18px rgba(255,255,255,.18)}
    .milome-rag-button-mark svg{width:19px;height:19px;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .milome-rag-button-mark::after{content:"";position:absolute;right:1px;top:2px;width:8px;height:8px;border-radius:50%;background:#bbf7d0;box-shadow:0 0 0 2px rgba(15,118,110,.78),0 0 12px rgba(187,247,208,.9)}
    @keyframes milome-rag-button-breathe{0%,100%{box-shadow:0 16px 38px rgba(14,165,233,.26),0 4px 14px rgba(15,118,110,.22)}50%{box-shadow:0 20px 54px rgba(14,165,233,.42),0 8px 24px rgba(15,118,110,.34)}}
    @keyframes milome-rag-button-aura{0%,100%{opacity:.46;transform:scale(.98)}50%{opacity:.86;transform:scale(1.06)}}
    @keyframes milome-rag-button-ring{0%{opacity:.7;transform:scale(.96)}70%,100%{opacity:0;transform:scale(1.22)}}
    #milome-rag-window,#milome-rag-window *{box-sizing:border-box}
    #milome-rag-window{position:fixed;right:28px;bottom:calc(166px + env(safe-area-inset-bottom,0px) + var(--milome-rag-visual-bottom,0px));width:min(760px,calc(100vw - 56px));height:min(700px,calc(100vh - 196px));display:none;flex-direction:column;overflow:hidden;z-index:2147483647;border:1px solid #e2e8f0;border-radius:18px;background:#fff;box-shadow:0 20px 58px rgba(15,23,42,.22);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transform-origin:bottom right}
    #milome-rag-window.open{display:flex;animation:milome-rag-open .3s ease both}
    @keyframes milome-rag-open{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .milome-rag-header{height:64px;flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:0 16px;background:linear-gradient(135deg,#0f766e,#0ea5e9);color:#fff}
    .milome-rag-brand-mark{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.18);font-weight:800;box-shadow:inset 0 0 0 1px rgba(255,255,255,.32)}
    .milome-rag-heading{min-width:0;display:flex;flex:1;flex-direction:column;gap:2px}
    #milome-rag-title{font-size:15px;line-height:1.2}
    #milome-rag-subtitle{font-size:12px;line-height:1.2;color:rgba(255,255,255,.78);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
     #milome-rag-close{width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:22px;line-height:1;cursor:pointer}
     #milome-rag-prompt-trigger{position:relative;flex:0 0 auto;width:82px;height:34px;min-height:34px;display:inline-flex;align-items:center;justify-content:center;gap:4px;margin-left:8px;padding:0 9px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.12);color:#ecfeff;font-family:inherit;font-size:13px;font-weight:800;line-height:1;white-space:nowrap;cursor:pointer;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.18);transition:background .16s ease,border-color .16s ease,box-shadow .16s ease,transform .16s ease}
     #milome-rag-prompt-trigger[hidden]{display:none}
     .milome-rag-prompt-icon{display:block;flex:0 0 auto;width:15px;height:15px;fill:rgba(250,204,21,.18);stroke:#facc15;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 5px rgba(250,204,21,.28))}
     .milome-rag-prompt-label{position:relative;z-index:1}
     .milome-rag-prompt-chevron{position:relative;z-index:1;display:block;flex:0 0 auto;width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;opacity:.76;transform:rotate(0deg);transition:transform .2s cubic-bezier(.2,.8,.2,1),opacity .16s ease}
     #milome-rag-prompt-trigger[aria-expanded="true"] .milome-rag-prompt-chevron{transform:rotate(180deg);opacity:.92}
     #milome-rag-prompt-trigger::before{content:"";position:absolute;inset:-1px;background:radial-gradient(circle at 20% 50%,rgba(255,255,255,.34),transparent 28%),linear-gradient(105deg,transparent 12%,rgba(125,211,252,.2) 34%,transparent 52%);opacity:0;transform:translateX(-38%);animation:milome-rag-prompt-spark 6.4s ease-in-out infinite;pointer-events:none}
     #milome-rag-prompt-trigger::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 0 0 rgba(186,230,253,.38);opacity:0;pointer-events:none}
     #milome-rag-prompt-trigger:hover,#milome-rag-prompt-trigger[aria-expanded="true"]{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.34);box-shadow:0 0 0 3px rgba(186,230,253,.12),inset 0 1px 0 rgba(255,255,255,.24)}
     #milome-rag-prompt-trigger:focus-visible{outline:0;box-shadow:0 0 0 3px rgba(236,254,255,.34),inset 0 1px 0 rgba(255,255,255,.24)}
     #milome-rag-prompt-trigger:not(.is-pulsing):not(.is-quiet):not(.is-answering):not([aria-expanded="true"]){animation:milome-rag-prompt-heartbeat 3.2s ease-in-out infinite}
     #milome-rag-prompt-trigger:not(.is-pulsing):not(.is-quiet):not(.is-answering):not([aria-expanded="true"])::after{animation:milome-rag-prompt-heartbeat-ring 3.2s ease-out infinite}
     #milome-rag-prompt-trigger.is-pulsing{animation:milome-rag-prompt-nudge 1.8s ease-out 1}
     #milome-rag-prompt-trigger.is-pulsing::after{animation:milome-rag-prompt-pulse 1.8s ease-out 1}
     #milome-rag-prompt-trigger.is-quiet,#milome-rag-prompt-trigger.is-answering,#milome-rag-prompt-trigger[aria-expanded="true"]{animation:none}
     #milome-rag-prompt-trigger.is-quiet::before,#milome-rag-prompt-trigger.is-quiet::after,#milome-rag-prompt-trigger.is-answering::before,#milome-rag-prompt-trigger.is-answering::after,#milome-rag-prompt-trigger[aria-expanded="true"]::after{animation:none}
     @keyframes milome-rag-prompt-spark{0%,72%{opacity:0;transform:translateX(-48%)}77%{opacity:.82}88%{opacity:.58;transform:translateX(54%)}94%,100%{opacity:0;transform:translateX(72%)}}
     @keyframes milome-rag-prompt-nudge{0%,100%{transform:scale(1)}18%{transform:scale(1.045)}42%{transform:scale(.995)}}
     @keyframes milome-rag-prompt-heartbeat{0%,58%,78%,100%{transform:scale(1)}64%{transform:scale(1.035)}70%{transform:scale(.995)}84%{transform:scale(1.022)}}
     @keyframes milome-rag-prompt-heartbeat-mobile{0%,58%,78%,100%{transform:scale(1)}64%{transform:scale(1.018)}70%{transform:scale(.997)}84%{transform:scale(1.012)}}
     @keyframes milome-rag-prompt-heartbeat-ring{0%,58%,78%,100%{opacity:0;box-shadow:0 0 0 0 rgba(186,230,253,0)}64%{opacity:.72;box-shadow:0 0 0 4px rgba(186,230,253,.24)}72%{opacity:.16;box-shadow:0 0 0 9px rgba(186,230,253,.08)}84%{opacity:.46;box-shadow:0 0 0 3px rgba(186,230,253,.16)}92%{opacity:.1;box-shadow:0 0 0 7px rgba(186,230,253,.05)}}
     @keyframes milome-rag-prompt-heartbeat-ring-mobile{0%,58%,78%,100%{opacity:0;box-shadow:0 0 0 0 rgba(186,230,253,0)}64%{opacity:.46;box-shadow:0 0 0 3px rgba(186,230,253,.16)}72%{opacity:.1;box-shadow:0 0 0 6px rgba(186,230,253,.05)}84%{opacity:.3;box-shadow:0 0 0 2px rgba(186,230,253,.12)}92%{opacity:.06;box-shadow:0 0 0 5px rgba(186,230,253,.04)}}
     @keyframes milome-rag-prompt-pulse{0%,100%{opacity:0;box-shadow:0 0 0 0 rgba(186,230,253,0)}14%{opacity:.92;box-shadow:0 0 0 4px rgba(186,230,253,.28)}52%{opacity:.42;box-shadow:0 0 0 9px rgba(186,230,253,.12)}}
     #milome-rag-prompt-drawer{position:absolute;top:65px;left:14px;right:14px;z-index:5;max-height:min(330px,calc(100% - 154px));display:flex;flex-direction:column;gap:12px;padding:14px;border:1px solid rgba(14,165,233,.16);border-radius:0 0 18px 18px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(240,253,250,.96));box-shadow:0 24px 48px rgba(15,23,42,.18),0 1px 0 rgba(255,255,255,.86) inset;backdrop-filter:blur(14px);overflow:hidden;opacity:0;visibility:hidden;pointer-events:none;transform-origin:top center;clip-path:inset(0 0 100% 0 round 0 0 18px 18px);transition:clip-path .32s cubic-bezier(.22,1,.36,1),opacity .12s ease .22s,visibility 0s linear .34s}
     #milome-rag-prompt-drawer.is-open{opacity:1;visibility:visible;pointer-events:auto;clip-path:inset(0 0 0 0 round 0 0 18px 18px);transition:clip-path .28s cubic-bezier(.2,.8,.2,1),opacity .14s ease,visibility 0s linear}
     #milome-rag-prompt-drawer::after{content:"";position:absolute;left:14px;right:14px;bottom:14px;height:34px;border-radius:0 0 14px 14px;background:linear-gradient(180deg,rgba(240,253,250,0),rgba(240,253,250,.96) 72%,rgba(240,253,250,.98));opacity:0;pointer-events:none;transition:opacity .16s ease}
     #milome-rag-prompt-drawer.has-scroll-more::after{opacity:1}
     #milome-rag-prompt-drawer[hidden]{display:none}
     .milome-rag-prompt-head{display:flex;flex-direction:column;gap:3px;padding:0 2px}
     #milome-rag-prompt-title{color:#0f766e;font-size:14px;line-height:1.25;font-weight:900}
     #milome-rag-prompt-subtitle{color:#64748b;font-size:12px;line-height:1.35;font-weight:650}
     #milome-rag-quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-flow:dense;gap:8px;min-height:0;overflow:auto;padding-right:2px}
    .milome-rag-quick-item{position:relative;min-width:0;min-height:44px;max-height:56px;border:0;border-radius:12px;background:rgba(255,255,255,.84);color:#334155;padding:8px 32px 8px 11px;font-size:13.5px;line-height:1.35;cursor:pointer;text-align:left;white-space:normal;overflow:hidden;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;box-shadow:inset 0 0 0 1px rgba(148,163,184,.18);transition:background .16s ease,box-shadow .16s ease,color .16s ease,transform .16s ease}
     .milome-rag-quick-item.is-short{grid-column:auto}
     .milome-rag-quick-item.is-medium{grid-column:auto}
     .milome-rag-quick-item.is-long{grid-column:1 / -1}
     .milome-rag-quick-item::after{content:"";position:absolute;right:13px;top:50%;width:7px;height:7px;border-top:2px solid currentColor;border-right:2px solid currentColor;opacity:.32;transform:translateY(-50%) rotate(45deg);transition:opacity .16s ease,right .16s ease}
     .milome-rag-quick-item:hover{background:#ecfeff;box-shadow:inset 0 0 0 1px rgba(14,165,233,.3),0 8px 18px rgba(14,165,233,.1);color:#155e75;transform:translateY(-1px)}
     .milome-rag-quick-item:hover::after{right:11px;opacity:.62}
    #milome-rag-messages{flex:1;min-height:0;overflow:auto;padding:12px 16px 16px;background:#f8fafc}
    .milome-rag-message{max-width:86%;margin-bottom:14px;padding:11px 14px;border-radius:14px;font-size:14px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
    .milome-rag-user{margin-left:auto;background:linear-gradient(135deg,#0f766e,#0ea5e9);color:#fff;border-bottom-right-radius:5px}
    .milome-rag-ai{background:#fff;color:#1e293b;border:1px solid #e2e8f0;border-bottom-left-radius:5px;white-space:normal}
    .milome-rag-ai p{margin:0 0 10px}
    .milome-rag-ai p:last-child{margin-bottom:0}
    .milome-rag-ai h3{margin:12px 0 8px;color:#0f766e;font-size:14px;line-height:1.35;font-weight:800}
    .milome-rag-ai ol,.milome-rag-ai ul{margin:0 0 10px 1.25rem;padding:0}
    .milome-rag-ai li{margin:0 0 8px;padding-left:2px}
    .milome-rag-ai strong{font-weight:800;color:#0f766e}
    .milome-rag-ai code{border-radius:6px;background:#ecfeff;color:#155e75;padding:1px 5px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.92em}
    .milome-rag-ai .milome-rag-codeblock{margin:10px 0;border:1px solid #bae6fd;border-radius:12px;background:#082f49;overflow:hidden}
    .milome-rag-code-lang{padding:6px 10px;border-bottom:1px solid rgba(186,230,253,.22);color:#a5f3fc;font:700 11px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;text-transform:uppercase;letter-spacing:.04em}
    .milome-rag-codeblock pre{margin:0;padding:12px;overflow:auto;white-space:pre}
    .milome-rag-ai .milome-rag-codeblock code{display:block;padding:0;border-radius:0;background:transparent;color:#e0f2fe;font:12px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre}
    .milome-rag-ai a{color:#0369a1;font-weight:700;text-decoration:none}
    .milome-rag-ai a:hover{text-decoration:underline}
    .milome-rag-cite,.milome-rag-source-badge{display:inline-flex;align-items:center;border:1px solid #7dd3fc;border-radius:999px;background:#ecfeff;color:#0369a1;font:800 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.01em}
    .milome-rag-cite{margin:0 2px;padding:2px 6px;vertical-align:baseline}
    .milome-rag-keyword{display:inline;padding:0 4px;border-radius:6px;background:linear-gradient(135deg,rgba(45,212,191,.18),rgba(14,165,233,.14));box-shadow:inset 0 0 0 1px rgba(14,165,233,.14);color:#0f766e;font-weight:800}
    .milome-rag-error{color:#b91c1c;background:#fff7ed;border-color:#fed7aa}
    .milome-rag-sources{margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.45;white-space:normal}
    .milome-rag-sources-title{display:block;margin-bottom:6px;font-weight:800;color:#475569}
    .milome-rag-sources a{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;gap:6px 8px;color:#0369a1;text-decoration:none;margin-top:6px;line-height:1.45}
    .milome-rag-sources a:hover{text-decoration:underline}
    .milome-rag-source-badge{flex:0 0 auto;padding:3px 7px}
    .milome-rag-source-title{min-width:0;overflow:visible;text-overflow:clip;white-space:normal;overflow-wrap:anywhere}
    #milome-rag-form{height:72px;flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:12px;border-top:1px solid #e2e8f0;background:#fff}
    #milome-rag-input{box-sizing:border-box;height:40px;flex:1;resize:none;overflow:hidden;padding:8px 13px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;color:#1e293b;font-family:inherit;font-size:14px;line-height:1.55;outline:none}
    #milome-rag-input::placeholder{color:rgba(30,41,59,.55)}
    #milome-rag-input:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.14)}
    #milome-rag-send{position:relative;width:40px;height:40px;flex:0 0 40px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:12px;background:linear-gradient(135deg,#0f766e,#0ea5e9);color:#fff;cursor:pointer;box-shadow:0 8px 18px rgba(14,165,233,.22),inset 0 1px 0 rgba(255,255,255,.24);transition:transform .16s ease,box-shadow .16s ease,filter .16s ease}
    #milome-rag-send:hover:not(:disabled){filter:brightness(1.06);box-shadow:0 10px 24px rgba(14,165,233,.3),0 0 0 3px rgba(125,211,252,.14)}
    #milome-rag-send:active:not(:disabled){transform:translateY(1px) scale(.98)}
    #milome-rag-send:disabled{opacity:.48;cursor:not-allowed;box-shadow:none;filter:saturate(.6)}
    #milome-rag-send svg{position:absolute;left:50%;top:50%;width:19px;height:19px;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transform:translate(-50%,-50%);transition:opacity .14s ease,transform .14s ease}
    #milome-rag-send.is-sending svg{opacity:0;transform:translate(-50%,-50%) scale(.82)}
    #milome-rag-send.is-sending::after{content:"";position:absolute;left:50%;top:50%;width:16px;height:16px;margin:-10px 0 0 -10px;border:2px solid rgba(255,255,255,.42);border-top-color:#fff;border-radius:50%;animation:milome-rag-spin .8s linear infinite}
    @keyframes milome-rag-spin{to{transform:rotate(360deg)}}
    #milome-rag-footer{flex:0 0 auto;padding:8px 12px;border-top:1px solid #e2e8f0;background:#fff;color:#64748b;text-align:center;font-size:11px;line-height:1.3}
     @media(max-width:767px){#milome-rag-button{right:0;top:calc(50% + var(--milome-rag-visual-bottom,0px) / 2);bottom:auto;min-width:0;width:28px;height:104px;padding:0;border-radius:14px 0 0 14px;gap:0;background:rgba(15,23,42,.88);border:1px solid rgba(125,211,252,.32);border-right:0;box-shadow:0 10px 24px rgba(15,23,42,.24);transform:translateY(-50%);animation:none}#milome-rag-button::before,#milome-rag-button::after{display:none}#milome-rag-button:hover{transform:translateY(-50%) translateX(-2px);box-shadow:0 14px 30px rgba(15,23,42,.3)}#milome-rag-button:active{transform:translateY(-50%) scale(.98)}.milome-rag-button-mark{display:none}.milome-rag-button-label{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#e0f2fe;font-size:0;letter-spacing:0} .milome-rag-button-label::before{content:"⋮";font-size:28px;line-height:1;font-weight:900}#milome-rag-window{right:0;left:0;top:0;bottom:0;width:auto;height:var(--milome-rag-visual-height,100vh);max-height:none;border-radius:0;border:0;transform-origin:right center}#milome-rag-window.open{animation:milome-rag-mobile-open .24s ease both}#milome-rag-window.open+#milome-rag-button,#milome-rag-button[aria-expanded="true"]{opacity:0;pointer-events:none}.milome-rag-header{height:auto;min-height:72px;padding:8px 10px;gap:7px;align-items:center}.milome-rag-brand-mark{width:26px;height:26px}.milome-rag-heading{flex:1 1 auto;min-width:0}#milome-rag-subtitle{max-width:none;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.25}#milome-rag-prompt-trigger{width:auto;min-width:84px;height:32px;min-height:32px;gap:4px;margin-left:0;padding:0 8px;font-size:12.5px}#milome-rag-prompt-trigger:not(.is-pulsing):not(.is-quiet):not(.is-answering):not([aria-expanded="true"]){animation:milome-rag-prompt-heartbeat-mobile 3.2s ease-in-out infinite}#milome-rag-prompt-trigger:not(.is-pulsing):not(.is-quiet):not(.is-answering):not([aria-expanded="true"])::after{animation:milome-rag-prompt-heartbeat-ring-mobile 3.2s ease-out infinite}.milome-rag-prompt-icon{width:15px;height:15px}.milome-rag-prompt-label{display:inline-block;max-width:none;overflow:visible;text-overflow:clip}.milome-rag-prompt-chevron{width:9px;height:9px}#milome-rag-close{width:32px;height:32px}#milome-rag-prompt-drawer{left:10px;right:10px;max-height:min(260px,42vh);padding:12px;border-radius:0 0 16px 16px}#milome-rag-prompt-drawer::after{left:12px;right:12px;bottom:12px}#milome-rag-quick{grid-template-columns:1fr;gap:7px}.milome-rag-quick-item,.milome-rag-quick-item.is-short,.milome-rag-quick-item.is-medium,.milome-rag-quick-item.is-long{grid-column:1 / -1;min-height:44px;font-size:13px;line-height:1.35}#milome-rag-messages{padding:12px}#milome-rag-input{height:44px;padding-top:9px;padding-bottom:9px}#milome-rag-send{width:44px;height:44px;flex-basis:44px}}
     @media(max-width:359px){.milome-rag-header{min-height:74px;gap:6px}#milome-rag-prompt-trigger{min-width:70px;padding:0 8px}}
     @media(max-width:319px){#milome-rag-prompt-trigger{width:34px;min-width:34px;padding:0}.milome-rag-prompt-label,.milome-rag-prompt-chevron{display:none}.milome-rag-prompt-icon{width:15px;height:15px}}
    @keyframes milome-rag-mobile-open{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
     @media(prefers-reduced-motion:reduce){#milome-rag-button,#milome-rag-button::before,#milome-rag-button::after,#milome-rag-window.open,#milome-rag-prompt-trigger,#milome-rag-prompt-trigger::before,#milome-rag-prompt-trigger::after,.milome-rag-prompt-chevron,#milome-rag-prompt-drawer,#milome-rag-prompt-drawer::after,#milome-rag-send.is-sending::after{animation:none;transition:none}}
     @media(prefers-color-scheme:dark){#milome-rag-window{background:#1e293b;border-color:#334155}#milome-rag-form,#milome-rag-footer{background:#1e293b;border-color:#334155}#milome-rag-prompt-trigger{border-color:rgba(125,211,252,.22);background:rgba(8,47,73,.34);color:#cffafe}#milome-rag-prompt-trigger:hover,#milome-rag-prompt-trigger[aria-expanded="true"]{border-color:rgba(125,211,252,.38);background:rgba(8,47,73,.52)}#milome-rag-prompt-drawer{border-color:rgba(125,211,252,.18);background:linear-gradient(180deg,rgba(15,23,42,.98),rgba(8,47,73,.96));box-shadow:0 24px 48px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.06)}#milome-rag-prompt-drawer::after{background:linear-gradient(180deg,rgba(8,47,73,0),rgba(8,47,73,.9) 72%,rgba(8,47,73,.96))}#milome-rag-prompt-title{color:#a5f3fc}#milome-rag-prompt-subtitle{color:#94a3b8}#milome-rag-messages{background:#0f172a}.milome-rag-quick-item{background:rgba(15,23,42,.72);color:#cbd5e1;box-shadow:inset 0 0 0 1px rgba(148,163,184,.16)}.milome-rag-quick-item:hover{background:#164e63;color:#ecfeff;box-shadow:inset 0 0 0 1px rgba(125,211,252,.28),0 8px 18px rgba(0,0,0,.18)}.milome-rag-ai{background:#1e293b;color:#f1f5f9;border-color:#334155}.milome-rag-error{background:#431407;color:#fed7aa;border-color:#9a3412}#milome-rag-input{background:#0f172a;color:#f1f5f9;border-color:#334155}#milome-rag-input::placeholder{color:rgba(241,245,249,.55)}#milome-rag-footer{color:#94a3b8}.milome-rag-cite,.milome-rag-source-badge{border-color:#0891b2;background:#164e63;color:#cffafe}.milome-rag-keyword{background:linear-gradient(135deg,rgba(45,212,191,.22),rgba(14,165,233,.2));box-shadow:inset 0 0 0 1px rgba(125,211,252,.2);color:#99f6e4}.milome-rag-sources{border-color:#334155;color:#94a3b8}.milome-rag-sources-title{color:#cbd5e1}.milome-rag-sources a{color:#7dd3fc}}
  `;

  const updateViewportMetrics = () => {
    const viewport = window.visualViewport;
    const visualHeight = viewport ? viewport.height : window.innerHeight;
    const visualTop = viewport ? viewport.offsetTop : 0;
    const visualBottom = Math.max(0, window.innerHeight - visualTop - visualHeight);
    document.documentElement.style.setProperty("--milome-rag-visual-height", Math.round(visualHeight) + "px");
    document.documentElement.style.setProperty("--milome-rag-visual-bottom", Math.round(visualBottom) + "px");
  };

  const mountWidget = () => {
    document.head.append(style);
    document.body.append(button, windowEl);
    updateViewportMetrics();
  };

  if (document.body) {
    mountWidget();
  } else {
    document.addEventListener("DOMContentLoaded", mountWidget, { once: true });
  }
  window.addEventListener("resize", updateViewportMetrics, { passive: true });
  window.visualViewport?.addEventListener("resize", updateViewportMetrics, { passive: true });
  window.visualViewport?.addEventListener("scroll", updateViewportMetrics, { passive: true });

  const title = windowEl.querySelector("#milome-rag-title");
  const subtitle = windowEl.querySelector("#milome-rag-subtitle");
  const closeButton = windowEl.querySelector("#milome-rag-close");
  const promptTrigger = windowEl.querySelector("#milome-rag-prompt-trigger");
  const promptDrawer = windowEl.querySelector("#milome-rag-prompt-drawer");
  const promptTitle = windowEl.querySelector("#milome-rag-prompt-title");
  const promptSubtitle = windowEl.querySelector("#milome-rag-prompt-subtitle");
  const form = windowEl.querySelector("#milome-rag-form");
  const input = windowEl.querySelector("#milome-rag-input");
  const sendButton = windowEl.querySelector("#milome-rag-send");
  const messages = windowEl.querySelector("#milome-rag-messages");
  const quick = windowEl.querySelector("#milome-rag-quick");
  const footer = windowEl.querySelector("#milome-rag-footer");

  let ui = { ...defaultUi };
  let quickQuestions = [];
  let promptDrawerOpen = false;
  let promptPulseTimer = 0;

  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const isMobileViewport = () => mobileQuery.matches;
  const isEnglishLocale = () => String(ui.locale || "").toLowerCase().startsWith("en");
  const promptTriggerLabel = () => (isEnglishLocale() ? "Prompt ideas" : "提问灵感");
  const promptTriggerShortText = () => (isEnglishLocale() ? "Ideas" : "灵感");
  const promptTriggerText = () => promptTriggerShortText();
  const promptTitleText = () => {
    if (isMobileViewport()) return isEnglishLocale() ? "Prompt ideas" : "提问灵感";
    return isEnglishLocale() ? `Prompt ideas · ${quickQuestions.length}` : `提问灵感 · ${quickQuestions.length} 个`;
  };
  const promptSubtitleText = () => (isEnglishLocale() ? "Pick one and I will send it immediately" : "选择一个问题后将立即发送");
  const createPromptTriggerIcon = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "milome-rag-prompt-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    ["M9 18h6", "M10 22h4", "M8.6 14.6A6 6 0 1 1 15.4 14.6c-.8.5-1.4 1.4-1.4 2.4h-4c0-1-.6-1.9-1.4-2.4Z", "M12 2v1", "M4.9 4.9l.7.7", "M19.1 4.9l-.7.7"].forEach((value) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", value);
      icon.append(path);
    });
    return icon;
  };
  const createPromptTriggerChevron = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "milome-rag-prompt-chevron");
    icon.setAttribute("viewBox", "0 0 12 12");
    icon.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3 4.5 6 7.5 9 4.5");
    icon.append(path);
    return icon;
  };
  const estimatePromptVisualUnits = (question) => {
    let units = 0;
    for (const char of String(question || "").trim()) {
      if (/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(char)) {
        units += 1;
      } else if (/[A-Za-z0-9]/.test(char)) {
        units += 0.6;
      } else if (/\s/.test(char)) {
        units += 0.3;
      } else {
        units += 0.45;
      }
    }
    return units;
  };
  const quickItemLengthClass = (question) => {
    const units = estimatePromptVisualUnits(question);
    if (units > 34) return "is-long";
    return units <= 18 ? "is-short" : "is-medium";
  };

  const updateQuickTabOrder = () => {
    quick.querySelectorAll(".milome-rag-quick-item").forEach((item) => {
      item.tabIndex = promptDrawerOpen ? 0 : -1;
    });
  };

  const focusWithoutScroll = (element) => {
    if (!element || typeof element.focus !== "function") return;
    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }
  };

  const moveFocusOutOfPromptDrawer = () => {
    const activeElement = document.activeElement;
    if (!(activeElement instanceof Node) || !promptDrawer.contains(activeElement)) return;
    const fallback = windowEl.classList.contains("open") && !promptTrigger.hidden ? promptTrigger : button;
    focusWithoutScroll(fallback);
  };

  const updatePromptScrollCue = () => {
    if (!promptDrawerOpen || !quickQuestions.length) {
      promptDrawer.classList.remove("has-scroll-more");
      return;
    }
    const hasOverflow = quick.scrollHeight > quick.clientHeight + 1;
    const hasMoreBelow = quick.scrollTop + quick.clientHeight < quick.scrollHeight - 1;
    promptDrawer.classList.toggle("has-scroll-more", hasOverflow && hasMoreBelow);
  };

  const renderPromptChrome = () => {
    const label = isMobileViewport() ? promptTriggerShortText() : promptTriggerText();
    const labelEl = document.createElement("span");
    labelEl.className = "milome-rag-prompt-label";
    labelEl.textContent = label;
    promptTrigger.replaceChildren(createPromptTriggerIcon(), labelEl, createPromptTriggerChevron());
    promptTrigger.setAttribute("aria-label", promptTriggerLabel());
    promptTitle.textContent = promptTitleText();
    promptSubtitle.textContent = promptSubtitleText();
  };

  const setPromptDrawerOpen = (open) => {
    const wasOpen = promptDrawerOpen;
    promptDrawerOpen = Boolean(open && quickQuestions.length > 0);
    const hasQuestions = quickQuestions.length > 0;
    if (promptDrawerOpen && !wasOpen) quick.scrollTop = 0;
    if (!promptDrawerOpen) moveFocusOutOfPromptDrawer();
    promptTrigger.hidden = !hasQuestions;
    promptDrawer.hidden = !hasQuestions;
    promptDrawer.toggleAttribute("inert", !promptDrawerOpen);
    promptDrawer.classList.toggle("is-open", promptDrawerOpen);
    promptDrawer.setAttribute("aria-hidden", promptDrawerOpen ? "false" : "true");
    promptTrigger.setAttribute("aria-expanded", promptDrawerOpen ? "true" : "false");
    if (promptDrawerOpen) {
      promptTrigger.classList.add("is-quiet");
    } else {
      promptTrigger.classList.remove("is-quiet");
    }
    renderPromptChrome();
    updateQuickTabOrder();
    window.requestAnimationFrame(updatePromptScrollCue);
  };

  const triggerPromptPulse = () => {
    if (promptDrawerOpen || !quickQuestions.length) return;
    promptTrigger.classList.remove("is-pulsing");
    window.clearTimeout(promptPulseTimer);
    window.requestAnimationFrame(() => {
      promptTrigger.classList.add("is-pulsing");
      promptPulseTimer = window.setTimeout(() => {
        promptTrigger.classList.remove("is-pulsing");
      }, 1900);
    });
  };

  const applyConfig = (config) => {
    const configLocale = config && typeof config === "object" ? config.locale : undefined;
    defaultUi = pickDefaultUi(configLocale || initialLocale);
    ui = {
      ...defaultUi,
      ...(config && typeof config === "object" ? config : {})
    };
    button.setAttribute("aria-label", ui.title);
    const label = button.querySelector(".milome-rag-button-label");
    if (label) label.textContent = ui.buttonLabel || ui.title || defaultUi.buttonLabel;
    title.textContent = ui.title;
    subtitle.textContent = ui.subtitle || "";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", ui.close || defaultUi.close);
    input.placeholder = ui.placeholder;
    sendButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 3 10.8 13.2"></path><path d="m21 3-6.5 18-3.7-7.8L3 9.5 21 3Z"></path></svg>';
    sendButton.setAttribute("aria-label", String(ui.locale || "").toLowerCase().startsWith("en") ? "Send message" : "发送消息");
    footer.textContent = ui.footer;
    quick.replaceChildren();
    const questions = Array.isArray(ui.quickQuestions) ? ui.quickQuestions.filter(Boolean) : [];
    quickQuestions = questions.map((question) => String(question));
    for (const question of quickQuestions) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "milome-rag-quick-item " + quickItemLengthClass(question);
      item.textContent = String(question);
      item.title = String(question);
      item.setAttribute("aria-label", String(question));
      item.tabIndex = -1;
      item.addEventListener("click", () => {
        setPromptDrawerOpen(false);
        void submitMessage(String(question));
      });
      quick.append(item);
    }
    setPromptDrawerOpen(false);
  };

  const loadConfig = async () => {
    if (!configUrl) {
      applyConfig(null);
      return;
    }
    try {
      const response = await fetch(configUrl, { credentials: "same-origin" });
      if (!response.ok) throw new Error("config_load_failed");
      applyConfig(await response.json());
    } catch {
      applyConfig(null);
    }
  };

  const scrollToBottom = () => {
    messages.scrollTop = messages.scrollHeight;
  };

  const append = (text, kind, extraClass = "") => {
    const item = document.createElement("div");
    item.className = "milome-rag-message " + (kind === "user" ? "milome-rag-user" : "milome-rag-ai") + (extraClass ? " " + extraClass : "");
    item.textContent = text;
    messages.append(item);
    scrollToBottom();
    return item;
  };

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const sourceCitationHtml = (marker) => {
    const index = String(marker || "").trim();
    return '<span class="milome-rag-cite">[source-' + index + ']</span>';
  };

  const renderInlineMarkdown = (value, options = {}) => escapeHtml(value)
    .replace(new RegExp(String.fromCharCode(96) + "([^" + String.fromCharCode(96) + "]+)" + String.fromCharCode(96), "g"), "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?:\[|【)\s*source\s*[- ]?\s*(\d+)\s*(?:\]|】)/gi, (_match, index) => sourceCitationHtml(index))
    .replace(/(?:\[|【)\s*(\d+)\s*(?:\]|】)/g, (match, index) => options.allowBareSourceNumbers ? sourceCitationHtml(index) : match);

  const renderMarkdown = (value, options = {}) => {
    const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let list = "";
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeLines = [];
    const fence = String.fromCharCode(96).repeat(3);
    const closeList = () => {
      if (!list) return;
      html += "</" + list + ">";
      list = "";
    };
    const normalizeCodeBlock = (lines) => {
      let start = 0;
      let end = lines.length - 1;
      while (start <= end && !String(lines[start]).trim()) start += 1;
      while (end >= start && !String(lines[end]).trim()) end -= 1;
      let normalized = lines.slice(start, end + 1);
      const blankCount = normalized.filter((line) => !String(line).trim()).length;
      if (normalized.length >= 4 && blankCount / normalized.length >= 0.3) {
        normalized = normalized.filter((line) => String(line).trim());
      } else {
        const compacted = [];
        for (const line of normalized) {
          if (!String(line).trim() && !String(compacted[compacted.length - 1] || "").trim()) continue;
          compacted.push(line);
        }
        normalized = compacted;
      }
      const nonEmpty = normalized.filter((line) => String(line).trim());
      const minIndent = nonEmpty.length
        ? Math.min(...nonEmpty.map((line) => (String(line).match(/^[ \t]*/) || [""])[0].replace(/\t/g, "    ").length))
        : 0;
      if (minIndent > 0) {
        normalized = normalized.map((line) => String(line).trim() ? String(line).slice(minIndent) : "");
      }
      return normalized.join("\n");
    };
    const renderCodeBlock = () => {
      const language = codeLanguage ? '<div class="milome-rag-code-lang">' + escapeHtml(codeLanguage) + '</div>' : "";
      html += '<div class="milome-rag-codeblock">' + language + '<pre><code>' + escapeHtml(normalizeCodeBlock(codeLines)) + '</code></pre></div>';
      codeLanguage = "";
      codeLines = [];
      inCodeBlock = false;
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith(fence)) {
        if (inCodeBlock) {
          renderCodeBlock();
        } else {
          closeList();
          inCodeBlock = true;
          codeLanguage = trimmed.slice(fence.length).trim().split(/\s+/)[0] || "";
          codeLines = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      const heading = line.match(/^\s{0,3}#{1,4}\s+(.+)$/);
      const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      const unordered = line.match(/^\s*[-*]\s+(.+)$/);
      if (heading) {
        closeList();
        html += "<h3>" + renderInlineMarkdown(heading[1], options) + "</h3>";
        continue;
      }

      if (ordered || unordered) {
        const nextList = ordered ? "ol" : "ul";
        if (list !== nextList) {
          closeList();
          html += "<" + nextList + ">";
          list = nextList;
        }
        html += "<li>" + renderInlineMarkdown((ordered || unordered)[1], options) + "</li>";
        continue;
      }

      if (!line.trim()) {
        continue;
      }

      closeList();
      html += "<p>" + renderInlineMarkdown(line.trim(), options) + "</p>";
    }
    if (inCodeBlock) renderCodeBlock();
    closeList();
    return html || escapeHtml(value);
  };

  const keywordFallback = [
    "AI engineering", "quant trading", "Cloudflare", "AI-TDD", "retrieval", "citations", "evaluation",
    "Python", "Java", "Qwen", "RAG", "AI 工程化", "量化交易", "召回", "引用", "评估"
  ];
  const normalizeKeywords = () => {
    const configured = Array.isArray(ui.answerKeywords) ? ui.answerKeywords : [];
    const values = [...configured, ...keywordFallback]
      .map((keyword) => String(keyword || "").trim())
      .filter((keyword) => keyword.length >= 2);
    const seen = new Set();
    return values.filter((keyword) => {
      const key = keyword.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => b.length - a.length);
  };
  const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlightAnswerKeywords = (container) => {
    const keywords = normalizeKeywords();
    if (!keywords.length) return;
    const perKeyword = new Map();
    let totalHighlights = 0;
    const maxPerKeyword = 2;
    const maxTotal = 12;
    const pattern = new RegExp("(" + keywords.map(escapeRegExp).join("|") + ")", "giu");
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !String(node.nodeValue || "").trim()) return NodeFilter.FILTER_REJECT;
        if (parent.closest("code, pre, a, .milome-rag-cite, .milome-rag-sources, .milome-rag-keyword")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) {
      if (totalHighlights >= maxTotal) break;
      const text = String(node.nodeValue || "");
      pattern.lastIndex = 0;
      let cursor = 0;
      let match;
      let changed = false;
      const fragment = document.createDocumentFragment();
      while ((match = pattern.exec(text))) {
        const keyword = match[0];
        const key = keyword.toLowerCase();
        const count = perKeyword.get(key) || 0;
        if (count >= maxPerKeyword || totalHighlights >= maxTotal) continue;
        if (match.index > cursor) fragment.append(document.createTextNode(text.slice(cursor, match.index)));
        const mark = document.createElement("span");
        mark.className = "milome-rag-keyword";
        mark.textContent = keyword;
        fragment.append(mark);
        perKeyword.set(key, count + 1);
        totalHighlights += 1;
        cursor = match.index + keyword.length;
        changed = true;
      }
      if (!changed) continue;
      if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
      node.parentNode?.replaceChild(fragment, node);
    }
  };

  const renderAnswer = (container, value, options = {}) => {
    container.innerHTML = renderMarkdown(value, options);
    highlightAnswerKeywords(container);
  };

  const renderSources = (container, sources) => {
    if (!Array.isArray(sources) || sources.length === 0) return;
    const box = document.createElement("div");
    box.className = "milome-rag-sources";
    const title = document.createElement("strong");
    title.className = "milome-rag-sources-title";
    title.textContent = ui.sourcesTitle || defaultUi.sourcesTitle;
    box.append(title);
    for (const [index, source] of sources.slice(0, 6).entries()) {
      const url = source?.url ? String(source.url) : "";
      if (!url) continue;
      const marker = source?.id ? String(source.id) : "source-" + (index + 1);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer";
      const badge = document.createElement("span");
      badge.className = "milome-rag-source-badge";
      badge.textContent = "[" + marker + "]";
      const label = document.createElement("span");
      label.className = "milome-rag-source-title";
      label.textContent = source?.title ? String(source.title) : url;
      link.title = label.textContent;
      link.append(badge, label);
      box.append(link);
    }
    container.append(box);
  };

  const errorText = async (response) => {
    try {
      const payload = await response.json();
      return payload?.error ? ui.requestFailed + " (" + payload.error + ")" : ui.requestFailed;
    } catch {
      return ui.requestFailed;
    }
  };

  const isCurrentPageSummaryRequest = (message) => /总结当前页面|总结本页|当前页面总结|summari[sz]e (this|current) page|current page summary/i.test(String(message || ""));

  const collectCurrentPageContent = () => {
    const container = document.querySelector("main article, article, main") || document.body;
    const text = String(container?.innerText || "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return text.slice(0, 6000);
  };

  const createPageContext = (message) => {
    const context = {
      title: document.title,
      url: location.href
    };
    if (isCurrentPageSummaryRequest(message)) {
      context.intent = "current-page-summary";
      context.content = collectCurrentPageContent();
    }
    return context;
  };

  const createResponseContract = () => ({
    format: "markdown",
    instructions: ui.answerFormatContract || defaultUi.answerFormatContract,
    requiredCitationFormat: "[source-N]",
    preferredInlineMarkers: ["headings", "lists", "bold-key-terms", "inline-code", "source-citations"],
    answerKeywords: Array.isArray(ui.answerKeywords) ? ui.answerKeywords.slice(0, 24).map((keyword) => String(keyword)) : []
  });

  const consumeSse = async (response, answer) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let wroteAnswer = false;
    let sources = [];
    let rawAnswer = "";

    const consume = (chunk) => {
      buffer += chunk;
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const eventText of events) {
        const dataLines = eventText.split("\n").filter((line) => line.startsWith("data:"));
        for (const line of dataLines) {
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const payload = JSON.parse(data);
            if (Array.isArray(payload?.sources)) {
              sources = payload.sources;
              continue;
            }
            const content =
              payload?.choices?.[0]?.delta?.content ||
              payload?.choices?.[0]?.message?.content ||
              payload?.output?.choices?.[0]?.message?.content ||
              payload?.output?.choices?.[0]?.delta?.content ||
              "";
            if (content) {
              if (!wroteAnswer) {
                answer.textContent = "";
                wroteAnswer = true;
              }
              rawAnswer += content;
              renderAnswer(answer, rawAnswer);
            }
          } catch {
            if (!wroteAnswer) {
              answer.textContent = "";
              wroteAnswer = true;
            }
            rawAnswer += data;
            renderAnswer(answer, rawAnswer);
          }
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      consume(decoder.decode(value, { stream: true }));
      scrollToBottom();
    }
    if (buffer) consume("\n\n");
    renderAnswer(answer, wroteAnswer ? rawAnswer : ui.noAnswer, { allowBareSourceNumbers: sources.length > 0 });
    renderSources(answer, sources);
    scrollToBottom();
  };

  const consumeJson = async (response, answer) => {
    const payload = await response.json();
    const hasSources = Array.isArray(payload?.sources) && payload.sources.length > 0;
    if (payload?.answer && payload.answer !== "no_answer") {
      renderAnswer(answer, String(payload.answer), { allowBareSourceNumbers: hasSources });
    } else {
      renderAnswer(answer, ui.noAnswer, { allowBareSourceNumbers: hasSources });
    }
    renderSources(answer, payload?.sources);
  };

  const setOpen = (open) => {
    windowEl.classList.toggle("open", open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) setPromptDrawerOpen(false);
    if (open) {
      input.focus();
      triggerPromptPulse();
    }
  };

  button.addEventListener("click", () => {
    setOpen(!windowEl.classList.contains("open"));
  });
  closeButton.addEventListener("click", () => setOpen(false));
  promptTrigger.addEventListener("click", () => {
    setPromptDrawerOpen(!promptDrawerOpen);
  });
  quick.addEventListener("scroll", updatePromptScrollCue, { passive: true });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  input.addEventListener("focus", () => {
    if (promptDrawerOpen && isMobileViewport()) setPromptDrawerOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && windowEl.classList.contains("open")) {
      if (promptDrawerOpen) {
        setPromptDrawerOpen(false);
        focusWithoutScroll(promptTrigger);
        return;
      }
      setOpen(false);
      focusWithoutScroll(button);
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!promptDrawerOpen || !windowEl.classList.contains("open")) return;
    if (event.target instanceof Node && (promptDrawer.contains(event.target) || promptTrigger.contains(event.target))) return;
    setPromptDrawerOpen(false);
  });
  const handleMobileViewportChange = () => {
    if (quickQuestions.length > 0) setPromptDrawerOpen(promptDrawerOpen);
    window.requestAnimationFrame(updatePromptScrollCue);
  };
  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleMobileViewportChange);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(handleMobileViewportChange);
  }
  window.addEventListener("resize", () => {
    window.requestAnimationFrame(updatePromptScrollCue);
  }, { passive: true });

  const submitMessage = async (rawMessage) => {
    const message = String(rawMessage || "").trim();
    if (!message || sendButton.disabled) return;
    setPromptDrawerOpen(false);
    input.value = "";
    append(message, "user");
    const answer = append(ui.thinking, "ai");
    sendButton.disabled = true;
    sendButton.classList.add("is-sending");
    sendButton.setAttribute("aria-busy", "true");
    promptTrigger.classList.add("is-answering");

    try {
      const response = await fetch(endpoint + "/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId: getSessionId(),
          pageContext: createPageContext(message),
          responseContract: createResponseContract()
        })
      });

      if (!response.ok || !response.body) {
        answer.classList.add("milome-rag-error");
        answer.textContent = await errorText(response);
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        await consumeJson(response, answer);
      } else {
        await consumeSse(response, answer);
      }
    } catch (error) {
      answer.classList.add("milome-rag-error");
      const errorName = error?.name ? String(error.name) : "TypeError";
      console.warn("[milome-rag] chat request failed", {
        code: ui.networkErrorCode || defaultUi.networkErrorCode,
        error: errorName,
        endpoint,
        origin: location.origin
      });
      answer.textContent = [
        ui.requestFailed + " (" + (ui.networkErrorCode || defaultUi.networkErrorCode) + ")",
        ui.networkDiagnostic || defaultUi.networkDiagnostic || ""
      ].filter(Boolean).join("\n");
    } finally {
      sendButton.disabled = false;
      sendButton.classList.remove("is-sending");
      sendButton.removeAttribute("aria-busy");
      promptTrigger.classList.remove("is-answering");
      promptTrigger.classList.remove("is-quiet");
      input.focus();
      scrollToBottom();
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitMessage(input.value);
  });

  void loadConfig();
})();

