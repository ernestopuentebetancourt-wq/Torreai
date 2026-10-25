// Proxy anti-CORS para Torre de Comando (Cloudflare Workers).
// 1) En Cloudflare: Workers y Pages → Crear Worker → pega este código → Desplegar.
// 2) En Ajustes del Worker → Variables, crea ALLOWED_ORIGIN con el origen de tu app, sin barra final.
//    Ejemplo: https://tuusuario.github.io
// 3) Pega la dirección del Worker en Torre de Comando → Paso 1 → Opciones avanzadas → Dirección de tu puente.
// Solo reenvía a los dominios de esta lista. Añade aquí el dominio de la API de Alibaba que uses.
const ALLOW = ['.myshopify.com', 'api.openai.com', 'api.anthropic.com', 'generativelanguage.googleapis.com', 'api.deepseek.com', 'openrouter.ai'];

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const okOrigin = !!env.ALLOWED_ORIGIN && origin === env.ALLOWED_ORIGIN;
    const cors = { 'Access-Control-Allow-Origin': okOrigin ? origin : 'null', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!okOrigin || req.method !== 'POST') return new Response('Prohibido', { status: 403, headers: cors });
    let j; try { j = await req.json(); } catch { return new Response('JSON inválido', { status: 400, headers: cors }); }
    let u; try { u = new URL(j.url); } catch { return new Response('URL inválida', { status: 400, headers: cors }); }
    const host = u.hostname, allowed = ALLOW.some(h => h.startsWith('.') ? host.endsWith(h) : host === h);
    if (u.protocol !== 'https:' || !allowed) return new Response('Destino no permitido', { status: 403, headers: cors });
    const method = j.method || 'GET';
    const r = await fetch(u.toString(), { method, headers: j.headers || {}, body: ['GET', 'HEAD'].includes(method) ? undefined : j.body });
    const h = new Headers(cors); h.set('content-type', r.headers.get('content-type') || 'application/json');
    return new Response(r.body, { status: r.status, headers: h });
  }
};
