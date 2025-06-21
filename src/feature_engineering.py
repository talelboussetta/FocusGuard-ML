import pandas as pd

LOG_FILE = r'C:\Users\talel\OneDrive\Documents\GitHub\FocusGuard-ML\data\activity_log.csv'  

def load_data():
    df = pd.read_csv(LOG_FILE, header=None, names=['timestamp', 'event_type', 'event_detail'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    df = df.dropna(subset=['timestamp'])
    return df

def extract_features(df, window_sec=30):
    # Round timestamps down to nearest window_sec
    df['time_window'] = df['timestamp'].dt.floor(f'{window_sec}S')

    # Blink intervals (for avg blink interval)
    blink_df = df[df['event_type'] == 'blink'].copy()
    blink_df = blink_df.sort_values('timestamp')
    blink_df['blink_interval'] = blink_df['timestamp'].diff().dt.total_seconds()

    features = []

    for window_start, group in df.groupby('time_window'):
        # Basic counts
        blinks = group[group['event_type'] == 'blink'].shape[0]
        keys = group[group['event_type'] == 'keyboard_press'].shape[0]
        mice = group[group['event_type'].str.contains('mouse')].shape[0]

        # Avg blink interval in this window (from blink_df)
        blink_intervals = blink_df[(blink_df['timestamp'] >= window_start) & (blink_df['timestamp'] < window_start + pd.Timedelta(seconds=window_sec))]['blink_interval']
        avg_blink_interval = blink_intervals.mean() if not blink_intervals.empty else None

        # Idle time: time in seconds without events (simplified)
        # Calculate gaps between events within this window
        timestamps = group['timestamp'].sort_values()
        if len(timestamps) > 1:
            gaps = timestamps.diff().dt.total_seconds().fillna(0)
            idle_time = gaps[gaps > 1].sum()  # sum of idle gaps longer than 1 second
        else:
            idle_time = 0

        features.append({
            'time_window_start': window_start,
            'blinks_count': blinks,
            'keypress_count': keys,
            'mouse_click_count': mice,
            'avg_blink_interval': avg_blink_interval,
            'idle_time_sec': idle_time
        })

    feature_df = pd.DataFrame(features)
    return feature_df
import os

def main():
    df = load_data()
    feature_df = extract_features(df)

    PROJECT_ROOT = r'C:\Users\talel\OneDrive\Documents\GitHub\FocusGuard-ML'
    DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

    print(f"Saving features to directory: {DATA_DIR}")
    print(f"Does directory exist? {os.path.exists(DATA_DIR)}")

    os.makedirs(DATA_DIR, exist_ok=True)
    feature_df.to_csv(os.path.join(DATA_DIR, 'features.csv'), index=False)
    print("Features saved to data/features.csv")


if __name__ == "__main__":
    main()
