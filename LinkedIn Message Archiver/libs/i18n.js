/**
 * @fileoverview Enhanced i18n wrapper for LinkedIn Message Archiver extension.
 * Extends Chrome's i18n capabilities with additional features.
 * 
 * @author Ronny M. Escalona
 * @version 1.0.0
 * @license MIT
 */

/**
 * Configuration object for i18n settings
 * @const {Object}
 */
const I18N_CONFIG = {
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LOCALES: ['en', 'es'],
  UI_STRINGS: {
    // UI Elements
    title: "extensionTitle",
    startButton: "startButtonText",
    settingsButton: "settingsButtonText",
    pauseButton: "pauseButtonText",
    resumeButton: "resumeButtonText",
    stopButton: "stopButtonText",
    messagesCount: "messagesCountText",
    notifications: "notificationsText",
    messageDelay: "messageDelayText",
    language: "languageText",

    // Status Messages
    errorLinkedIn: "errorLinkedInText",
    noMessages: "noMessagesText",
    processingStopped: "processingStoppedText",
    archiveSuccess: "archiveSuccessText",
    
    // Progress Messages
    searchingArchiveButton: "searchingArchiveButtonText",
    loadingMessages: "loadingMessagesText",
    scrollCompleted: "scrollCompletedText",
    startingSelection: "startingSelectionText",
    messageSelected: "messageSelectedText",
    warningIncomplete: "warningIncompleteText",
    archiveButtonFound: "archiveButtonFoundText",
    retryingSelection: "retryingSelectionText"
  }
};

/**
 * Enhanced i18n manager class
 */
class I18nManager {
  constructor() {
    this.validateChromeI18n();
  }

  /**
   * Validates that chrome.i18n is available
   * @private
   * @throws {Error} If chrome.i18n is not available
   */
  validateChromeI18n() {
    if (!chrome.i18n) {
      throw new Error('chrome.i18n is not available');
    }
  }

  /**
   * Gets a message from chrome.i18n or returns a fallback
   * @param {string} key - The message key
   * @param {Array<string>} [substitutions] - Optional substitutions
   * @returns {string} The translated message
   */
  getMessage(key, substitutions = []) {
    const messageKey = I18N_CONFIG.UI_STRINGS[key] || key;
    const message = chrome.i18n.getMessage(messageKey, substitutions);
    
    if (!message) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }

    return message;
  }

  /**
   * Gets the current locale from chrome.i18n
   * @returns {string} The current locale
   */
  getCurrentLocale() {
    return chrome.i18n.getUILanguage();
  }

  /**
   * Checks if a locale is supported
   * @param {string} locale - The locale to check
   * @returns {boolean} True if the locale is supported
   */
  isLocaleSupported(locale) {
    return I18N_CONFIG.SUPPORTED_LOCALES.includes(locale);
  }

  /**
   * Gets all supported locales
   * @returns {Array<string>} Array of supported locales
   */
  getSupportedLocales() {
    return I18N_CONFIG.SUPPORTED_LOCALES;
  }

  /**
   * Gets the message with placeholder substitutions
   * @param {string} key - The message key
   * @param {Object} substitutions - Key-value pairs for substitutions
   * @returns {string} The formatted message
   */
  getFormattedMessage(key, substitutions = {}) {
    let message = this.getMessage(key);
    
    Object.entries(substitutions).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      message = message.replace(placeholder, value);
    });

    return message;
  }
}

// Create singleton instance
const i18nManager = new I18nManager();

// Export for module systems
export default i18nManager;

// Export to window for global access
window.i18n = {
  getMessage: (key, substitutions) => i18nManager.getMessage(key, substitutions),
  getFormattedMessage: (key, substitutions) => i18nManager.getFormattedMessage(key, substitutions),
  getCurrentLocale: () => i18nManager.getCurrentLocale(),
  getSupportedLocales: () => i18nManager.getSupportedLocales(),
  isLocaleSupported: (locale) => i18nManager.isLocaleSupported(locale)
};