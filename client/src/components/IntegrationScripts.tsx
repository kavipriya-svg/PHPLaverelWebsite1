/**
 * IntegrationScripts — mounted once in App.tsx.
 * Fetches public integration config and injects the relevant third-party
 * scripts (GA4, Meta Pixel, Hotjar, Clarity, GTM, chatbots, GSC meta tag).
 */
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface PublicIntegrationConfig {
  google_analytics?:       { measurementId?: string };
  meta_pixel?:             { pixelId?: string };
  hotjar?:                 { siteId?: string };
  ms_clarity?:             { projectId?: string };
  google_tag_manager?:     { containerId?: string };
  google_search_console?:  { verificationCode?: string };
  tawkto?:                 { propertyId?: string; widgetId?: string };
  crisp?:                  { websiteId?: string };
  tidio?:                  { publicKey?: string };
  intercom?:               { appId?: string };
  freshchat?:              { token?: string; host?: string };
}

function injectScript(id: string, src: string, async = true) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  if (async) s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function injectInlineScript(id: string, code: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.innerHTML = code;
  document.head.appendChild(s);
}

function injectMeta(name: string, content: string) {
  if (document.querySelector(`meta[name="${name}"]`)) return;
  const m = document.createElement("meta");
  m.name = name;
  m.content = content;
  document.head.appendChild(m);
}

export function IntegrationScripts() {
  const { data } = useQuery<{ configs: PublicIntegrationConfig }>({
    queryKey: ["/api/integrations/public"],
    staleTime: 5 * 60 * 1000, // 5 min
  });

  useEffect(() => {
    if (!data?.configs) return;
    const c = data.configs;

    // ── Google Analytics 4 ──────────────────────────────────────────────────
    const gaMeasurementId = c.google_analytics?.measurementId;
    if (gaMeasurementId) {
      injectScript("gtag-script", `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`);
      injectInlineScript("gtag-init", `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaMeasurementId}');
      `);
    }

    // ── Google Tag Manager ──────────────────────────────────────────────────
    const gtmId = c.google_tag_manager?.containerId;
    if (gtmId) {
      injectInlineScript("gtm-init", `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `);
      // noscript iframe
      if (!document.getElementById("gtm-noscript")) {
        const ns = document.createElement("noscript");
        ns.id = "gtm-noscript";
        ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
        document.body.insertBefore(ns, document.body.firstChild);
      }
    }

    // ── Meta Pixel ──────────────────────────────────────────────────────────
    const pixelId = c.meta_pixel?.pixelId;
    if (pixelId) {
      injectInlineScript("fbpixel-init", `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${pixelId}');fbq('track','PageView');
      `);
    }

    // ── Hotjar ──────────────────────────────────────────────────────────────
    const hotjarSiteId = c.hotjar?.siteId;
    if (hotjarSiteId) {
      injectInlineScript("hotjar-init", `
        (function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${hotjarSiteId},hjsv:6};a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `);
    }

    // ── Microsoft Clarity ───────────────────────────────────────────────────
    const clarityProjectId = c.ms_clarity?.projectId;
    if (clarityProjectId) {
      injectInlineScript("clarity-init", `
        (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,
        document,"clarity","script","${clarityProjectId}");
      `);
    }

    // ── Google Search Console verification ──────────────────────────────────
    const gscCode = c.google_search_console?.verificationCode;
    if (gscCode) {
      injectMeta("google-site-verification", gscCode.replace(/^google-site-verification=/, ""));
    }

    // ── Tawk.to ─────────────────────────────────────────────────────────────
    const tawkPropertyId = c.tawkto?.propertyId;
    const tawkWidgetId   = c.tawkto?.widgetId ?? "default";
    if (tawkPropertyId) {
      injectInlineScript("tawkto-init", `
        var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();
        (function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;s1.src='https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}';
        s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0)})();
      `);
    }

    // ── Crisp ───────────────────────────────────────────────────────────────
    const crispWebsiteId = c.crisp?.websiteId;
    if (crispWebsiteId) {
      injectInlineScript("crisp-init", `
        window.$crisp=[];window.CRISP_WEBSITE_ID="${crispWebsiteId}";
        (function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";
        s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
      `);
    }

    // ── Tidio ───────────────────────────────────────────────────────────────
    const tidioKey = c.tidio?.publicKey;
    if (tidioKey) {
      injectScript("tidio-chat", `//code.tidio.co/${tidioKey}.js`);
    }

    // ── Intercom ────────────────────────────────────────────────────────────
    const intercomAppId = c.intercom?.appId;
    if (intercomAppId) {
      injectInlineScript("intercom-init", `
        window.intercomSettings={api_base:"https://api-iam.intercom.io",app_id:"${intercomAppId}"};
        (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');
        ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};
        i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');
        s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/${intercomAppId}';
        var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};
        if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}
        else{w.addEventListener('load',l,false);}}})();
      `);
    }

    // ── Freshchat ───────────────────────────────────────────────────────────
    const freshchatToken = c.freshchat?.token;
    const freshchatHost  = c.freshchat?.host ?? "https://wchat.freshchat.com";
    if (freshchatToken) {
      injectScript("freshchat-js", `${freshchatHost}/js/widget.js`);
      injectInlineScript("freshchat-init", `
        function initFreshChat(){window.fcWidget.init({token:"${freshchatToken}",host:"${freshchatHost}"});}
        function initialize(i,t){var e;i.getElementById(t)?
        initFreshChat():((e=i.createElement("script")).id=t,e.async=!0,
        e.src="${freshchatHost}/js/widget.js",e.onload=initFreshChat,i.head.appendChild(e))}
        initialize(document,"Freshdesk Messaging-js-sdk");
      `);
    }
  }, [data]);

  return null; // renders nothing — side-effects only
}
