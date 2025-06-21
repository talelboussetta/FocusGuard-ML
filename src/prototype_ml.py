import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


print("Current working directory:", os.getcwd())

PROJECT_ROOT = r'C:\Users\talel\OneDrive\Documents\GitHub\FocusGuard-ML'
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')
FEATURES_PATH = os.path.join(DATA_DIR, 'features.csv')

print("Absolute features file path:", FEATURES_PATH)
print("File exists at FEATURES_PATH?", os.path.isfile(FEATURES_PATH))

print("Using features path:", FEATURES_PATH)
if not os.path.exists(FEATURES_PATH):
    print(f"ERROR: File {FEATURES_PATH} does not exist.")
    exit(1)

df = pd.read_csv(FEATURES_PATH)
print(f"Loaded {len(df)} rows")

# Create dummy labels for prototype purposes (replace with real labels later)
df['label'] = [0, 1] * (len(df) // 2) + ([0] if len(df) % 2 else [])
print("Sample labels:", df['label'].head().tolist())

df = df.dropna(subset=['avg_blink_interval'])
print(f"After dropping NaNs, {len(df)} rows remain")

if df.empty:
    print("ERROR: No data left after dropping NaNs.")
    exit(1)

X = df[['blinks_count', 'keypress_count', 'mouse_click_count', 'avg_blink_interval', 'idle_time_sec']]
y = df['label']

print("Splitting data into train/test sets...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

print(f"Training samples: {len(X_train)}, Testing samples: {len(X_test)}")

clf = RandomForestClassifier(random_state=42)
clf.fit(X_train, y_train)
print("Training completed.")

y_pred = clf.predict(X_test)
print("Prediction done. Classification report:")
print(classification_report(y_test, y_pred))
