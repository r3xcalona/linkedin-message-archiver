/**
 * @fileoverview Background script for LinkedIn Message Archiver extension.
 * Handles installation events and manages notifications for the extension.
 * 
 * @author Ronny M. Escalona
 * @version 1.0.0
 * @license MIT
 */

/**
 * Configuration object for the extension
 * @const {Object}
 */
const CONFIG = {
  DEFAULT_ICON: 'assets/icons/icon48.png',
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds
  STORAGE_KEYS: {
    SETTINGS: 'extension_settings',
    LAST_VERSION: 'last_version'
  }
};

/**
 * Handles the installation and update events of the extension
 * @param {Object} details - Installation details object
 */
const handleInstallation = async (details) => {
  const { reason, previousVersion } = details;

  switch (reason) {
    case 'install':
      console.info(chrome.i18n.getMessage('logInstallSuccess'));
      await initializeDefaultSettings();
      showWelcomeNotification();
      break;
    case 'update':
      console.info(chrome.i18n.getMessage('logUpdateSuccess', [previousVersion]));
      await handleExtensionUpdate(previousVersion);
      break;
    default:
      console.info(chrome.i18n.getMessage('logExtensionLoaded'));
  }
};

/**
 * Initializes default settings for the extension
 * @returns {Promise<void>}
 */
const initializeDefaultSettings = async () => {
  const defaultSettings = {
    showNotifications: true,
    messageDelay: 1000,
    language: chrome.i18n.getUILanguage()
  };

  try {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.SETTINGS]: defaultSettings
    });
    console.info(chrome.i18n.getMessage('logSettingsInitialized'));
  } catch (error) {
    console.error(chrome.i18n.getMessage('errorSettingsInit'), error);
  }
};

/**
 * Handles extension updates
 * @param {string} previousVersion - Previous version of the extension
 * @returns {Promise<void>}
 */
const handleExtensionUpdate = async (previousVersion) => {
  try {
    // Add any necessary migration logic here
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.LAST_VERSION]: chrome.runtime.getManifest().version
    });
  } catch (error) {
    console.error(chrome.i18n.getMessage('errorUpdateHandling'), error);
  }
};

/**
 * Shows a welcome notification to the user after installation
 */
const showWelcomeNotification = () => {
  createNotification({
    title: chrome.i18n.getMessage('extensionName'),
    message: chrome.i18n.getMessage('notificationWelcome')
  });
};

/**
 * Creates and shows a notification with the given parameters
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} [options.type='basic'] - Notification type
 */
const createNotification = async ({ title, message, type = 'basic' }) => {
  try {
    // Check if we have permission to show notifications
    const permission = await chrome.permissions.contains({ permissions: ['notifications'] });
    if (!permission) {
      console.warn(chrome.i18n.getMessage('warnNotificationPermission'));
      return;
    }

    const notificationId = await new Promise((resolve) => {
      chrome.notifications.create({
        type,
        iconUrl: chrome.runtime.getURL(CONFIG.DEFAULT_ICON),
        title,
        message,
      }, (id) => resolve(id));
    });

    // Auto-clear notification after timeout
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, CONFIG.NOTIFICATION_TIMEOUT);
  } catch (error) {
    console.error(chrome.i18n.getMessage('errorNotificationCreate'), error);
  }
};

/**
 * Handles incoming messages from content scripts and popup
 * @param {Object} request - Message request object
 * @param {Object} sender - Sender information
 * @param {Function} sendResponse - Callback to send a response
 * @returns {boolean} - Returns true if the response will be sent asynchronously
 */
const handleMessage = (request, sender, sendResponse) => {
  const handlers = {
    showNotification: async () => {
      try {
        await createNotification({
          title: request.title || chrome.i18n.getMessage('extensionName'),
          message: request.message,
          type: request.type || 'basic'
        });
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: chrome.i18n.getMessage('errorNotificationHandler')
        });
      }
    }
  };

  const handler = handlers[request.action];
  if (handler) {
    handler();
    return true; // Keep message channel open for async response
  }

  console.warn(chrome.i18n.getMessage('warnUnhandledMessage', [request.action]));
  sendResponse({ success: false, error: chrome.i18n.getMessage('errorUnknownAction') });
  return false;
};

// Event Listeners
chrome.runtime.onInstalled.addListener(handleInstallation);
chrome.runtime.onMessage.addListener(handleMessage);

// Error handling for uncaught exceptions
window.onerror = (message, source, line, column, error) => {
  console.error(chrome.i18n.getMessage('errorGlobalHandler'), {
    message,
    source,
    line,
    column,
    error: error?.message
  });
  return false;
};