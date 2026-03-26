/* ============================================================
   SAM & SOFIA — PREMIUM WEDDING INVITATION
   JavaScript: Curtain, Scratch Cards, Confetti, Countdown,
               Sound, Language Toggle, Scroll Animations
   ============================================================ */

(function () {
    'use strict';

    // ── CONFIG ──────────────────────────────────────────────
    const WEDDING_DATE = new Date('2026-04-29T19:30:00');
    const SCRATCH_REVEAL_THRESHOLD = 0.45; // 45% scratched to auto-reveal

    // ── STATE ───────────────────────────────────────────────
    let currentLang = 'en';
    let soundEnabled = false;
    let audioCtx = null;
    let scratchedCount = 0;
    let confettiFired = false;
    let curtainOpened = false;
    
    // Scratch Synth State
    let scratchOsc = null;
    let scratchGain = null;
    let scratchFilter = null;

    // ── DOM REFS ────────────────────────────────────────────
    const curtainOverlay = document.getElementById('curtain-overlay');
    const enterBtn = document.getElementById('enter-btn');
    const topBar = document.getElementById('top-bar');
    const soundToggle = document.getElementById('sound-toggle');
    const soundIconOn = document.getElementById('sound-icon-on');
    const soundIconOff = document.getElementById('sound-icon-off');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiCtx = confettiCanvas.getContext('2d');
    const mainContent = document.getElementById('main-content');

    // ── INITIALIZATION ──────────────────────────────────────
    document.body.classList.add('curtain-closed');

    function init() {
        setupCurtain();
        setupLanguageToggle();
        setupSoundToggle();
        setupScratchCards();
        setupCountdown();
        setupScrollAnimations();
        initDustCanvas();
        setup3DTilt();
        resizeConfettiCanvas();
        window.addEventListener('resize', resizeConfettiCanvas);
    }

    // ── CURTAIN ─────────────────────────────────────────────
    function setupCurtain() {
        enterBtn.addEventListener('click', openCurtain);
    }

    function openCurtain() {
        if (curtainOpened) return;
        curtainOpened = true;

        // Auto-enable sound upon first user interaction
        if (!soundEnabled) {
            soundEnabled = true;
            soundIconOn.style.display = 'block';
            soundIconOff.style.display = 'none';
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            playBackgroundAmbience();
        }

        curtainOverlay.classList.add('open');
        document.body.classList.remove('curtain-closed');

        document.getElementById('flare-overlay').classList.add('flare-active');

        if (soundEnabled) playRealisticOpening();

        setTimeout(() => {
            topBar.classList.add('visible');
            soundToggle.classList.add('visible');
            scrollIndicator.classList.add('visible');
        }, 1200);

        setTimeout(() => {
            curtainOverlay.classList.add('hidden');
        }, 2500);

        setTimeout(() => {
            animateHero();
        }, 1200);
    }

    function animateHero() {
        const lines = document.querySelectorAll('.invitation-line');
        const namesBlock = document.querySelector('.names-block');
        const welcomeText = document.querySelector('.welcome-text');

        lines.forEach((line, i) => {
            setTimeout(() => line.classList.add('animate'), i * 200);
        });

        setTimeout(() => namesBlock.classList.add('animate'), 600);
        setTimeout(() => welcomeText.classList.add('animate'), 800);
    }

    // ── LANGUAGE TOGGLE ─────────────────────────────────────
    function setupLanguageToggle() {
        const buttons = document.querySelectorAll('.lang-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                if (lang === currentLang) return;
                currentLang = lang;

                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                updateLanguage(lang);
            });
        });
    }

    function updateLanguage(lang) {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-' + lang + ']').forEach(el => {
            el.innerHTML = el.getAttribute('data-' + lang); // Allow <br> inside translation
        });

        document.querySelectorAll('[data-' + lang + '-placeholder]').forEach(el => {
            el.placeholder = el.getAttribute('data-' + lang + '-placeholder');
        });
    }

    // ── SOUND SYSTEM ────────────────────────────────────────
    function setupSoundToggle() {
        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            soundIconOn.style.display = soundEnabled ? 'block' : 'none';
            soundIconOff.style.display = soundEnabled ? 'none' : 'block';

            if (soundEnabled && !audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (soundEnabled) {
                playBackgroundAmbience();
            } else {
                stopBackgroundAmbience();
            }
        });
    }

    let ambienceInterval = null;
    let ambienceGain = null;

    function playBackgroundAmbience() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        ambienceGain = audioCtx.createGain();
        ambienceGain.gain.value = 0.4;
        ambienceGain.connect(audioCtx.destination);
        
        // Classic romantic progression: C G Am F
        const chords = [
            [261.63, 329.63, 392.00, 523.25], // C Major
            [196.00, 246.94, 293.66, 392.00], // G Major
            [220.00, 261.63, 329.63, 440.00], // A Minor
            [174.61, 220.00, 261.63, 349.23]  // F Major
        ];
        
        let chordIndex = 0;
        let noteIndex = 0;
        
        function playNote() {
            if (!ambienceGain || !audioCtx) return;
            const freq = chords[chordIndex][noteIndex];
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'triangle'; // Sweet harp-like tone
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);
            
            osc.connect(gain);
            gain.connect(ambienceGain);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 2.6);
            
            noteIndex++;
            if (noteIndex >= 4) {
                noteIndex = 0;
                chordIndex = (chordIndex + 1) % chords.length;
            }
        }
        
        ambienceInterval = setInterval(playNote, 400); // Gentle arpeggio timing
    }

    function stopBackgroundAmbience() {
        if (ambienceInterval) {
            clearInterval(ambienceInterval);
            ambienceInterval = null;
        }
        if (ambienceGain) {
            ambienceGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
            setTimeout(() => { ambienceGain = null; }, 1600);
        }
    }

    function playRealisticOpening() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        // Deep swoosh
        const bufferSize = audioCtx.sampleRate * 2; 
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; 
        }

        const noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.8);
        filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 2);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noiseNode.start();
        
        // Crystalline Sparkle Chime
        const chimeNotes = [523.25, 783.99, 1046.50, 1567.98, 2093.00];
        chimeNotes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const vca = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                vca.gain.setValueAtTime(0, audioCtx.currentTime);
                vca.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
                vca.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.5);
                osc.connect(vca);
                vca.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 2.6);
            }, i * 120 + 600);
        });
    }

    function startScratchSound() {
        if (!soundEnabled || !audioCtx) return;
        if (scratchOsc) return; // Already scratching
        
        // Create noise buffer for scratch
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        scratchOsc = audioCtx.createBufferSource();
        scratchOsc.buffer = buffer;
        scratchOsc.loop = true;

        scratchFilter = audioCtx.createBiquadFilter();
        scratchFilter.type = 'bandpass';
        scratchFilter.frequency.value = 2000;
        scratchFilter.Q.value = 0.5;

        scratchGain = audioCtx.createGain();
        scratchGain.gain.setValueAtTime(0, audioCtx.currentTime);
        scratchGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);

        scratchOsc.connect(scratchFilter);
        scratchFilter.connect(scratchGain);
        scratchGain.connect(audioCtx.destination);

        scratchOsc.start();
    }

    function modulateScratchSound(speed) {
        if (!scratchFilter) return;
        // Modulate frequency based on scratching speed
        const targetFreq = 1000 + Math.min(speed * 300, 3000);
        scratchFilter.frequency.linearRampToValueAtTime(targetFreq, audioCtx.currentTime + 0.05);
    }

    function stopScratchSound() {
        if (!scratchGain) return;
        scratchGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        setTimeout(() => {
            if (scratchOsc) {
                try { scratchOsc.stop(); } catch(e){}
                scratchOsc = null;
                scratchGain = null;
                scratchFilter = null;
            }
        }, 110);
    }

    function playScratchFinishSound() {
        if (!soundEnabled || !audioCtx) return;
        
        // Little magial blip
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }

    function playConfettiSound() {
        if (!soundEnabled || !audioCtx) return;

        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                // Alternating sine and square for pop and shimmer
                osc.type = i % 2 === 0 ? 'sine' : 'square';
                
                const freq = 1500 + Math.random() * 2500;
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + 0.3);
                
                gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.5);
            }, i * 60);
        }
    }

    // ── SCRATCH CARDS ───────────────────────────────────────
    function setupScratchCards() {
        const cards = document.querySelectorAll('.scratch-card');
        const hint = document.querySelector('.scratch-hint');

        setTimeout(() => hint.classList.add('visible'), 500);

        cards.forEach((card, index) => {
            const canvas = card.querySelector('.scratch-canvas');
            const rect = card.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) || 120;
            
            canvas.width = size * 2;
            canvas.height = size * 2;
            const ctx = canvas.getContext('2d');
            ctx.scale(2, 2);

            drawFoil(ctx, size / 2, size / 2, size / 2 - 2);

            let isScratching = false;
            let scratched = false;
            let lastPos = {x: 0, y: 0};
            let lastTime = 0;

            function getPos(e) {
                const bounds = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return {
                    x: (clientX - bounds.left) * (size / bounds.width),
                    y: (clientY - bounds.top) * (size / bounds.height)
                };
            }

            function scratch(e) {
                if (!isScratching || scratched) return;
                e.preventDefault();
                const pos = getPos(e);
                
                // Calculate scratch speed for audio
                const now = performance.now();
                const dt = now - lastTime;
                const dx = pos.x - lastPos.x;
                const dy = pos.y - lastPos.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const speed = dist / (dt || 1);
                
                if (soundEnabled) modulateScratchSound(speed);

                lastPos = pos;
                lastTime = now;

                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size * 0.12, 0, Math.PI * 2);
                ctx.fill();

                checkScratchProgress(ctx, canvas, size, index);
            }

            function checkScratchProgress(ctx, canvas, size, cardIndex) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
                let transparent = 0;
                let total = 0;

                for (let i = 3; i < pixels.length; i += 16) {
                    total++;
                    if (pixels[i] < 128) transparent++;
                }

                if (transparent / total > SCRATCH_REVEAL_THRESHOLD && !scratched) {
                    scratched = true;
                    isScratching = false;
                    stopScratchSound();

                    canvas.style.transition = 'opacity 0.6s ease';
                    canvas.style.opacity = '0';
                    setTimeout(() => canvas.style.display = 'none', 600);

                    playScratchFinishSound();
                    scratchedCount++;

                    if (scratchedCount >= 3) {
                        onAllScratched();
                    }
                }
            }

            // Events
            const startEvent = (e) => {
                if (scratched) return;
                isScratching = true;
                lastPos = getPos(e);
                lastTime = performance.now();
                startScratchSound();
                scratch(e);
            };
            const stopEvent = () => {
                isScratching = false;
                stopScratchSound();
            };

            canvas.addEventListener('mousedown', startEvent);
            canvas.addEventListener('mousemove', scratch);
            window.addEventListener('mouseup', stopEvent);
            canvas.addEventListener('mouseleave', stopEvent);

            canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startEvent(e); }, { passive: false });
            canvas.addEventListener('touchmove', (e) => { scratch(e); }, { passive: false });
            window.addEventListener('touchend', stopEvent);
        });
    }

    function drawFoil(ctx, cx, cy, radius) {
        // Creates a rich realistic foil texture
        const gradient = ctx.createRadialGradient(
            cx - radius * 0.4, cy - radius * 0.4, 0,
            cx, cy, radius
        );
        gradient.addColorStop(0, '#f9edd1');
        gradient.addColorStop(0.3, '#d4a843');
        gradient.addColorStop(0.5, '#8b6914');
        gradient.addColorStop(0.7, '#c9a84c');
        gradient.addColorStop(1, '#a07c1e');

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Overlay noise texture for metallic grain
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for(let i=0; i<100; i++) {
            ctx.beginPath();
            ctx.arc(
                cx + (Math.random()-0.5) * radius * 2,
                cy + (Math.random()-0.5) * radius * 2,
                Math.random() * 3, 0, Math.PI*2
            );
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.stroke();
    }

    function onAllScratched() {
        if (confettiFired) return;
        confettiFired = true;

        const marriedText = document.querySelector('.married-text');
        marriedText.classList.add('visible');

        const hint = document.querySelector('.scratch-hint');
        hint.classList.add('hidden');

        // Unlock scrolling sections
        const locked = document.getElementById('locked-sections');
        if (locked) {
            locked.classList.add('unlocked');
            // Allow a tiny delay for display: block to apply before transitioning opacity
            setTimeout(() => {
                locked.classList.add('show');
                // Scroll down automatically to hint that more content is available
                window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' });
            }, 100);
        }

        // Trigger new explosive floating wedding emojis
        releaseWeddingAnimations();

        fireConfetti();
        playConfettiSound();
    }

    function releaseWeddingAnimations() {
        const emojis = ['🤍', '✨', '🕊️', '💍', '🥂', '💖'];
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '9999';
        container.style.overflow = 'hidden';
        document.body.appendChild(container);

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const el = document.createElement('div');
                el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
                el.style.position = 'absolute';
                el.style.left = (Math.random() * 100) + 'vw';
                el.style.top = '100vh';
                el.style.fontSize = (Math.random() * 25 + 15) + 'px';
                el.style.opacity = '1';
                el.style.transform = `translateX(${(Math.random() - 0.5) * 50}px)`;
                el.style.transition = `top ${Math.random() * 2 + 3}s ease-out, opacity ${Math.random() * 2 + 3}s ease-out, transform ${Math.random() * 2 + 3}s ease-out`;

                container.appendChild(el);

                // Start floating up next frame
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        el.style.top = '-10vh';
                        el.style.opacity = '0';
                        el.style.transform = `translateX(${(Math.random() - 0.5) * 200}px) rotate(${Math.random() * 360}deg)`;
                    });
                });

                // Cleanup individual element
                setTimeout(() => {
                    if(el.parentNode) el.remove();
                }, 6000);
            }, i * 60);
        }

        // Cleanup container
        setTimeout(() => {
            if(container.parentNode) container.remove();
        }, 12000);
    }

    // ── CONFETTI ────────────────────────────────────────────
    function resizeConfettiCanvas() {
        confettiCanvas.width = window.innerWidth * 2;
        confettiCanvas.height = window.innerHeight * 2;
        confettiCanvas.style.width = window.innerWidth + 'px';
        confettiCanvas.style.height = window.innerHeight + 'px';
        confettiCtx.scale(2, 2);
    }

    function fireConfetti() {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const particles = [];
        const colors = [
            '#4a5a3a', '#6b7e58', '#3a4a2a', '#8a9a78', '#c9a84c', '#f5f0e8'
        ];

        for (let i = 0; i < 200; i++) {
            particles.push({
                x: W / 2 + (Math.random() - 0.5) * W * 0.8,
                y: H * 0.4 + (Math.random() - 0.5) * 150,
                vx: (Math.random() - 0.5) * 15,
                vy: -(Math.random() * 10 + 5),
                w: Math.random() * 8 + 4,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 20,
                gravity: 0.15 + Math.random() * 0.1,
                opacity: 1,
                delay: Math.random() * 400,
            });
        }

        const startTime = performance.now();

        function animateConfetti(time) {
            confettiCtx.clearRect(0, 0, W, H);
            let activeCount = 0;

            particles.forEach(p => {
                const elapsed = time - startTime;
                if (elapsed < p.delay) return;

                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.98;
                p.rotation += p.rotationSpeed;

                if (p.y > H * 0.7) p.opacity -= 0.015;

                if (p.opacity <= 0 || p.y > H + 50) return;
                activeCount++;

                confettiCtx.save();
                confettiCtx.translate(p.x, p.y);
                confettiCtx.rotate((p.rotation * Math.PI) / 180);
                confettiCtx.globalAlpha = Math.max(0, p.opacity);
                confettiCtx.fillStyle = p.color;
                confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                // Glossy touch
                confettiCtx.fillStyle = 'rgba(255,255,255,0.4)';
                confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h/2);
                confettiCtx.restore();
            });

            if (activeCount > 0) {
                requestAnimationFrame(animateConfetti);
            } else {
                confettiCtx.clearRect(0, 0, W, H);
            }
        }
        requestAnimationFrame(animateConfetti);
    }

    // ── COUNTDOWN TIMER ─────────────────────────────────────
    function setupCountdown() {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    function updateCountdown() {
        const now = new Date();
        const diff = WEDDING_DATE - now;

        if (diff <= 0) {
            document.getElementById('cd-days').textContent = '0';
            document.getElementById('cd-hours').textContent = '0';
            document.getElementById('cd-min').textContent = '0';
            document.getElementById('cd-sec').textContent = '0';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        document.getElementById('cd-days').textContent = days;
        document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('cd-min').textContent = String(minutes).padStart(2, '0');
        document.getElementById('cd-sec').textContent = String(seconds).padStart(2, '0');
    }

    // ── SCROLL ANIMATIONS & PARALLAX ────────────────────────
    function setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.anim-item').forEach(el => observer.observe(el));

        // Parallax
        const parallaxItems = document.querySelectorAll('.parallax-item');
        let ticked = false;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 150) {
                scrollIndicator.classList.remove('visible');
            }

            if (!ticked) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    parallaxItems.forEach(item => {
                        const speed = parseFloat(item.getAttribute('data-speed')) || 0;
                        item.style.transform = `translateY(${scrollY * speed}px)`;
                    });
                    ticked = false;
                });
                ticked = true;
            }
        }, { passive: true });

        const revealSection = document.getElementById('reveal');
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const hint = document.querySelector('.scratch-hint');
                    if (!hint.classList.contains('hidden')) {
                        hint.classList.add('visible');
                    }
                }
            });
        }, { threshold: 0.3 });

        revealObserver.observe(revealSection);
    }

    // ── EXTRA EFFECTS ────────────────────────────────────────
    function initDustCanvas() {
        const canvas = document.getElementById('dust-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        const particles = [];
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 2 + 0.5,
                dx: (Math.random() - 0.5) * 0.4,
                dy: (Math.random() - 0.5) * 0.4,
                alpha: Math.random() * 0.5 + 0.1
            });
        }
        function render() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.x += p.dx;
                p.y += p.dy;
                if (p.x < 0 || p.x > width) p.dx *= -1;
                if (p.y < 0 || p.y > height) p.dy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(201, 168, 76, ${p.alpha})`;
                ctx.fill();
            });
            requestAnimationFrame(render);
        }
        render();
        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });
    }

    function setup3DTilt() {
        const panels = document.querySelectorAll('.glass-panel');
        panels.forEach(panel => {
            panel.addEventListener('mousemove', e => {
                const rect = panel.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                // Reduce the intensity string calculation
                const tiltX = (y - centerY) / -40;
                const tiltY = (x - centerX) / 40;
                panel.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
                panel.style.transition = 'transform 0.1s ease-out';
            });
            panel.addEventListener('mouseleave', () => {
                panel.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                panel.style.transition = 'transform 0.6s ease';
            });
        });
    }

    // ── START ────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', init);

})();
