<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>P2P Chat</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        body {
            font-family: 'Roboto', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #00c4a7;
            color: white;
            padding: 15px;
            font-size: 20px;
            font-weight: bold;
            text-align: center;
        }
        .chat-container {
            width: 92%;
            max-width: 600px;
            margin: auto;
            background: white;
            padding: 18px;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            height: 80vh;
        }
        .chat-box {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            border-bottom: 1px solid #ccc;
            display: flex;
            flex-direction: column;
        }
        .message-container {
            display: flex;
            flex-direction: column;
            margin-bottom: 10px;
        }
        .message {
            padding: 10px;
            border-radius: 8px;
            max-width: 70%;
            word-wrap: break-word;
            white-space: pre-wrap;
            position: relative;
        }
        .sent {
            background: #0084ff;
            color: white;
            align-self: flex-end;
            text-align: left;
        }
        .received {
            background: #e5e5e5;
            align-self: flex-start;
            text-align: left;
        }
        .system {
            color: gray;
            font-size: 14px;
            text-align: center;
            font-weight: bold;
            width: 100%;
        }
        .user-id {
            font-size: 10px;
            color: gray;
            display: block;
            text-align: right;
            margin-bottom: 2px;
            font-weight: bold;
        }
        .input-box {
            display: flex;
            padding: 10px;
            background: #f0f0f0;
        }
        .input-box textarea {
            flex: 1;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            outline: none;
            resize: none;
        }
        .input-box button {
            margin-left: 10px;
            padding: 10px;
            background: #0084ff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="header">otr.to Chat</div>
    <div class="chat-container">
        <div class="chat-box" id="chatBox"></div>
        <div class="input-box">
            <textarea id="chatInput" placeholder="Message..."></textarea>
            <button id="sendBtn">Send</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let mySocketId = "";  
        let myUserId = "";  

        socket.on("connect", () => {
            mySocketId = socket.id;
            myUserId = mySocketId.slice(-4);
            socket.emit("user-connected", { userId: myUserId });
        });

        function showSystemMessage(message) {
            const newMessage = document.createElement("div");
            newMessage.classList.add("system");
            newMessage.textContent = message;
            chatBox.appendChild(newMessage);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        socket.on("message", (data) => {
            const messageContainer = document.createElement("div");
            messageContainer.classList.add("message-container");

            const userIdSpan = document.createElement("span");
            userIdSpan.classList.add("user-id");
            userIdSpan.textContent = `User: ${data.userId}`;

            const newMessage = document.createElement("div");
            newMessage.classList.add("message");

            if (data.userId === "system") {
                newMessage.classList.add("system");
                newMessage.textContent = data.message;
            } else if (data.userId !== myUserId) {
                newMessage.classList.add("received");
                messageContainer.appendChild(userIdSpan);
                newMessage.textContent = data.message;
            } else {
                newMessage.classList.add("sent");
                messageContainer.appendChild(userIdSpan);
                newMessage.textContent = data.message;
            }

            messageContainer.appendChild(newMessage);
            chatBox.appendChild(messageContainer);
            chatBox.scrollTop = chatBox.scrollHeight;
        });

        socket.on("user-connected", (data) => {
            showSystemMessage(`User ${data.userId} connected`);
        });

        sendBtn.addEventListener("click", () => {
            const message = chatInput.value.trim();
            if (message) {
                socket.emit("user-message", { message, userId: myUserId });
                chatInput.value = "";
            }
        });
    </script>
</body>
</html>
