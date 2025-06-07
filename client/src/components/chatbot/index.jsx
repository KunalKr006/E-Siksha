import { useState, useRef, useEffect, useContext } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, X } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuthContext } from "@/context/auth-context";
import { sendChatMessageService } from "@/services";

function Chatbot({
  courseId,
  lectureId
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const { auth } = useContext(AuthContext);
  const studentName = auth?.user?.userName || 'Student';

  // Initial greeting message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: 'bot',
          text: `Hello ${studentName}, how can I help you with this course?`,
        },
      ]);
    }
  }, [isOpen, messages.length, studentName]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const userMessage = {
      sender: 'user',
      text: inputMessage,
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await sendChatMessageService(courseId, lectureId, messageToSend);

      if (response.success) {
        setMessages(prevMessages => [
          ...prevMessages,
          { sender: 'bot', text: response.response }
        ]);
      } else {
        setMessages(prevMessages => [
          ...prevMessages,
          { sender: 'bot', text: 'Error getting response.' }
        ]);
        console.error('Error from chatbot backend:', response.message);
      }
    } catch (error) {
      console.error('Error sending message to chatbot backend:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: 'bot', text: 'Error sending message.' }
      ]);
    } finally {
        setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          className="rounded-full w-12 h-12 shadow-lg"
          onClick={toggleChatbot}
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-96 h-[500px] flex flex-col shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
            <CardTitle className="text-md font-semibold">E-Siksha Bot</CardTitle>
            <Button variant="ghost" onClick={toggleChatbot} size="icon" className="w-6 h-6">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-grow p-3 overflow-hidden">
            <ScrollArea className="h-full pr-2">
              <div className="flex flex-col space-y-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg p-2 max-w-[80%] text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="rounded-lg p-2 max-w-[80%] text-sm bg-gray-200 text-gray-800">
                            ...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <div className="p-3 border-t flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-grow"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default Chatbot; 