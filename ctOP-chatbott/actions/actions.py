from rasa_sdk import Action
from rasa_sdk.events import SlotSet
from rasa_sdk import Tracker
import logging
import os
import typing
from typing import Any, Text, Dict, List
from rasa_sdk.executor import CollectingDispatcher
import requests
import json
import uuid


try:
    from .data_loader import FAQLoader
    from .recommender import FAQRecommender
except ImportError:
    try:
        from data_loader import FAQLoader
        from recommender import FAQRecommender
    except ImportError:
        import sys
        # Add the actions directory to the path
        actions_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.append(actions_dir)
        from data_loader import FAQLoader
        from recommender import FAQRecommender

base = os.path.dirname(os.path.abspath(__file__))
faq_file = os.path.join(base, "..", "data_for_recommendations.yml")

# Initialize components - pass the file path, not the data
recommender = FAQRecommender(faq_file=faq_file)

class RecommendFAQsAction(Action):
    def name(self) -> Text:
        return "action_recommend_faqs"
    
    def get_last_user_message(self, tracker: Tracker) -> typing.Tuple[Text, Text]:
        """Safely extract the last user message and intent from tracker events"""
        events = tracker.events
        
        # Traverse events in reverse to find the last user message
        for event in reversed(events):
            if event.get("event") == "user":
                # Get message text
                text = event.get("text", "")
                
                # Get intent from parse data
                parse_data = event.get("parse_data", {})
                intent = parse_data.get("intent", {}).get("name", "")
                
                return text, intent
                
        return "", ""

    def run(self, dispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        try:
            # Safely get user message and intent
            user_text, current_intent = self.get_last_user_message(tracker)
            
            logging.debug(f"User text: '{user_text}'")
            logging.debug(f"Current intent: '{current_intent}'")
            
            if not user_text:
                logging.warning("No user message found in tracker events")
                return []
            
            # Skip if user just clicked a button
            if user_text.startswith("/"):
                logging.debug("Skipping recommendation for button click")
                return []
            
            # Get recommendations
            recs = recommender.recommend(user_text, current_intent)
            logging.debug(f"Found {len(recs)} recommendations")
            
            if not recs:
                logging.debug("No recommendations found")
                return []
            
            # Log recommendations
            for i, rec in enumerate(recs):
                logging.debug(f"Rec {i+1}: {rec['text']} (score: {rec['score']:.3f})")
            
            # Create buttons
            buttons = []
            for rec in recs:
                display_text = rec["text"]
                if len(display_text) > 35:
                    display_text = display_text[:32] + "..."
                    
                buttons.append({
                    "title": display_text,
                    "payload": f"/{rec['intent']}"
                })
            
            # Send recommendation message
            dispatcher.utter_message(
                text="You might also want to know:",
                buttons=buttons
            )
            
            return [SlotSet("last_recommendations", [r["intent"] for r in recs])]
            
        except Exception as e:
            logging.error(f"Recommendation failed: {str(e)}", exc_info=True)
            dispatcher.utter_message(text="Here are some common questions:")
            dispatcher.utter_message(response="utter_fallback_suggestions")
            return []
        
        
        
class ActionHandleEscalatedFallback(Action):
    def name(self) -> Text:
        return "action_handle_escalated_fallback"
    
    def run(
        self, 
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        
        # Get current fallback count
        fallback_count = tracker.get_slot("consecutive_fallbacks") or 0
        
        # Increment counter
        new_count = fallback_count + 1
        
        # Check if we need to show help menu
        if new_count >= 3:
            dispatcher.utter_message(response="utter_help_menu")
            # Reset counter after showing help menu
            return [SlotSet("consecutive_fallbacks", 0)]
        else:
            # Send default message
            dispatcher.utter_message(response="utter_default")
            return [SlotSet("consecutive_fallbacks", new_count)]

class ActionResetFallbackCounter(Action):
    def name(self) -> Text:
        return "action_reset_fallback_counter"
    
    def run(
        self, 
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        
        return [SlotSet("consecutive_fallbacks", 0)]

class ActionHandleHelpSelection(Action):
    def name(self) -> Text:
        return "action_handle_help_selection"
    
    def run(
        self, 
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        
        # Get the selected help topic from entity
        help_topic = None
        entities = tracker.latest_message.get('entities', [])
        
        for entity in entities:
            if entity.get('entity') == 'help_topic':
                help_topic = entity.get('value')
                break
        
        # Respond based on selected topic
        if help_topic == "getting_started":
            dispatcher.utter_message(response="utter_help_getting_started")
        elif help_topic == "features":
            dispatcher.utter_message(response="utter_help_features")
        elif help_topic == "management":
            dispatcher.utter_message(response="utter_help_management")
        elif help_topic == "security":
            dispatcher.utter_message(response="utter_help_security")
        elif help_topic == "general":
            dispatcher.utter_message(response="utter_help_general")
        else:
            dispatcher.utter_message(text="Please select one of the help topics above.")
        
        # Reset fallback counter as user engaged with help
        return [SlotSet("consecutive_fallbacks", 0)]





class ActionRequestNodeNavigationConfirmation(Action):
    def name(self) -> Text:
        return "action_request_node_navigation_confirmation"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        node_name = next(tracker.get_latest_entity_values("node_name"), None)
        
        if not node_name:
            dispatcher.utter_message(text="Please specify which node you'd like to navigate to.")
            return []
        
        # Generate confirmation ID for tracking
        confirmation_id = str(uuid.uuid4())
        
        # Store in slot for later use
        dispatcher.utter_message(
            text=f"Would you like me to navigate you to the analytics view for node '{node_name}'?",
            buttons=[
                {"title": "Yes, navigate", "payload": "/confirm_navigation"},
                {"title": "No, cancel", "payload": "/deny_navigation"}
            ]
        )
        
        return [
            SlotSet("pending_node_name", node_name),
            SlotSet("confirmation_id", confirmation_id)
        ]


class ActionRequestSensorNavigationConfirmation(Action):
    def name(self) -> Text:
        return "action_request_sensor_navigation_confirmation"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        sensor_type = next(tracker.get_latest_entity_values("sensor_type"), None)
        
        if not sensor_type:
            dispatcher.utter_message(text="Please specify which sensor type you'd like to navigate to.")
            return []
        
        confirmation_id = str(uuid.uuid4())
        
        dispatcher.utter_message(
            text=f"Would you like me to navigate you to the analytics view for '{sensor_type}' sensors?",
            buttons=[
                {"title": "Yes, navigate", "payload": "/confirm_navigation"},
                {"title": "No, cancel", "payload": "/deny_navigation"}
            ]
        )
        
        return [
            SlotSet("pending_sensor_type", sensor_type),
            SlotSet("confirmation_id", confirmation_id)
        ]


class ActionNavigateToNodeAnalytics(Action):
    def name(self) -> Text:
        return "action_navigate_to_node_analytics"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        node_name = tracker.get_slot("pending_node_name")
        confirmation_id = tracker.get_slot("confirmation_id")
        
        if not node_name:
            dispatcher.utter_message(text="No node specified for navigation.")
            return []
        
        # Send navigation request to frontend
        navigation_payload = {
            "action": "NAVIGATE_TO_NODE_ANALYTICS",
            "nodeName": node_name,
            "confirmationId": confirmation_id
        }
        
        # Send both text and custom data
        dispatcher.utter_message(
            text=f"Navigating you to the analytics view for node '{node_name}'...",
            custom=navigation_payload
        )
        
        return [
            SlotSet("pending_node_name", None),
            SlotSet("confirmation_id", None)
        ]


class ActionNavigateToSensorAnalytics(Action):
    def name(self) -> Text:
        return "action_navigate_to_sensor_analytics"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        sensor_type = tracker.get_slot("pending_sensor_type")
        confirmation_id = tracker.get_slot("confirmation_id")
        
        if not sensor_type:
            dispatcher.utter_message(text="No sensor type specified for navigation.")
            return []
        
        navigation_payload = {
            "action": "NAVIGATE_TO_SENSOR_TYPE_ANALYTICS",
            "sensorType": sensor_type,
            "confirmationId": confirmation_id
        }
        
        dispatcher.utter_message(
            text=f"Navigating you to the analytics view for '{sensor_type}' sensors...",
            custom=navigation_payload
        )
        
        return [
            SlotSet("pending_sensor_type", None),
            SlotSet("confirmation_id", None)
        ]


class ActionRequestNodeSelection(Action):
    def name(self) -> Text:
        return "action_request_node_selection"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Request available nodes from frontend
        dispatcher.utter_message(
            text="Which node would you like to navigate to? You can say something like 'Navigate to node sensor_01'",
            custom={
                "action": "REQUEST_NODE_LIST"
            }
        )
        
        return []


class ActionRequestSensorTypeSelection(Action):
    def name(self) -> Text:
        return "action_request_sensor_type_selection"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        dispatcher.utter_message(
            text="Which sensor type would you like to navigate to? You can say something like 'Navigate to air quality sensor analytics'",
            custom={
                "action": "REQUEST_SENSOR_TYPE_LIST"
            }
        )
        
        return []


class ActionListAvailableNodes(Action):
    def name(self) -> Text:
        return "action_list_available_nodes"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        dispatcher.utter_message(
            text="Let me get the list of available nodes for you...",
            custom={
                "action": "REQUEST_NODE_LIST"
            }
        )
        
        return []


class ActionListAvailableSensorTypes(Action):
    def name(self) -> Text:
        return "action_list_available_sensor_types"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        dispatcher.utter_message(
            text="Let me get the list of available sensor types for you...",
            custom={
                "action": "REQUEST_SENSOR_TYPE_LIST"
            }
        )
        
        return []


class ActionDenyNavigation(Action):
    def name(self) -> Text:
        return "action_deny_navigation"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        dispatcher.utter_message(text="Navigation cancelled. Is there anything else I can help you with?")
        
        return [
            SlotSet("pending_node_name", None),
            SlotSet("pending_sensor_type", None),
            SlotSet("confirmation_id", None)
        ]


class ActionCheckAuthStatus(Action):
    def name(self) -> Text:
        return "action_check_auth_status"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        dispatcher.utter_message(
            text="Checking authentication status...",
            custom={
                "action": "CHECK_AUTH_STATUS"
            }
        )
        
        return []