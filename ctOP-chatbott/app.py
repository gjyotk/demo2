# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from rasa.core.agent import Agent
# from rasa.core.channels.channel import CollectingOutputChannel, UserMessage
# from rasa.utils.endpoints import EndpointConfig
# from fastapi.middleware.cors import CORSMiddleware
# import os
# import logging
# import asyncio

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI()

# # Enable CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Global agent variable
# agent = None

# class ChatRequest(BaseModel):
#     sender: str
#     message: str

# @app.on_event("startup")
# async def load_agent():
#     """Load the Rasa agent on startup with action server configuration"""
#     global agent
#     model_dir = os.path.join(os.path.dirname(__file__), "models")
    
#     try:
#         model_files = [f for f in os.listdir(model_dir) if f.endswith(".tar.gz")]
#         if not model_files:
#             raise FileNotFoundError("No model files found in models directory")
            
#         model_path = os.path.join(model_dir, sorted(model_files)[-1])
#         logger.info(f"Loading model from: {model_path}")
        
#         # Configure action endpoint
#         action_endpoint = EndpointConfig(url="http://localhost:5055/webhook")
        
#         # Load agent with action endpoint configuration
#         agent = Agent.load(
#             model_path,
#             action_endpoint=action_endpoint
#         )
#         logger.info("Rasa agent loaded successfully with action server configuration")
#     except Exception as e:
#         logger.error(f"Error loading agent: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=500, detail=f"Failed to load agent: {str(e)}")

# @app.post("/chat")
# async def chat_with_bot(request: ChatRequest):
#     """Handle chat requests"""
#     global agent
    
#     if not agent:
#         raise HTTPException(status_code=500, detail="Agent not loaded")
    
#     try:
#         # Create output channel
#         output_channel = CollectingOutputChannel()
        
#         # Create proper UserMessage object
#         message = UserMessage(
#             text=request.message,
#             output_channel=output_channel,
#             sender_id=request.sender
#         )
        
#         # Process message
#         await agent.handle_message(message)
        
#         # Format responses
#         responses = []
#         for msg in output_channel.messages:
#             response = {"text": msg.get("text", "")}
#             if "buttons" in msg:
#                 response["buttons"] = msg["buttons"]
#             responses.append(response)
        
#         return {"responses": responses}
        
#     except Exception as e:
#         logger.error(f"Error processing message: {str(e)}", exc_info=True)
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error processing message: {str(e)}"
#         )

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rasa.core.agent import Agent
from rasa.core.channels.channel import CollectingOutputChannel, UserMessage
from rasa.utils.endpoints import EndpointConfig
import os
import logging
import asyncio
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global agent variable
agent = None

class ChatRequest(BaseModel):
    sender: str
    message: str

class ChatResponse(BaseModel):
    text: Optional[str] = None
    buttons: Optional[List[Dict[str, str]]] = None
    custom: Optional[Dict[str, Any]] = None

class ChatAPIResponse(BaseModel):
    responses: List[ChatResponse]

@app.on_event("startup")
async def load_agent():
    """Load the Rasa agent on startup with action server configuration"""
    global agent
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    
    try:
        # Check if models directory exists
        if not os.path.exists(model_dir):
            logger.warning(f"Models directory not found: {model_dir}")
            os.makedirs(model_dir, exist_ok=True)
            
        model_files = [f for f in os.listdir(model_dir) if f.endswith(".tar.gz")]
        if not model_files:
            logger.warning("No model files found in models directory")
            # For development, you might want to continue without a model
            # or provide a default model path
            return
            
        model_path = os.path.join(model_dir, sorted(model_files)[-1])
        logger.info(f"Loading model from: {model_path}")
        
        # Configure action endpoint
        action_endpoint = EndpointConfig(url="http://localhost:5055/webhook")
        
        # Load agent with action endpoint configuration
        agent = Agent.load(
            model_path,
            action_endpoint=action_endpoint
        )
        logger.info("Rasa agent loaded successfully with action server configuration")
        
    except Exception as e:
        logger.error(f"Error loading agent: {str(e)}", exc_info=True)
        # Don't raise here to allow the server to start
        # raise HTTPException(status_code=500, detail=f"Failed to load agent: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Rasa Chatbot API is running", "agent_loaded": agent is not None}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agent_loaded": agent is not None,
        "version": "1.0.0"
    }

@app.post("/chat", response_model=ChatAPIResponse)
async def chat_with_bot(request: ChatRequest):
    """Handle chat requests"""
    global agent
    
    if not agent:
        logger.error("Agent not loaded")
        raise HTTPException(status_code=500, detail="Agent not loaded. Please check server logs.")
    
    try:
        # Create output channel
        output_channel = CollectingOutputChannel()
        
        # Create proper UserMessage object
        message = UserMessage(
            text=request.message,
            output_channel=output_channel,
            sender_id=request.sender
        )
        
        # Process message
        await agent.handle_message(message)
        
        # Format responses
        responses = []
        for msg in output_channel.messages:
            response = ChatResponse()
            
            # Handle text response
            if "text" in msg and msg["text"]:
                response.text = msg["text"]
            
            # Handle buttons
            if "buttons" in msg and msg["buttons"]:
                response.buttons = msg["buttons"]
            
            # Handle custom data (navigation commands)
            if "custom" in msg and msg["custom"]:
                response.custom = msg["custom"]
            
            responses.append(response)
        
        # If no responses, provide a default fallback
        if not responses:
            responses.append(ChatResponse(text="I'm sorry, I didn't understand that. Could you please rephrase?"))
        
        return ChatAPIResponse(responses=responses)
        
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )

@app.post("/webhook")
async def webhook():
    """Webhook endpoint for external integrations"""
    return {"status": "received"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)