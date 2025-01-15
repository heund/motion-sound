class MotionSoundGenerator {
    constructor() {
        this.initialized = false;
        this.isPlaying = false;
        
        // UI elements
        this.startButton = document.getElementById('startButton');
        this.statusElement = document.getElementById('status');
        this.motionVisual = document.getElementById('motionVisual');
        this.xElement = document.getElementById('x');
        this.yElement = document.getElementById('y');
        this.zElement = document.getElementById('z');
        
        // Bind methods
        this.handleMotion = this.handleMotion.bind(this);
        this.initialize = this.initialize.bind(this);
        this.toggleSound = this.toggleSound.bind(this);
        
        // Setup event listeners
        this.startButton.addEventListener('click', this.initialize);
    }

    async initialize() {
        if (this.initialized) {
            this.toggleSound();
            return;
        }

        try {
            // Request device motion permission
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                const permissionState = await DeviceMotionEvent.requestPermission();
                if (permissionState === 'granted') {
                    this.setupAudio();
                } else {
                    this.statusElement.textContent = 'Motion permission denied';
                    return;
                }
            } else {
                // Non-iOS devices
                this.setupAudio();
            }
        } catch (error) {
            console.error('Error initializing:', error);
            this.statusElement.textContent = 'Error initializing motion sensors';
        }
    }

    async setupAudio() {
        // Initialize Tone.js
        await Tone.start();
        
        // Create synth
        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.synth.volume.value = -10; // Set to a higher volume
        
        // Add a global limiter
        this.limiter = new Tone.Limiter(-1).toDestination();
        this.synth.connect(this.limiter);

        // Create effects
        this.filter = new Tone.Filter(200, "lowpass").connect(this.limiter);
        this.reverb = new Tone.Reverb(2).connect(this.limiter);
        
        // Connect synth through effects
        this.synth.connect(this.filter);
        this.filter.connect(this.reverb);

        // Log audio context state
        console.log('Audio context state:', Tone.context.state);
        if (Tone.context.state !== 'running') {
            await Tone.context.resume();
            console.log('Audio context resumed');
        }

        // Setup motion listener
        window.addEventListener('devicemotion', this.handleMotion);
        
        this.initialized = true;
        this.isPlaying = true;
        this.startButton.textContent = 'Stop';
        this.statusElement.textContent = 'Move your device to create sound';
    }

    toggleSound() {
        this.isPlaying = !this.isPlaying;
        this.startButton.textContent = this.isPlaying ? 'Stop' : 'Start moving!';
        this.statusElement.textContent = this.isPlaying ? 'Move your device to create sound' : 'Paused';
    }

    handleMotion(event) {
        if (!this.isPlaying) return;

        const x = event.accelerationIncludingGravity.x || 0;
        const y = event.accelerationIncludingGravity.y || 0;
        const z = event.accelerationIncludingGravity.z || 0;

        // Log motion values
        console.log(`Motion values - X: ${x}, Y: ${y}, Z: ${z}`);

        // Update debug display
        this.xElement.textContent = x.toFixed(2);
        this.yElement.textContent = y.toFixed(2);
        this.zElement.textContent = z.toFixed(2);

        // Update visualizer
        const visualX = (x + 10) * 5;
        const visualY = (y + 10) * 5;
        this.motionVisual.style.transform = `translate(${visualX}px, ${visualY}px)`;
        
        // Lower the threshold to trigger sounds more easily
        const totalMotion = Math.abs(x) + Math.abs(y) + Math.abs(z);
        this.motionVisual.style.backgroundColor = totalMotion > 2 ? '#ff4444' : '#4CAF50';
        
        if (totalMotion > 2) { 
            const note = this.mapMotionToNote(y);
            const filterFreq = this.mapMotionToFilter(x);
            const reverbAmount = this.mapMotionToReverb(z);

            this.filter.frequency.value = filterFreq;
            this.reverb.wet.value = reverbAmount;
            
            // Add visual feedback when sound is triggered
            this.statusElement.textContent = `Playing note: ${note}`;
            this.synth.triggerAttackRelease(note, "8n");
        } else {
            this.statusElement.textContent = 'Move device to create sound';
        }
    }

    mapMotionToNote(motion) {
        // Map Y motion to pentatonic scale notes
        const notes = ["C4", "D4", "E4", "G4", "A4", "C5"];
        const index = Math.floor(Math.map(motion, -10, 10, 0, notes.length));
        return notes[Math.clamp(index, 0, notes.length - 1)];
    }

    mapMotionToFilter(motion) {
        // Map X motion to filter frequency
        return Math.map(Math.abs(motion), 0, 10, 200, 2000);
    }

    mapMotionToReverb(motion) {
        // Map Z motion to reverb amount
        return Math.map(Math.abs(motion), 0, 10, 0, 0.8);
    }
}

// Utility functions
Math.map = (value, in_min, in_max, out_min, out_max) => {
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

Math.clamp = (num, min, max) => Math.min(Math.max(num, min), max);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new MotionSoundGenerator();
});
