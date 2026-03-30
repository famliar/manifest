// ==================== 路由表（预定义） ====================
const routes = [
    { match: /^\/$/, handler: homeHandler },
    { match: /^\/user\/(\d+)$/, handler: userHandler }
];

// ==================== 融合缓存工具 ====================
// 缓存优先策略：优先返回缓存，否则执行生成器并存入缓存
async function cacheFirst(cacheKey, generator) {
    const cache = await caches.open('dynamic-pages');
    const cached = await cache.match(cacheKey);
    if (cached) {
        console.log(`[Cache Hit] ${cacheKey}`);
        return cached;
    }
    console.log(`[Cache Miss] ${cacheKey}, generating...`);
    const response = await generator();
    // 只缓存成功的响应
    if (response && response.ok) {
        await cache.put(cacheKey, response.clone());
    }
    return response;
}

// Stale-While-Revalidate 策略（用于首页）
async function staleWhileRevalidate(cacheKey, generator) {
    const cache = await caches.open('dynamic-pages');
    const cached = await cache.match(cacheKey);
    const updatePromise = generator().then(async (fresh) => {
        if (fresh && fresh.ok) {
            await cache.put(cacheKey, fresh.clone());
        }
        return fresh;
    }).catch(err => {
        console.error('Revalidate failed', err);
        return null;
    });
    // 如果有缓存，立即返回，后台更新；否则等待更新完成
    if (cached) {
        updatePromise.catch(() => {}); // 静默处理后台错误
        return cached;
    }
    return updatePromise;
}

// ==================== 路由处理器 ====================

/**
 * 首页处理器 - 使用 stale-while-revalidate 策略
 */
async function homeHandler(request, url) {
    const cacheKey = '/';
    return staleWhileRevalidate(cacheKey, async () => {
        // 模拟异步数据获取（例如从 API 获取站点配置）
        const siteTitle = await fetchSiteTitle();
        const html = generateHomePage(siteTitle);
        return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
        });
    });
}

/**
 * 用户页处理器 - 使用 cacheFirst 策略，并演示请求悬置
 */
async function userHandler(request, url) {
    const userId = url.pathname.match(/\/user\/(\d+)/)[1];
    const cacheKey = `/user/${userId}`;
    return cacheFirst(cacheKey, async () => {
        // 模拟从 API 获取用户数据（悬置：等待 1 秒）
        const userData = await fetchUserData(userId);
        const html = generateUserPage(userData);
        return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
        });
    });
}

// ==================== 辅助函数：模拟异步数据源 ====================

async function fetchSiteTitle() {
    // 模拟网络延迟
    await delay(300);
    // 这里可以替换为真实 fetch('/api/config')
    return '悬置路由演示站点';
}

async function fetchUserData(userId) {
    // 模拟网络延迟 + 数据获取
    await delay(1000);
    // 模拟用户数据库
    const users = {
        1: { id: 1, name: '张三', email: 'zhangsan@example.com', bio: '前端工程师' },
        2: { id: 2, name: '李四', email: 'lisi@example.com', bio: '后端架构师' },
        3: { id: 3, name: '王五', email: 'wangwu@example.com', bio: '全栈开发者' }
    };
    const user = users[userId];
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 模板生成 ====================

function generateHomePage(title) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .nav { margin-bottom: 2rem; border-bottom: 1px solid #eaecef; padding-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="nav">
        <a href="/">首页</a> | 
        <a href="/user/1">用户1</a> | 
        <a href="/user/2">用户2</a> | 
        <a href="/user/3">用户3</a>
    </div>
    <h1>${escapeHtml(title)}</h1>
    <p>这是一个由 Service Worker 动态生成的页面，使用了 <strong>stale-while-revalidate</strong> 缓存策略。</p>
    <p>点击上方链接体验“用户页”的 <strong>cacheFirst</strong> 策略和请求悬置效果。</p>
    <p><small>提示：首次访问用户页会等待 1 秒模拟 API 延迟；再次访问将立即从缓存返回。</small></p>
</body>
</html>`;
}

function generateUserPage(user) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>用户：${escapeHtml(user.name)}</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .nav { margin-bottom: 2rem; border-bottom: 1px solid #eaecef; padding-bottom: 1rem; }
        .user-card { background: #f6f8fa; padding: 1rem; border-radius: 6px; border: 1px solid #e1e4e8; }
    </style>
</head>
<body>
    <div class="nav">
        <a href="/">首页</a> | 
        <a href="/user/1">用户1</a> | 
        <a href="/user/2">用户2</a> | 
        <a href="/user/3">用户3</a>
    </div>
    <h1>用户资料</h1>
    <div class="user-card">
        <p><strong>姓名：</strong> ${escapeHtml(user.name)}</p>
        <p><strong>邮箱：</strong> ${escapeHtml(user.email)}</p>
        <p><strong>简介：</strong> ${escapeHtml(user.bio)}</p>
    </div>
    <p><small>此页面由 Service Worker 动态生成，使用了 <strong>cacheFirst</strong> 策略。再次访问将立即从缓存返回。</small></p>
</body>
</html>`;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== Service Worker 生命周期 ====================

self.addEventListener('install', event => {
    console.log('SW installed');
    // 跳过等待，立即激活
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('SW activated');
    // 立即接管所有打开的页面
    event.waitUntil(clients.claim());
});

// ==================== Fetch 事件：路由匹配与悬置处理 ====================

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    // 只处理 GET 请求且同源的 HTML 页面导航
    if (event.request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;

    // 查找匹配的路由
    const route = routes.find(route => route.match.test(url.pathname));
    if (route) {
        console.log(`[Route] ${url.pathname} -> ${route.handler.name}`);
        // 悬置：将请求交给处理器，处理器返回 Promise<Response>
        event.respondWith(route.handler(event.request, url));
    }
    // 其他请求（如图片、CSS）默认走浏览器网络，也可扩展缓存策略
});
