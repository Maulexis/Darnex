import pickle
import pandas as pd
import numpy as np
import joblib
import networkx as nx
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score
import psycopg2
from psycopg2 import sql
import os

# Define database connection parameters (edit as needed)
DB_PARAMS = {
    'dbname': 'railway_sim_db',
    'user': 'postgres',
    'password': 'Themedaksh990', # Your actual password
    'host': 'localhost',
    'port': 5432
}

# Create connection
try:
    conn = psycopg2.connect(**DB_PARAMS)
    print("Database connection successful.")
except psycopg2.OperationalError as e:
    print(f"Database connection failed: {e}")
    exit()


# Helper function to load data from SQL
def load_data(query):
    # Added a UserWarning suppression for cleaner output
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        return pd.read_sql_query(query, conn)

# Fetch all necessary data
train_movements = load_data("SELECT * FROM train_movements;")
trains = load_data("SELECT * FROM trains;")
stations = load_data("SELECT * FROM stations;")
tracks = load_data("SELECT * FROM tracks;")
signals = load_data("SELECT * FROM signals;")
# <-- FIX: Added timetable_events to get scheduled times
timetable_events = load_data("SELECT * FROM timetable_events;")

# --- 1. PREPROCESSING FOR DELAY PREDICTION ---

# Check if tables are empty before proceeding
if train_movements.empty or trains.empty:
    print("Error: train_movements or trains table is empty. Cannot proceed with training.")
    exit()

# <-- FIX: Corrected the merge to use 'id' from the trains table
df_ma = train_movements.merge(trains, left_on='train_id', right_on='id', how='left')

# <-- FIX: Merge with timetable_events to get scheduled times
# This merge is complex; a simple merge on train_id is used for demonstration.
# A more accurate merge would also involve station and order_no.
df_ma = df_ma.merge(timetable_events, on='train_id', how='left')


# Example feature engineering: convert times, get delay durations
# <-- FIX: Use actual column names 'actual_arrival' and 'scheduled_arrival'
df_ma['actual_arrival'] = pd.to_datetime(df_ma['actual_arrival'],utc=True)
df_ma['scheduled_arrival'] = pd.to_datetime(df_ma['scheduled_arrival'], utc=True)
# Fill NaNs that result from merges or missing data before calculation
df_ma['delay_minutes'] = (df_ma['actual_arrival'] - df_ma['scheduled_arrival']).dt.total_seconds() / 60.0
df_ma['delay_minutes'].fillna(0, inplace=True) # Assume no delay if data is missing

# <-- FIX: Use column names that actually exist in your schema.
# Removed 'weather_conditions' and 'track_usage' as they don't exist.
# Renamed 'train_type' to 'type' and 'speed' to 'speed_kmph'.
# Fill potential NaN values in feature columns
df_ma['type'].fillna('Unknown', inplace=True)
print("Columns in DataFrame df_ma:", df_ma.columns.tolist())
df_ma['speed_kmph'].fillna(0, inplace=True)

X_delay = df_ma[['type', 'speed_kmph']].copy()

# Convert categorical features
X_delay = pd.get_dummies(X_delay, columns=['type'], dummy_na=True) # dummy_na handles potential missing values

# Target variable
y_delay = df_ma['delay_minutes']

# Split data
X_train_delay, X_test_delay, y_train_delay, y_test_delay = train_test_split(
    X_delay, y_delay, test_size=0.2, random_state=42)

# --- 2. TRAINING DELAY PREDICTOR (Regression) ---
print("Training delay prediction model...")
delay_regressor = RandomForestRegressor(n_estimators=100, n_jobs=-1, random_state=42)
delay_regressor.fit(X_train_delay, y_train_delay)

# Evaluate
preds_delay = delay_regressor.predict(X_test_delay)
mae = mean_absolute_error(y_test_delay, preds_delay)
print(f"Delay prediction MAE: {mae:.2f} minutes")

# Save delay model
os.makedirs('models', exist_ok=True)
joblib.dump(delay_regressor, 'models/delay_predictor.pkl')

# --- 3. DELAY REASON CLASSIFICATION ---
print("Training delay reason classification model...")
# For demo purposes, create a random label array
np.random.seed(42)
df_ma['delay_reason'] = np.random.choice([
    'signal_failure', 'weather', 'congestion', 'technical_fault', 'crew_issue', 'track_maintenance'], size=len(df_ma))

# Encode labels
from sklearn.preprocessing import LabelEncoder
le_reason = LabelEncoder()
df_ma['delay_reason_enc'] = le_reason.fit_transform(df_ma['delay_reason'])

# <-- FIX: Simplified features to use columns that exist in the merged dataframe ('type' and 'status')
# 'status' is from train_movements, used as a proxy for signal_status.
df_ma['status'].fillna('Unknown', inplace=True)
X_reason = pd.get_dummies(df_ma[['type', 'status']], columns=['type', 'status'], dummy_na=True)
y_reason = df_ma['delay_reason_enc']

X_train_reason, X_test_reason, y_train_reason, y_test_reason = train_test_split(
    X_reason, y_reason, test_size=0.2, random_state=42)

# Train classifier
reason_classifier = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)
reason_classifier.fit(X_train_reason, y_train_reason)

# Evaluate
y_pred_reason = reason_classifier.predict(X_test_reason)
accuracy = accuracy_score(y_test_reason, y_pred_reason)
print(f"Delay reason classification accuracy: {accuracy:.2f}")

# Save reason classifier
joblib.dump(reason_classifier, 'models/delay_reason_classifier.pkl')
joblib.dump(le_reason, 'models/label_encoder_reason.pkl')

# --- 4. DECISION MAKING AI (using rules + Random Forest) ---
# This part of your code was using simulated data, so it remains unchanged.
print("Training decision making model...")
decision_labels = np.random.choice(['hold', 'proceed', 'reroute'], size=1000)
decision_features = pd.DataFrame({
    'train_type': np.random.choice(['Passenger', 'Freight'], 1000),
    'delay_minutes': np.random.uniform(0, 30, 1000),
    'current_speed': np.random.uniform(20, 120, 1000),
    'weather': np.random.choice(['Clear', 'Rain', 'Fog'], 1000),
    'priority': np.random.choice([1,2,3], 1000)
})
decision_X = pd.get_dummies(decision_features, columns=['train_type', 'weather'])
decision_y = pd.Series(decision_labels)
X_decision_train, X_decision_test, y_decision_train, y_decision_test = train_test_split(
    decision_X, decision_y, test_size=0.2, random_state=42)
decision_clf = RandomForestClassifier(n_estimators=100, n_jobs=-1, random_state=42)
decision_clf.fit(X_decision_train, y_decision_train)
joblib.dump(decision_clf, 'models/decision_maker.pkl')

# --- 5. ROUTE OPTIMIZATION (using networkx) ---
print("Building and saving route optimization graph...")
G = nx.Graph()

# Build graph from stations and tracks
# <-- FIX: Corrected column names to match the schema
for index, row in tracks.iterrows():
    G.add_edge(row['from_station'], row['to_station'], length=row['length_m'])

# Save graph as edge list for later
# (You will need 'import pickle' at the top of your file)
with open('models/railway_graph.gpickle', 'wb') as f:
    pickle.dump(G, f)

print("\nAll models trained and saved successfully.")

# Close the database connection
conn.close()