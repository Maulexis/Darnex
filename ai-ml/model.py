# model.py
import pandas as pd
import psycopg2
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Connect to DB
conn = psycopg2.connect(
    dbname="railway_sim_db",
    user="postgres",
    password="yourpassword",
    host="localhost",
    port="5432"
)

# Load training data (example: train movements + signals)
query = """
SELECT tm.train_id, tm.speed_kmph, tm.delay_minutes, tm.status,
       s.status AS signal_status
FROM train_movements tm
JOIN signals s ON tm.next_signal_id = s.id
LIMIT 5000;
"""
df = pd.read_sql(query, conn)

# Preprocess
X = df[["speed_kmph", "delay_minutes"]]
y = df["signal_status"]

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model
joblib.dump(model, "train_signal_model.pkl")

print("✅ Model trained and saved as train_signal_model.pkl")
