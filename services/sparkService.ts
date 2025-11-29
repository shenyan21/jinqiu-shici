// Credentials
const APPID = '165e3f80';
const API_SECRET = 'ZWI2Nzg3ZmFhMjU4YzQ0Mjc4ZjYwMjBm';
const API_KEY = 'ffd801e3c2a111ace3a2c3b418da63b7';

// Spark API URL (v4.0 Ultra)
const SPARK_URL = 'wss://spark-api.xf-yun.com/v4.0/chat';

async function getWebsocketUrl(): Promise<string> {
    const host = "spark-api.xf-yun.com";
    const path = "/v4.0/chat";
    const date = new Date().toUTCString();

    const builder = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(API_SECRET);
    const msgData = encoder.encode(builder);

    const cryptoKey = await window.crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);

    // Use native btoa for Base64 encoding
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray));

    const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`;
    const authorization = btoa(authorizationOrigin);

    const url = `${SPARK_URL}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
    console.log("Connecting to Spark API...", { host, date, url: url.replace(authorization, '***') });
    return url;
}

export const chatWithSpark = async (message: string, onMessage?: (token: string) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const url = await getWebsocketUrl();
            const socket = new WebSocket(url);
            let fullResponse = "";

            socket.onopen = () => {
                const params = {
                    "header": {
                        "app_id": APPID,
                        "uid": "user_default"
                    },
                    "parameter": {
                        "chat": {
                            "domain": "4.0Ultra",
                            "temperature": 0.5,
                            "max_tokens": 4096
                        }
                    },
                    "payload": {
                        "message": {
                            "text": [
                                { "role": "system", "content": "你是一位博学多才的国学大师，精通唐诗宋词。请用优雅、古风的白话文回答用户的问题。" },
                                { "role": "user", "content": message }
                            ]
                        }
                    }
                };
                socket.send(JSON.stringify(params));
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.header.code !== 0) {
                    console.error("Spark API Error:", data.header.message);
                    socket.close();
                    reject(new Error(data.header.message));
                    return;
                }

                if (data.payload && data.payload.choices && data.payload.choices.text) {
                    const content = data.payload.choices.text[0].content;
                    fullResponse += content;
                    if (onMessage) {
                        onMessage(content);
                    }
                }

                if (data.header.status === 2) {
                    socket.close();
                    resolve(fullResponse);
                }
            };

            socket.onerror = (error) => {
                console.error("WebSocket Error:", error);
                reject(error);
            };

            socket.onclose = (event) => {
                if (!fullResponse && event.code !== 1000) {
                    reject(new Error(`WebSocket closed unexpectedly with code ${event.code}`));
                }
            };

        } catch (error) {
            reject(error);
        }
    });
};

export const analyzePoemWithSpark = async (poemTitle: string, poemAuthor: string, poemContent: string[], onMessage?: (token: string) => void): Promise<string> => {
    const prompt = `请赏析这首诗：\n题目：《${poemTitle}》\n作者：${poemAuthor}\n内容：\n${poemContent.join('\n')}\n\n请从意象、意境、情感等方面进行深度赏析。`;
    return chatWithSpark(prompt, onMessage);
};
