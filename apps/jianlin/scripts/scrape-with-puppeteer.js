/**
 * 使用 Puppeteer 从旧网站抓取数据
 *
 * 安装依赖：
 * npm install --save-dev puppeteer
 *
 * 运行：
 * node scripts/scrape-with-puppeteer.js
 */

const fs = require('fs').promises;
const path = require('path');

async function scrapeWithPuppeteer() {
  let browser;

  try {
    // 动态导入 puppeteer
    const puppeteer = await import('puppeteer');

    console.log('启动浏览器...');
    browser = await puppeteer.default.launch({
      headless: false, // 设置为 false 可以看到浏览器操作过程
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });

    const page = await browser.newPage();

    console.log('访问旧网站...');
    await page.goto('https://www.jianlin.com.tw', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // 等待 React 应用加载完成
    console.log('等待页面加载...');
    await page.waitForTimeout(5000);

    console.log('提取页面数据...');

    // 在浏览器上下文中执行数据提取
    const data = await page.evaluate(() => {
      const hotCases = [];
      const historyCases = [];
      const rentals = [];

      // TODO: 根据实际的 DOM 结构修改选择器
      // 这里提供几种常见的选择器模式：

      // 方式 1: 通过 data 属性
      document.querySelectorAll('[data-case-type="hot"]').forEach((el, idx) => {
        hotCases.push({
          numberID: `hot${String(idx + 1).padStart(3, '0')}`,
          title: el.querySelector('.case-title, h2, h3, .title')?.innerText?.trim() || '',
          subtitle: el.querySelector('.case-subtitle, .subtitle')?.innerText?.trim() || '',
          content: el.querySelector('.case-content, .content, .description')?.innerHTML || '',
          images: Array.from(el.querySelectorAll('img')).map(img => img.src),
          type: 'hot',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      // 方式 2: 通过 class 名称
      document.querySelectorAll('.history-case, .history-item').forEach((el, idx) => {
        historyCases.push({
          numberID: `history${String(idx + 1).padStart(3, '0')}`,
          title: el.querySelector('.case-title, h2, h3, .title')?.innerText?.trim() || '',
          subtitle: el.querySelector('.case-subtitle, .subtitle')?.innerText?.trim() || '',
          content: el.querySelector('.case-content, .content, .description')?.innerHTML || '',
          images: Array.from(el.querySelectorAll('img')).map(img => img.src),
          type: 'history',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      // 方式 3: 通过导航链接找到页面
      // 如果数据分布在不同页面，需要导航到各个页面
      // 这部分需要根据实际情况实现

      // 提取租售物件
      document.querySelectorAll('.rental-item, [data-type="rental"]').forEach((el, idx) => {
        rentals.push({
          numberID: `rental${String(idx + 1).padStart(3, '0')}`,
          title: el.querySelector('.rental-title, h2, h3, .title')?.innerText?.trim() || '',
          subtitle: el.querySelector('.rental-subtitle, .subtitle')?.innerText?.trim() || '',
          content: el.querySelector('.rental-content, .content, .description')?.innerHTML || '',
          images: Array.from(el.querySelectorAll('img')).map(img => img.src),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      return {
        hotCases,
        historyCases,
        rentals,
        _metadata: {
          scrapedAt: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      };
    });

    console.log('数据提取完成：');
    console.log(`- 热销个案：${data.hotCases.length} 个`);
    console.log(`- 历年个案：${data.historyCases.length} 个`);
    console.log(`- 租售物件：${data.rentals.length} 个`);

    // 保存数据
    const outputDir = path.join(__dirname, '../lib/data');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'puppeteer-scraped-data.json');
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`\n数据已保存到：${outputPath}`);

    // 如果需要，也可以分别保存到 case.json 和 rental.json
    const allCases = [...data.hotCases, ...data.historyCases];
    if (allCases.length > 0) {
      await fs.writeFile(
        path.join(outputDir, 'case.json'),
        JSON.stringify(allCases, null, 2),
        'utf-8'
      );
      console.log('个案数据已保存到：case.json');
    }

    if (data.rentals.length > 0) {
      await fs.writeFile(
        path.join(outputDir, 'rental.json'),
        JSON.stringify(data.rentals, null, 2),
        'utf-8'
      );
      console.log('租售数据已保存到：rental.json');
    }

    return data;

  } catch (error) {
    console.error('抓取失败：', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 运行脚本
if (require.main === module) {
  scrapeWithPuppeteer()
    .then(() => {
      console.log('\n✅ 数据抓取完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 数据抓取失败：', error);
      process.exit(1);
    });
}

module.exports = { scrapeWithPuppeteer };
