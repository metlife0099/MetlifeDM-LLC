import DOMPurify from 'dompurify';

const CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption', 'hr',
    'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'object', 'embed', 'svg', 'math'],
  FORBID_ATTR: ['style'],
  ALLOW_DATA_ATTR: false,
};

export const sanitizeRichText = (html = '') => {
  const clean = DOMPurify.sanitize(String(html), CONFIG);
  const template = document.createElement('template');
  template.innerHTML = clean;
  template.content.querySelectorAll('a').forEach((anchor) => {
    anchor.setAttribute('rel', 'noopener noreferrer');
    if (anchor.host && anchor.host !== window.location.host) anchor.setAttribute('target', '_blank');
  });
  template.content.querySelectorAll('img').forEach((image) => image.setAttribute('loading', 'lazy'));
  return template.innerHTML;
};
