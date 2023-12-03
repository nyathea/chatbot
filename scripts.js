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

let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];

async function getAiResponse(userMessage) {
  let thinkingMessage;

  try {
    let apiKey = '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';
    let apiUrl = 'https://api.openai.com/v1/chat/completions';

    const userMessageObj = { role: 'user', content: userMessage };

    if (conversationHistory.length === 0 || conversationHistory[0].content !== userMessage) {
      conversationHistory.unshift(userMessageObj);
      localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    }

    if (conversationHistory.length > 20) {
      const userMessageToResend = userMessage;
      thinkingMessage = displayThinkingMessage();
      localStorage.removeItem('conversationHistory');
      conversationHistory = [];
      removeThinkingMessage(thinkingMessage);
      return getAiResponse(userMessageToResend);
    }

    thinkingMessage = displayThinkingMessage();

    let requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: conversationHistory,
        model: 'gpt-3.5-turbo-0613',
        max_tokens: 3000,
        temperature: 0.5,
        frequency_penalty: 0.2,
      }),
    };

    if (mode === 'dalle') {
      apiKey = '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';
      apiUrl = 'https://api.openai.com/v1/images/davinci-codex';

      requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: userMessage.replace('dallecreate', '').trim(),
          n: 3,
        }),
      };

      const response = await fetch(apiUrl, requestOptions);
      const data = await response.json();

      const responses = data.choices?.map(choice => choice.text);

      chatBox.removeChild(thinkingMessage);
      appendDalleImages(responses);
    } else {
      const response = await fetch(apiUrl, requestOptions);
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      chatBox.removeChild(thinkingMessage);

      if (aiResponse) {
        conversationHistory.push({ role: 'user', content: userMessage });
        conversationHistory.push({ role: 'assistant', content: aiResponse });
        appendAiMessage(aiResponse);
      } else {
        console.error('Invalid AI response format:', data);
        appendAiMessage('An error occurred. This is either my doing or OpenAI\'s fault. Please try again later.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    chatBox.removeChild(thinkingMessage);
    appendAiMessage('An error occurred. This is either my doing or OpenAI\'s fault. Please try again later.');
  } finally {
    enableInput();
  }

  localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
}

function appendDalleImages(images) {
  const profilePicture = 'https://flan.cafe/chatbot/ai-pfp2.png';
  
  images.forEach((imageUrl) => {
    const aiMessageContainer = document.createElement('div');
    aiMessageContainer.classList.add('ai-message', 'message');

    const imageElement = document.createElement('img');
    imageElement.src = imageUrl;
    imageElement.classList.add('dalle-image');
    imageElement.style.width = '200px';
    imageElement.style.height = '200px';
    imageElement.style.borderRadius = '10px';
    imageElement.dataset.original = imageUrl;

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.appendChild(imageElement);

    const profilePictureElement = document.createElement('img');
    profilePictureElement.src = profilePicture;
    profilePictureElement.alt = 'AI Profile';
    profilePictureElement.classList.add('profile-picture');

    aiMessageContainer.appendChild(profilePictureElement);
    aiMessageContainer.appendChild(messageContent);

    chatBox.appendChild(aiMessageContainer);
  });

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

function setCustomProfilePicture(fileInput) {
  const file = fileInput.files[0];
  
  if (file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
      const imageUrl = event.target.result;
      localStorage.setItem('customProfilePicture', imageUrl);
      const userPfpElements = document.querySelectorAll('.user-message .profile-picture');
      if (userPfpElements.length > 0) {
        userPfpElements.forEach(function(element) {
          element.src = imageUrl;
        });
      }
    };
    
    reader.readAsDataURL(file);
  }
}

function handleProfilePictureClick() {
  const fileInput = document.getElementById('customPfpInput');
  if (fileInput) {
    fileInput.click();
  }
}

window.onload = function() {
  const customProfilePicture = localStorage.getItem('customProfilePicture');
  const userPfpElements = document.querySelectorAll('.user-message .profile-picture');
  
  if (customProfilePicture && userPfpElements.length > 0) {
    userPfpElements.forEach(function(element) {
      element.src = customProfilePicture;
    });
  }
};
