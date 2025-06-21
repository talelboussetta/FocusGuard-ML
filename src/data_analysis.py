import pandas as pd

from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

def plot_activity(df):
    df['minute'] = df['timestamp'].dt.floor('T')
    df['hour'] = df['timestamp'].dt.hour
    df['minute_of_hour'] = df['timestamp'].dt.minute

    # Count events per type
    event_counts = df['event_type'].value_counts()

    # Events per minute
    time_events = df.groupby(['minute', 'event_type']).size().unstack(fill_value=0)

    # Blink intervals
    blink_df = df[df['event_type'] == 'blink'].copy()
    blink_df['delta'] = blink_df['timestamp'].diff().dt.total_seconds()
    blink_intervals = blink_df['delta'].dropna()

    # Activity heatmap data
    heatmap_data = df.groupby(['hour', 'minute_of_hour']).size().unstack(fill_value=0)

    # Plot layout
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle("FocusGuard Activity Dashboard", fontsize=16)

    # 1. Lineplot – events per minute
    ax = axes[0, 0]
    for event in ['blink', 'keyboard_press', 'mouse_click']:
        if event in time_events:
            sns.lineplot(data=time_events, x=time_events.index, y=event, label=event, ax=ax)
    ax.set_title("Events Per Minute")
    ax.set_xlabel("Time")
    ax.set_ylabel("Count")
    ax.legend()
    ax.tick_params(axis='x', rotation=45)

    # 2. Barplot – total event types
    sns.barplot(x=event_counts.index, y=event_counts.values, ax=axes[0, 1], palette="Set2")
    axes[0, 1].set_title("Total Event Counts")
    axes[0, 1].set_ylabel("Count")
    axes[0, 1].set_xlabel("Event Type")

    # 3. Histogram – blink intervals
    if not blink_intervals.empty:
        sns.histplot(blink_intervals, bins=20, ax=axes[1, 0], kde=True, color="royalblue")
        axes[1, 0].set_title("Time Between Blinks (seconds)")
        axes[1, 0].set_xlabel("Seconds")
    else:
        axes[1, 0].text(0.5, 0.5, "Not enough blinks to analyze", ha='center')
        axes[1, 0].set_title("Blink Intervals")

    # 4. Heatmap – activity by hour and minute
    sns.heatmap(heatmap_data, cmap="YlGnBu", ax=axes[1, 1])
    axes[1, 1].set_title("Activity Density by Time of Day")
    axes[1, 1].set_xlabel("Minute")
    axes[1, 1].set_ylabel("Hour")

    plt.tight_layout(rect=[0, 0, 1, 0.96])  # space for suptitle
    plt.show(block=True)



LOG_FILE = r'C:\Users\talel\OneDrive\Documents\GitHub\FocusGuard-ML\data\activity_log.csv'  

def load_data():
    # Load CSV with timestamp parsing
    df = pd.read_csv(LOG_FILE, header=None, names=['timestamp', 'event_type', 'event_detail'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    df = df.dropna(subset=['timestamp'])  # drop rows with bad timestamps
    return df

def summarize_events(df):
    # Filter blinks, keyboard, mouse events
    blinks = df[df['event_type'] == 'blink']
    keyboard_presses = df[df['event_type'] == 'keyboard_press']
    mouse_clicks = df[df['event_type'].str.contains('mouse')]

    print(f"Total blinks recorded: {len(blinks)}")
    print(f"Total keyboard presses: {len(keyboard_presses)}")
    print(f"Total mouse events: {len(mouse_clicks)}")

def events_per_minute(df):
    # Round timestamps to minute
    df['minute'] = df['timestamp'].dt.floor('T')
    counts = df.groupby(['minute', 'event_type']).size().unstack(fill_value=0)
    print("\nEvents per minute:")
    print(counts.head(10))  # show first 10 minutes

def main():
    df = load_data()
    summarize_events(df)
    events_per_minute(df)
    plot_activity(df)

if __name__ == "__main__":
    main()
