#!/usr/bin/env python3
"""
Generate meal eligibility data based on leader assignments.
Leaders are eligible for meals if they work during meal times or adjacent shifts.
"""

import pandas as pd
import os
from datetime import datetime, timedelta

def parse_time(time_str):
    """Parse time string like '12:30pm' into datetime object"""
    try:
        return datetime.strptime(time_str.replace(' ', ''), '%I:%M%p')
    except:
        return datetime.strptime(time_str.replace(' ', ''), '%I%p')

def generate_meal_eligibility():
    """Generate meal eligibility based on the new assignments"""
    
    # Load the assignment data
    assignments_file = "enhanced_orientation_assignments_leader_assignments.csv"
    if not os.path.exists(assignments_file):
        print(f"Error: Could not find {assignments_file}")
        return False
    
    df = pd.read_csv(assignments_file)
    
    # Define meal events with their times
    meal_events = {
        "Dean's Lunch": {
            "date": "Aug 25",
            "start_time": "12:30pm",
            "end_time": "1:45pm"
        },
        "Dinner": {
            "date": "Aug 25", 
            "start_time": "8:30pm",
            "end_time": "10:00pm"
        },
        "Breakfast": {
            "date": "Aug 26",
            "start_time": "8:00am", 
            "end_time": "9:30am"
        },
        "Lunch": {
            "date": "Aug 26",
            "start_time": "12:00pm",
            "end_time": "1:30pm"
        },
        "Dinner (Aug 26)": {
            "date": "Aug 26",
            "start_time": "6:00pm",
            "end_time": "7:30pm"
        },
        "Breakfast (Aug 27)": {
            "date": "Aug 27",
            "start_time": "8:00am",
            "end_time": "9:30am"
        },
        "Lunch (Aug 27)": {
            "date": "Aug 27", 
            "start_time": "12:00pm",
            "end_time": "1:30pm"
        },
        "Dinner (Aug 27)": {
            "date": "Aug 27",
            "start_time": "6:00pm", 
            "end_time": "7:30pm"
        },
        "Breakfast (Aug 28)": {
            "date": "Aug 28",
            "start_time": "8:00am",
            "end_time": "9:30am"
        },
        "Lunch (Aug 28)": {
            "date": "Aug 28",
            "start_time": "12:00pm",
            "end_time": "1:30pm"
        }
    }
    
    eligibility_records = []
    
    # For each meal event, find eligible leaders
    for meal_name, meal_info in meal_events.items():
        meal_date = meal_info["date"]
        meal_start = parse_time(meal_info["start_time"])
        meal_end = parse_time(meal_info["end_time"])
        
        # Find leaders working on the same date
        date_assignments = df[df['Date'] == meal_date]
        
        for _, assignment in date_assignments.iterrows():
            leader_email = assignment['Leader Email']
            event_start = parse_time(assignment['Start Time'])
            event_end = parse_time(assignment['End Time'])
            
            # Check if leader is working during meal time or adjacent shifts
            eligible = False
            reason = ""
            
            # Working during meal time
            if (event_start <= meal_start < event_end) or (event_start < meal_end <= event_end):
                eligible = True
                reason = "Working during meal time"
            
            # Working adjacent shift (within 2 hours before or after)
            elif abs((event_end - meal_start).total_seconds()) <= 2 * 3600:  # 2 hours
                eligible = True
                reason = "Working adjacent shift"
            elif abs((meal_end - event_start).total_seconds()) <= 2 * 3600:  # 2 hours
                eligible = True
                reason = "Working adjacent shift"
            
            if eligible:
                eligibility_records.append({
                    'Meal Event': meal_name,
                    'Eligible Leader': leader_email,
                    'Reason': reason
                })
    
    # Remove duplicates
    eligibility_df = pd.DataFrame(eligibility_records)
    eligibility_df = eligibility_df.drop_duplicates()
    
    # Save to CSV
    output_file = "enhanced_orientation_assignments_meal_eligibility.csv"
    eligibility_df.to_csv(output_file, index=False)
    
    print(f"Generated meal eligibility data: {output_file}")
    print(f"Total eligibility records: {len(eligibility_df)}")
    print(f"Unique leaders eligible for meals: {eligibility_df['Eligible Leader'].nunique()}")
    print(f"Meal events covered: {eligibility_df['Meal Event'].nunique()}")
    
    return True

if __name__ == "__main__":
    print("Generating Meal Eligibility Data")
    print("=" * 40)
    
    # Change to the correct directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    os.chdir(parent_dir)
    
    success = generate_meal_eligibility()
    if success:
        print("✅ Meal eligibility generation completed successfully!")
    else:
        print("❌ Failed to generate meal eligibility data.")
