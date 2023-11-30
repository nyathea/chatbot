const chatBox = document.querySelector('.chat-box');
const messageInput = document.querySelector('.message-input');
const sendButton = document.querySelector('.send-button');

function appendUserMessage(message) {
  const userMessage = document.createElement('div');
  userMessage.classList.add('message', 'user-message');
  userMessage.innerHTML = `
    <img src="https://flan.cafe/chatbot/user-pfp.png" alt="User Profile" class="profile-picture">
    <div class="message-content">${message}</div>
  `;
  chatBox.appendChild(userMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
  getAiResponse(message);
}

function appendAiMessage(message) {
  const aiMessage = document.createElement('div');
  aiMessage.classList.add('message', 'ai-message');
  aiMessage.innerHTML = `
    <img src="https://flan.cafe/chatbot/ai-pfp2.png" alt="AI Profile" class="profile-picture">
    <div class="message-content">${message}</div>
  `;
  chatBox.appendChild(aiMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function getAiResponse(userMessage) {
  const thinkingMessage = displayThinkingMessage();
  const apiKey = '<apikey>';
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: userMessage }],
      model: 'gpt-4',
      max_tokens: 4000,
      temperature: 1,
      frequency_penalty: 0.5,
    }),
  });

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;

  chatBox.removeChild(thinkingMessage);
  appendAiMessage(aiResponse);
}

function sendUserMessage() {
  const userMessage = messageInput.value.trim();
  if (userMessage !== '') {
    appendUserMessage(userMessage);
    messageInput.value = '';
  }
}

sendButton.addEventListener('click', sendUserMessage);

messageInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendUserMessage();
  }
});

function displayThinkingMessage() {
  const thinkingMessage = document.createElement('div');
  thinkingMessage.classList.add('ai-message');
  thinkingMessage.textContent = 'Thinking...';
  chatBox.appendChild(thinkingMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
  return thinkingMessage;
}

async function sendMessage() {
  const userMessage = messageInput.value.trim();
  if (userMessage !== '') {
    appendUserMessage(userMessage);
    messageInput.value = '';

    try {
      await getAiResponse(userMessage);
    } catch (error) {
      console.error('Error:', error);
      appendAiMessage('Sorry, an error occurred.');
    }
  }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

let lastMessageTime = 0;

function displayRateLimitMessage() {
  const rateLimitMessage = document.createElement('div');
  rateLimitMessage.classList.add('ai-message', 'ai-message-rate-limit');
  rateLimitMessage.textContent = 'Rate limit has exceeded. Please wait a moment before sending another message.';
  chatBox.appendChild(rateLimitMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
  return rateLimitMessage;
}

async function sendMessage() {
  const currentTime = Date.now();
  const timeDifference = currentTime - lastMessageTime;
  const rateLimit = 5000;

  if (timeDifference >= rateLimit) {
    const userMessage = messageInput.value.trim();
    if (userMessage !== '') {
      const existingRateLimitMessage = document.querySelector('.ai-message-rate-limit');
      if (existingRateLimitMessage) {
        chatBox.removeChild(existingRateLimitMessage);
      }

      appendUserMessage(userMessage);
      messageInput.value = '';

      try {
        await getAiResponse(userMessage);
        lastMessageTime = currentTime;
      } catch (error) {
        console.error('Error:', error);
        appendAiMessage('Sorry, an error occurred.');
      }
    }
  } else {
    console.log('Rate limit exceeded. Please wait before sending another message.');
    displayRateLimitMessage();
  }
}
