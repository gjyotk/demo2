import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, IconButton, Paper, TextField, Typography, Fade, Avatar, Button } from '@mui/material';
import { Chat, Close, Send } from '@mui/icons-material';
import ChatBotIcon from '../assets/images/computer.png';
import config from '../config.json';

const ChatBotAvatar = ({ size = "medium" }) => {
    const sizeMap = {
    small: { xs: 24, md: 29 },
    medium: { xs: 28, md: 35 },
    };
    return (
    <Avatar
        sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        width: sizeMap[size],
        height: sizeMap[size],
        }}
    >
        <img
        src={ChatBotIcon}
        alt="ChatBot"
        style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
        }}
        />
    </Avatar>
    );
};

const MessageBotAvatar = ({ size = "small" }) => {
    const sizeMap = {
    small: { xs: 24, md: 29 },
    medium: { xs: 28, md: 35 },
    };
    return (
    <Avatar
        sx={{
        width: sizeMap[size],
        height: sizeMap[size],
        backgroundColor: '#e5e7eb',
        mb: 0.5,
        display: { xs: 'none', sm: 'flex' },
        }}
    >
        <img
        src={ChatBotIcon}
        alt="ChatBot"
        style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
        }}
        />
    </Avatar>
    );
};

function ChatBot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authStatus, setAuthStatus] = useState({ isAuthenticated: false, user: null });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    // Listen for navigation responses from the frontend
    useEffect(() => {
        const handleNavigationResponse = (event) => {
            // Only handle messages from same origin
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'CHATBOT_NAVIGATION_RESPONSE') {
                const response = event.data.payload;
                console.log('Received navigation response:', response);
                
                // Add bot message based on response
                const botMessage = {
                    from: "bot",
                    text: response.message,
                    timestamp: new Date(),
                    id: `bot-nav-${Date.now()}-${Math.random()}`,
                };

                // If authentication is required, add login button
                if (response.requiresAuth) {
                    botMessage.buttons = [{
                        title: "Login",
                        payload: "/request_login",
                        id: `btn-login-${Date.now()}`
                    }];
                }

                setMessages(prev => [...prev, botMessage]);
                
                // Update auth status if provided
                if (response.type === 'AUTH_STATUS_RESPONSE' || response.type === 'AUTH_STATUS_CHANGED') {
                    setAuthStatus({
                        isAuthenticated: response.isAuthenticated,
                        user: response.user
                    });
                }
            }
        };

        window.addEventListener('message', handleNavigationResponse);
        return () => window.removeEventListener('message', handleNavigationResponse);
    }, []);

    // Check authentication status on component mount
    useEffect(() => {
        if (isOpen) {
            // Request auth status from navigation service
            window.postMessage({
                type: 'CHATBOT_NAVIGATION',
                payload: {
                    action: 'CHECK_AUTH_STATUS'
                }
            }, window.location.origin);
        }
    }, [isOpen]);

    const triggerGreeting = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "user1", message: "/greet" }),
        });
        if (!res.ok) throw new Error("Network response was not ok");

      const { responses: botReplies } = await res.json();
      const botMessages = botReplies.map((r, i) => ({
        from: "bot",
        text: r.text,
        buttons: r.buttons || null,
        timestamp: new Date(),
        id: `bot-${Date.now()}-${i}-${Math.random()}`,
      }));
      setMessages(botMessages);
    } catch (error) {
      console.error("Error triggering greeting:", error);
      setMessages([{
        from: "bot",
        text: "I'm having trouble connecting. Please try again later.",
        timestamp: new Date(),
        id: `bot-error-${Date.now()}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      triggerGreeting();
    }
  }, [isOpen, messages.length, triggerGreeting]);

  const sendMessage = async (messageText = input, isButtonClick = false) => {
    if (!messageText.trim()) return;
    if (!isButtonClick) {
      setMessages(msgs => [...msgs, {
        from: "user",
        text: messageText,
        timestamp: new Date(),
        id: `user-${Date.now()}-${Math.random()}`,
      }]);
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "user1", message: messageText }),
      });
      if (!res.ok) throw new Error("Bad request");

      const { responses: botReplies } = await res.json();
      const botMessages = botReplies.map((r, i) => {
        const message = {
          from: "bot",
          text: r.text,
          buttons: r.buttons
            ? r.buttons.map((btn, bi) => ({
                ...btn,
                id: `btn-${Date.now()}-${i}-${bi}-${Math.random()}`,
              }))
            : null,
          timestamp: new Date(),
          id: `bot-${Date.now()}-${i}-${Math.random()}`,
        };

        // Handle navigation requests from bot - FIXED: check for custom field
        if (r.custom) {
          console.log('Sending navigation request:', r.custom);
          
          // Emit custom event for chatbot responses with navigation commands
          window.dispatchEvent(new CustomEvent('chatbotResponse', {
            detail: { custom: r.custom }
          }));
          
          // Also send via postMessage for broader compatibility
          window.postMessage({
            type: 'CHATBOT_NAVIGATION',
            payload: r.custom
          }, window.location.origin);
        }

        return message;
      });
      setMessages(msgs => [...msgs, ...botMessages]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(msgs => [...msgs, {
        from: "bot",
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date(),
        id: `bot-error-${Date.now()}`,
      }]);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  const handleButtonClick = (button) => {
    setMessages(msgs => [...msgs, {
      from: "user",
      text: button.title,
      timestamp: new Date(),
      isButtonClick: true,
      id: `user-button-${Date.now()}-${Math.random()}`,
    }]);
    sendMessage(button.payload, true);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
      <Box sx={{ position: 'fixed', bottom: { xs: 16, md: 24 }, right: { xs: 16, md: 24 }, zIndex: 1000 }}>
        <Fade in={isOpen} timeout={200}>
          <Paper elevation={3} sx={{
            position: 'absolute',
            bottom: 70,
            right: 0,
            width: { xs: 'calc(90vw - 40px)', sm: 360, md: 360 },
            height: { xs: 'calc(100vh - 140px)', sm: 480, md: 540 },
            maxHeight: { xs: '72vh', sm: 430, md: 500 },
            display: isOpen ? 'flex' : 'none',
            flexDirection: 'column',
            borderRadius: { xs: 5, md: 7 },
            overflow: 'hidden',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
          }}>
            <Box sx={{
              backgroundColor: '#123462',
              color: 'white',
              p: { xs: 2, md: 2.4 },
              display: 'flex',
              height: { xs: 55, sm: 58, md: 68 },
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ChatBotAvatar size="medium" />
                <Box>
                  <Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', md: '1.2rem' }, fontWeight: 600 }}>
                    ctOP Assistant
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                    {authStatus.isAuthenticated ? 'Authenticated' : 'Guest Mode'}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{
              flex: 1,
              overflow: 'auto',
              p: { xs: 1.5, md: 2 },
              backgroundColor: '#f8fafc',
              '&::-webkit-scrollbar': { width: '5px' },
              '&::-webkit-scrollbar-track': { backgroundColor: '#f1f5f9' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '3px' },
            }}>
              {messages.map(msg => (
                <Box key={msg.id} sx={{ mb: 2 }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: 1,
                  }}>
                    {msg.from === 'bot' && <MessageBotAvatar size="small" />}
                    <Paper elevation={1} sx={{
                      p: { xs: 1.2, md: 1.5 },
                      maxWidth: { xs: '70%', sm: '70%' },
                      backgroundColor: msg.from === 'user' ? '#123462' : '#fff',
                      color: msg.from === 'user' ? 'white' : '#374151',
                      borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      border: msg.from === 'user' ? 'none' : '1px solid #e5e7eb',
                    }}>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.72rem', md: '0.81rem' }, lineHeight: 1.4 }}>
                        {msg.text}
                      </Typography>
                    </Paper>
                  </Box>

                  {msg.from === 'bot' && msg.buttons && (
                    <Box sx={{
                      mt: 1.5,
                      ml: { xs: 0, sm: 4 },
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      flexWrap: 'wrap',
                      gap: 1,
                      maxWidth: { xs: '100%', sm: '75%' },
                    }}>
                      {msg.buttons.map(btn => (
                        <Button
                          key={btn.id}
                          variant="outlined"
                          size="small"
                          onClick={() => handleButtonClick(btn)}
                          sx={{
                            borderColor: '#123462',
                            color: '#123462',
                            borderRadius: '12px',
                            px: 2,
                            py: 0.5,
                            fontSize: { xs: '0.7rem', md: '0.75rem' },
                            textTransform: 'none',
                            fontWeight: 400,
                            '&:hover': { backgroundColor: '#f8fafc', borderColor: '#123462' },
                          }}
                        >
                          {btn.title}
                        </Button>
                      ))}
                      <Typography variant="caption" sx={{ mt: 1, color: '#6b7280', fontSize: { xs: '0.7rem', md: '0.75rem' }, fontStyle: 'italic', width: '100%' }}>
                        or type your own question below!
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}

              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, alignItems: 'center', gap: 1 }}>
                  <MessageBotAvatar size="small" />
                  <Paper elevation={1} sx={{ px: 2, py: 1, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px 16px 16px 4px' }}>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
                      Typing...
                    </Typography>
                  </Paper>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ p: { xs: 1.5, md: 2 }, backgroundColor: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type your query..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    backgroundColor: '#f8fafc',
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: '#123462' },
                    '&.Mui-focused fieldset': { borderColor: '#123462' },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.85rem', md: '0.9rem' },
                    '&::placeholder': { color: '#9ca3af' },
                  },
                }}
              />
              <IconButton
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                sx={{
                  backgroundColor: '#123462',
                  color: 'white',
                  width: { xs: 40, md: 44 },
                  height: { xs: 40, md: 44 },
                  '&:hover': { backgroundColor: '#1e4a7a' },
                  '&:disabled': { backgroundColor: '#9ca3af', color: '#fff' },
                }}
              >
                <Send fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        </Fade>

        <IconButton
            onClick={() => setIsOpen(!isOpen)}
            sx={{
            backgroundColor: '#123462',
            color: 'white',
            width: { xs: 56, md: 64 },
            height: { xs: 56, md: 64 },
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': { backgroundColor: '#1e4a7a' },
            }}
        >
            {isOpen ? <Close sx={{ fontSize: { xs: 24, md: 28 } }} /> : <Chat sx={{ fontSize: { xs: 24, md: 28 } }} />}
        </IconButton>
        </Box>
    );
}

export default ChatBot;