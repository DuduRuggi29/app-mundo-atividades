const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// --- Tab Navigation Logic ---
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons and tabs
        navBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active-tab'));

        // Add active class to clicked
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active-tab');
    });
});

// --- API Helper ---
async function callGroqAPI(messages, max_tokens = 1024) {
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Fast logic
                messages: messages,
                temperature: 0.7,
                max_tokens: max_tokens
            })
        });

        if (!response.ok) throw new Error("API Fails");
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Groq Error:", error);
        return "Ops! Ocorreu um erro mágico. Tente de novo! ✨";
    }
}

function appendTypingIndicator(boxId) {
    const box = document.getElementById(boxId);
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-' + boxId;
    typingDiv.classList.add('message', 'ai-message');
    typingDiv.innerHTML = `
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Teacher&backgroundColor=b6e3f4" class="avatar">
        <div class="message-content typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    box.appendChild(typingDiv);
    box.scrollTop = box.scrollHeight;
}

function removeTypingIndicator(boxId) {
    const typingDiv = document.getElementById('typing-' + boxId);
    if (typingDiv) typingDiv.remove();
}

function appendChatMessage(boxId, role, content, avatarSeed, avatarBg) {
    const box = document.getElementById(boxId);
    const div = document.createElement('div');
    div.classList.add('message', role === 'user' ? 'user-message' : 'ai-message');
    
    let htmlContent = role === 'user' ? content : marked.parse(content);

    const avatarUrl = role === 'user' 
        ? "https://api.dicebear.com/7.x/bottts/svg?seed=Lucky&backgroundColor=transparent"
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}&backgroundColor=${avatarBg}`;

    div.innerHTML = `
        <img src="${avatarUrl}" class="avatar">
        <div class="message-content">${htmlContent}</div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}


// --- 1. Professor IA Logic ---
const profBox = 'professor-chat-box';
const profInput = document.getElementById('professor-input');
const profSendBtn = document.getElementById('professor-send-btn');

let professorHistory = [{
    role: "system",
    content: "Você é um Professor de escola super amigável, encorajador e voltado para crianças. Explique qualquer conceito de forma simples e divertida, usando poucos emojis. NUNCA gere imagens aqui."
}];

async function handleProfessorSend() {
    const text = profInput.value.trim();
    if (!text) return;
    profInput.value = '';

    appendChatMessage(profBox, 'user', text);
    professorHistory.push({ role: "user", content: text });
    
    appendTypingIndicator(profBox);
    const response = await callGroqAPI(professorHistory);
    removeTypingIndicator(profBox);

    professorHistory.push({ role: "assistant", content: response });
    appendChatMessage(profBox, 'ai', response, 'Teacher', 'b6e3f4');
}

profSendBtn.addEventListener('click', handleProfessorSend);
profInput.addEventListener('keypress', e => e.key === 'Enter' && handleProfessorSend());


// --- 2. Calligraphy IA Logic ---
const caliBox = 'calligraphy-chat-box';
const caliInput = document.getElementById('calligraphy-input');
const caliSendBtn = document.getElementById('calligraphy-send-btn');

let calligraphyHistory = [{
    role: "system",
    content: "Você é um Mestre da Caligrafia infantil. Sempre que a criança disser uma palavra ou letra, primeiro anime-a e depois escreva as palavras em formato de destaque. Envolva as palavras que devem ser copiadas por ela usando o formato de blockquote do markdown (ou seja, começando a linha com '> '). Exemplo:\n\n> A B C D\n\n> Bola\n\nFaça lições curtas e visualmente bonitas."
}];

async function handleCalligraphySend() {
    const text = caliInput.value.trim();
    if (!text) return;
    caliInput.value = '';

    appendChatMessage(caliBox, 'user', text);
    calligraphyHistory.push({ role: "user", content: text });
    
    appendTypingIndicator(caliBox);
    const response = await callGroqAPI(calligraphyHistory);
    removeTypingIndicator(caliBox);

    calligraphyHistory.push({ role: "assistant", content: response });
    appendChatMessage(caliBox, 'ai', response, 'Pen', 'f4b6dc');
}

caliSendBtn.addEventListener('click', handleCalligraphySend);
caliInput.addEventListener('keypress', e => e.key === 'Enter' && handleCalligraphySend());


// --- 3. Drawings Gallery Logic ---
const drawInput = document.getElementById('drawings-input');
const drawSendBtn = document.getElementById('drawings-send-btn');
const drawLoading = document.getElementById('drawing-loading');
const drawGallery = document.getElementById('drawing-gallery');

async function handleDrawingGenerate() {
    const subject = drawInput.value.trim();
    if (!subject) return;
    
    // We don't append chat here, just generate in the gallery directly.
    drawInput.value = '';
    drawLoading.classList.remove('hidden');

    // We ask Groq to translate the childish prompt to a descriptive image prompt
    const promptMessage = [
        { role: "system", content: "You strictly output ONLY English descriptions of the subject given by the user, formatted exactly as a comma separated list of visual keywords. Ignore all conversational filler. Emphasize cute, kid-friendly." },
        { role: "user", content: `Quero colorir: ${subject}` }
    ];

    const keywords = await callGroqAPI(promptMessage, 50); // fast and short

    // Final Prompt for Pollinations
    const finalPollinationsPrompt = `coloring page of ${keywords}, thick black and white line art, for kids, cute styling, highly detailed, clean lines, white background, no text`;
    const encodedPrompt = encodeURIComponent(finalPollinationsPrompt);
    const imgUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;

    drawLoading.classList.add('hidden');

    // Create Gallery Card
    const card = document.createElement('div');
    card.className = 'drawing-card';
    card.innerHTML = `
        <img src="${imgUrl}" alt="${subject}">
        <p>${subject}</p>
    `;
    
    // Insert at top
    drawGallery.prepend(card);
}

drawSendBtn.addEventListener('click', handleDrawingGenerate);
drawInput.addEventListener('keypress', e => e.key === 'Enter' && handleDrawingGenerate());
