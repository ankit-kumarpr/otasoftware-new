import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../components/AuthContext';
import { initSocket } from '../components/socket';
import { toast } from 'react-toastify';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import styled from 'styled-components';
import {
  Paper,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Button,
  Badge,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  InsertEmoticon as EmojiIcon,
  AttachFile as AttachFileIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// Styled components for better organization
const ChatContainer = styled(Paper)`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
  position: relative;
  overflow: hidden;

  @media (min-width: 768px) {
    height: 80vh;
    max-height: 800px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #1976d2;
  color: white;
  position: relative;
  z-index: 10;
`;

const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatusBadge = styled(Badge)`
  & .MuiBadge-badge {
    right: 5px;
    top: 5px;
    border: 2px solid white;
  }
`;

const SessionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  &.sent {
    align-self: flex-end;
    background-color: #1976d2;
    color: white;
    border-bottom-right-radius: 4px;
  }

  &.received {
    align-self: flex-start;
    background-color: white;
    color: #333;
    border-bottom-left-radius: 4px;
  }
`;

const MessageMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 4px;
  opacity: 0.8;
`;

const InputContainer = styled.form`
  display: flex;
  padding: 12px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  align-items: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 24px;
  color: #666;
`;

const TypingIndicator = styled.div`
  padding: 8px 16px;
  font-size: 0.85rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmojiPickerContainer = styled.div`
  position: absolute;
  bottom: 70px;
  right: 20px;
  z-index: 100;
`;

const FileInput = styled.input`
  display: none;
`;

const ChatBox = ({
  sessionToken,
  chatDuration,
  lawyer,
  client,
  bookingId,
  role = 'client',
  currentUser: passedUser,
  onReady,
  authToken, // ✅ Add this
}) => {


    const emojiPickerRef = useRef(null);

  const auth = useAuth();
  const currentUser = passedUser || auth?.currentUser;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [remainingTime, setRemainingTime] = useState(chatDuration * 60);
  const [sessionStatus, setSessionStatus] = useState('waiting');
  const [socketConnected, setSocketConnected] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socketRef.current?.emit('typing', {
      bookingId,
      senderId: currentUser.userId,
      senderRole: role,
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


 //effect to handle clicks outside the emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        // Check if the click was on the emoji button
        const emojiButton = document.querySelector('.emoji-button');
        if (!emojiButton || !emojiButton.contains(event.target)) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (sessionStatus !== 'active' || remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setSessionStatus('expired');
          socketRef.current?.emit('end-session', { bookingId });
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStatus, remainingTime]);



  useEffect(() => {
    if (!sessionToken || !bookingId || !currentUser?.userId) return;

    const socket = initSocket(token, currentUser.userId, currentUser.role || role);
    if (!socket) return;

    socketRef.current = socket;

    const fallbackTimer = setTimeout(() => {
      if (socket.connected && sessionStatus === 'waiting') {
        console.warn('⚠️ session-started not received, still waiting...');
      }
    }, 7000);

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join-booking', bookingId);
      if (onReady) onReady();
    });

    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('connect_error', () => setSocketConnected(false));

    socket.on('session-started', (data) => {
      if (data.bookingId === bookingId) {
        setSessionStatus('active');
        setRemainingTime(data.duration || chatDuration * 60);
        toast.success("✅ Session started!");
      }
    });

    socket.on('new-message', async (msg) => {
  if (msg.bookingId === bookingId) {
    setMessages((prev) => [...prev, msg]);

    // 🔄 Save received message to DB
    try {
const token = authToken || sessionStorage.getItem('token'); // ✅ fixes it
;
console.log("🎯 Loaded session token from sessionStorage:", token);

      console.log('🔐 Session Token:', sessionToken);

      await axios.post(
        'https://lawyerbackend-qrqa.onrender.com/lawapi/common/sendmessage',
        {
          bookingId: msg.bookingId,
          content: msg.content,
          files: msg.files || []
        },
        {
          headers: {
              'Content-Type': 'application/json',

            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (err) {
      console.error('❌ Failed to save received message', err.response?.data || err.message);
    }
  }
});


    socket.on('session-time', ({ remaining }) => setRemainingTime(remaining));

    socket.on('session-ended', () => {
      setSessionStatus('expired');
      toast.info("⚠️ Session has ended.");
    });

    socket.on('typing', (data) => {
      if (data.bookingId === bookingId && data.senderId !== currentUser.userId) {
        setOtherTyping(true);
        setTimeout(() => setOtherTyping(false), 1500);
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      socket.off();
      socket.disconnect();
    };
  }, [sessionToken, bookingId, currentUser]);

  
const token = sessionToken || currentUser?.token || sessionStorage.getItem('token');

const fetchChatHistory = async () => {
  try {
    const res = await axios.get(
      `https://lawyerbackend-qrqa.onrender.com/lawapi/common/gethistory/`,
      {
        params: { bookingId },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.data.error && Array.isArray(res.data.data)) {
      const sortedMessages = res.data.data.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setMessages(sortedMessages);
    } else {
      console.warn("⚠️ Failed to fetch history:", res.data.message);
    }
  } catch (err) {
    console.error("❌ Error fetching chat history", err.response?.data || err.message);
  }
};

useEffect(() => {
  if (!token || !bookingId || !currentUser?.userId) return;

  fetchChatHistory(); // ✅ Load previous chat before connecting

  const socket = initSocket(token, currentUser.userId, currentUser.role || role);

  // ✅ Continue with your existing socket logic
}, [token, bookingId, currentUser]);


useEffect(() => {
  if (!sessionToken || !bookingId || !currentUser?.userId) return;

  fetchChatHistory(); // ✅ Load previous chat before connecting

  const socket = initSocket(token, currentUser.userId, currentUser.role || role);
  // ...
}, [sessionToken, bookingId, currentUser]);

const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!message.trim() || sessionStatus !== 'active' || !socketConnected) return;

  const msg = {
    id: uuidv4(),
    sender: currentUser.name,
    senderId: currentUser.userId,
    senderRole: role,
    content: message,
    type: 'text',
    bookingId,
    timestamp: new Date().toISOString(),
  };

  socketRef.current?.emit('chat-message', msg);

  try {
    const payload = {
      bookingId,
      content: message
    };

    console.log("📤 Sending message to backend:", payload);
    console.log("🔐 Session Token:", sessionToken);

  const authToken = sessionStorage.getItem('token'); // or use currentUser?.token

await axios.get(
  `https://lawyerbackend-qrqa.onrender.com/lawapi/common/gethistory/${bookingId}`, // ✅ path param
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);


  } catch (err) {
    console.error('❌ Failed to save message', err.response?.data || err.message);
  }

  setMessage('');
};


  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      socketRef.current?.emit('end-session', { bookingId });
      setSessionStatus('expired');
    }
  };

 const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = async () => {
    const msg = {
      id: uuidv4(),
      sender: currentUser.name,
      senderId: currentUser.userId,
      senderRole: role,
      content: reader.result,
      filename: file.name,
      fileType: file.type,
      type: 'file',
      bookingId,
      timestamp: new Date().toISOString(),
    };

    socketRef.current?.emit('chat-message', msg);

    // Save to DB
    try {
      await axios.post(
  'https://lawyerbackend-qrqa.onrender.com/lawapi/common/sendmessage',
  {
    bookingId,
    content: file.name,
    files: [{
      fileUrl: reader.result,
      fileType: file.type,
      fileName: file.name
    }]
  },
  {
    headers: {
     'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

    } catch (err) {
      console.error('❌ Failed to save file message', err);
    }
  };
  reader.readAsDataURL(file);
};


  return (
    <ChatContainer elevation={3}>
      {showEmojiPicker && (
        <EmojiPickerContainer ref={emojiPickerRef}>
          <Picker
            data={data}
            onEmojiSelect={(emoji) => {
              setMessage(prev => prev + emoji.native);
              setShowEmojiPicker(false);
            }}
            onClickOutside={() => setShowEmojiPicker(false)}
          />
        </EmojiPickerContainer>
      )}

<ChatHeader>
  <ProfileInfo>
    <StatusBadge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      variant="dot"
      color={socketConnected ? 'success' : 'error'}
    >
     <Avatar sx={{ bgcolor: 'white', color: '#1976d2' }}>
  {(role === 'lawyer'
    ? (client?.name || messages[0]?.sender || 'C')
    : (lawyer?.name || 'L')
  ).charAt(0).toUpperCase()}
</Avatar>

    </StatusBadge>
    <div>
<Typography variant="subtitle1" fontWeight="bold">
  {role === 'lawyer'
    ? client?.name || messages[0]?.sender || 'Client'
    : lawyer?.name || 'Lawyer'}
</Typography>


      <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
        <WorkIcon fontSize="inherit" />
        {role === 'lawyer' ? 'Client' : (lawyer?.specialization || 'Legal Professional')}
      </Typography>
    </div>
  </ProfileInfo>

  <SessionInfo>
    <Tooltip title="Time remaining">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <TimerIcon fontSize="small" />
        <Typography variant="body2">{formatTime(remainingTime)}</Typography>
      </div>
    </Tooltip>

    {sessionStatus === 'active' && (
      <Button
        variant="contained"
        color="error"
        size="small"
        onClick={handleEndSession}
        endIcon={<CloseIcon />}
      >
        End
      </Button>
    )}
  </SessionInfo>
</ChatHeader>



      <MessagesContainer>
        {sessionStatus === 'waiting' ? (
          <EmptyState>
            <CircularProgress size={48} thickness={4} />
            <Typography variant="h6" mt={2}>Setting up your secure consultation...</Typography>
            <Typography variant="body2" mt={1}>
              Please wait while we connect you with {role === 'lawyer' ? 'the client' : 'your attorney'}
            </Typography>
          </EmptyState>
        ) : messages.length === 0 ? (
          <EmptyState>
            <Typography variant="h5" color="primary">⚖️ Secure Legal Consultation</Typography>
            <Typography variant="body1" mt={2}>
              This is a private, encrypted conversation with your {role === 'lawyer' ? 'client' : 'attorney'}
            </Typography>
            <Typography variant="body2">
              All communications are confidential and protected by attorney-client privilege
            </Typography>
          </EmptyState>
        ) : (
          messages
            .filter((msg) => msg?.content)
            .map((msg) => (
              <MessageBubble
                key={msg._id || msg.id || `${msg.senderId}-${msg.timestamp}`}
                className={`${msg.senderId === currentUser.userId ? 'sent' : 'received'}`}
              >
                <MessageMeta>
                  <span>
                    {msg.senderRole === 'lawyer' ? (
                      <WorkIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    ) : (
                      <PersonIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    )}
                    {msg.sender}
                  </span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </MessageMeta>
                {msg.type === 'file' ? (
                  msg.fileType.startsWith('image') ? (
                    <img 
                      src={msg.content} 
                      alt={msg.filename} 
                      style={{ maxWidth: '100%', borderRadius: 8, marginTop: 4 }}
                    />
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      href={msg.content}
                      download={msg.filename}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ mt: 1 }}
                    >
                      📄 {msg.filename}
                    </Button>
                  )
                ) : (
                  <div>{msg.content}</div>
                )}
              </MessageBubble>
            ))
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {sessionStatus === 'active' && (
        <>
          {otherTyping && (
            <TypingIndicator>
              <CircularProgress size={12} thickness={5} />
              {role === 'lawyer' ? 'Client' : 'Lawyer'} is typing...
            </TypingIndicator>
          )}

          {showEmojiPicker && (
            <EmojiPickerContainer>
              <Picker 
                data={data} 
                onEmojiSelect={(e) => setMessage((prev) => prev + e.native)}
                onClickOutside={() => setShowEmojiPicker(false)}
              />
            </EmojiPickerContainer>
          )}

          <InputContainer onSubmit={handleSendMessage}>
            <Tooltip title="Add emoji">
              <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)}>
                <EmojiIcon color="primary" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Attach file">
              <IconButton onClick={() => fileInputRef.current.click()}>
                <AttachFileIcon color="primary" />
              </IconButton>
            </Tooltip>
            <FileInput
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
            />

            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Type your message..."
              value={message}
              onChange={handleTyping}
              disabled={!socketConnected}
              sx={{ mx: 1 }}
            />

            <Tooltip title="Send message">
              <span>
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={!message.trim() || !socketConnected}
                >
                  <SendIcon />
                </IconButton>
              </span>
            </Tooltip>
          </InputContainer>
        </>
      )}

      {sessionStatus === 'expired' && (
        <EmptyState>
          <Typography variant="h6" color="error">Session Ended</Typography>
          <Typography variant="body1" mt={2}>
            This consultation session has concluded
          </Typography>
          <Typography variant="body2">
            {role === 'lawyer' ? 'You may close this window' : 'Thank you for your consultation'}
          </Typography>
        </EmptyState>
      )}
    </ChatContainer>
  );
};

export default ChatBox;