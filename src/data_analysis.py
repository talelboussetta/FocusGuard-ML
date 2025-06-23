import pandas as pd
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import matplotlib.dates as mdates

def plot_activity(df):
    if df.empty:
        print("No data to plot.")
        return

    # Sort by timestamp for consistency
    df = df.sort_values('timestamp').copy()

    # Prepare time-based features
    df['minute'] = df['timestamp'].dt.floor('T')
    df['hour'] = df['timestamp'].dt.hour
    df['minute_of_hour'] = df['timestamp'].dt.minute

    # Calculate event counts per minute and fill missing with 0
    time_events = df.groupby(['minute', 'event_type']).size().unstack(fill_value=0)

    # Add combined clicks = keyboard_press + mouse_click
    time_events['clicks'] = 0
    if 'keyboard_press' in time_events.columns:
        time_events['clicks'] += time_events['keyboard_press']
    if 'mouse_click' in time_events.columns:
        time_events['clicks'] += time_events['mouse_click']

    # Smooth lines with rolling average (window 3 minutes)
    rolling_events = time_events.rolling(window=3, min_periods=1).mean()

    # Blink intervals
    blink_df = df[df['event_type'] == 'blink'].copy()
    blink_df['delta'] = blink_df['timestamp'].diff().dt.total_seconds()
    blink_intervals = blink_df['delta'].dropna()

    # Activity heatmap data
    heatmap_data = df.groupby(['hour', 'minute_of_hour']).size().unstack(fill_value=0)

    # Cumulative blinks as a proxy for "Focus Over Time"
    blink_cumulative = blink_df.groupby('minute').size().cumsum()

    # For fatigue proxy, use average blink interval per minute (if enough data)
    blink_interval_per_minute = blink_df.groupby('minute')['delta'].mean()

    # Set up plot grid
    fig, axes = plt.subplots(3, 2, figsize=(16, 14))
    fig.suptitle("FocusGuard Activity Dashboard", fontsize=18)

    # 1. Events per minute (raw) - blinks, keyboard, mouse clicks
    ax = axes[0, 0]
    for event in ['blink', 'keyboard_press', 'mouse_click']:
        if event in time_events.columns:
            ax.plot(time_events.index, time_events[event], label=f"{event} (raw)", alpha=0.4)
    ax.set_title("Events Per Minute (Raw)")
    ax.set_xlabel("Time")
    ax.set_ylabel("Count")
    ax.legend()
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
    ax.tick_params(axis='x', rotation=45)

    # 2. Events per minute (smoothed rolling average)
    ax = axes[0, 1]
    for event in ['blink', 'keyboard_press', 'mouse_click', 'clicks']:
        if event in rolling_events.columns:
            ax.plot(rolling_events.index, rolling_events[event], label=f"{event} (smoothed)")
    ax.set_title("Events Per Minute (Smoothed)")
    ax.set_xlabel("Time")
    ax.set_ylabel("Count (rolling avg)")
    ax.legend()
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
    ax.tick_params(axis='x', rotation=45)

    # 3. Cumulative blinks over time (Focus Over Time proxy)
    ax = axes[1, 0]
    if not blink_cumulative.empty:
        ax.plot(blink_cumulative.index, blink_cumulative, color='green')
        ax.set_title("Cumulative Blinks (Focus Over Time)")
        ax.set_xlabel("Time")
        ax.set_ylabel("Cumulative Blink Count")
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
        ax.tick_params(axis='x', rotation=45)
    else:
        ax.text(0.5, 0.5, "Not enough blinks to plot focus over time", ha='center')
        ax.set_title("Cumulative Blinks (Focus Over Time)")

    # 4. Blink intervals histogram (Fatigue proxy)
    ax = axes[1, 1]
    if not blink_intervals.empty:
        sns.histplot(blink_intervals, bins=20, kde=True, color="royalblue", ax=ax)
        ax.set_title("Time Between Blinks (seconds) - Fatigue Proxy")
        ax.set_xlabel("Seconds")
    else:
        ax.text(0.5, 0.5, "Not enough blinks to analyze", ha='center')
        ax.set_title("Blink Intervals")

    # 5. Activity heatmap by hour and minute
    ax = axes[2, 0]
    sns.heatmap(heatmap_data, cmap="YlGnBu", ax=ax)
    ax.set_title("Activity Density by Time of Day")
    ax.set_xlabel("Minute")
    ax.set_ylabel("Hour")

    # 6. Clicks per minute (keyboard + mouse)
    ax = axes[2, 1]
    if 'clicks' in time_events.columns:
        ax.plot(time_events.index, time_events['clicks'], label='Clicks per Minute', color='purple', alpha=0.6)
        ax.set_title("Clicks Per Minute")
        ax.set_xlabel("Time")
        ax.set_ylabel("Clicks Count")
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
        ax.tick_params(axis='x', rotation=45)
        ax.legend()
    else:
        ax.text(0.5, 0.5, "No click data available", ha='center')
        ax.set_title("Clicks Per Minute")

    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.show(block=True)

# Usage (keep your existing load_data and main functions)
LOG_FILE = r"C:\Users\talel\OneDrive\Documents\GitHub\FocusGuard-ML\src\data\activity_log.csv"

def load_data():
    # Load CSV with timestamp parsing
    df = pd.read_csv(LOG_FILE, header=None, names=['timestamp', 'event_type', 'event_detail'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    df = df.dropna(subset=['timestamp'])  # drop rows with bad timestamps
    return df



def main():
    
    df = load_data()
    if df.empty:
        print("No data available to plot.")
        return
    
    plot_activity(df)

if __name__ == "__main__":
    main()
