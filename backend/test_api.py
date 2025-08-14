#!/usr/bin/env python3
"""
Test script for the Trinity College Orientation Leaders API
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint: str, description: str) -> Dict[str, Any]:
    """Test an API endpoint and return results"""
    print(f"\n🧪 Testing: {description}")
    print(f"   Endpoint: {endpoint}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success! Response keys: {list(data.keys())}")
            return {"success": True, "data": data, "status": response.status_code}
        else:
            print(f"   ❌ Failed with status {response.status_code}")
            print(f"   Error: {response.text}")
            return {"success": False, "status": response.status_code, "error": response.text}
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection failed - is the server running?")
        return {"success": False, "error": "Connection failed"}
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return {"success": False, "error": str(e)}

def test_filtered_endpoints():
    """Test endpoints with query parameters"""
    print("\n🔍 Testing filtered endpoints...")
    
    # Test event staffing with filters
    test_endpoint("/api/event-staffing?fully_staffed=true", "Event staffing - fully staffed only")
    test_endpoint("/api/event-staffing?min_duration=2.0", "Event staffing - min 2 hours")
    
    # Test leader assignments with filters
    test_endpoint("/api/leader-assignments?min_hours=5.0", "Leader assignments - min 5 hours")
    test_endpoint("/api/leader-assignments?event=Block Party", "Leader assignments - Block Party event")

def main():
    """Run all tests"""
    print("🚀 Trinity College Orientation Leaders API - Test Suite")
    print("=" * 60)
    
    # Test basic endpoints
    test_endpoint("/", "Root endpoint")
    test_endpoint("/health", "Health check")
    
    # Test data endpoints
    test_endpoint("/api/event-staffing", "Event staffing data")
    test_endpoint("/api/leader-assignments", "Leader assignments data")
    test_endpoint("/api/summary", "Summary statistics")
    test_endpoint("/api/leaders", "All leaders")
    test_endpoint("/api/events", "All events")
    
    # Test filtered endpoints
    test_filtered_endpoints()
    
    # Test specific leader lookup
    test_endpoint("/api/lookup/adrianyh", "Leader lookup by name")
    
    print("\n" + "=" * 60)
    print("✨ Test suite completed!")

if __name__ == "__main__":
    main()
