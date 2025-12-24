/**
 * SEO Utility for dynamic meta tag updates
 * Updates document head meta tags for better SEO
 */

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

/**
 * Update page meta tags dynamically
 */
export function updateSEOTags(data: SEOData) {
  const { title, description, keywords, image, url, type = 'website' } = data;

  // Update title
  if (title) {
    document.title = title;
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'twitter:title', title);
  }

  // Update description
  if (description) {
    updateMetaTag('name', 'description', description);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'twitter:description', description);
  }

  // Update keywords
  if (keywords) {
    updateMetaTag('name', 'keywords', keywords);
  }

  // Update image
  if (image) {
    updateMetaTag('property', 'og:image', image);
    updateMetaTag('property', 'twitter:image', image);
  }

  // Update URL
  if (url) {
    updateMetaTag('property', 'og:url', url);
    updateMetaTag('property', 'twitter:url', url);
    updateCanonical(url);
  }

  // Update type
  if (type) {
    updateMetaTag('property', 'og:type', type);
  }
}

/**
 * Update or create a meta tag
 */
function updateMetaTag(attribute: 'name' | 'property', name: string, content: string) {
  const selector = attribute === 'name' ? `meta[name="${name}"]` : `meta[property="${name}"]`;
  let meta = document.querySelector(selector) as HTMLMetaElement;

  if (!meta) {
    meta = document.createElement('meta');
    if (attribute === 'name') {
      meta.setAttribute('name', name);
    } else {
      meta.setAttribute('property', name);
    }
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

/**
 * Update canonical URL
 */
function updateCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', url);
}

/**
 * Reset to default homepage SEO
 */
export function resetSEOToHome() {
  updateSEOTags({
    title: 'Sahni Auto - Best Tata Motors & Massey Ferguson Dealer | HP Lubricants | Andhra Pradesh & Telangana',
    description: 'Sahni Auto (sahniauto.com) - No.1 Tata Motors & Massey Ferguson authorized dealer since 1965. Best showroom for Tata Ace, Yodha, trucks, buses, Massey Ferguson tractors, HP lubricants, fuel stations & genuine spare parts in Vijayawada, Guntur, Narasaraopet, Andhra Pradesh & Telangana. Book test drives, explore commercial vehicles & lubricants.',
    keywords: 'Tata Motors dealer Vijayawada, Massey Ferguson dealer Andhra Pradesh, Tata Ace dealer, Tata Yodha dealer, best commercial vehicle showroom, HP lubricants distributor, Tata Motors SCV dealer, Massey Ferguson tractor dealer, automotive lubricants dealer, vehicle showroom Vijayawada, vehicle showroom Guntur, vehicle showroom Narasaraopet, commercial vehicle finance, institutional vehicle sales, Tata genuine parts, fuel stations Andhra Pradesh, sahniauto.com, Sahni Auto, Sahni Group',
    url: 'https://sahniauto.com/',
    image: 'https://sahniauto.com/images/logo.jpg',
  });
}

