import authService from './authService';
import { getAccessToken } from './tokenService';

class ChatbotNavigationService {
    constructor() {
      this.navigationHandlers = new Map();
      this.authListenerSetup = false;
      this.lastResponse = null;
      this.instanceId = `nav-service-${Date.now()}`;
      this.authContext = null;
      this.messageQueue = [];
      this.isProcessing = false;
      
      // Listen for messages from the chatbot
      this.setupMessageListener();
      
      // Listen for auth state changes
      this.setupAuthListener();

      // Listen for chatbot responses
      this.setupChatbotResponseListener();
    }

    // Set auth context reference from Dashboard
    setAuthContext(authContext) {
      this.authContext = authContext;
    }
  
    // Check if user is authenticated
    get isUserAuthenticated() {
      // Check if we have a valid token
      const token = getAccessToken();
      if (!token) return false;

      // Check authService if available
      if (authService && typeof authService.isAuthenticated === 'boolean') {
        return authService.isAuthenticated;
      }

      // Check auth context if available
      if (this.authContext?.isLoggedIn) {
        return this.authContext.isLoggedIn;
      }

      // Fallback: check localStorage for auth indicators
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
      return !!authToken;
    }
  
    // Get current user info
    getCurrentUser() {
      if (!this.isUserAuthenticated) {
        return null;
      }
      
      // Get user from auth context if available
      if (this.authContext?.user) {
        return {
          authenticated: true,
          ...this.authContext.user
        };
      }
      
      // Try to get user from localStorage
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          return { authenticated: true, ...user };
        }
      } catch (e) {
        console.warn('Failed to parse user from localStorage:', e);
      }
      
      // Fallback to basic authenticated object
      return { authenticated: true };
    }
  
    // Setup listener for auth state changes
    setupAuthListener() {
      if (this.authListenerSetup) return;
      
      this.authListenerSetup = true;
      
      // Listen for custom auth events
      window.addEventListener('authStateChanged', (event) => {
        console.log('Auth state changed:', event.detail);
        this.handleAuthStateChange(event.detail);
      });

      // Listen for storage changes (for logout detection)
      window.addEventListener('storage', (event) => {
        if (event.key === 'authToken' || event.key === 'accessToken') {
          const isAuth = this.isUserAuthenticated;
          this.sendAuthStatusUpdate(isAuth);
        }
      });
    }

    // Setup listener for chatbot responses
    setupChatbotResponseListener() {
      // This would typically be integrated with your chatbot component
      // For now, we'll listen for custom events
      window.addEventListener('chatbotResponse', (event) => {
        this.handleChatbotResponse(event.detail);
      });
    }

    // Handle responses from chatbot that contain navigation commands
    handleChatbotResponse(response) {
      if (!response || !response.custom) return;

      const { custom } = response;
      
      // Handle navigation commands from chatbot
      if (custom.action) {
        this.handleNavigationRequest({
          action: custom.action,
          nodeId: custom.nodeId,
          nodeName: custom.nodeName,
          sensorType: custom.sensorType,
          confirmationId: custom.confirmationId
        });
      }
    }
  
    // Register navigation handlers from the Dashboard component
    registerNavigationHandlers(handlers) {
      // Clear existing handlers
      this.navigationHandlers.clear();
      
      // Register new handlers
      this.navigationHandlers.set('nodeAnalytics', handlers.handleNodeAnalyticsClick);
      this.navigationHandlers.set('sensorTypeAnalytics', handlers.handleSensorTypeAnalyticsClick);
      this.navigationHandlers.set('setCurrentNode', handlers.setCurrentNode);
      this.navigationHandlers.set('setSelectedRow', handlers.setSelectedRow);
      this.navigationHandlers.set('setShowSensorTypeAnalytics', handlers.setShowSensorTypeAnalytics);
      this.navigationHandlers.set('setCurrentSensorType', handlers.setCurrentSensorType);
      this.navigationHandlers.set('allNodes', handlers.allNodes || []);
      
      console.log('Navigation handlers registered:', this.navigationHandlers.size);
      
      // Process any queued messages
      this.processMessageQueue();
    }

    // Process queued messages
    processMessageQueue() {
      if (this.isProcessing || this.messageQueue.length === 0) return;
      
      this.isProcessing = true;
      
      while (this.messageQueue.length > 0) {
        const queuedPayload = this.messageQueue.shift();
        this.handleNavigationRequest(queuedPayload);
      }
      
      this.isProcessing = false;
    }
  
    // Setup listener for chatbot messages
    setupMessageListener() {
      window.addEventListener('message', (event) => {
        // Allow same-origin messages
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data.type === 'CHATBOT_NAVIGATION') {
          this.handleNavigationRequest(event.data.payload);
        }
      });
    }
  
    // Handle navigation requests from chatbot
    async handleNavigationRequest(payload) {
      const { action, nodeId, nodeName, sensorType, confirmationId } = payload;

      console.log('Handling navigation request:', { action, nodeId, nodeName, sensorType });

      // If handlers not ready, queue the message
      if (action.startsWith('NAVIGATE_') && this.navigationHandlers.size === 0) {
        console.log('Handlers not ready, queueing message');
        this.messageQueue.push(payload);
        return;
      }

      // Check authentication first for navigation actions
      if (action.startsWith('NAVIGATE_') && !this.isUserAuthenticated) {
        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          success: false,
          message: 'Please log in first to access analytics views.',
          requiresAuth: true,
          confirmationId
        });
        return;
      }

      try {
        switch (action) {
          case 'NAVIGATE_TO_NODE_ANALYTICS':
            await this.navigateToNodeAnalytics(nodeId, nodeName, confirmationId);
            break;
            
          case 'NAVIGATE_TO_SENSOR_TYPE_ANALYTICS':
            await this.navigateToSensorTypeAnalytics(sensorType, confirmationId);
            break;
            
          case 'REQUEST_NODE_LIST':
            this.sendNodeList(confirmationId);
            break;
            
          case 'REQUEST_SENSOR_TYPE_LIST':
            this.sendSensorTypeList(confirmationId);
            break;
            
          case 'CHECK_AUTH_STATUS':
            this.sendAuthStatus(confirmationId);
            break;
            
          default:
            this.sendResponseToChatbot({
              type: 'NAVIGATION_RESPONSE',
              success: false,
              message: `Unknown navigation action: ${action}`,
              confirmationId
            });
        }
      } catch (error) {
        console.error('Navigation error:', error);
        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          success: false,
          message: 'Navigation failed. Please try again.',
          confirmationId,
          error: error.message
        });
      }
    }
  
    // Send current auth status to chatbot
    sendAuthStatus(confirmationId = null) {
      const isAuth = this.isUserAuthenticated;
      const user = this.getCurrentUser();
      
      this.sendResponseToChatbot({
        type: 'AUTH_STATUS_RESPONSE',
        isAuthenticated: isAuth,
        user: user,
        message: isAuth ? 'User is authenticated' : 'User is not authenticated',
        confirmationId
      });
    }

    // Send auth status update (for internal use)
    sendAuthStatusUpdate(isAuthenticated) {
      this.sendResponseToChatbot({
        type: 'AUTH_STATUS_CHANGED',
        isAuthenticated,
        user: isAuthenticated ? this.getCurrentUser() : null,
        message: isAuthenticated ? 'User logged in' : 'User logged out'
      });
    }
  
    // Navigate to node analytics
    async navigateToNodeAnalytics(nodeId, nodeName, confirmationId) {
      const allNodes = this.navigationHandlers.get('allNodes') || [];
      
      if (!Array.isArray(allNodes) || allNodes.length === 0) {
        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          confirmationId,
          success: false,
          message: 'No nodes available. Please wait for data to load.'
        });
        return;
      }

      let targetNode;
  
      // Search by nodeId first (more specific)
      if (nodeId) {
        const parsedNodeId = parseInt(nodeId, 10);
        if (!Number.isNaN(parsedNodeId)) {
          targetNode = allNodes.find(n => n.nodeId === parsedNodeId);
        }
      }
      
      // If not found by ID, search by name (case-insensitive, partial match)
      if (!targetNode && nodeName) {
        const normalizedName = nodeName.toLowerCase().trim();
        targetNode = allNodes.find(n => 
          n.nodeName && n.nodeName.toLowerCase().includes(normalizedName)
        );
      }
  
      if (!targetNode) {
        const searchTerm = nodeName || nodeId;
        const availableNodes = allNodes.slice(0, 5).map(n => n.nodeName).join(', ');
        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          confirmationId,
          success: false,
          message: `Node "${searchTerm}" not found. Available nodes include: ${availableNodes}${allNodes.length > 5 ? '...' : ''}`
        });
        return;
      }
  
      // Execute navigation
      const setCurrentNode = this.navigationHandlers.get('setCurrentNode');
      const handleNodeAnalytics = this.navigationHandlers.get('nodeAnalytics');
      
      if (!setCurrentNode || !handleNodeAnalytics) {
        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          confirmationId,
          success: false,
          message: 'Navigation handlers not available. Please refresh the page.'
        });
        return;
      }

      try {
        // Create node object for navigation
        const nodeForNavigation = {
          nodeId: targetNode.nodeId,
          nodeName: targetNode.nodeName,
          domainName: targetNode.domainName,
          sensorTypeName: targetNode.sensorTypeName,
          nodeArea: targetNode.nodeArea,
          lat: targetNode.lat,
          lng: targetNode.lng,
          sensorTypeId: targetNode.sensorTypeId
        };

        // Set the current node first
        setCurrentNode(nodeForNavigation);

        // Then navigate to analytics
        handleNodeAnalytics(nodeForNavigation);

        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          confirmationId,
          success: true,
          message: `Successfully navigated to ${targetNode.nodeName} analytics view.`,
          navigatedTo: {
            type: 'node_analytics',
            nodeId: targetNode.nodeId,
            nodeName: targetNode.nodeName,
            domain: targetNode.domainName,
            sensorType: targetNode.sensorTypeName
          }
        });
      } catch (navError) {
        console.error('Navigation execution error:', navError);
        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          confirmationId,
          success: false,
          message: 'Failed to execute navigation. Please try again.',
          error: navError.message
        });
      }
    }
  
    // Navigate to sensor type analytics
    async navigateToSensorTypeAnalytics(sensorType, confirmationId) {
      const allNodes = this.navigationHandlers.get('allNodes') || [];
      
      if (!Array.isArray(allNodes) || allNodes.length === 0) {
        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          confirmationId,
          success: false,
          message: 'No sensor type data available. Please wait for data to load.'
        });
        return;
      }

      const availableSensorTypes = [...new Set(allNodes.map(n => n.sensorTypeName).filter(Boolean))];
      
      const normalizedSensorType = sensorType.toLowerCase().trim();
      const targetSensorType = availableSensorTypes.find(st => 
        st && st.toLowerCase().includes(normalizedSensorType)
      );
  
      if (!targetSensorType) {
        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          confirmationId,
          success: false,
          message: `Sensor type "${sensorType}" not found. Available types: ${availableSensorTypes.join(', ')}`
        });
        return;
      }
  
      // Execute navigation
      const setCurrentSensorType = this.navigationHandlers.get('setCurrentSensorType');
      const setShowSensorTypeAnalytics = this.navigationHandlers.get('setShowSensorTypeAnalytics');
      
      if (!setCurrentSensorType || !setShowSensorTypeAnalytics) {
        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          confirmationId,
          success: false,
          message: 'Sensor type navigation handlers not available. Please refresh the page.'
        });
        return;
      }

      try {
        setCurrentSensorType(targetSensorType);
        setShowSensorTypeAnalytics(true);

        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          confirmationId,
          success: true,
          message: `Successfully navigated to ${targetSensorType} analytics view.`,
          navigatedTo: {
            type: 'sensor_type_analytics',
            sensorType: targetSensorType
          }
        });
      } catch (navError) {
        console.error('Sensor type navigation error:', navError);
        this.sendResponseToChatbot({
          type: 'NAVIGATION_RESPONSE',
          confirmationId,
          success: false,
          message: 'Failed to navigate to sensor type analytics. Please try again.',
          error: navError.message
        });
      }
    }
  
    // Send available nodes list to chatbot
    sendNodeList(confirmationId = null) {
      if (!this.isUserAuthenticated) {
        this.sendResponseToChatbot({
          type: 'NODE_LIST_RESPONSE',
          success: false,
          message: 'Authentication required to access node list.',
          requiresAuth: true,
          confirmationId
        });
        return;
      }

      const allNodes = this.navigationHandlers.get('allNodes') || [];
      
      if (!Array.isArray(allNodes)) {
        this.sendResponseToChatbot({
          type: 'NODE_LIST_RESPONSE',
          success: false,
          message: 'Node data not available.',
          confirmationId
        });
        return;
      }

      const nodesList = allNodes.map(node => ({
        id: node.nodeId,
        name: node.nodeName,
        domain: node.domainName,
        sensorType: node.sensorTypeName,
        area: node.nodeArea || 'Unknown'
      })).filter(node => node.name); // Filter out nodes without names
  
      this.sendResponseToChatbot({
        type: 'NODE_LIST_RESPONSE',
        success: true,
        nodes: nodesList,
        count: nodesList.length,
        message: `Found ${nodesList.length} available nodes.`,
        confirmationId
      });
    }
  
    // Send available sensor types list to chatbot
    sendSensorTypeList(confirmationId = null) {
      if (!this.isUserAuthenticated) {
        this.sendResponseToChatbot({
          type: 'SENSOR_TYPE_LIST_RESPONSE',
          success: false,
          message: 'Authentication required to access sensor type list.',
          requiresAuth: true,
          confirmationId
        });
        return;
      }

      const sensorTypes = [...new Set(allNodes.map(n => n.sensorTypeName).filter(Boolean))];
  
      this.sendResponseToChatbot({
        type: 'SENSOR_TYPE_LIST_RESPONSE',
        success: true,
        sensorTypes: sensorTypes,
        count: sensorTypes.length,
        confirmationId
      });
    }
  
    // Send response back to chatbot
    sendResponseToChatbot(response) {
      // Add timestamp and service info to response
      const responseWithTimestamp = {
        ...response,
        timestamp: new Date().toISOString(),
        serviceId: this.constructor.name,
        instanceId: this.instanceId
      };

      // Store the last response for debugging
      this.lastResponse = responseWithTimestamp;
      
      // Broadcast to window for chatbot to receive
      window.postMessage({
        type: 'CHATBOT_NAVIGATION_RESPONSE',
        payload: responseWithTimestamp
      }, window.location.origin);
      
      console.log('Sending to chatbot:', responseWithTimestamp);
    }
  
    // Method to handle logout (call this when user logs out)
    handleLogout() {
      // Clear any cached data
      this.lastResponse = null;
      console.log('User logged out - clearing navigation service cache');
      
      this.sendAuthStatusUpdate(false);
    }

    // Method to handle login (call this when user logs in)
    handleLogin(user = null) {
      console.log('User logged in - navigation service ready');
      this.sendAuthStatusUpdate(true);
    }

    // Handle auth state changes
    handleAuthStateChange(authState) {
      console.log('Auth state changed:', authState);
      
      if (!authState.isAuthenticated) {
        this.handleLogout();
      } else {
        this.handleLogin(authState.user);
      }
    }

    updateAuthStatus(isAuthenticated, user = null) {
      if (isAuthenticated) {
        this.handleLogin(user);
      } else {
        this.handleLogout();
      }
    }

    // Cleanup method
    destroy() {
      this.navigationHandlers.clear();
      this.authContext = null;
      this.lastResponse = null;
      console.log('ChatbotNavigationService destroyed');
    }
  }
  
  // Create singleton instance
  const chatbotNavService = new ChatbotNavigationService();
  export default chatbotNavService;