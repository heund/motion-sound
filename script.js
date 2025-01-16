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
        this.circle = document.getElementById('circle');
        
        // Bind methods
        this.handleMotion = this.handleMotion.bind(this);
        this.initialize = this.initialize.bind(this);
        this.toggleSound = this.toggleSound.bind(this);
        
        // Setup event listeners
        this.startButton.addEventListener('click', this.initialize);
        window.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            this.circle.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
        });
        this.circle.addEventListener('click', () => {
            this.circle.classList.toggle('active');
        });
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
        
        // Create FM synth
        this.fmSynth = new Tone.FMSynth().toDestination();
        this.fmSynth.volume.value = -15;
        this.limiter = new Tone.Limiter(-20).toDestination();
        this.reverb = new Tone.Reverb(5).toDestination();
        this.delay = new Tone.FeedbackDelay(0.5).toDestination();

        this.fmSynth.connect(this.reverb);
        this.reverb.connect(this.delay);
        this.delay.connect(this.limiter);

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
        const visualX = (x + 10) * 10; // Adjust scaling factor for better visibility
        const visualY = (y + 10) * 10;
        this.motionVisual.style.transform = `translate(${visualX}px, ${visualY}px)`;
        
        // Lower the threshold to trigger sounds more easily
        const totalMotion = Math.abs(x) + Math.abs(y) + Math.abs(z);
        this.motionVisual.style.backgroundColor = totalMotion > 2 ? '#ff4444' : '#4CAF50';
        
        if (totalMotion > 2) { 
            const note = this.mapMotionToNote(y);
            const filterFreq = this.mapMotionToFilter(x);
            const reverbAmount = this.mapMotionToReverb(z);

            // Adjust sound based on motion intensity
            const intensity = Math.abs(event.acceleration.x) + Math.abs(event.acceleration.y) + Math.abs(event.acceleration.z);
            this.fmSynth.triggerAttackRelease(note, "8n", Tone.now(), intensity * 0.02);
            this.delay.delayTime.value = intensity * 0.01;
            this.reverb.decay = intensity * 0.5;

            // Add visual feedback when sound is triggered
            this.statusElement.textContent = `Playing note: ${note}`;
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
