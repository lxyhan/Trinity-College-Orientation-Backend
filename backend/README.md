# Trinity College Orientation Leaders API

A FastAPI backend service that serves orientation leader assignments, event staffing, and summary data for Trinity College's orientation program.

## Features

- **Event Staffing Data**: Complete information about orientation events, staffing requirements, and coverage
- **Leader Assignments**: Detailed assignment data for each orientation leader
- **Summary Statistics**: High-level metrics and statistics about the orientation program
- **Flexible Filtering**: Query parameters for filtering data by various criteria
- **Leader Lookup**: Search for leaders by name or email
- **CORS Support**: Ready for frontend integration

## Data Sources

The API serves data from three main CSV files:

1. **`orientation_assignments_event_staffing.csv`** - Event details, staffing requirements, and coverage
2. **`orientation_assignments_leader_assignments.csv`** - Individual leader assignments and schedules
3. **`orientation_assignments_summary.csv`** - Summary statistics and metrics

## Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server:**
   ```bash
   python main.py
   ```

   Or with uvicorn directly:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Access the API:**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

## API Endpoints

### Core Data Endpoints

#### `GET /api/event-staffing`
Get event staffing information with optional filters.

**Query Parameters:**
- `fully_staffed` (bool): Filter by fully staffed events
- `time_slot` (string): Filter by time slot (e.g., "10:00am")
- `min_duration` (float): Minimum duration in hours
- `max_duration` (float): Maximum duration in hours

**Example:**
```bash
GET /api/event-staffing?fully_staffed=true&min_duration=2.0
```

#### `GET /api/leader-assignments`
Get leader assignments with optional filters.

**Query Parameters:**
- `leader_email` (string): Filter by leader email
- `event` (string): Filter by event name
- `date` (string): Filter by specific date
- `min_hours` (float): Minimum hours assigned
- `max_hours` (float): Maximum hours assigned

**Example:**
```bash
GET /api/leader-assignments?min_hours=5.0&event=Block Party
```

#### `GET /api/summary`
Get orientation assignment summary statistics.

**Example:**
```bash
GET /api/summary
```

### Leader Management Endpoints

#### `GET /api/leaders`
Get a list of all leaders with their assignment statistics.

**Example:**
```bash
GET /api/leaders
```

#### `GET /api/lookup/{leader_name}`
Look up a leader's scheduled events by name.

**Example:**
```bash
GET /api/lookup/adrianyh
```

#### `GET /api/leader/{leader_email}`
Get detailed information about a specific leader by email.

**Example:**
```bash
GET /api/leader/adrianyh.cheng@mail.utoronto.ca
```

### Event Management Endpoints

#### `GET /api/events`
Get a list of all events with staffing information.

**Example:**
```bash
GET /api/events
```

### Utility Endpoints

#### `GET /`
Root endpoint with API information and available endpoints.

#### `GET /health`
Health check endpoint to verify data loading status.

## Data Models

### Event Staffing Response
```json
{
  "total_events": 35,
  "events": [
    {
      "Event": "Kit Pickup & Icebreakers",
      "Leaders Needed": 8,
      "Leaders Assigned": 8,
      "Staffing Percentage": 100.0,
      "Fully Staffed": true,
      "Time Slot": "10:00am - 12:30pm",
      "Duration (hours)": 2.5
    }
  ]
}
```

### Leader Assignments Response
```json
{
  "total_assignments": 205,
  "assignments": [
    {
      "Leader Email": "adrianyh.cheng@mail.utoronto.ca",
      "Event": "Scavenger Hunt",
      "Date": "Aug 27",
      "Start Time": "10:00am",
      "End Time": "11:00am",
      "Hours": 1.0
    }
  ]
}
```

### Summary Response
```json
{
  "summary": [
    {
      "Metric": "Total Assignment Hours",
      "Value": 465.5
    },
    {
      "Metric": "Average Staffing Percentage",
      "Value": 100.0
    }
  ]
}
```

## Testing

Run the test suite to verify all endpoints are working:

```bash
python test_api.py
```

**Note:** Make sure the server is running before executing tests.

## Error Handling

The API includes comprehensive error handling:

- **404 Not Found**: When requested resources don't exist
- **500 Internal Server Error**: When data fails to load or processing errors occur
- **Validation Errors**: Automatic validation of query parameters

## CORS Configuration

The API is configured with CORS middleware to allow cross-origin requests from frontend applications. In production, consider restricting `allow_origins` to your specific frontend domain.

## Performance Considerations

- Data is loaded once at startup for optimal performance
- Filtering is performed in-memory using pandas
- Responses are serialized to JSON for efficient transmission

## Future Enhancements

- Database integration for larger datasets
- Authentication and authorization
- Rate limiting
- Caching layer
- Real-time updates via WebSockets
- Export functionality (PDF, Excel)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Trinity College Orientation program.
