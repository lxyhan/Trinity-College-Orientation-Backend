from typing import List, Dict, Set, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import heapq
import pandas as pd
import os

def parse_leaders_csv(csv_file: str) -> List[Dict]:
    """
    Parse the simplified leaders CSV and convert availability string to dictionary format.
    """
    df = pd.read_csv(csv_file)
    leaders = []
    
    for _, row in df.iterrows():
        # Parse the availability string into a dictionary
        availability_dict = {}
        availability_str = row['Availability']
        
        if availability_str and availability_str != "No availability specified":
            # Split by | and parse each date:availability pair
            for pair in availability_str.split(' | '):
                if ':' in pair:
                    date_part, availability_part = pair.split(':', 1)
                    date = date_part.strip()
                    availability = availability_part.strip()
                    availability_dict[date] = availability
        
        leader = {
            "name": f"{row['First Name']} {row['Last Name']}",
            "email": row['Email'],
            "availability": availability_dict
        }
        leaders.append(leader)
    
    return leaders

def output_assignments_to_csv(result: Dict, output_file: str, backend_dir: str = None):
    """
    Convert the assignment results to CSV format for easy viewing.
    Saves both regular files in root and enhanced files in backend directory.
    """
    # Create leader assignments CSV
    leader_rows = []
    for email, assignments in result['leader_assignments'].items():
        if assignments:  # Only include leaders with assignments
            for assignment in assignments:
                leader_rows.append({
                    'Leader Email': email,
                    'Event': assignment['event'],
                    'Date': assignment['date'],
                    'Start Time': assignment['start_time'],
                    'End Time': assignment['end_time'],
                    'Hours': assignment['hours']
                })
    
    # Create event staffing CSV
    event_rows = []
    for event_name, info in result['event_staffing'].items():
        event_rows.append({
            'Event': event_name,
            'Leaders Needed': info['leaders_needed'],
            'Leaders Assigned': info['leaders_assigned'],
            'Staffing Percentage': info.get('staffing_percentage', 0),
            'Fully Staffed': info['fully_staffed'],
            'Time Slot': info['time_slot'],
            'Duration (hours)': info['duration_hours']
        })
    
    # Create summary CSV
    summary = result['scheduling_summary']
    summary_rows = [{
        'Metric': 'Total Assignment Hours',
        'Value': summary['total_assignment_hours']
    }, {
        'Metric': 'Average Staffing Percentage',
        'Value': summary['staffing_metrics']['avg_staffing_percentage']
    }, {
        'Metric': 'Minimum Staffing Percentage',
        'Value': summary['staffing_metrics']['min_staffing_percentage']
    }, {
        'Metric': 'Events Below 50% Staffed',
        'Value': summary['staffing_metrics']['events_below_50_percent']
    }, {
        'Metric': 'Average Hours Per Leader',
        'Value': summary['labor_compliance']['avg_hours_per_leader']
    }, {
        'Metric': 'Max Hours Assigned',
        'Value': summary['labor_compliance']['max_hours_assigned']
    }]
    
    # Define file sets to save - only save to backend directory now
    file_sets = []
    
    # Only save enhanced files to backend directory if specified
    if backend_dir and os.path.exists(backend_dir):
        file_sets.append({
            'prefix': os.path.join(backend_dir, 'enhanced_orientation_assignments'),
            'dir': backend_dir,
            'type': 'enhanced'
        })
        print(f"📁 Saving assignment files to backend directory: {backend_dir}")
    else:
        # Fallback to current directory if no backend directory
        file_sets.append({
            'prefix': output_file,
            'dir': '.',
            'type': 'regular'
        })
        print("⚠️  Backend directory not found, saving to current directory")
    
    # Save all CSV files in both locations
    for file_set in file_sets:
        prefix = file_set['prefix']
        
        if leader_rows:
            leader_file = f"{prefix}_leader_assignments.csv"
            pd.DataFrame(leader_rows).to_csv(leader_file, index=False)
            print(f"Leader assignments saved to: {leader_file}")
        
        if event_rows:
            event_file = f"{prefix}_event_staffing.csv"
            pd.DataFrame(event_rows).to_csv(event_file, index=False)
            print(f"Event staffing saved to: {event_file}")
        
        if summary_rows:
            summary_file = f"{prefix}_summary.csv"
            pd.DataFrame(summary_rows).to_csv(summary_file, index=False)
            print(f"Summary saved to: {summary_file}")
    
    # Save time conflicts if any (to backend directory if available)
    if result['time_conflicts']:
        conflict_rows = []
        for conflict in result['time_conflicts']:
            conflict_rows.append({
                'Leader': conflict['leader'],
                'Conflicting Events': ', '.join(conflict['conflicting_events']),
                'Overlap Time': conflict['overlap_time']
            })
        
        if backend_dir and os.path.exists(backend_dir):
            conflict_file = os.path.join(backend_dir, "enhanced_orientation_assignments_time_conflicts.csv")
        else:
            conflict_file = f"{output_file}_time_conflicts.csv"
            
        pd.DataFrame(conflict_rows).to_csv(conflict_file, index=False)
        print(f"Time conflicts saved to: {conflict_file}")

def schedule_event_leaders(leaders: List[Dict], events: Dict[str, Dict]) -> Dict:
    """
    Returns optimal leader assignment with time slot validation.
    """
    
    # Helper function to parse time
    def parse_time(time_str: str) -> datetime:
        """Convert time string to datetime object for comparison"""
        return datetime.strptime(time_str, "%I:%M%p")
    
    # Helper function to calculate hours between times
    def calculate_hours(start_time: str, end_time: str) -> float:
        """Calculate duration in hours between two times"""
        start = parse_time(start_time)
        end = parse_time(end_time)
        delta = end - start
        return delta.total_seconds() / 3600
    
    # Helper function to check if event time fits in availability slot
    def is_time_compatible(availability: str, start_time: str, end_time: str) -> bool:
        """Check if event time fits within leader's availability"""
        start = parse_time(start_time)
        end = parse_time(end_time)
        
        if availability == "unavailable":
            return False
        elif availability == "all-day":
            # All-day means available for any reasonable time during the day
            # Allow events from 8am to 11pm for all-day availability
            day_start = parse_time("8:00am")
            day_end = parse_time("11:00pm")
            return start >= day_start and end <= day_end
        elif availability.lower() == "morning":
            # Morning: 8am-12pm (extended from 9am to catch early events)
            slot_start = parse_time("8:00am")
            slot_end = parse_time("12:00pm")
            return start >= slot_start and end <= slot_end
        elif availability.lower() == "afternoon":
            # Afternoon: 12pm-6pm (extended to cover more afternoon events)
            slot_start = parse_time("12:00pm")
            slot_end = parse_time("6:00pm")
            return start >= slot_start and end <= slot_end
        elif availability.lower() == "evening":
            # Evening: 5pm-11pm (extended to cover late evening events)
            slot_start = parse_time("5:00pm")
            slot_end = parse_time("11:00pm")
            return start >= slot_start and end <= slot_end
        
        return False
    
    # Helper function to check for time conflicts
    def has_time_conflict(event1_start: str, event1_end: str, 
                          event2_start: str, event2_end: str) -> bool:
        """Check if two events have overlapping times"""
        start1 = parse_time(event1_start)
        end1 = parse_time(event1_end)
        start2 = parse_time(event2_start)
        end2 = parse_time(event2_end)
        
        # Events overlap if one starts before the other ends
        return not (end1 <= start2 or end2 <= start1)
    
    # Initialize result structure
    leader_assignments = {leader["email"]: [] for leader in leaders}
    leader_hours = {leader["email"]: 0 for leader in leaders}
    event_staffing = {}
    time_conflicts = []
    
    # Create event staffing structure
    for event_name, event_data in events.items():
        duration = calculate_hours(event_data["start_time"], event_data["end_time"])
        event_staffing[event_name] = {
            "assigned_leaders": [],
            "leaders_needed": event_data["leaders_needed"],
            "leaders_assigned": 0,
            "fully_staffed": False,
            "time_slot": f"{event_data['start_time']} - {event_data['end_time']}",
            "duration_hours": duration
        }
    
    # Sort events by priority (shorter events first, then by start time)
    sorted_events = sorted(events.items(), 
                          key=lambda x: (parse_time(x[1]["start_time"]), 
                                       calculate_hours(x[1]["start_time"], x[1]["end_time"])))
    
    # Track leader-event assignments for conflict detection
    leader_event_map = defaultdict(list)
    
    # First pass: Determine leader availability for each event
    event_availability = {}
    for event_name, event_data in events.items():
        date = event_data["date"]
        start_time = event_data["start_time"]
        end_time = event_data["end_time"]
        duration = calculate_hours(start_time, end_time)
        
        available_for_event = []
        for leader in leaders:
            email = leader["email"]
            
            if date not in leader["availability"]:
                continue
            
            availability = leader["availability"][date]
            if is_time_compatible(availability, start_time, end_time):
                # Check if within hour limits
                if leader_hours[email] + duration <= 50:
                    available_for_event.append(email)
        
        event_availability[event_name] = {
            "available_leaders": available_for_event,
            "leaders_needed": event_data["leaders_needed"],
            "date": date,
            "start_time": start_time,
            "end_time": end_time,
            "duration": duration
        }
    
    # Calculate staffing ratios and implement proportional distribution
    total_demand = sum(e["leaders_needed"] for e in event_availability.values())
    
    # Count total available leader-hours (considering conflicts)
    total_supply = 0
    for event_info in event_availability.values():
        total_supply += len(event_info["available_leaders"])
    
    # If there's a shortage, distribute proportionally
    if total_supply < total_demand:
        # Calculate fair share for each event
        shortage_ratio = total_supply / total_demand if total_demand > 0 else 0
        
        for event_name in event_availability:
            needed = event_availability[event_name]["leaders_needed"]
            # Ensure at least 1 leader for each event if possible
            fair_share = max(1, int(needed * shortage_ratio))
            event_availability[event_name]["adjusted_target"] = min(
                fair_share, 
                len(event_availability[event_name]["available_leaders"])
            )
    else:
        # No shortage, try to fully staff everything
        for event_name in event_availability:
            event_availability[event_name]["adjusted_target"] = \
                event_availability[event_name]["leaders_needed"]
    
    # Assignment algorithm with round-robin approach for fairness
    # Sort events by priority (criticality could be added as a parameter)
    sorted_events = sorted(event_availability.items(), 
                          key=lambda x: (parse_time(x[1]["start_time"]), x[1]["duration"]))
    
    # Track assignments to prevent conflicts
    leader_schedule = defaultdict(list)
    
    # Round-robin assignment to ensure fair distribution
    assignment_rounds = []
    max_rounds = max((e["adjusted_target"] for e in event_availability.values()), default=0)
    
    for round_num in range(max_rounds):
        round_assignments = []
        
        for event_name, event_info in sorted_events:
            # Skip if event already has enough leaders for this round
            current_assigned = len(event_staffing[event_name]["assigned_leaders"])
            target = event_info.get("adjusted_target", event_info["leaders_needed"])
            
            if current_assigned >= target:
                continue
            
            # Find best available leader for this event
            best_leader = None
            best_score = float('inf')
            
            for leader_email in event_info["available_leaders"]:
                # Skip if already assigned to this event
                if leader_email in event_staffing[event_name]["assigned_leaders"]:
                    continue
                
                # Check for conflicts
                has_conflict = False
                for scheduled in leader_schedule[leader_email]:
                    if scheduled["date"] == event_info["date"]:
                        if has_time_conflict(event_info["start_time"], event_info["end_time"],
                                           scheduled["start_time"], scheduled["end_time"]):
                            has_conflict = True
                            break
                
                if has_conflict:
                    continue
                
                # Check hour limit
                if leader_hours[leader_email] + event_info["duration"] > 50:
                    continue
                
                # Score based on current hours (prefer less loaded leaders)
                score = leader_hours[leader_email]
                
                if score < best_score:
                    best_score = score
                    best_leader = leader_email
            
            # Assign the best leader if found
            if best_leader:
                assignment = {
                    "event": event_name,
                    "date": event_info["date"],
                    "start_time": event_info["start_time"],
                    "end_time": event_info["end_time"],
                    "hours": event_info["duration"]
                }
                
                leader_assignments[best_leader].append(assignment)
                leader_hours[best_leader] += event_info["duration"]
                event_staffing[event_name]["assigned_leaders"].append(best_leader)
                event_staffing[event_name]["leaders_assigned"] += 1
                leader_schedule[best_leader].append({
                    "date": event_info["date"],
                    "start_time": event_info["start_time"],
                    "end_time": event_info["end_time"]
                })
                
                round_assignments.append((event_name, best_leader))
        
        if round_assignments:
            assignment_rounds.append(round_assignments)
        else:
            break  # No more assignments possible
    
    # Update staffing status
    for event_name, event_data in events.items():
        assigned = event_staffing[event_name]["leaders_assigned"]
        needed = event_staffing[event_name]["leaders_needed"]
        event_staffing[event_name]["fully_staffed"] = (assigned >= needed)
        
        # Add staffing percentage for better visibility
        event_staffing[event_name]["staffing_percentage"] = round((assigned / needed * 100) if needed > 0 else 0, 1)
    
    # Detect time conflicts (double-check)
    for leader_email, assignments in leader_assignments.items():
        for i, assign1 in enumerate(assignments):
            for assign2 in assignments[i+1:]:
                if assign1["date"] == assign2["date"]:
                    if has_time_conflict(assign1["start_time"], assign1["end_time"],
                                       assign2["start_time"], assign2["end_time"]):
                        
                        # Calculate overlap
                        start1 = parse_time(assign1["start_time"])
                        end1 = parse_time(assign1["end_time"])
                        start2 = parse_time(assign2["start_time"])
                        end2 = parse_time(assign2["end_time"])
                        
                        overlap_start = max(start1, start2)
                        overlap_end = min(end1, end2)
                        
                        conflict = {
                            "leader": leader_email,
                            "conflicting_events": [assign1["event"], assign2["event"]],
                            "overlap_time": f"{overlap_start.strftime('%I:%M%p').lstrip('0').lower()} - {overlap_end.strftime('%I:%M%p').lstrip('0').lower()}"
                        }
                        time_conflicts.append(conflict)
    
    # Calculate summary statistics
    fully_staffed = [name for name, info in event_staffing.items() if info["fully_staffed"]]
    understaffed = [name for name, info in event_staffing.items() if not info["fully_staffed"]]
    unassigned = [leader["email"] for leader in leaders if not leader_assignments[leader["email"]]]
    
    total_hours = sum(leader_hours.values())
    leaders_over_50 = [email for email, hours in leader_hours.items() if hours > 50]
    
    active_leaders = [email for email, hours in leader_hours.items() if hours > 0]
    avg_hours = total_hours / len(active_leaders) if active_leaders else 0
    max_hours = max(leader_hours.values()) if leader_hours else 0
    
    # Calculate staffing distribution metrics
    staffing_percentages = [info.get("staffing_percentage", 0) for info in event_staffing.values()]
    avg_staffing_percentage = sum(staffing_percentages) / len(staffing_percentages) if staffing_percentages else 0
    min_staffing_percentage = min(staffing_percentages) if staffing_percentages else 0
    
    # Identify critically understaffed events (less than 50% staffed)
    critically_understaffed = [
        name for name, info in event_staffing.items() 
        if info.get("staffing_percentage", 0) < 50
    ]
    
    # Build final result
    result = {
        "leader_assignments": leader_assignments,
        "event_staffing": event_staffing,
        "scheduling_summary": {
            "fully_staffed_events": fully_staffed,
            "understaffed_events": understaffed,
            "critically_understaffed_events": critically_understaffed,
            "unassigned_leaders": unassigned,
            "total_assignment_hours": round(total_hours, 1),
            "staffing_metrics": {
                "avg_staffing_percentage": round(avg_staffing_percentage, 1),
                "min_staffing_percentage": round(min_staffing_percentage, 1),
                "events_below_50_percent": len(critically_understaffed)
            },
            "labor_compliance": {
                "leaders_over_50hrs": leaders_over_50,
                "avg_hours_per_leader": round(avg_hours, 1),
                "max_hours_assigned": round(max_hours, 1)
            }
        },
        "time_conflicts": time_conflicts
    }
    
    return result


# Test with the provided example
if __name__ == "__main__":
    print("Trinity College Orientation Leaders Assignment Algorithm")
    print("=" * 60)
    
    # Load the real leaders data from our simplified CSV
    csv_file = "Trinity College Orientation Leaders 2025(Simplified).csv"
    if os.path.exists(csv_file):
        print(f"Loading leaders from: {csv_file}")
        leaders = parse_leaders_csv(csv_file)
        print(f"Loaded {len(leaders)} leaders")
        
        # Import the orientation schedule
        from orientation_schedule import ORIENTATION_EVENTS
        
        print(f"Loaded {len(ORIENTATION_EVENTS)} orientation events")
        
        # Run the assignment algorithm
        print("\nRunning assignment algorithm...")
        result = schedule_event_leaders(leaders, ORIENTATION_EVENTS)
        
        # Output results to CSV files
        output_prefix = "orientation_assignments"
        backend_dir = "backend"
        output_assignments_to_csv(result, output_prefix, backend_dir)
        
        # Generate meal eligibility if backend directory exists
        if os.path.exists(backend_dir):
            try:
                print("\nGenerating meal eligibility...")
                # Import and run meal eligibility generation
                import sys
                sys.path.append(backend_dir)
                from scripts.generate_meal_eligibility import generate_meal_eligibility
                
                # Change to backend directory temporarily
                original_dir = os.getcwd()
                os.chdir(backend_dir)
                generate_meal_eligibility()
                os.chdir(original_dir)
                print("✅ Meal eligibility generated successfully!")
            except Exception as e:
                print(f"Warning: Could not generate meal eligibility: {e}")
        
        # Print summary
        print("\n" + "="*60)
        print("ASSIGNMENT SUMMARY")
        print("="*60)
        
        summary = result['scheduling_summary']
        print(f"Fully Staffed Events: {len(summary['fully_staffed_events'])}")
        print(f"Understaffed Events: {len(summary['understaffed_events'])}")
        print(f"Critically Understaffed Events: {len(summary['critically_understaffed_events'])}")
        print(f"Unassigned Leaders: {len(summary['unassigned_leaders'])}")
        print(f"Total Assignment Hours: {summary['total_assignment_hours']}")
        print(f"Average Staffing Percentage: {summary['staffing_metrics']['avg_staffing_percentage']}%")
        print(f"Minimum Staffing Percentage: {summary['staffing_metrics']['min_staffing_percentage']}%")
        print(f"Average Hours Per Leader: {summary['labor_compliance']['avg_hours_per_leader']}")
        print(f"Max Hours Assigned: {summary['labor_compliance']['max_hours_assigned']}")
        
        if result['time_conflicts']:
            print(f"\nTime Conflicts Found: {len(result['time_conflicts'])}")
            for conflict in result['time_conflicts'][:3]:  # Show first 3 conflicts
                print(f"  {conflict['leader']}: {conflict['conflicting_events']} ({conflict['overlap_time']})")
        
        print(f"\nResults saved to CSV files with prefix: {output_prefix}")
        
    else:
        print(f"Error: Could not find file {csv_file}")
        print("Please make sure the simplified CSV file is in the current directory.")