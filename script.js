/**
 * ============================================================================
 * SCRIPT CLIENT-SIDE (PORTFOLIO ALESSANDRO NARDI)
 * Moduli: Scroll progress, Typing effect, IntersectionObserver counters,
 *         QR Code, Chatbot con fix chiusura e gestione sicura delle API.
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // === CONFIGURAZIONE & COSTANTI ===
    const LINKEDIN_URL = 'https://www.linkedin.com/in/alessandro-nardi-8152a694/';
    
    // Recupero credenziali sicuro (senza dipendenza bloccante da config.js)
    const geminiKey = (typeof SECRET_CONFIG !== 'undefined' && SECRET_CONFIG.GEMINI_API_KEY) 
        ? SECRET_CONFIG.GEMINI_API_KEY.trim() 
        : '';
        
    const webhookUrl = (typeof SECRET_CONFIG !== 'undefined' && SECRET_CONFIG.N8N_WEBHOOK_URL) 
        ? SECRET_CONFIG.N8N_WEBHOOK_URL.trim() 
        : '';

    const SYSTEM_PROMPT = `Sei l'assistente virtuale di Alessandro Nardi, AI enthusiast e advisor.
Il target di Alessandro sono professionisti curiosi che desiderano orientarsi tra gli strumenti di intelligenza artificiale (LLM come Claude, ChatGPT, Gemini, automazioni semplici con n8n o Make).
Alessandro non si spaccia per un grande consulente enterprise o ingegnere deep-tech, ma offre una solida esperienza sul campo, testando casi d'uso concreti e aiutando a semplificare le routine quotidiane.
Regole per le risposte:
- Rispondi sempre in italiano, con tono accogliente, pragmatico, onesto e professionale.
- Scrivi in sentence case (solo la prima lettera della frase maiuscola, tranne nomi propri).
- Sii conciso (massimo 80-100 parole).
- Suggerisci sempre di approfondire o connettersi con Alessandro direttamente su LinkedIn: ${LINKEDIN_URL}.`;

    // ========================================================================
    // 1. BARRA DI AVANZAMENTO SCROLL
    // ========================================================================
    const scrollProgressBar = document.getElementById('scrollProgress');
    if (scrollProgressBar) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
                    scrollProgressBar.style.width = `${progress}%`;
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ========================================================================
    // 2. EFFETTO DIGITAZIONE (TYPING EFFECT IN SENTENCE CASE)
    // ========================================================================
    const typingElement = document.getElementById('typingText');
    if (typingElement) {
        const phrases = [
            "Analisi dei flussi e identificazione casi d'uso...",
            "Prompt engineering pratico per attività di routine...",
            "Sintesi automatica di documenti e report...",
            "Panoramica ragionata sui modelli Claude, ChatGPT e Gemini...",
            "Automazioni quotidiane senza codice invasivo..."
        ];

        let phraseIdx = 0;
        let charIdx = 0;
        let isDeleting = false;

        function runTyping() {
            const currentPhrase = phrases[phraseIdx];
            if (isDeleting) {
                typingElement.textContent = currentPhrase.substring(0, charIdx - 1);
                charIdx--;
            } else {
                typingElement.textContent = currentPhrase.substring(0, charIdx + 1);
                charIdx++;
            }

            let delay = isDeleting ? 25 : 55;

            if (!isDeleting && charIdx === currentPhrase.length) {
                delay = 2200; // pausa di lettura a fine frase
                isDeleting = true;
            } else if (isDeleting && charIdx === 0) {
                isDeleting = false;
                phraseIdx = (phraseIdx + 1) % phrases.length;
                delay = 400;
            }

            setTimeout(runTyping, delay);
        }

        setTimeout(runTyping, 600);
    }

    // ========================================================================
    // 3. ANIMAZIONE CONTATORI METRICHE (INTERSECTION OBSERVER)
    // ========================================================================
    const metricElements = document.querySelectorAll('.metric-number');
    if (metricElements.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.3
        };

        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
                    const suffix = el.getAttribute('data-suffix') || '+';
                    const duration = 1600;
                    const steps = 40;
                    const stepTime = duration / steps;
                    let current = 0;
                    const increment = target / steps;

                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            el.textContent = `${target}${suffix}`;
                            clearInterval(timer);
                        } else {
                            el.textContent = `${Math.floor(current)}${suffix}`;
                        }
                    }, stepTime);

                    observer.unobserve(el);
                }
            });
        }, observerOptions);

        metricElements.forEach(el => counterObserver.observe(el));
    }

    // ========================================================================
    // 4. GENERAZIONE QR CODE LINKEDIN
    // ========================================================================
    const qrContainer = document.getElementById('qrCode');
    if (qrContainer && typeof QRCode !== 'undefined') {
        try {
            new QRCode(qrContainer, {
                text: LINKEDIN_URL,
                width: 120,
                height: 120,
                colorDark: "#111827",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        } catch (e) {
            console.warn("Inizializzazione QR code non riuscita:", e);
        }
    }

    // ========================================================================
    // 5. CHATBOT ASSISTANT (WIDGET CON FIX CHIUSURA & GESTIONE API)
    // ========================================================================
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    let chatHistory = [];

    function openChat() {
        if (!chatWindow) return;
        chatWindow.classList.add('active');
        chatWindow.setAttribute('aria-hidden', 'false');
        if (chatInput) chatInput.focus();
        sendTelemetry('chat_open');
    }

    function closeChat() {
        if (!chatWindow) return;
        chatWindow.classList.remove('active');
        chatWindow.setAttribute('aria-hidden', 'true');
        if (chatToggle) chatToggle.focus();
    }

    if (chatToggle) {
        chatToggle.addEventListener('click', () => {
            if (chatWindow && chatWindow.classList.contains('active')) {
                closeChat();
            } else {
                openChat();
            }
        });
    }

    // Fix bug precedente: assegnazione listener al pulsante di chiusura
    if (chatClose) {
        chatClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closeChat();
        });
    }

    // Chiusura con tasto Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatWindow && chatWindow.classList.contains('active')) {
            closeChat();
        }
    });

    function appendMessage(text, isUser = false) {
        if (!chatMessages) return null;
        const msg = document.createElement('div');
        msg.className = `chat-msg ${isUser ? 'chat-msg-user' : 'chat-msg-bot'}`;
        msg.textContent = text;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msg;
    }

    function showLoadingIndicator() {
        if (!chatMessages) return null;
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-msg chat-msg-bot chat-msg-loading';
        loadingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingDiv;
    }

    async function handleSendMessage() {
        if (!chatInput || !chatSend) return;
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        chatSend.disabled = true;

        appendMessage(text, true);
        chatHistory.push({ role: 'user', parts: [{ text }] });

        // Se non è configurata una chiave API Gemini valida, forniamo una risposta di fallback cortese
        if (!geminiKey || geminiKey === 'INSERISCI_QUI_LA_TUA_CHIAVE_API') {
            setTimeout(() => {
                appendMessage("Grazie per la tua domanda! Per approfondire i casi d'uso e confrontarci sugli strumenti più adatti alla tua attività, ti invito a scrivermi direttamente su LinkedIn: https://www.linkedin.com/in/alessandro-nardi-8152a694/");
                chatSend.disabled = false;
                chatInput.focus();
            }, 600);
            return;
        }

        const loader = showLoadingIndicator();

        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
            const payload = {
                contents: [
                    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
                    { role: 'model', parts: [{ text: 'Perfetto, risponderò come assistente virtuale di Alessandro seguendo rigorosamente queste linee guida.' }] },
                    ...chatHistory
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 250
                }
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (loader) loader.remove();

            if (!response.ok) {
                throw new Error(`Risposta server non valida (${response.status})`);
            }

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (reply) {
                appendMessage(reply, false);
                chatHistory.push({ role: 'model', parts: [{ text: reply }] });
                sendTelemetry('message_reply', { userTextLength: text.length });
            } else {
                appendMessage("Non sono riuscito a elaborare una risposta. Ti invito a contattare Alessandro direttamente su LinkedIn.");
            }
        } catch (err) {
            if (loader) loader.remove();
            console.error("Errore durante la chiamata al bot:", err);
            appendMessage("Si è verificato un inconveniente momentaneo di connessione. Puoi scrivere ad Alessandro direttamente su LinkedIn.");
        } finally {
            chatSend.disabled = false;
            chatInput.focus();
        }
    }

    if (chatSend) {
        chatSend.addEventListener('click', handleSendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    function sendTelemetry(event, data = {}) {
        if (!webhookUrl || webhookUrl.includes('YOUR_N8N_WEBHOOK')) return;
        try {
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
            }).catch(() => {});
        } catch (_) {}
    }
});
