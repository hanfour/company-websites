/**
 * 取得圖片的完整 URL
 * 優先使用 location（完整 S3 URL），否則使用 src 並加上 CDN 前綴
 *
 * @param item - 包含 src 和可選 location 的圖片物件
 * @param cdnLink - CDN 前綴 URL（從環境變數取得）
 * @returns 完整的圖片 URL
 */
export function getImageUrl(
  item: { src: string; location?: string } | string,
  cdnLink: string = ''
): string {
  // 如果傳入的是字串，直接處理
  if (typeof item === 'string') {
    // 如果是完整 URL（http/https），直接返回
    if (item.startsWith('http')) {
      return item;
    }
    // 如果是 S3 路徑（images/xxx），加上 S3 前綴
    if (item.startsWith('images/')) {
      return `https://jienlin.s3-ap-northeast-1.amazonaws.com/${item}`;
    }
    // 其他相對路徑（如 ./demo/xxx），加上 CDN 前綴
    return `${cdnLink}/${item}`;
  }

  // 如果有 location 欄位，優先使用
  if (item.location) {
    return item.location;
  }

  // 使用 src
  const src = item.src;

  // 如果 src 是完整 URL
  if (src.startsWith('http')) {
    return src;
  }

  // 如果 src 是 S3 路徑（images/xxx）
  if (src.startsWith('images/')) {
    return `https://jienlin.s3-ap-northeast-1.amazonaws.com/${src}`;
  }

  // 其他情況，加上 CDN 前綴
  return `${cdnLink}/${src}`;
}
