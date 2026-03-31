/**
 * 悬置路由 - 基础版 Service Worker
 * 功能：核心路由 + 缓存策略 + 404 处理
 */

// ==================== 配置 ====================

const CACHE_VERSION = 'v1';
const CACHE_NAME = `suspended-routing-${CACHE_VERSION}`;

// ==================== 路由表 ====================

const routes = [
    { match: /^\/$/, handler: homeHandler, name: 'home' },
    { match: /^\/about$/, handler: aboutHandler, name: 'about' },
    { match: /^\/contact$/, handler: contactHandler, name: 'contact' }
];

// ==================== 缓存策略 ====================

/**
 * Cache First 策略
 * @param {string} cacheKey - 缓存键
 * @param {Function} generator - 生成器函数
 * @returns {Promise<Response>}
 */
async function cacheFirst(cacheKey, generator) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(cacheKey);

    if (cached) {
        console.log(`[Cache Hit] ${cacheKey}`);
        return cached;
    }

    console.log(`[Cache Miss] ${cacheKey}, generating...`);
    const response = await generator();
    if (response && response.ok) {
        await cache.put(cacheKey, response.clone());
    }
    return response;
}

// ==================== 工具函数 ====================

function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return str.replace(/[&<>"']/g, m => map[m]);
}

// ==================== 模板生成 ====================

function generateHomePage() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>首页</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1rem;
            line-height: 1.6;
            background: #f6f8fa;
        }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .nav {
            margin-bottom: 2rem;
            padding: 1rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <div class="nav">
        <a href="/">首页</a> |
        <a href="/about">关于</a> |
        <a href="/contact">联系</a>
    </div>
    <div class="hero">
        <h1>欢迎使用悬置路由</h1>
        <p>基于 Service Worker 的全虚拟化路由系统</p>
    </div>
    <p>这是一个由 Service Worker 动态生成的页面。</p>
</body>
</html>`;
}

function generateAboutPage() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>关于</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1rem;
            line-height: 1.6;
            background: #f6f8fa;
        }
        a { color: #0366d6; text-decoration: none; }
        .nav { margin-bottom: 2rem; padding: 1rem; background: white; border-radius: 8px; }
        .content { background: white; padding: 2rem; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="nav"><a href="/">首页</a> | <a href="/about">关于</a> | <a href="/contact">联系</a></div>
    <div class="content">
        <h1>关于悬置路由</h1>
        <p>这是一个基于 Service Worker 的全虚拟化路由系统。</p>
        <p>所有页面均由 Service Worker 动态生成，无需服务器端渲染。</p>
    </div>
</body>
</html>`;
}

function generateContactPage() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>联系</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1rem;
            line-height: 1.6;
            background: #f6f8fa;
        }
        a { color: #0366d6; text-decoration: none; }
        .nav { margin-bottom: 2rem; padding: 1rem; background: white; border-radius: 8px; }
        .content { background: white; padding: 2rem; border-radius: 8px; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; }
        input, textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="nav"><a href="/">首页</a> | <a href="/about">关于</a> | <a href="/contact">联系</a></div>
    <div class="content">
        <h1>联系我们</h1>
        <form onsubmit="event.preventDefault(); alert('留言已提交！');">
            <div class="form-group"><label>姓名</label><input type="text" required></div>
            <div class="form-group"><label>邮箱</label><input type="email" required></div>
            <div class="form-group"><label>留言</label><textarea rows="4" required></textarea></div>
            <button type="submit">提交</button>
        </form>
    </div>
</body>
</html>`;
}

function generate404Page(path) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - 未找到</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1rem;
            line-height: 1.6;
            background: #f6f8fa;
        }
        a { color: #0366d6; text-decoration: none; }
        .nav { margin-bottom: 2rem; padding: 1rem; background: white; border-radius: 8px; }
        .error-box { background: #ffeef0; border: 1px solid #d73a49; padding: 2rem; border-radius: 8px; text-align: center; }
        .error-box h1 { color: #d73a49; margin: 0 0 1rem 0; }
    </style>
</head>
<body>
    <div class="nav"><a href="/">首页</a> | <a href="/about">关于</a> | <a href="/contact">联系</a></div>
    <div class="error-box">
        <h1>404 - 未找到</h1>
        <p>抱歉，您请求的页面 "${escapeHtml(path)}" 不存在。</p>
        <p><a href="/">返回首页</a></p>
    </div>
</body>
</html>`;
}

// ==================== 路由处理器 ====================

async function homeHandler() {
    return cacheFirst('/', async () => {
        return new Response(generateHomePage(), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    });
}

async function aboutHandler() {
    return cacheFirst('/about', async () => {
        return new Response(generateAboutPage(), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    });
}

async function contactHandler() {
    return cacheFirst('/contact', async () => {
        return new Response(generateContactPage(), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    });
}

async function notFoundHandler(url) {
    return new Response(generate404Page(url), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// ==================== Service Worker 生命周期 ====================

self.addEventListener('install', event => {
    console.log('[SW] Installed');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('[SW] Activated');
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.filter(k => k.startsWith('suspended-routing-') && k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            );
            await clients.claim();
            const allClients = await clients.matchAll({ type: 'window' });
            allClients.forEach(client => client.postMessage({ type: 'ACTIVATED' }));
        })()
    );
});

// ==================== Fetch 事件 ====================

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;
    if (url.pathname === '/index.html') return;
    if (url.pathname === '/sw.js') return;

    const route = routes.find(r => r.match.test(url.pathname));

    if (route) {
        console.log(`[Route] ${url.pathname} -> ${route.name}`);
        event.respondWith(route.handler());
    } else {
        console.log(`[404] ${url.pathname}`);
        event.respondWith(notFoundHandler(url.pathname));
    }
});
