const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// System prompt forces kid-friendly tone and format for images
const SYSTEM_PROMPT = `
Você é uma IA amiga, muito alegre, carinhosa e voltada para crianças. 
Seu objetivo é ajudar as crianças a aprenderem rapidamente, ensinarem caligrafia, darem dicas de estudo e serem a melhor companhia educativa.
Fale de forma simples, animada e use muitos emojis!

REGRAS IMPORTANTES:
1. Se a criança pedir para desenhar algo para colorir (ex: "faz um desenho de um cachorro", "quero pintar um dinossauro"), você deve responder de forma animada e colocar a exata tag a seguir na sua resposta para gerar o desenho: [DRAWING: descrição em inglês do desenho]
Exemplo de resposta sua: "Claro! Aqui está um lindo cachorrinho para você colorir! [DRAWING: cute puppy dog]"
A tag [DRAWING: ...] é interpretada pelo sistema para mostrar a imagem. Dê a descrição apenas em INGLÊS dentro dos colchetes, pois a IA geradora de imagens entende melhor o inglês. Siga as palavras chaves "coloring page, line art, black and white" indiretamente, eu adicionarei isso no código, então apenas diga o sujeito dentro dos colchetes. Por exemplo: [DRAWING: cute dinosaur]. NUNCA falhe ao colocar esta tag se pedirem desenho.
2. Seja sempre positivo e encorajador.
3. Se fizerem perguntas sobre outros assuntos, responda de forma educativa e infantil.
`;

let messageHistory = [
    { role: "system", content: SYSTEM_PROMPT }
];

async function callGroqAPI(messages) {
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Using a fast, standard model present in Groq
                messages: messages,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Error communicating with Groq API:", error);
        return "Ops! Tivemos um probleminha mágico. Você pode perguntar de novo? 🪄✨";
    }
}

function processContentForImages(text) {
    // Look for [DRAWING: description] tag
    const regex = /\[DRAWING:\s*(.*?)\]/gi;
    return text.replace(regex, (match, description) => {
        const prmt = `coloring page of ${description}, thick black and white line art, for kids, highly detailed, no shading, clean lines, white background, no text`;
        const encodedPrompt = encodeURIComponent(prmt);
        const imgUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;
        return `\n\n<img src="${imgUrl}" alt="Desenho para colorir: ${description}" onload="scrollToBottom()">\n\n`;
    });
}

function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role === 'user' ? 'user-message' : 'ai-message');

    const avatarUrl = role === 'user' 
        ? "https://api.dicebear.com/7.x/bottts/svg?seed=Lucky&backgroundColor=transparent"
        : "https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=b6e3f4";

    // Format content with markdown and parse image tags
    let formattedContent = role === 'ai' ? processContentForImages(content) : content;
    // Uses marked library for basic markdown parsing for bold, lists, etc.
    if(role === 'ai') formattedContent = marked.parse(formattedContent);

    messageDiv.innerHTML = `
        <img src="${avatarUrl}" alt="${role} Avatar" class="avatar">
        <div class="message-content">
            ${role === 'user' ? formattedContent : formattedContent}
        </div>
    `;

    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

function appendTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.classList.add('message', 'ai-message');
    typingDiv.innerHTML = `
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=b6e3f4" alt="AI Avatar" class="avatar">
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    chatBox.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // Reset input
    userInput.value = '';

    // Render User Message
    appendMessage('user', text);
    messageHistory.push({ role: "user", content: text });

    // Show AI typing
    appendTypingIndicator();

    // Fetch response
    const aiResponse = await callGroqAPI(messageHistory);

    // Remove typing
    removeTypingIndicator();

    // Track AI msg for future context
    messageHistory.push({ role: "assistant", content: aiResponse });

    // Render AI message
    appendMessage('ai', aiResponse);
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});
