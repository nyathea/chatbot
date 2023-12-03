const chatBox = document.querySelector('.chat-box');
const messageInput = document.querySelector('.message-input');
const sendButton = document.querySelector('.send-button');
let lastMessageTime = 0;
let mode = 'gpt'; 

function appendMessage(message, role, profilePicture) {
  const newMessage = document.createElement('div');
  newMessage.classList.add('message', `${role}-message`);
  newMessage.innerHTML = `<img src="${profilePicture}" alt="${role} Profile" class="profile-picture">
    <div class="message-content">${message}</div>`;
  chatBox.appendChild(newMessage);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function getAiResponse(userMessage) {
  const thinkingMessage = displayThinkingMessage();

  try {
    let apiKey = '<apikey here>'; 
    let apiUrl = 'https://api.openai.com/v1/chat/completions'; 
    let requestOptions = {
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
    };

    if (mode === 'dalle') {
      apiKey = '<apikey here>'; 
      apiUrl = 'https://api.openai.com/v1/images/generations'; 
      requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: userMessage.replace('dallecreate', '').trim(),
          size: '1024x1024',
          quality: 'hd',
          style: 'natural',
          n: 1,
        }),
      };
    }

const response = await fetch(apiUrl, requestOptions);
const data = await response.json();

let aiResponse = [];

if (mode === 'gpt') {
  aiResponse = data.choices?.[0]?.message?.content ? [data.choices[0].message.content] : [];
} else {
  if (Array.isArray(data.data)) {
    aiResponse = data.data.map(item => item.url);
  } else if (data.url) {
    aiResponse = [data.url];
  }
}

chatBox.removeChild(thinkingMessage);

if (aiResponse.length > 0) {
  if (mode === 'gpt') {
    appendAiMessage(aiResponse[0]);
  } else {
    appendDalleImages(aiResponse);
  }
} else {
  console.error('Invalid AI response format:', data);
  appendAiMessage('An error occurred. Please try again later.');
}
  } catch (error) {
    console.error('Error:', error);
    chatBox.removeChild(thinkingMessage);
    appendAiMessage('An error occurred. Please try again later.');
  } finally {
    enableInput();
  }
}

function appendDalleImages(images) {
  const aiMessageContainer = document.createElement('div');
  aiMessageContainer.classList.add('ai-message', 'message');

  const profilePicture = 'https://flan.cafe/chatbot/ai-pfp2.png';

  images.forEach((imageUrl) => {
    const imageElement = document.createElement('img');
    imageElement.src = imageUrl;
    imageElement.classList.add('dalle-image');
    imageElement.style.width = '300px';
    imageElement.style.height = '300px';
    imageElement.style.borderRadius = '10px';
    imageElement.dataset.original = imageUrl;

    aiMessageContainer.appendChild(imageElement);
  });

  const profilePictureElement = document.createElement('img');
  profilePictureElement.src = profilePicture;
  profilePictureElement.alt = 'AI Profile';
  profilePictureElement.classList.add('profile-picture');

  aiMessageContainer.appendChild(profilePictureElement);

  chatBox.appendChild(aiMessageContainer);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendUserMessage() {
  const userMessage = messageInput.value.trim();

  if (userMessage.toLowerCase().includes('dallecreate')) {
    mode = 'dalle';
  } else {
    mode = 'gpt';
  }

  if (userMessage !== '') {
    appendUserMessage(userMessage);
    getAiResponse(userMessage);
    messageInput.value = '';
  }
}

function displayThinkingMessage() {
  const thinkingMessageContainer = document.createElement('div');
  thinkingMessageContainer.classList.add('ai-message', 'message');

  const profilePicture = document.createElement('img');
  profilePicture.src = 'https://flan.cafe/chatbot/ai-pfp2.png';
  profilePicture.alt = 'AI Profile';
  profilePicture.classList.add('profile-picture');

  const thinkingMessage = document.createElement('div');
  thinkingMessage.classList.add('message-content', 'thinking-message');

  if (mode === 'dalle') {
    thinkingMessage.textContent = 'Generating an image for you. Please wait...';
  } else {
    thinkingMessage.textContent = 'Generating a response for you. Please wait...';
  }

  thinkingMessageContainer.appendChild(profilePicture);
  thinkingMessageContainer.appendChild(thinkingMessage);
  chatBox.appendChild(thinkingMessageContainer);
  chatBox.scrollTop = chatBox.scrollHeight;

  disableInput();

  return thinkingMessageContainer;
}

function removeThinkingMessage(thinkingMessageContainer) {
  thinkingMessageContainer.remove();
  enableInput();
}

function appendUserMessage(message) {
  const customProfilePicture = localStorage.getItem('customProfilePicture');
  appendMessage(message, 'user', customProfilePicture || 'https://flan.cafe/chatbot/user-pfp.png');
}

function appendAiMessage(message) {
  appendMessage(message, 'ai', 'https://flan.cafe/chatbot/ai-pfp2.png');
}

function disableInput() {
  messageInput.disabled = true;
  sendButton.disabled = true;
}

function enableInput() {
  messageInput.disabled = false;
  sendButton.disabled = false;
}

sendButton.addEventListener('click', sendUserMessage);

messageInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendUserMessage();
  }
});
