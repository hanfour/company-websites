const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs').promises;
const path = require('path');

// 从旧网站 JS bundle 中提取的配置
const SPREADSHEET_ID = '1UrAXdddpwsWQZ83oE6Utq010xpfpnLkOrQG0riCYMXo';
const SHEET_ID = '0';
const CLIENT_EMAIL = 'jianlin-web@jian-lin.iam.gserviceaccount.com';
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDJzKOAQ5w30MGA
f3GbXpwPTmf/mXUGb9E3GC1Vad8TJuOuB8CncksTWcZ00+M3x1cQU9waxM8VdPi+
Zh6wJVq2UGGLJ+Wi0JcTWzebnFMHeSkign2JHsFR+CdyP8KdrMSMenmeX5eCO0zD
0aH5LCew0o1JulgziyJHstASOP40ffNibfu2cc9nSBV7WDxQPwcVkBJw1pWHjedV
1+sjqZnH3qTFb07AIuOT2EGxw+TNQnmrvd+NEW/aeppwAZRxEJB8qr4NqlgTUbNH
Nv9p7bryuM7muO8KGdRZZLWhTGS1FlFi2tYZPSEc8IrXJ7NiQLf26KIsZObiGNIJ
FYa9XbrFAgMBAAECggEAER3HIXY6nh5aB1Ln+TBzZrX1CsBCpY7e7UAi+jtuZSK3
jZeRPvKqDQRgmaCuRVkmWJdwVCHs2apP/eBOCo1EjjGvsFysNNzh742dYBjIjxn3
A/sS+EowRgpZGC7xzCtvCWZLAgSkJnLuri5OAYM+A5i8TKxeVlLfD7tKPD1yzFNa
wZegVqwlwKVAD47uJI8wh4RXZguyNVHCwvoYf1CPPU6t/NP/LuC6epGEUelMcd5Y
wsMi0+SwVbaEknHQ0ZhQowUqXr03auk0eGDnyStuBKd03XR3EvOTiVBQwnBU/AC0
ALs7TjyG2dr7jllaAqdAo7nEeES6GcWgZpqbnpx+gQKBgQD9/SjlJYsnb6qqsNmu
aeFIe3aUAYDYDgJfakZehaaQeSHs/xPT2zDH3zU4Q0umaWobsQ7OEvfUdRQoE8tX
oCvy1ItPtAZ3esxHEXmVoUP2HkU1ncrJDmFpTzCAln9Unen8WSjX6lqwt5gqdoMU
3HEMhzHvNWjZ56AeCEXsdyzBRQKBgQDLZbCUiw2HW//8NrtnnkzWvGpYQA5+wryt
hgELyWFRIlhmVC4MONMk0nH40i5+4VnCkQ2odknQhfpzGUotmXMv1pOs2WN8vvJ7
n1ucao3rvcKFqJ1BCDSaHJMY23Qr7Qxwmpp4KEiX3oIX8W2UilXbK/8KR9V/mBor
muTkYC7rgQKBgG3g15BKbajh5jNxzrplk9CHmQTuoY7WgLBGiarapvRZcxPURf+h
E7lkFuIAOvoDIKRaNM1x50VCYTX1WkLOSDUFPj984k9OEJGuPas92Ojgr5BCczgH
wJyOZa07blps9oz1BXZjLFjHFE1Kd+rOcxm4YyHZOUMLsXlMmvNxmysBAoGATnH9
1Ix8v0PgSqnhRWlsQTWR3k92R7Vbh6EzLhSRD/WrGmxFBjm0VXNEua52eED5mWzQ
U7Sra10A5vtN/KA+KKkdc4C0Ohx68OrZLk56Rf191Ibff4FmqDl1EhUxjO9z6Mn3
4XfH56rNieZ3WN6xlkI1rwVddkR3c3Hd7aaa8gECgYAtkLvaFnRRCmPTq7Ch9hjk
c90IB5nzmRPKsDGNf1GMXtz2jMnd77kT/B4KhOsnYNqC1waqRYDD5bJfLt+Tfxtb
4OOeC5CHSO72Zk2LCP9TP1aZaLb9YEXPP/yT/z+ygddQBjDIpy55uhY/9vNkzxSm
0ip7DOyzROIFX90+WDDhIQ==
-----END PRIVATE KEY-----`;

const CDN_BASE = 'https://d377o53dybsd55.cloudfront.net';

async function fetchSpreadsheetData() {
  console.log('Connecting to Google Spreadsheet...');

  try {
    // 创建 JWT 认证
    const serviceAccountAuth = new JWT({
      email: CLIENT_EMAIL,
      key: PRIVATE_KEY,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    // google-spreadsheet v5+ 使用新的认证方式
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

    console.log('Loading spreadsheet info...');
    await doc.loadInfo();

    console.log(`Spreadsheet title: ${doc.title}`);
    console.log(`Number of sheets: ${doc.sheetCount}`);

    // 打印所有 sheet 信息
    doc.sheetsByIndex.forEach((sheet, index) => {
      console.log(`Sheet ${index}: ${sheet.title} (ID: ${sheet.sheetId})`);
    });

    // 获取所有 sheets 的数据
    const allData = {};

    for (const sheet of doc.sheetsByIndex) {
      console.log(`\nFetching data from sheet: ${sheet.title}`);
      const rows = await sheet.getRows();

      console.log(`Found ${rows.length} rows in ${sheet.title}`);

      if (rows.length > 0) {
        // 打印第一行的字段
        console.log('Columns:', Object.keys(rows[0].toObject()));

        // 转换为 JSON
        allData[sheet.title] = rows.map(row => row.toObject());
      }
    }

    // 保存数据
    const outputDir = path.join(__dirname, '../lib/data');
    await fs.mkdir(outputDir, { recursive: true });

    // 保存完整数据
    const fullDataPath = path.join(outputDir, 'scraped-full-data.json');
    await fs.writeFile(fullDataPath, JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`\nFull data saved to: ${fullDataPath}`);

    // 按照用户需求的结构组织数据
    const organizedData = {
      hotCases: [],
      historyCases: [],
      rentals: []
    };

    // 根据实际的 sheet 名称和数据结构来组织
    // 这里需要根据实际获取的数据来调整
    for (const [sheetName, sheetData] of Object.entries(allData)) {
      if (sheetName.includes('熱銷') || sheetName.includes('hot')) {
        organizedData.hotCases = sheetData.map((item, idx) => ({
          numberID: `hot${String(idx + 1).padStart(3, '0')}`,
          title: item.title || item['標題'] || item['物件標題'] || '',
          subtitle: item.subtitle || item['副標題'] || '',
          content: item.content || item['內容'] || '',
          images: (item.images || item['圖片'] || '').split(',').filter(Boolean).map(img => img.trim()),
          type: 'hot',
          ...item
        }));
      } else if (sheetName.includes('歷年') || sheetName.includes('history')) {
        organizedData.historyCases = sheetData.map((item, idx) => ({
          numberID: `history${String(idx + 1).padStart(3, '0')}`,
          title: item.title || item['標題'] || item['物件標題'] || '',
          subtitle: item.subtitle || item['副標題'] || '',
          content: item.content || item['內容'] || '',
          images: (item.images || item['圖片'] || '').split(',').filter(Boolean).map(img => img.trim()),
          type: 'history',
          ...item
        }));
      } else if (sheetName.includes('租售') || sheetName.includes('rental')) {
        organizedData.rentals = sheetData.map((item, idx) => ({
          numberID: `rental${String(idx + 1).padStart(3, '0')}`,
          title: item.title || item['標題'] || item['物件標題'] || '',
          subtitle: item.subtitle || item['副標題'] || '',
          content: item.content || item['內容'] || '',
          images: (item.images || item['圖片'] || '').split(',').filter(Boolean).map(img => img.trim()),
          ...item
        }));
      }
    }

    const organizedDataPath = path.join(outputDir, 'scraped-organized-data.json');
    await fs.writeFile(organizedDataPath, JSON.stringify(organizedData, null, 2), 'utf-8');
    console.log(`Organized data saved to: ${organizedDataPath}`);

    console.log('\nSummary:');
    console.log(`- Hot Cases: ${organizedData.hotCases.length}`);
    console.log(`- History Cases: ${organizedData.historyCases.length}`);
    console.log(`- Rentals: ${organizedData.rentals.length}`);

    return organizedData;

  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// 运行脚本
fetchSpreadsheetData()
  .then(() => {
    console.log('\nData fetching completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nData fetching failed:', error);
    process.exit(1);
  });
