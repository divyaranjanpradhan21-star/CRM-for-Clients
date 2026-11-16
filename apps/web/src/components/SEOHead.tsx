import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ title, description, canonicalPath = '/' }) => {
  useEffect(() => {
    // Set dynamic unique document title
    document.title = title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const fullCanonicalUrl = `https://dinepulsecrm.com${canonicalPath}`;
    if (canonicalLink) {
      canonicalLink.setAttribute('href', fullCanonicalUrl);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', fullCanonicalUrl);
      document.head.appendChild(canonicalLink);
    }
  }, [title, description, canonicalPath]);

  return null;
};
