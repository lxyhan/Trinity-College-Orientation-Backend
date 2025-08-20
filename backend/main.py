from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import sys
from typing import List, Dict, Optional
from datetime import datetime

# Add the parent directory to the path so we can import from scripts
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(
    title="Trinity College Orientation Leaders API",
    description="API for serving orientation leader assignments, event staffing, and summary data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the data files
def load_data():
    """Load the orientation data from CSV files"""
    try:
        # Get the base directory - try multiple possible locations
        possible_base_dirs = [
            ".",  # Current directory (backend/ on Railway)
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),  # From backend/ -> project root
            os.getcwd(),  # Current working directory 
            os.path.dirname(os.getcwd()),  # Parent of current directory
            ".."  # Parent directory
        ]
        
        base_dir = None
        csv_files = [
            "enhanced_orientation_assignments_leader_assignments.csv",
            "enhanced_orientation_assignments_event_staffing.csv", 
            "enhanced_orientation_assignments_summary.csv",
            "enhanced_orientation_assignments_meal_eligibility.csv"
        ]
        
        # Find the directory that contains our CSV files
        for potential_dir in possible_base_dirs:
            test_file = os.path.join(potential_dir, csv_files[0])
            if os.path.exists(test_file):
                base_dir = potential_dir
                print(f"✅ Found CSV files in: {base_dir}")
                break
        
        if base_dir is None:
            print(f"❌ Could not find CSV files in any of these locations:")
            for potential_dir in possible_base_dirs:
                print(f"   - {os.path.abspath(potential_dir)}")
            raise FileNotFoundError("CSV files not found")
        
        print(f"🔍 Using base directory: {os.path.abspath(base_dir)}")
        print(f"📁 Current working directory: {os.getcwd()}")
        
        # Load all four CSV files from project root (enhanced versions)
        assignments_df = pd.read_csv(os.path.join(base_dir, "enhanced_orientation_assignments_leader_assignments.csv"))
        events_df = pd.read_csv(os.path.join(base_dir, "enhanced_orientation_assignments_event_staffing.csv"))
        summary_df = pd.read_csv(os.path.join(base_dir, "enhanced_orientation_assignments_summary.csv"))
        
        # Load meal eligibility data
        try:
            meal_eligibility_df = pd.read_csv(os.path.join(base_dir, "enhanced_orientation_assignments_meal_eligibility.csv"))
        except Exception as e:
            print(f"Warning: Could not load meal eligibility data: {e}")
            meal_eligibility_df = None
        
        # Load the original orientation schedule for additional details
        try:
            from scripts.orientation_schedule import ORIENTATION_EVENTS
        except ImportError:
            ORIENTATION_EVENTS = {}
        
        return assignments_df, events_df, summary_df, meal_eligibility_df, ORIENTATION_EVENTS
    except Exception as e:
        print(f"Error loading data: {e}")
        return None, None, None, None, {}

# Helper function to get base directory
def get_base_dir():
    # Try to find the directory with CSV files
    possible_base_dirs = [
        ".",  # Current directory (backend/ on Railway)
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),  # From backend/ -> project root
        os.getcwd(),  # Current working directory 
        os.path.dirname(os.getcwd()),  # Parent of current directory
        ".."  # Parent directory
    ]
    
    # Test with a known CSV file
    test_file = "enhanced_orientation_assignments_leader_assignments.csv"
    for potential_dir in possible_base_dirs:
        if os.path.exists(os.path.join(potential_dir, test_file)):
            return potential_dir
    
    # Fallback to original logic
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load data at startup
print("🚀 Starting data loading... (v2)")
assignments_df, events_df, summary_df, meal_eligibility_df, orientation_events = load_data()
print(f"📊 Data loaded: assignments={assignments_df is not None}, events={events_df is not None}, meal_eligibility={meal_eligibility_df is not None}")
if assignments_df is not None:
    print(f"📈 Assignments shape: {assignments_df.shape}")
if events_df is not None:
    print(f"📅 Events shape: {events_df.shape}")
print(f"🍽️ Orientation events loaded: {len(orientation_events)} events")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Trinity College Orientation Leaders API",
        "version": "1.0.0",
        "endpoints": {
            "event_staffing": "/api/event-staffing",
            "leader_assignments": "/api/leader-assignments", 
            "summary": "/api/summary",
            "leaders": "/api/leaders",
            "events": "/api/events",
            "lookup": "/api/lookup/{leader_name}",
            "event_leaders": "/api/event/{event_name}/leaders",
            "leader_details": "/api/leader/{leader_email}",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    import glob
    
    # List files in current directory and parent
    current_files = []
    try:
        current_files = glob.glob("*")[:20]  # Limit to first 20 files
    except:
        current_files = ["error listing files"]
        
    parent_files = []
    try:
        parent_files = glob.glob("../*")[:20]  # Limit to first 20 files  
    except:
        parent_files = ["error listing parent files"]
    
    return {
        "status": "healthy",
        "environment": {
            "cwd": os.getcwd(),
            "current_files": current_files,
            "parent_files": parent_files
        },
        "data_loaded": {
            "assignments": assignments_df is not None,
            "events": events_df is not None,
            "meal_eligibility": meal_eligibility_df is not None,
            "orientation_events": len(orientation_events) > 0
        },
        "data_counts": {
            "assignments": len(assignments_df) if assignments_df is not None else 0,
            "events": len(events_df) if events_df is not None else 0,
            "meal_eligibility": len(meal_eligibility_df) if meal_eligibility_df is not None else 0,
            "orientation_events": len(orientation_events)
        }
    }

@app.get("/api/event-staffing")
async def get_event_staffing(
    fully_staffed: Optional[bool] = Query(None, description="Filter by fully staffed events"),
    time_slot: Optional[str] = Query(None, description="Filter by time slot"),
    min_duration: Optional[float] = Query(None, description="Minimum duration in hours"),
    max_duration: Optional[float] = Query(None, description="Maximum duration in hours")
):
    """
    Get event staffing information with optional filters
    """
    if events_df is None:
        raise HTTPException(status_code=500, detail="Event staffing data not loaded")
    
    filtered_df = events_df.copy()
    
    # Apply filters
    if fully_staffed is not None:
        filtered_df = filtered_df[filtered_df['Fully Staffed'] == fully_staffed]
    
    if time_slot:
        filtered_df = filtered_df[filtered_df['Time Slot'].str.contains(time_slot, case=False, na=False)]
    
    if min_duration is not None:
        filtered_df = filtered_df[filtered_df['Duration (hours)'] >= min_duration]
    
    if max_duration is not None:
        filtered_df = filtered_df[filtered_df['Duration (hours)'] <= max_duration]
    
    return {
        "total_events": len(filtered_df),
        "events": filtered_df.to_dict('records')
    }

@app.get("/api/leader-assignments")
async def get_leader_assignments(
    leader_email: Optional[str] = Query(None, description="Filter by leader email"),
    event: Optional[str] = Query(None, description="Filter by event name"),
    date: Optional[str] = Query(None, description="Filter by date"),
    min_hours: Optional[float] = Query(None, description="Minimum hours assigned"),
    max_hours: Optional[float] = Query(None, description="Maximum hours assigned")
):
    """
    Get leader assignments with optional filters
    """
    if assignments_df is None:
        raise HTTPException(status_code=500, detail="Leader assignments data not loaded")
    
    filtered_df = assignments_df.copy()
    
    # Apply filters
    if leader_email:
        filtered_df = filtered_df[filtered_df['Leader Email'].str.contains(leader_email, case=False, na=False)]
    
    if event:
        filtered_df = filtered_df[filtered_df['Event'].str.contains(event, case=False, na=False)]
    
    if date:
        filtered_df = filtered_df[filtered_df['Date'] == date]
    
    if min_hours is not None:
        filtered_df = filtered_df[filtered_df['Hours'] >= min_hours]
    
    if max_hours is not None:
        filtered_df = filtered_df[filtered_df['Hours'] <= max_hours]
    
    return {
        "total_assignments": len(filtered_df),
        "assignments": filtered_df.to_dict('records')
    }

@app.get("/api/summary")
async def get_summary():
    """
    Get orientation assignment summary statistics
    """
    if summary_df is None:
        raise HTTPException(status_code=500, detail="Summary data not loaded")
    
    return {
        "summary": summary_df.to_dict('records')
    }

@app.get("/api/leaders")
async def get_all_leaders():
    """Get a list of all leaders with their assignment statistics"""
    if assignments_df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    # Get unique leaders and their assignment counts
    leader_stats = assignments_df.groupby('Leader Email').agg({
        'Event': 'count',
        'Hours': 'sum'
    }).reset_index()
    
    leader_stats.columns = ['email', 'event_count', 'total_hours']
    
    # Add names if available
    try:
        leaders_df = pd.read_csv(os.path.join(get_base_dir(), "Trinity College Orientation Leaders 2025(Simplified).csv"))
        leader_stats = leader_stats.merge(
            leaders_df[['Email', 'First Name', 'Last Name']], 
            left_on='email', 
            right_on='Email',
            how='left'
        )
        leader_stats['full_name'] = leader_stats['First Name'].fillna('') + ' ' + leader_stats['Last Name'].fillna('')
        leader_stats['full_name'] = leader_stats['full_name'].str.strip()
        leader_stats.loc[leader_stats['full_name'] == '', 'full_name'] = leader_stats['email']
    except Exception as e:
        print(f"Error loading leader names: {e}")
        leader_stats['full_name'] = leader_stats['email']
    
    # Sort by total hours (descending)
    leader_stats = leader_stats.sort_values('total_hours', ascending=False)
    
    return {
        "total_leaders": len(leader_stats),
        "leaders": leader_stats[['full_name', 'email', 'event_count', 'total_hours']].to_dict('records')
    }

@app.get("/api/events")
async def get_all_events():
    """Get a list of all events with staffing information and event type details"""
    if events_df is None:
        raise HTTPException(status_code=500, detail="Event data not loaded")
    
    # Sort by date and time for better organization
    events_sorted = events_df.sort_values(['Time Slot', 'Event'])
    
    # Enrich events with type information from orientation_schedule.py
    enriched_events = []
    for _, event_row in events_sorted.iterrows():
        event_dict = event_row.to_dict()
        event_name = event_dict['Event']
        
        # Get additional event details from orientation schedule
        event_details = orientation_events.get(event_name, {})
        
        # Add type information
        event_dict['is_meal'] = event_details.get('is_meal', False)
        event_dict['is_indoor'] = event_details.get('is_indoor', False)
        event_dict['is_outdoor'] = event_details.get('is_outdoor', False)
        event_dict['is_core'] = event_details.get('is_core', False)
        event_dict['location'] = event_details.get('location', '')
        event_dict['date'] = event_details.get('date', '')
        event_dict['start_time'] = event_details.get('start_time', '')
        event_dict['end_time'] = event_details.get('end_time', '')
        event_dict['event_name'] = event_name  # Add event_name field for consistency
        
        enriched_events.append(event_dict)
    
    return {
        "total_events": len(enriched_events),
        "events": enriched_events
    }

@app.get("/api/lookup/{leader_name:path}")
async def lookup_leader_schedule(leader_name: str):
    """
    Look up a leader's scheduled events by name.
    
    Args:
        leader_name: The name of the leader (can be first name, last name, or full name)
    
    Returns:
        List of scheduled events with details
    """
    try:
        if assignments_df is None or events_df is None:
            raise HTTPException(status_code=500, detail="Data not loaded")
        
        # Search for the leader by name (case-insensitive)
        leader_name_lower = leader_name.lower()
        
        # Try to find the leader by email (most reliable)
        leader_assignments = assignments_df[
            assignments_df['Leader Email'].str.lower().str.contains(leader_name_lower, na=False)
        ]
        
        # If no matches by email, try by name in the original data
        if len(leader_assignments) == 0:
            try:
                leaders_df = pd.read_csv(os.path.join(get_base_dir(), "Trinity College Orientation Leaders 2025(Simplified).csv"))
                # Find leader by name
                name_matches = leaders_df[
                    (leaders_df['First Name'].str.lower().str.contains(leader_name_lower, na=False)) |
                    (leaders_df['Last Name'].str.lower().str.contains(leader_name_lower, na=False)) |
                    (leaders_df['First Name'].str.lower() + ' ' + leaders_df['Last Name'].str.lower()).str.contains(leader_name_lower, na=False)
                ]
                
                if len(name_matches) > 0:
                    # Get the email and find assignments
                    leader_email = name_matches.iloc[0]['Email']
                    leader_assignments = assignments_df[
                        assignments_df['Leader Email'] == leader_email
                    ]
            except Exception as e:
                print(f"Error searching by name: {e}")
        
        if len(leader_assignments) == 0:
            raise HTTPException(
                status_code=404, 
                detail=f"No leader found with name containing '{leader_name}'"
            )
        
        # Get the leader's email for additional info
        leader_email = leader_assignments.iloc[0]['Leader Email']
        
        # Get leader details from original data
        try:
            leaders_df = pd.read_csv(os.path.join(get_base_dir(), "Trinity College Orientation Leaders 2025(Simplified).csv"))
            leader_info = leaders_df[leaders_df['Email'] == leader_email].iloc[0]
            leader_full_name = f"{leader_info['First Name']} {leader_info['Last Name']}"
        except:
            leader_full_name = leader_email
        
        # Build the response with event details
        events = []
        for _, assignment in leader_assignments.iterrows():
            event_name = assignment['Event']
            date = assignment['Date']
            start_time = assignment['Start Time']
            end_time = assignment['End Time']
            hours = assignment['Hours']
            
            # Get location and other details from orientation events
            event_details = orientation_events.get(event_name, {})
            location = event_details.get('location', 'Location not specified')
            
            events.append({
                "event_name": event_name,
                "date": date,
                "start_time": start_time,
                "end_time": end_time,
                "duration_hours": hours,
                "location": location
            })
        
        # Sort events by date and time
        events.sort(key=lambda x: (x['date'], x['start_time']))
        
        # Get meal eligibility for this leader
        meal_eligibility = []
        if meal_eligibility_df is not None:
            eligible_meals = meal_eligibility_df[
                meal_eligibility_df['Eligible Leader'] == leader_email
            ]
            for _, meal_row in eligible_meals.iterrows():
                # Get meal details from orientation events
                meal_name = meal_row['Meal Event']
                meal_details = orientation_events.get(meal_name, {})
                
                meal_eligibility.append({
                    "meal_name": meal_name,
                    "date": meal_details.get('date', 'Unknown'),
                    "start_time": meal_details.get('start_time', 'Unknown'),
                    "end_time": meal_details.get('end_time', 'Unknown'),
                    "location": meal_details.get('location', 'Unknown'),
                    "reason": meal_row['Reason']
                })
        
        # Sort meals by date and time
        meal_eligibility.sort(key=lambda x: (x['date'], x['start_time']))
        
        return {
            "leader_name": leader_full_name,
            "leader_email": leader_email,
            "total_events": len(events),
            "total_hours": sum(event['duration_hours'] for event in events),
            "events": events,
            "meal_eligibility": meal_eligibility
        }
    except Exception as e:
        print(f"Error in lookup_leader_schedule for '{leader_name}': {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error while looking up leader '{leader_name}': {str(e)}"
        )

@app.get("/api/event/{event_name}/leaders")
async def get_event_leaders(event_name: str):
    """
    Get all leaders assigned to a specific event
    
    Args:
        event_name: The name of the event (can be partial match)
    
    Returns:
        List of leaders assigned to this event with their details
    """
    if assignments_df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    # Find event assignments (case-insensitive partial match)
    # First try exact match, then partial match
    exact_match = assignments_df[assignments_df['Event'] == event_name]
    if len(exact_match) > 0:
        event_assignments = exact_match
    else:
        # Try case-insensitive exact match
        exact_match_ci = assignments_df[assignments_df['Event'].str.lower() == event_name.lower()]
        if len(exact_match_ci) > 0:
            event_assignments = exact_match_ci
        else:
            # Fall back to partial match
            event_assignments = assignments_df[
                assignments_df['Event'].str.contains(event_name, case=False, na=False)
            ]
    
    if len(event_assignments) == 0:
        raise HTTPException(
            status_code=404, 
            detail=f"No event found matching '{event_name}'"
        )
    
    # Get the exact event name from the first match
    exact_event_name = event_assignments.iloc[0]['Event']
    
    # Filter to exact matches only
    event_assignments = assignments_df[assignments_df['Event'] == exact_event_name]
    
    # Get event details from the orientation schedule
    event_details = orientation_events.get(exact_event_name, {})
    
    # Get event staffing info
    event_staffing = events_df[events_df['Event'] == exact_event_name]
    if len(event_staffing) > 0:
        staffing_info = event_staffing.iloc[0].to_dict()
    else:
        staffing_info = {}
    
    # Build leader list with details
    leaders = []
    try:
        leaders_df = pd.read_csv(os.path.join(get_base_dir(), "Trinity College Orientation Leaders 2025(Simplified).csv"))
        
        for _, assignment in event_assignments.iterrows():
            leader_email = assignment['Leader Email']
            
            # Get leader details from original data
            leader_info = leaders_df[leaders_df['Email'] == leader_email]
            if len(leader_info) > 0:
                leader_data = leader_info.iloc[0]
                leader_name = f"{leader_data['First Name']} {leader_data['Last Name']}"
                leader_details = {
                    "name": leader_name,
                    "email": leader_email,
                    "first_name": leader_data['First Name'],
                    "last_name": leader_data['Last Name']
                }
            else:
                leader_details = {
                    "name": leader_email,
                    "email": leader_email,
                    "first_name": "",
                    "last_name": ""
                }
            
            leaders.append(leader_details)
    except Exception as e:
        print(f"Error loading leader details: {e}")
        # Fallback to just email addresses
        for _, assignment in event_assignments.iterrows():
            leaders.append({
                "name": assignment['Leader Email'],
                "email": assignment['Leader Email'],
                "first_name": "",
                "last_name": ""
            })
    
    # Sort leaders by name
    leaders.sort(key=lambda x: x['name'])
    
    return {
        "event_name": exact_event_name,
        "event_details": {
            "date": event_assignments.iloc[0]['Date'] if len(event_assignments) > 0 else "",
            "start_time": event_assignments.iloc[0]['Start Time'] if len(event_assignments) > 0 else "",
            "end_time": event_assignments.iloc[0]['End Time'] if len(event_assignments) > 0 else "",
            "duration_hours": event_assignments.iloc[0]['Hours'] if len(event_assignments) > 0 else 0,
            "location": event_details.get('location', 'Location not specified')
        },
        "staffing_info": staffing_info,
        "total_leaders": len(leaders),
        "leaders": leaders
    }

@app.get("/api/leader/{leader_email}")
async def get_leader_details(leader_email: str):
    """
    Get detailed information about a specific leader by email
    """
    if assignments_df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    # Get leader assignments
    leader_assignments = assignments_df[assignments_df['Leader Email'] == leader_email]
    
    if len(leader_assignments) == 0:
        raise HTTPException(status_code=404, detail=f"No leader found with email: {leader_email}")
    
    # Get leader details
    try:
        leaders_df = pd.read_csv(os.path.join(get_base_dir(), "Trinity College Orientation Leaders 2025(Simplified).csv"))
        leader_info = leaders_df[leaders_df['Email'] == leader_email]
        if len(leader_info) > 0:
            leader_details = leader_info.iloc[0].to_dict()
        else:
            leader_details = {"Email": leader_email}
    except:
        leader_details = {"Email": leader_email}
    
    # Calculate statistics
    total_hours = leader_assignments['Hours'].sum()
    event_count = len(leader_assignments)
    
    # Get event details
    events = []
    for _, assignment in leader_assignments.iterrows():
        event_name = assignment['Event']
        
        # Get event staffing info
        event_staffing = events_df[events_df['Event'] == event_name]
        if len(event_staffing) > 0:
            event_info = event_staffing.iloc[0]
            time_slot = event_info['Time Slot']
            duration = event_info['Duration (hours)']
        else:
            time_slot = assignment['Start Time'] + " - " + assignment['End Time']
            duration = assignment['Hours']
        
        events.append({
            "event_name": event_name,
            "date": assignment['Date'],
            "start_time": assignment['Start Time'],
            "end_time": assignment['End Time'],
            "time_slot": time_slot,
            "duration_hours": duration
        })
    
    # Sort events by date and time
    events.sort(key=lambda x: (x['date'], x['start_time']))
    
    return {
        "leader_details": leader_details,
        "statistics": {
            "total_events": event_count,
            "total_hours": total_hours,
            "average_hours_per_event": total_hours / event_count if event_count > 0 else 0
        },
        "assignments": events
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
