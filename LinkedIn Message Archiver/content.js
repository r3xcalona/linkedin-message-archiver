/**
 * @fileoverview Content script for LinkedIn Message Archiver extension.
 * Handles the message selection, scrolling, and archiving functionality.
 * 
 * @author Ronny M. Escalona
 * @version 1.0.0
 * @license MIT
 */

/**
 * Configuration object for selectors and timing values
 * @const {Object}
 */
const CONFIG = {
    SELECTORS: {
      MESSAGE_LIST: '.msg-conversations-container__conversations-list',
      CHECKBOX: '.msg-selectable-entity__input[type="checkbox"]',
      CHECKBOX_CONTAINER: '.msg-selectable-entity__checkbox-container',
      MESSAGE_ITEM: '.msg-conversation-listitem:not(.msg-conversation-card--archived)',
      ACTION_BAR: '.msg-multisend-action-bar',
      ARCHIVE_BUTTON_SELECTORS: [
        'button[data-control-name="archive_selected"]',
        'button[aria-label*="Archive"]',
        'button[aria-label*="Archivar"]',
        '.msg-multisend-action-button[aria-label*="Archive"]',
        '.msg-multisend-action-button[aria-label*="Archivar"]'
      ]
    },
    TIMING: {
      ELEMENT_TIMEOUT: 5000,
      SCROLL_DELAY: 500,
      CHECK_DELAY: 100,
      ACTION_DELAY: 1000
    },
    MAX_RETRIES: 3
  };
  
  /**
   * State management class for the archiving process
   */
  class ArchiveState {
    constructor() {
      this.isPaused = false;
      this.shouldStop = false;
      this.currentProgress = 0;
      this.currentLanguage = chrome.i18n.getUILanguage();
    }
  
    /**
     * Updates the current progress and notifies the popup
     * @param {number} count - Current count of selected messages
     */
    updateProgress(count) {
      this.currentProgress = count;
      chrome.runtime.sendMessage({ 
        type: 'updateProgress', 
        count: count 
      });
      this.log('messageSelected', { count: this.currentProgress });
    }
  
    /**
     * Logs a message using the current language
     * @param {string} messageKey - The i18n message key
     * @param {Object} [placeholders] - Optional placeholders for the message
     */
    log(messageKey, placeholders = {}) {
      const message = chrome.i18n.getMessage(messageKey, Object.values(placeholders));
      console.log(message);
    }
  
    /**
     * Resets the state to initial values
     */
    reset() {
      this.isPaused = false;
      this.shouldStop = false;
      this.currentProgress = 0;
    }
  }
  
  const state = new ArchiveState();
  
  /**
   * Waits for an element to be present in the DOM
   * @param {string} selector - CSS selector to find the element
   * @param {number} [timeout=5000] - Maximum time to wait in milliseconds
   * @returns {Promise<Element>} The found element
   * @throws {Error} If element is not found within timeout
   */
  async function waitForElement(selector, timeout = CONFIG.TIMING.ELEMENT_TIMEOUT) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }
  
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          observer.disconnect();
          reject(new Error(chrome.i18n.getMessage('errorElementTimeout', [selector])));
        }
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
  
  /**
   * Scrolls to the bottom of the message list to load all messages
   * @returns {Promise<void>}
   */
  async function scrollToBottom() {
    state.log('loadingMessages');
    const messageList = document.querySelector(CONFIG.SELECTORS.MESSAGE_LIST);
    if (!messageList) return;
  
    let previousHeight = 0;
    let noChangeCount = 0;
    const maxNoChange = 3;
  
    while (noChangeCount < maxNoChange) {
      messageList.scrollTo(0, messageList.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, CONFIG.TIMING.SCROLL_DELAY));
      
      const currentHeight = messageList.scrollHeight;
      
      if (currentHeight === previousHeight) {
        noChangeCount++;
      } else {
        noChangeCount = 0;
      }
      
      previousHeight = currentHeight;
    }
  
    messageList.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, CONFIG.TIMING.SCROLL_DELAY));
    state.log('scrollCompleted');
  }
  
  /**
   * Checks if an element is visible in the viewport
   * @param {Element} element - The element to check
   * @returns {boolean} True if the element is visible
   */
  function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }
  
  /**
   * Selects messages in the list with retry capability
   * @param {number} maxAttempts - Maximum number of selection attempts
   * @returns {Promise<Object>} Result object with selection status
   */
  async function selectMessages(maxAttempts = CONFIG.MAX_RETRIES) {
    let attemptCount = 0;
    let allSelected = false;
    let totalSelected = 0;
  
    while (!allSelected && attemptCount < maxAttempts && !state.shouldStop) {
      attemptCount++;
      state.log('startingSelection', { attempt: attemptCount });
  
      const messageList = document.querySelector(CONFIG.SELECTORS.MESSAGE_LIST);
      let currentScroll = 0;
      const scrollStep = window.innerHeight / 2;
  
      while (currentScroll < messageList.scrollHeight && !state.shouldStop) {
        await handlePauseAndStop();
        if (state.shouldStop) break;
  
        const checkboxes = document.querySelectorAll(
          `${CONFIG.SELECTORS.MESSAGE_ITEM} ${CONFIG.SELECTORS.CHECKBOX}`
        );
  
        for (const checkbox of checkboxes) {
          await handlePauseAndStop();
          if (state.shouldStop) break;
  
          try {
            if (await selectSingleMessage(checkbox)) {
              totalSelected++;
              state.updateProgress(totalSelected);
            }
          } catch (error) {
            console.error(chrome.i18n.getMessage('errorSelectingMessage'), error);
          }
        }
  
        if (state.shouldStop) break;
        
        messageList.scrollBy(0, scrollStep);
        await new Promise(resolve => setTimeout(resolve, CONFIG.TIMING.SCROLL_DELAY));
        currentScroll += scrollStep;
      }
  
      if (state.shouldStop) break;
  
      const unselectedCount = await checkUnselectedMessages();
      allSelected = unselectedCount === 0;
      
      if (!allSelected && !state.shouldStop) {
        state.log('retryingSelection', { count: unselectedCount });
        await new Promise(resolve => setTimeout(resolve, CONFIG.TIMING.ACTION_DELAY));
      }
    }
  
    return { totalSelected, allSelected };
  }
  
  /**
   * Handles pause and stop states
   * @returns {Promise<void>}
   */
  async function handlePauseAndStop() {
    while (state.isPaused && !state.shouldStop) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.TIMING.CHECK_DELAY));
    }
  }
  
  /**
   * Attempts to select a single message
   * @param {Element} checkbox - The checkbox element to select
   * @returns {Promise<boolean>} True if message was selected
   */
  async function selectSingleMessage(checkbox) {
    if (!checkbox.checked) {
      const container = checkbox.closest(CONFIG.SELECTORS.CHECKBOX_CONTAINER);
      if (container && isElementVisible(container)) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.TIMING.CHECK_DELAY));
        container.click();
        return true;
      }
    }
    return false;
  }
  
  /**
   * Counts unselected messages
   * @returns {Promise<number>} Number of unselected messages
   */
  async function checkUnselectedMessages() {
    const unselectedCheckboxes = document.querySelectorAll(
      `${CONFIG.SELECTORS.MESSAGE_ITEM} ${CONFIG.SELECTORS.CHECKBOX}:not(:checked)`
    );
    return unselectedCheckboxes.length;
  }
  
  /**
   * Finds the bulk archive button in the interface
   * @returns {Promise<Element|null>} The archive button if found
   */
  async function findBulkArchiveButton() {
    state.log('searchingArchiveButton');
    
    const actionBar = await waitForElement(CONFIG.SELECTORS.ACTION_BAR, 2000).catch(() => null);
    
    if (actionBar) {
      const buttons = actionBar.querySelectorAll('button');
      for (const button of buttons) {
        if (isArchiveButton(button)) {
          state.log('archiveButtonFound');
          return button;
        }
      }
    }
  
    // Fallback to searching in the entire page
    for (const selector of CONFIG.SELECTORS.ARCHIVE_BUTTON_SELECTORS) {
      const button = document.querySelector(selector);
      if (button) return button;
    }
  
    return null;
  }
  
  /**
   * Checks if a button is the archive button
   * @param {Element} button - Button element to check
   * @returns {boolean} True if it's the archive button
   */
  function isArchiveButton(button) {
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    const text = button.textContent.toLowerCase();
    return ariaLabel.includes('archive') || ariaLabel.includes('archivar') ||
           text.includes('archive') || text.includes('archivar');
  }
  
  /**
   * Main function to handle the message archiving process
   * @param {number} messageDelay - Delay between actions in milliseconds
   * @returns {Promise<Object>} Result of the archiving process
   */
  async function archiveMessages(messageDelay) {
    try {
      state.log('startingProcess');
      state.reset();
      
      const messageList = await waitForElement(CONFIG.SELECTORS.MESSAGE_LIST);
      await scrollToBottom();
      
      const { totalSelected, allSelected } = await selectMessages(CONFIG.MAX_RETRIES);
      
      if (state.shouldStop) {
        return { 
          count: state.currentProgress, 
          debug: chrome.i18n.getMessage('processingStopped') 
        };
      }
  
      if (totalSelected === 0) {
        return { 
          count: 0, 
          debug: chrome.i18n.getMessage('noMessages') 
        };
      }
  
      const archiveButton = await findBulkArchiveButton();
      if (!archiveButton) {
        throw new Error(chrome.i18n.getMessage('errorArchiveButton'));
      }
  
      if (!state.shouldStop) {
        archiveButton.click();
        await new Promise(resolve => setTimeout(resolve, messageDelay));
      }
  
      return { 
        count: totalSelected,
        debug: chrome.i18n.getMessage('archiveSuccess', [totalSelected]) +
              (!allSelected ? chrome.i18n.getMessage('warningIncomplete') : '')
      };
    } catch (error) {
      console.error(chrome.i18n.getMessage('errorArchiveProcess'), error);
      throw error;
    }
  }
  
  // Message handler setup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const handlers = {
      'archiveAll': () => {
        archiveMessages(request.messageDelay)
          .then(result => sendResponse({ success: true, ...result }))
          .catch(error => sendResponse({ 
            success: false, 
            error: chrome.i18n.getMessage('errorGeneric', [error.message]) 
          }));
        return true;
      },
      'pause': () => {
        state.isPaused = true;
        state.log('processPaused');
        sendResponse({ success: true });
        return true;
      },
      'resume': () => {
        state.isPaused = false;
        state.log('processResumed');
        sendResponse({ success: true });
        return true;
      },
      'stop': () => {
        state.shouldStop = true;
        state.isPaused = false;
        state.log('processStopped');
        sendResponse({ success: true });
        return true;
      },
      'setLanguage': () => {
        state.currentLanguage = request.language;
        sendResponse({ success: true });
        return true;
      }
    };
  
    const handler = handlers[request.action];
    return handler ? handler() : false;
  });