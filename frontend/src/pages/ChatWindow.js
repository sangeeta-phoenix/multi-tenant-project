import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import MinimizeIcon from "@mui/icons-material/Minimize";
import CropSquareIcon from "@mui/icons-material/CropSquare";

const socket = io("http://localhost:5000");

const ChatContainer = styled(Paper)(({ theme }) => ({
  position: "fixed",
  bottom: 20,
  right: 20,
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  boxShadow: theme.shadows[5],
  zIndex: 1300,
  transition: "all 0.3s ease",
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.primary.main,
  color: "#fff",
  borderTopLeftRadius: 8,
  borderTopRightRadius: 8,
  fontWeight: "bold",
}));

const ChatBody = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(2),
  backgroundColor: "#f5f5f5",
}));

const ChatFooter = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: "#fff",
}));

const ChatMessage = ({ msg, currentUser }) => {
  const isUser = msg.userName === currentUser;

  return (
    <Box
      display="flex"
      justifyContent={isUser ? "flex-end" : "flex-start"}
      mb={1}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems={isUser ? "flex-end" : "flex-start"}
        maxWidth="80%"
      >
        <Box display="flex" alignItems="center" mb={0.5}>
          {!isUser && <Avatar sx={{ width: 24, height: 24, mr: 1 }} />}
          <Typography
            variant="body2"
            fontWeight="bold"
            color={isUser ? "primary" : "textPrimary"}
          >
            {isUser ? "You" : msg.userName}
          </Typography>
        </Box>
        <Paper
          elevation={1}
          sx={{
            px: 1.5,
            py: 1,
            backgroundColor: isUser ? "#e3f2fd" : "#fff",
          }}
        >
          <Typography variant="body2">{msg.text}</Typography>
        </Paper>
        <Typography variant="caption" color="textSecondary">
          {msg.timestamp}
        </Typography>
      </Box>
    </Box>
  );
};

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef(null);

  const email = localStorage.getItem("email");
  const userName = email ? email.split("@")[0] : "User";

  useEffect(() => {
    // Load stored messages on mount
    const storedMessages = localStorage.getItem("chatMessages");
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

    socket.on("receive_message", (data) => {
      setMessages((prev) => {
        const updated = [...prev, data];
        localStorage.setItem("chatMessages", JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!msg.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage = {
      userName,
      text: msg,
      timestamp,
    };

    const aiResponse = {
      userName: "AI Support Bot",
      text: `Thanks ${userName}, I received your message.`,
      timestamp,
    };

    socket.emit("send_message", userMessage);

    setTimeout(() => {
      socket.emit("send_message", aiResponse);
    }, 1000);

    setMsg("");
  };

  if (isClosed) return null;

  return (
    <ChatContainer
      sx={{
        width: isMaximized ? 500 : 350,
        height: isMinimized ? 60 : isMaximized ? 600 : 450,
      }}
    >
      <ChatHeader>
        <Typography variant="subtitle1">Chat Window</Typography>
        <Box>
          <IconButton size="small" onClick={() => setIsMinimized((prev) => !prev)}>
            <MinimizeIcon sx={{ color: "#fff" }} />
          </IconButton>
          <IconButton size="small" onClick={() => setIsMaximized((prev) => !prev)}>
            <CropSquareIcon sx={{ color: "#fff" }} />
          </IconButton>
          <IconButton size="small" onClick={() => setIsClosed(true)}>
            <CloseIcon sx={{ color: "#fff" }} />
          </IconButton>
        </Box>
      </ChatHeader>

      {!isMinimized && (
        <>
          <ChatBody>
            {messages.map((msg, index) => (
              <ChatMessage key={index} msg={msg} currentUser={userName} />
            ))}
            <div ref={messagesEndRef} />
          </ChatBody>
          <ChatFooter>
            <TextField
              variant="outlined"
              size="small"
              fullWidth
              placeholder="Type a message..."
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <IconButton color="primary" onClick={handleSend}>
              <SendIcon />
            </IconButton>
          </ChatFooter>
        </>
      )}
    </ChatContainer>
  );
};

export default ChatWindow;
