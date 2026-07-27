/**
 * Reusable authentication-based navigation helper.
 */

// Mapping of landing page section hashes to protected dashboard hashes
export const PROTECTED_NAV_MAP = {
  '#report-category': '#dashboard/report-issue',
  '#live-map': '#dashboard/status',
  '#why-us': '#dashboard/hub',
  '#lost-found': '#dashboard/lost-found',
  '#announcements': '#dashboard/announcements'
};

/**
 * Checks if a target hash is a protected route.
 * @param {string} targetHash - The target URL hash (e.g. '#report-category')
 * @returns {boolean} True if the hash is protected
 */
export const isProtectedHash = (targetHash) => {
  return targetHash in PROTECTED_NAV_MAP;
};

/**
 * Handles navigation to a path, checking authentication.
 * @param {string} targetHref - The requested href target (e.g., '#report-category')
 * @param {object|null} user - The current logged-in user profile from AuthContext
 * @param {Event} [e] - Optional React/DOM click event to prevent default behavior
 * @returns {boolean} True if navigation was intercepted/handled by this helper, false otherwise
 */
export const handleAuthNavigation = (targetHref, user, e) => {
  if (isProtectedHash(targetHref)) {
    if (e) e.preventDefault();
    const destination = PROTECTED_NAV_MAP[targetHref];

    if (user) {
      // User is logged in: navigate directly to the requested page
      window.location.hash = destination;
    } else {
      // User is NOT logged in: save the intended destination and redirect to Login
      localStorage.setItem('redirectAfterLogin', destination);
      window.location.hash = '#login';
    }
    return true;
  }
  return false;
};

/**
 * Retrieves the saved redirect destination after a successful login.
 * Automatically clears the saved value from localStorage.
 * @returns {string} The saved destination hash, or '#dashboard' as a fallback
 */
export const getRedirectDestination = () => {
  const dest = localStorage.getItem('redirectAfterLogin');
  localStorage.removeItem('redirectAfterLogin');
  return dest || '#dashboard';
};

// Mapping of category keys (from CategoriesSection) to ReportIssuePage dropdown options
export const CATEGORY_MAP = {
  road: 'Road Damage',
  drainage: 'Drainage',
  waste: 'Garbage',
  water: 'Water Supply',
  light: 'Street Light',
  vegetation: 'Environment',
  property: 'Public Safety',
  pathway: 'Road Damage',
  land: 'Other',
  animal: 'Other'
};

/**
 * Gets the corresponding dropdown category string for a given key, with a fallback.
 * @param {string} key - The category key (e.g. 'road')
 * @returns {string} The matched dropdown option value
 */
export const getMappedCategory = (key) => {
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];

  // Try direct case-insensitive matching or fallback to Other
  const options = [
    'Road Damage',
    'Garbage',
    'Water Supply',
    'Drainage',
    'Street Light',
    'Electricity',
    'Public Safety',
    'Traffic',
    'Environment',
    'Other'
  ];
  const found = options.find(o => o.toLowerCase() === key.toLowerCase());
  return found || 'Other';
};

/**
 * Handles navigation when a category is clicked on the landing page.
 * @param {string} categoryKey - The key of the clicked category (e.g. 'road')
 * @param {object|null} user - The current logged-in user profile from AuthContext
 */
export const handleCategoryClick = (categoryKey, user) => {
  const mappedCategory = getMappedCategory(categoryKey);
  const targetHash = `#dashboard/report-issue?category=${encodeURIComponent(mappedCategory)}`;

  if (user) {
    // Navigate directly to the Report Issue page
    window.location.hash = targetHash;
  } else {
    // Redirect to the Login page and save both destination and category
    localStorage.setItem('redirectAfterLogin', targetHash);
    localStorage.setItem('selectedCategory', mappedCategory);
    window.location.hash = '#login';
  }
};

