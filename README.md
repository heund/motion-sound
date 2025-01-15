# Motion Sound Experiment

An interactive web experiment that generates sounds based on device motion. Move your device to create dynamic audio patterns.

## Requirements

- Must be served over HTTPS (device motion APIs require a secure context)
- Works best on mobile devices with motion sensors
- Modern browser that supports the Web Audio API and Device Motion API

## Setup

### Local Testing
1. Use a local server (e.g., Python's `http.server` or VS Code's Live Server)
2. Access via `localhost`

### Web Deployment
1. Upload to a web server with HTTPS support
2. Ensure all files are in the same directory structure:
   ```
   motion_sound/
   ├── index.html
   ├── styles.css
   ├── script.js
   └── README.md
   ```

### GitHub Pages Deployment
1. Create a new repository
2. Push these files
3. Enable GitHub Pages in repository settings
4. Access via `https://yourusername.github.io/repository-name`

## Usage

1. Open on a mobile device
2. Tap "Start" to grant motion permissions
3. Move device to generate sounds:
   - Tilt forward/back: Change notes
   - Tilt left/right: Adjust filter
   - Roll: Control reverb amount

## Browser Support

- iOS Safari: 12.2+
- Android Chrome: Latest version
- Other mobile browsers with Device Motion API support
