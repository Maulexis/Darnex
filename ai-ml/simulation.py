import pandas as pd
import joblib
import pickle
import networkx as nx
from datetime import datetime, timedelta
import time
import random

# --- CONFIGURATION ---
SIMULATION_TICKS = 60         # How many minutes the simulation will run for
SECONDS_PER_TICK = 0.5        # How fast the simulation runs in real-time (lower is faster)

# --- 1. LOAD MODELS AND GRAPH ("THE BRAINS") ---
def load_assets():
    """Loads all the trained models and the railway graph from disk."""
    try:
        decision_maker = joblib.load('models/decision_maker.pkl')
        with open('models/railway_graph.gpickle', 'rb') as f:
            railway_graph = pickle.load(f)
        print("✅ Models and railway graph loaded successfully.")
        return decision_maker, railway_graph
    except FileNotFoundError as e:
        print(f"🚨 Error: Could not find a model file. {e}")
        print("Please make sure you have run 'model.py' successfully first.")
        exit()

# --- 2. DEFINE THE TRAIN OBJECT ---
class Train:
    """A class to represent a train and its current state in the simulation."""
    def __init__(self, train_id, name, train_type, priority, route):
        self.id = train_id
        self.name = name
        self.type = train_type
        self.priority = priority
        self.route = route
        self.route_index = 0
        self.current_station = route[0]
        self.next_station = route[1]
        self.speed_kmph = 0
        self.status = "AT_STATION" # Possible statuses: AT_STATION, IN_TRANSIT
        # We'll need a way to get track distance; for now, we'll use a placeholder
        self.distance_to_next_station = 100 # Placeholder distance in km
        self.distance_covered = 0

    def depart(self):
        """Changes the train's status to start its journey to the next station."""
        self.status = "IN_TRANSIT"
        self.speed_kmph = 100 # Set a cruising speed
        print(f"    -> {self.name} departing from {self.current_station} towards {self.next_station}.")

    def move(self, time_delta_hours):
        """Updates the train's position based on its speed."""
        if self.status == "IN_TRANSIT":
            distance_moved = self.speed_kmph * time_delta_hours
            self.distance_covered += distance_moved
            
            # Check for arrival
            if self.distance_covered >= self.distance_to_next_station:
                self.arrive()

    def arrive(self):
        """Changes the train's status upon arriving at a station."""
        self.status = "AT_STATION"
        self.speed_kmph = 0
        self.distance_covered = 0
        self.route_index += 1
        
        # Check if the journey is complete
        if self.route_index >= len(self.route) - 1:
            self.current_station = self.route[self.route_index]
            self.next_station = None
            print(f"    -> {self.name} has arrived at its final destination: {self.current_station}.")
        else:
            self.current_station = self.route[self.route_index]
            self.next_station = self.route[self.route_index + 1]
            print(f"    -> {self.name} has arrived at {self.current_station}.")


# --- 3. AI AND SIMULATION LOGIC ---

def get_ai_decision(train, decision_model):
    """Formats a train's current state and gets a decision from the AI model."""
    # The decision model was trained on simulated data. We must create a matching input.
    # In a real system, you'd use your delay_predictor here to get delay_minutes.
    current_state = pd.DataFrame([{
        'train_type': train.type,
        'delay_minutes': random.uniform(0, 30), # Simulate a random current delay
        'current_speed': train.speed_kmph,
        'weather': 'Clear', # Simulate weather
        'priority': train.priority
    }])
    
    # Preprocess the data exactly as in the training script
    current_state_encoded = pd.get_dummies(current_state, columns=['train_type', 'weather'])
    
    # The training data might have had more columns. We need to align them.
    # Get the columns the model was trained on
    model_columns = decision_model.feature_names_in_
    # Add any missing columns to our current state and fill with 0
    for col in model_columns:
        if col not in current_state_encoded.columns:
            current_state_encoded[col] = 0
    
    # Ensure the order of columns is the same as during training
    current_state_encoded = current_state_encoded[model_columns]
    
    # Get a decision
    decision = decision_model.predict(current_state_encoded)[0]
    return decision

def reroute_train(train, graph, disruption_point):
    """Uses the networkx graph to find a new path for a train."""
    try:
        # Create a copy of the graph and remove the disrupted node (station)
        temp_graph = graph.copy()
        temp_graph.remove_node(disruption_point)
        
        new_path = nx.shortest_path(temp_graph,
                                    source=train.current_station,
                                    target=train.route[-1]) # Target is the final destination
        print(f"    REROUTING: New path found: {' -> '.join(map(str, new_path))}")
        train.route = new_path
        train.route_index = 0 # Reset the route index
        train.next_station = new_path[1]
        
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        print(f"    REROUTING: No alternative path found for {train.name}. Holding at station.")
        train.status = "HOLD" # A new status to indicate it's stuck

# --- 4. MAIN SIMULATION ---
if __name__ == "__main__":
    # Load the AI models and graph
    decision_maker_model, railway_graph = load_assets()

    # Initialize a few trains for the simulation
    # The station IDs/codes must exist in your graph
    trains = [
        Train(train_id=1, name="Jaipur Shatabdi", train_type="express", priority=1, route=[1, 2, 3]), # Assuming station IDs 1, 2, 3
        Train(train_id=2, name="Freight Hauler 88", train_type="freight", priority=5, route=[3, 1])
    ]

    print("\n--- Starting Railway Simulation ---")
    simulation_time = datetime(2025, 9, 24, 10, 0, 0)
    
    # The main loop
    for tick in range(SIMULATION_TICKS):
        print(f"\n--- Tick {tick+1}/{SIMULATION_TICKS} | Time: {simulation_time.strftime('%H:%M:%S')} ---")
        
        # Introduce a random disruption for demonstration
        if tick == 10:
            print("🚨 DISRUPTION: Station 2 is closed for maintenance! 🚨")
            disruption = 2
        else:
            disruption = None

        # Update each train
        for train in trains:
            print(f"  Train: {train.name} | Status: {train.status} | Location: {train.current_station}")
            
            if train.status == "AT_STATION":
                # If there's a disruption on our route, force a reroute decision
                if disruption and disruption in train.route:
                    decision = 'reroute'
                else:
                    # Otherwise, ask the AI what to do
                    decision = get_ai_decision(train, decision_maker_model)
                
                print(f"  AI Decision: {decision.upper()}")
                
                if decision == 'reroute':
                    reroute_train(train, railway_graph, disruption_point=disruption)
                
                if decision == 'proceed' and train.next_station:
                    train.depart()

            elif train.status == "IN_TRANSIT":
                # Time delta is 1 minute per tick for this simulation
                train.move(time_delta_hours=1/60)

        # Advance the simulation clock and wait
        simulation_time += timedelta(minutes=1)
        time.sleep(SECONDS_PER_TICK)

    print("\n--- Simulation Complete ---")