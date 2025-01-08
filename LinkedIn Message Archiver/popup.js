/**
 * @fileoverview Popup controller for LinkedIn Message Archiver extension
 * @author Ronny M. Escalona
 * @version 1.0.0
 * @license MIT
 */

class PopupController {
    /**
     * @constructor
     */
    constructor() {
      /** @private {?number} */
      this.currentTabId = null;
      
      /** @private {boolean} */
      this.isProcessing = false;
      
      /** @private {boolean} */
      this.isPaused = false;
      
      /** @private {string} */
      this.currentLanguage = 'es';
  
      /** @private {Object} */
      this.elements = {};
  
      /** @private {Object} */
      this.CONFIG = {
        SELECTORS: {
          title: '#title',
          startButton: '#startArchive',
          pauseButton: '#pauseButton',
          stopButton: '#stopButton',
          controls: '#controls',
          selectedCount: '#selectedCount',
          status: '#status',
          languageSelect: '#languageSelect',
          messagesText: '#messagesText'
        },
        CLASSES: {
          visible: 'visible',
          error: 'status-error',
          warning: 'status-warning',
          success: 'status-success'
        },
        COLORS: {
          pause: '#f59e0b',
          resume: '#059669'
        },
        URL_PATTERN: 'linkedin.com/messaging'
      };
    }
  
    /**
     * Initializes the popup controller
     * @public
     */
    async init() {
      try {
        await this.initializeElements();
        await this.loadStoredLanguage();
        await this.getCurrentTab();
        this.initializeEventListeners();
        this.initializeMessageListener();
        console.info('Popup initialized successfully');
      } catch (error) {
        console.error('Error initializing popup:', error);
        this.showError(chrome.i18n.getMessage('errorInitialization'));
      }
    }
  
    /**
     * Initializes DOM element references
     * @private
     */
    initializeElements() {
      for (const [key, selector] of Object.entries(this.CONFIG.SELECTORS)) {
        this.elements[key] = document.querySelector(selector);
        if (!this.elements[key]) {
          throw new Error(`Element not found: ${selector}`);
        }
      }
    }
  
    /**
     * Loads stored language preference
     * @private
     */
    async loadStoredLanguage() {
      try {
        const { language } = await chrome.storage.local.get(['language']);
        this.currentLanguage = language || 'es';
        this.elements.languageSelect.value = this.currentLanguage;
        this.updateTexts();
      } catch (error) {
        console.error('Error loading language:', error);
      }
    }
  
    /**
     * Gets current active tab
     * @private
     */
    async getCurrentTab() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        this.currentTabId = tab?.id;
      } catch (error) {
        console.error('Error getting current tab:', error);
      }
    }
  
    /**
     * Updates interface texts based on current language
     * @private
     */
    updateTexts() {
      const texts = {
        title: 'title',
        startButton: 'startButton',
        pauseButton: this.isPaused ? 'resumeButton' : 'pauseButton',
        stopButton: 'stopButton',
        messagesText: 'messagesCount'
      };
  
      for (const [element, messageKey] of Object.entries(texts)) {
        if (this.elements[element]) {
          this.elements[element].textContent = chrome.i18n.getMessage(messageKey);
        }
      }
    }
  
    /**
     * Initializes all event listeners
     * @private
     */
    initializeEventListeners() {
      // Language change handler
      this.elements.languageSelect.addEventListener('change', 
        this.handleLanguageChange.bind(this));
  
      // Button click handlers
      this.elements.startButton.addEventListener('click', 
        this.handleStartClick.bind(this));
      this.elements.pauseButton.addEventListener('click', 
        this.handlePauseClick.bind(this));
      this.elements.stopButton.addEventListener('click', 
        this.handleStopClick.bind(this));
    }
  
    /**
     * Initializes message listener for progress updates
     * @private
     */
    initializeMessageListener() {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'updateProgress') {
          this.updateProgress(message.count);
        }
      });
    }
  
    /**
     * Handles language change event
     * @private
     * @param {Event} event - Change event
     */
    async handleLanguageChange(event) {
      try {
        this.currentLanguage = event.target.value;
        await chrome.storage.local.set({ language: this.currentLanguage });
        this.updateTexts();
        
        if (this.currentTabId) {
          await chrome.tabs.sendMessage(this.currentTabId, { 
            action: 'setLanguage', 
            language: this.currentLanguage 
          });
        }
      } catch (error) {
        console.error('Error changing language:', error);
        this.showError(chrome.i18n.getMessage('errorLanguageChange'));
      }
    }
  
    /**
     * Handles start button click
     * @private
     */
    async handleStartClick() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes(this.CONFIG.URL_PATTERN)) {
          throw new Error(chrome.i18n.getMessage('errorLinkedIn'));
        }
  
        this.isProcessing = true;
        this.elements.controls.classList.add(this.CONFIG.CLASSES.visible);
        this.elements.startButton.disabled = true;
        this.updateProgress(0);
  
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'archiveAll',
          messageDelay: 1000,
          language: this.currentLanguage
        });
      } catch (error) {
        console.error('Error starting process:', error);
        this.showError(error.message);
      }
    }
  
    /**
     * Handles pause button click
     * @private
     */
    async handlePauseClick() {
      if (!this.currentTabId) return;
  
      try {
        this.isPaused = !this.isPaused;
        
        await chrome.tabs.sendMessage(this.currentTabId, { 
          action: this.isPaused ? 'pause' : 'resume',
          language: this.currentLanguage
        });
  
        this.updatePauseButton();
      } catch (error) {
        console.error('Error toggling pause:', error);
        this.showError(chrome.i18n.getMessage('errorPauseToggle'));
      }
    }
  
    /**
     * Updates pause button state
     * @private
     */
    updatePauseButton() {
      this.elements.pauseButton.textContent = chrome.i18n.getMessage(
        this.isPaused ? 'resumeButton' : 'pauseButton'
      );
      this.elements.pauseButton.style.backgroundColor = this.isPaused ? 
        this.CONFIG.COLORS.resume : 
        this.CONFIG.COLORS.pause;
    }
  
    /**
     * Handles stop button click
     * @private
     */
    async handleStopClick() {
      if (!this.currentTabId) return;
  
      try {
        await chrome.tabs.sendMessage(this.currentTabId, { 
          action: 'stop',
          language: this.currentLanguage
        });
  
        this.resetInterface();
      } catch (error) {
        console.error('Error stopping process:', error);
        this.showError(chrome.i18n.getMessage('errorStopProcess'));
      }
    }
  
    /**
     * Updates progress counter
     * @private
     * @param {number} count - Number of processed messages
     */
    updateProgress(count) {
      this.elements.selectedCount.textContent = count;
    }
  
    /**
     * Resets interface to initial state
     * @private
     */
    resetInterface() {
      this.isProcessing = false;
      this.elements.controls.classList.remove(this.CONFIG.CLASSES.visible);
      this.elements.startButton.disabled = false;
      this.updateProgress(0);
    }
  
    /**
     * Shows error message
     * @private
     * @param {string} message - Error message to display
     */
    showError(message) {
      this.elements.status.textContent = message;
      this.elements.status.className = `status ${this.CONFIG.CLASSES.error}`;
      setTimeout(() => {
        this.elements.status.textContent = '';
        this.elements.status.className = 'status';
      }, 5000);
    }
  }
  
  // Initialize popup when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const popup = new PopupController();
    popup.init().catch(error => {
      console.error('Failed to initialize popup:', error);
    });
  });