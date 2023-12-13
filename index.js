import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import path from 'path';
import { chatData, chatData2 } from './data.js';

const app = express();
const __dirname = path.resolve();
const API_KEY = '당신의 OpenAI API KEY';

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat-gpt.html'));
});

const fetchChatData = async (messages, parameters) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages,
            ...parameters
        }),
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
};

const fetchImageData = async (chatData) => {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "dall-e-3",
            prompt: chatData,
            n: 1,
            size: "1024x1024",
        }),
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
};

app.post('/generate/chat/data', async (req, res) => {
    const messages = [
        {
            role: 'system',
            content: `The assistant's job is to generate conversation data including personal information provided by the user. It should return data in the JSON format used for conversation datasets.`,
        },
        {
            role: 'user', content: `context = ["철수와 짱구가 퇴근 후 게임을 하는 상황"]`
        },
        {
            role: 'assistant', content: chatData
        },
        {
            role: 'user', content: `context = ["훈이와 유리가 서울로 쇼핑을 간 상황"]`
        },
        {
            role: 'assistant', content: chatData2
        },
        {
            role: 'user', content: `context = ["${req.body.context}"]`
        },
    ];
    const parameters = { temperature: 0.7 };

    try {
        const chatResponse = await fetchChatData(messages, parameters);
        const chatData = chatResponse.choices[0].message.content.trim();

        const imageResponse = await fetchImageData(chatData);
        const imageData = imageResponse.data[0].url;

        res.json({
            chat_data: chatData,
            image: imageData,
        });

    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
