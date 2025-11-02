export const createGoogleTag = () => {
  // Load GA only in production and when REACT_APP_GA_ID is provided
  const GA_ID = process.env.REACT_APP_GA_ID;
  if (process.env.NODE_ENV === 'production' && GA_ID) {
    // Inject the gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // Initialize gtag helper immediately so calls can be queued
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = window.gtag || gtag;
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }
};

export default createGoogleTag;
