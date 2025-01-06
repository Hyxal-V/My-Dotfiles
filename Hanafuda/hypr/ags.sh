#!/bin/bash

# Execute hyprctl monitors command and capture the output
output=$(hyprctl monitors)

# Check if hyprctl command was successful
if [ $? -ne 0 ]; then
    echo "Error: Could not retrieve monitor information."
    exit 1
fi

# Check for BenQ monitor
if echo "$output" | grep -q "BenQ"; then
    echo "BenQ monitor detected."
    sleep 2
    GDK_DPI_SCALE=0.6 GTK_THEME=win32 ags
else
    echo "BenQ monitor not detected."
    sleep 2
    GDK_DPI_SCALE=0.7 GTK_THEME=win32 ags
fi

