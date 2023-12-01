const chatBox = document.querySelector('.chat-box');
const messageInput = document.querySelector('.message-input');
const sendButton = document.querySelector('.send-button');
let lastMessageTime = 0;

function appendMessage(message, role, profilePicture) {
  const newMessage = document.createElement('div');
  newMessage.classList.add('message', `${role}-message`);
  newMessage.innerHTML = `<img src="${profilePicture}" alt="${role} Profile" class="profile-picture">
    <div class="message-content">${message}</div>`;
  chatBox.appendChild(newMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function appendUserMessage(message) {
  appendMessage(message, 'user', 'https://flan.cafe/chatbot/user-pfp.png');
  getAiResponse(message);
}

function appendAiMessage(message) {
  appendMessage(message, 'ai', 'https://flan.cafe/chatbot/ai-pfp2.png');
}

async function getAiResponse(userMessage) {
  const thinkingMessage = displayThinkingMessage();

  try {
    const apiKey = '<apiKey>';
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
        model: 'gpt-3.5-turbo',
        max_tokens: 4000,
        temperature: 1,
        frequency_penalty: 0.5,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    chatBox.removeChild(thinkingMessage);

    if (aiResponse) {
      appendAiMessage(aiResponse);
    } else {
      console.error('Invalid AI response format:', data);
      appendAiMessage('An error occurred. This is either my doing or OpenAI\'s fault. Please try again later.');
    }
  } catch (error) {
    console.error('Error:', error);
    chatBox.removeChild(thinkingMessage);
    appendAiMessage('An error occurred. This is either my doing or OpenAI\'s fault. Please try again later.');
  } finally {
    enableInput();
  }
}

function sendUserMessage() {
  const userMessage = messageInput.value.trim();
  if (userMessage !== '') {
    disableInput();
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
  thinkingMessage.classList.add('ai-message', 'thinking-message');
  thinkingMessage.textContent = 'Thinking...';
  chatBox.appendChild(thinkingMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
  return thinkingMessage;
}

async function sendMessage() {
  const currentTime = Date.now();
  const timeDifference = currentTime - lastMessageTime;

  if (timeDifference >= 5000) {
    const userMessage = messageInput.value.trim();
    if (userMessage !== '') {
      disableInput();
      appendUserMessage(userMessage);
      messageInput.value = '';

      try {
        await getAiResponse(userMessage);
        lastMessageTime = currentTime;
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

function disableInput() {
  messageInput.disabled = true;
  sendButton.disabled = true;
}

function enableInput() {
  messageInput.disabled = false;
  sendButton.disabled = false;
}
