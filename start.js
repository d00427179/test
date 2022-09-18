const Koa = require('koa');
const static = require('koa-static');
const Router = require('koa-router');
const axios = require('axios');
const { JSDOM } = require('jsdom');
 
const app = new Koa();
const router = new Router({});


// 域名 最后有几张图片 列表页的地址reg  list地址拼接函数
// const domain = 'http://seemed.cn/', picSlice = 14, pageReg = /page=[0-9]+$/, listUrl = (query) => { const { cate = 2, page = 1 } = query; return `?cate=3&page=${page}` };  // 2 3
// const domain = 'https://www.99ztu.com/', picSlice = 9, pageReg = /\_[0-9]+\.html+$/, listUrl = (query) => { const { cate = 2, page = 1 } = query; return `tese/index${page > 1 ? ('_' + page) : ''}.html` };
// const domain = 'https://www.930tu.com/', picSlice = 0, pageReg = /\_[0-9]+\.html+$/, listUrl = (query) => { const { cate = 2, page = 1 } = query; return `meinv/index${page > 1 ? ('_' + page) : ''}.html` };
const domain = 'https://www.itu11.com/', picSlice = 25, pageReg = /\_[0-9]+\.html+$/, listUrl = (query) => { const { cate = 2, page = 1 } = query; return `xingganmeinvxiezhen/list_1_${page}.html` };

function getSrc(src, url) {
  return src.startsWith('http') || src.startsWith('//') ? src : src.startsWith('/') ? (domain + src) : getSrc(url).replace(/([^\/]+?)$/, src);
}

router.get('/links', async (ctx, next) => {
  const { query } = ctx;
  const links = {}
  const response = await axios.get(`${domain}${listUrl(query)}`);
  const { document } = new JSDOM(response.data).window;
  Array.from(document.getElementsByTagName('a')).forEach(i => {
    const img = i.getElementsByTagName('img')[0];
    if (!img || img.src.includes('logo')) { return }
    const src = img.getAttribute('data-original') || img.src;
    links[i.href] = getSrc(src);
  })
  ctx.set('Content-Type', 'application/json;charset=utf-8');
  ctx.body = JSON.stringify(links);
})

function getImgs(document) {
  const imgs = Array.from(document.getElementsByTagName('img'))
  return imgs.slice(0, imgs.length - picSlice).filter(i => i.src.includes('jpg')).map(i => getSrc(i.src));
}

router.get('/link', async (ctx, next) => {
  const { query } = ctx;
  const url = decodeURIComponent(query.url);
  let updated = [url];
  const imgs = new Set();
  const pages = new Set(updated);
  let l = 0;
  while(pages.size > l) {
    l = pages.size;
    const newPages = await Promise.all(updated.map(i => axios.get(getSrc(i, url))));
    updated = [];
    newPages.forEach(i => {
      const { document } = new JSDOM(i.data).window;
      getImgs(document).forEach(i => imgs.add(i));
      (Array.from(document.getElementsByTagName('a')).map(i => i.href).filter(i => i.match(pageReg))).forEach(i => {
        const lold = pages.size;
        pages.add(i).size > lold && updated.push(i);
      });
    })
  }
  ctx.set('Content-Type', 'application/json;charset=utf-8');
  ctx.body = JSON.stringify(Array.from(imgs));
})

app.use(static('./'));
app.use(router.routes(), router.allowedMethods());
app.listen(3000);