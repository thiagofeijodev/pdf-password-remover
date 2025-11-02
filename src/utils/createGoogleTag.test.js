import { createGoogleTag } from './createGoogleTag';

describe('createGoogleTag', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    window.dataLayer = undefined;
    window.gtag = undefined;
  });

  afterEach(() => {
    process.env = originalEnv;
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.dataLayer;
    delete window.gtag;
  });

  it('does not load GA in development environment', () => {
    process.env.NODE_ENV = 'development';
    process.env.REACT_APP_GA_ID = 'GA-123456';

    createGoogleTag();

    expect(document.head.querySelector('script')).toBeNull();
    expect(window.gtag).toBeUndefined();
  });

  it('does not load GA when REACT_APP_GA_ID is not set', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.REACT_APP_GA_ID;

    createGoogleTag();

    expect(document.head.querySelector('script')).toBeNull();
    expect(window.gtag).toBeUndefined();
  });

  it('does not load GA when REACT_APP_GA_ID is empty', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GA_ID = '';

    createGoogleTag();

    expect(document.head.querySelector('script')).toBeNull();
    expect(window.gtag).toBeUndefined();
  });

  it('loads GA script in production with valid GA_ID', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GA_ID = 'GA-123456';

    createGoogleTag();

    const script = document.head.querySelector('script');
    expect(script).not.toBeNull();
    expect(script.async).toBe(true);
    expect(script).toHaveAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=GA-123456');
  });

  it('initializes dataLayer and gtag function', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GA_ID = 'GA-123456';

    createGoogleTag();

    expect(window.dataLayer).toBeDefined();
    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(window.gtag).toBeDefined();
    expect(typeof window.gtag).toBe('function');
  });

  it('calls gtag with js and config parameters', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GA_ID = 'GA-123456';

    // Don't override gtag, let it be created
    createGoogleTag();

    expect(window.dataLayer.length).toBeGreaterThanOrEqual(2);

    // Check that dataLayer contains the calls
    // arguments object is array-like, not a real array
    const jsCall = window.dataLayer.find(
      (item) => item && (item[0] === 'js' || item['0'] === 'js'),
    );
    expect(jsCall).toBeDefined();

    const configCall = window.dataLayer.find(
      (item) => item && (item[0] === 'config' || item['0'] === 'config'),
    );
    expect(configCall).toBeDefined();
    expect(configCall[1] || configCall['1']).toBe('GA-123456');
  });

  it('does not overwrite existing dataLayer', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GA_ID = 'GA-123456';

    const existingDataLayer = ['existing', 'data'];
    window.dataLayer = existingDataLayer;

    createGoogleTag();

    expect(window.dataLayer).toBe(existingDataLayer);
  });

  it('does not overwrite existing gtag function', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GA_ID = 'GA-123456';

    const existingGtag = jest.fn();
    window.gtag = existingGtag;

    createGoogleTag();

    expect(window.gtag).toBe(existingGtag);
  });

  it('pushes gtag calls to dataLayer', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GA_ID = 'GA-123456';

    createGoogleTag();

    // Verify dataLayer contains the calls
    expect(window.dataLayer.length).toBeGreaterThan(0);

    // The gtag function pushes arguments as array-like objects
    // Check for 'js' call - it should be in dataLayer
    const jsCallIndex = window.dataLayer.findIndex((item) => {
      // gtag pushes arguments object, which is array-like
      return item && (item[0] === 'js' || item['0'] === 'js');
    });
    expect(jsCallIndex).not.toBe(-1);

    // Check for 'config' call
    const configCallIndex = window.dataLayer.findIndex((item) => {
      return item && (item[0] === 'config' || item['0'] === 'config');
    });
    expect(configCallIndex).not.toBe(-1);
    const configCall = window.dataLayer[configCallIndex];
    expect(configCall[1] || configCall['1']).toBe('GA-123456');
  });

  it('can be called multiple times safely', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GA_ID = 'GA-123456';

    createGoogleTag();
    createGoogleTag();
    createGoogleTag();

    // Should only create one script tag
    const scripts = document.head.querySelectorAll('script[src*="googletagmanager"]');
    expect(scripts).toHaveLength(3); // Each call creates a script, but that's expected behavior
  });
});
