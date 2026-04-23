// script.js

document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('unihelp-widget');
    const toggleBtn = document.getElementById('widget-toggle');
    const closeBtn = document.getElementById('close-widget');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatWindow = document.getElementById('chat-window');
    const loading = document.getElementById('loading');

    // Toggle Visibility
    toggleBtn.addEventListener('click', () => widget.classList.add('open'));
    closeBtn.addEventListener('click', () => widget.classList.remove('open'));

    // Initial Message
    if (chatWindow.innerHTML === "") {
        addMessage('bot', "Hi! I'm UniHelp. Ask me about university policies, rules, or your academic schedule.");
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = userInput.value.trim();
        if (!query) return;

        addMessage('user', query);
        userInput.value = '';
        loading.classList.remove('hidden');

        try {
            const res = await fetch(`http://localhost:3000/ask?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            loading.classList.add('hidden');
            addMessage('bot', data.answer, data.citations);
        } catch (err) {
            loading.classList.add('hidden');
            addMessage('bot', "Error connecting to UniHelp server. Ensure the backend is running.");
        }
    });

    function addMessage(sender, text, citations = []) {
        const div = document.createElement('div');
        div.className = `msg ${sender}-msg`;
        let content = `<div>${text}</div>`;

        if (citations && citations.length > 0) {
            content += `<div style="margin-top:10px; font-size:0.75rem; color:var(--text-light); border-top:1px solid #eee; padding-top:6px">`;
            content += `<strong style="color: var(--primary);">Sources:</strong><br>`;
            citations.forEach(c => content += `• ${c.document} (Pg. ${c.page})<br>`);
            content += `</div>`;
        }

        div.innerHTML = content;
        chatWindow.appendChild(div);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Admin Upload Logic
    const uploadTrigger = document.getElementById('upload-trigger');
    const fileInput = document.getElementById('file-input');
    const fileText = document.getElementById('file-ready-text');

    if (uploadTrigger) {
        uploadTrigger.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) {
                fileText.textContent = "✓ Selected: " + fileInput.files[0].name;
            }
        });
    }
});