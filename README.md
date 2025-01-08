# LinkedIn Message Archiver

A Chrome extension that helps you automatically archive LinkedIn messages in bulk. This tool streamlines the process of managing your LinkedIn inbox by allowing you to select and archive multiple messages at once.

## Features

- 🚀 Bulk message archiving
- ⏯️ Pause/Resume functionality
- 📊 Real-time progress tracking
- 🌐 Multilingual support (English/Spanish)
- 🌓 Light/Dark theme support
- ⌨️ Keyboard shortcuts

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store](your_store_link)
2. Click "Add to Chrome"
3. Follow the installation prompts

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the directory containing the extension files

## Usage

1. Navigate to LinkedIn Messages (`linkedin.com/messaging`)
2. Click the extension icon in your Chrome toolbar
3. Click "Archive All Messages"
4. Monitor the progress in real-time
5. Use pause/stop buttons as needed

### Keyboard Shortcuts
- Open extension: `Ctrl+Shift+L` (Windows/Linux) or `Command+Shift+L` (Mac)

## Features in Detail

### Bulk Archiving
- Automatically selects and archives multiple messages
- Handles dynamic loading of message lists
- Provides visual feedback during the process

### Progress Control
- Real-time counter of archived messages
- Pause functionality for temporary stops
- Complete stop option with reset capability

### Language Support
- English and Spanish interfaces
- Easy language switching
- Persistent language preference

### Theme Support
- Automatic light/dark mode detection
- Follows system preferences
- LinkedIn-style design integration

## Technical Details

### Built With
- HTML5
- CSS3 (with CSS Variables)
- JavaScript (ES6+)
- Chrome Extension APIs

### Directory Structure

```
LinkedIn Message Archiver/
├── _locales/
│   ├── en/
│   │   └── messages.json
│   └── es/
│       └── messages.json
├── assets/
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon32.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── styles/
│       ├── popup.css
│       └── themes/
│           ├── light.css
│           └── dark.css
├── libs/
│   └── i18n.js
├── background.js
├── content.js
├── popup.html
├── popup.js
└── manifest.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Author

**Ronny M. Escalona**
- LinkedIn: [r-escalona-software-developer](https://www.linkedin.com/in/r-escalona-software-developer/)
- GitHub: [Your GitHub Profile](your_github_profile)

## Acknowledgments

- Thanks to LinkedIn for inspiring this solution
- Special thanks to all contributors and testers
- Icons provided by [Source Name]

## Roadmap

- [ ] Add support for more languages
- [ ] Implement batch size configuration
- [ ] Add message filtering options
- [ ] Create statistics dashboard
- [ ] Add export functionality

## Support

If you encounter any problems or have suggestions, please:
1. Check the [Issues](issues_link) page for existing reports
2. Create a new issue if needed
3. Provide detailed information about your problem

## Version History

* 1.0.0
    * Initial Release
    * Basic archiving functionality
    * Bilingual support

## FAQ

**Q: Is this extension safe to use?**  
A: Yes, the extension only requests necessary permissions and operates solely on LinkedIn's messaging page.

**Q: Will this delete my messages?**  
A: No, it only archives them. You can always access archived messages in LinkedIn.

**Q: Can I undo the archiving?**  
A: Yes, LinkedIn provides functionality to unarchive messages from your archived folder.

---

Made with ❤️ by Ronny M. Escalona
