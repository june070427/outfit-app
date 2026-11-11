// 코디 사진은 우리 사이트에 가져오지 않고, 각 사이트의 이미지 검색 결과로 연결만 한다.
export function searchLinks(topName: string, bottomName: string, aesthetic: string) {
  const q = [`${topName} 상의`, `${bottomName} 하의`, "코디", aesthetic.trim()].filter(Boolean).join(" ");
  const e = encodeURIComponent(q);
  return [
    { name: "핀터레스트", href: `https://www.pinterest.com/search/pins/?q=${e}` },
    { name: "네이버 이미지", href: `https://search.naver.com/search.naver?where=image&query=${e}` },
    { name: "구글 이미지", href: `https://www.google.com/search?tbm=isch&q=${e}` },
  ];
}
