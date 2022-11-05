const Koa = require('koa');
const static = require('koa-static');
const Router = require('koa-router');
const axios = require('axios');
const { JSDOM } = require('jsdom');
 
const app = new Koa();
const router = new Router({});


// 列表地址 listSelect contentClass nextSelector 详情列表页的地址reg
const sites = [
  { listUrl: (page) => `https://www.jpmnb.net/Xrqj/XingYan/index${page > 1 ? page : ''}.html`, listSelect: 'section.container', contentSelector: 'p[style], p[align]', nextSelector: '.pagination1', pageReg: /\_[0-9]+\.html+$/ }, // 多
  { listUrl: (page) => `https://www.jpmnb.net/Xrqj/YouWu/index${page > 1 ? page : ''}.html`, listSelect: 'section.container', contentSelector: 'p[style], p[align]', nextSelector: '.pagination1', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.jpmnb.net/Xrqj/MiiTao/index${page > 1 ? page : ''}.html`, listSelect: 'section.container', contentSelector: 'p[style], p[align]', nextSelector: '.pagination1', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.jpmnb.net/Xrqj/XiaoYu/index${page > 1 ? page : ''}.html`, listSelect: 'section.container', contentSelector: 'p[style], p[align]', nextSelector: '.pagination1', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.jpmnb.net/Xrqj/HuaYang/index${page > 1 ? page : ''}.html`, listSelect: 'section.container', contentSelector: 'p[style], p[align]', nextSelector: '.pagination1', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.jpmnb.net/Xrqj/YouMi/index${page > 1 ? page : ''}.html`, listSelect: 'section.container', contentSelector: 'p[style], p[align]', nextSelector: '.pagination1', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.jpmnb.net/Xrqj/DKGirl/index${page > 1 ? page : ''}.html`, listSelect: 'section.container', contentSelector: 'p[style], p[align]', nextSelector: '.pagination1', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.930tu.com/meinv/index${page > 1 ? ('_' + page) : ''}.html`, listSelect: '.m-list', contentSelector: '.pic-main', nextSelector: '.page', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.kunvtu.com/meinvtaotu/list_31_${page}.html`, listSelect: '.boxs', contentSelector: '.content', nextSelector: '#pages',  pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.itu11.com/xingganmeinvxiezhen/list_1_${page}.html`, listSelect: '.pic4list', contentSelector: '.nry', nextSelector: '.dede_pages', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => 'https://www.yunvkong.com/meinv/' + (page > 1  ? `index_${page}.html` : ''), listSelect: '.all-work-list', contentSelector: '.wenzHtml', nextSelector: '.wenzHtml', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.tu963.cc/y/2/list_2_${page}.html`, listSelect: '.listMeinuT', contentSelector: '.content', nextSelector: '.articleV4Page', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `http://www.hao312.net/html/5/category-catid-5${page > 1 ? ('-page-' + page) : ''}.html`, listSelect: '.listBox', contentSelector: '.articleBody', nextSelector: '.pages', pageReg: /\-[0-9]+\-[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.neihantu.net/zhainannvshen/index${page > 1 ? ('_' + page) : ''}.html`, listSelect: '.piclist', contentSelector: '.con', nextSelector: '.con', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.neihantu.net/zhainannvshen/index${page > 1 ? ('_' + page) : ''}.html`, listSelect: '.piclist', contentSelector: '.con', nextSelector: '.con', pageReg: /\_[0-9]+\.html+$/ },
  { listUrl: (page) => `https://www.neihantu.net/zhainannvshen/index${page > 1 ? ('_' + page) : ''}.html`, listSelect: '.piclist', contentSelector: '.artbody', nextSelector: '.pages', pageReg: /\_[0-9]+\.html+$/ },
  // { listUrl: (page) => `http://www.cgtpw.com/xgmn/index${page > 1 ? ('_' + page) : ''}.html`, listSelect: '.listBox2', contentSelector: 'img_content', pageReg: /\_[0-9]+_[0-9]+\.html+$/ }, // 走代理/www.yeitu.com/(.*)/ http://localhost:3000/$1
]

function getSrc(url, src) {
  // 如果a.href是 b.html 那么要替换当前访问url的最后一段
  return src.startsWith('http') || src.startsWith('//') ? src : src.startsWith('/') ? (new URL(url).origin + src) : url.replace(/([^\/]*?)$/, src);
}

router.get('/links', async (ctx, next) => {
  const { query: { page, site } } = ctx;
  const s = sites[(site - 1) % sites.length];
  const { listUrl, listSelect } = s;
  const listHtml = listUrl(page);
  const response = await axios.get(listHtml);
  const { document } = new JSDOM(response.data).window;
  const listRoot = document.querySelector(listSelect);
  const links = {};
  Array.from(listRoot.getElementsByTagName('a')).forEach(i => {
    const img = i.getElementsByTagName('img')[0];
    if (!img) { return }
    const src = img.getAttribute('data-original') || img.getAttribute('lazysrc') || img.src;
    links[getSrc(listHtml, i.href)] = getSrc(listHtml, src);
  })
  ctx.set('Content-Type', 'application/json;charset=utf-8');
  ctx.body = JSON.stringify(links);
})

router.get('/link', async (ctx, next) => {
  const { query: { url, site } } = ctx;
  const s = sites[(site - 1) % sites.length];
  const { contentSelector, nextSelector, pageReg } = s;
  const detailHtml = decodeURIComponent(url);
  let updated = [detailHtml];
  const imgs = new Set();
  const pages = new Set(updated);
  let l = 0;
  while(pages.size > l) {
    l = pages.size;
    const newPages = await Promise.all(updated.map(i => i && axios.get(i).catch(e => {})));
    updated = [];
    newPages.forEach(i => {
      const html = i.config.url;
      const { document } = new JSDOM(i.data).window;
      const center = document.querySelector(contentSelector);
      const img = Array.from(center.getElementsByTagName('img'));
      img.map(j => getSrc(html, j.src)).forEach(j => imgs.add(j));
      const nexts = document.querySelector(nextSelector);
      (Array.from(nexts.getElementsByTagName('a')).filter(j => j.href?.match(pageReg))).map(j => getSrc(html, j.href)).forEach(j => {
        const lold = pages.size;
        pages.add(j).size > lold && updated.push(j);
      });
    })
  }
  ctx.set('Content-Type', 'application/json;charset=utf-8');
  ctx.body = JSON.stringify(Array.from(imgs));
})

app.use(static('./'));
app.use(router.routes(), router.allowedMethods());
app.listen(3000);