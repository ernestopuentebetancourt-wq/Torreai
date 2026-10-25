const V='torre-c1',SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!=='share').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return; // las APIs externas nunca se cachean
  if(e.request.method==='POST'&&u.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      const fd=await e.request.formData(),c=await caches.open('share');
      await c.put('meta',new Response(JSON.stringify({title:fd.get('title'),text:fd.get('text'),url:fd.get('url')})));
      const f=fd.get('media');if(f&&f.size)await c.put('file',new Response(f));
      return Response.redirect(new URL('index.html?shared=1',self.registration.scope).href,303);
    })());return;
  }
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>{
    const n=fetch(e.request).then(res=>{if(res.ok){const k=res.clone();caches.open(V).then(c=>c.put(e.request,k))}return res}).catch(()=>r);
    return r||n}))});
