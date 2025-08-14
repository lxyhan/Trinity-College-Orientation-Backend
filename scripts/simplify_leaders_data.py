import pandas as pd
import os

def simplify_leaders_data():
    """
    Script to simplify the orientation leaders data by keeping only essential information:
    - Leader names and emails
    - Clean availability information (just dates and times, no verbose titles)
    """
    
    # File paths
    input_file = "Trinity College Orientation Leaders 2025(Final with Full Info).csv"
    output_file = "Trinity College Orientation Leaders 2025(Simplified).csv"
    
    try:
        print("Reading the cleaned leaders data...")
        
        # Read the cleaned data
        df = pd.read_csv(input_file)
        print(f"Loaded {len(df)} records from cleaned data")
        
        # Define the availability columns with their corresponding clean date labels
        availability_mapping = {
            'Tell us about your availability! Final scheduling will occur in mid-August.Mon Aug 25': 'Aug 25',
            'Tell us about your availability! Final scheduling will occur in mid-August.Tues Aug 26': 'Aug 26',
            'Tell us about your availability! Final scheduling will occur in mid-August.Wed Aug 27': 'Aug 27',
            'Tell us about your availability! Final scheduling will occur in mid-August.Thurs Aug 28': 'Aug 28',
            'Tell us about your availability! Final scheduling will occur in mid-August.Fri Aug 29': 'Aug 29',
            'Tell us about your availability! Final scheduling will occur in mid-August.Sat Aug 30': 'Aug 30',
            'Tell us about your availability! Final scheduling will occur in mid-August.Sun Aug 31': 'Aug 31',
            'Tell us about your availability! Final scheduling will occur in mid-August.Mon Sept 1': 'Sept 1'
        }
        
        # Create a simplified dataframe with only essential columns
        simplified_df = df[['First Name', 'Last Name', 'Email']].copy()
        
        # Consolidate availability into a single column with clean format
        def consolidate_availability(row):
            availability_info = []
            for col, date_label in availability_mapping.items():
                if col in df.columns:
                    availability = str(row[col]).strip()
                    if availability and availability.lower() not in ['nan', 'none', '']:
                        # Clean up the availability text to remove any verbose descriptions
                        clean_availability = availability.replace('all day', 'all-day').replace('Afternoon/evening', 'afternoon').replace('not available', 'unavailable')
                        availability_info.append(f"{date_label}: {clean_availability}")
            
            if availability_info:
                return " | ".join(availability_info)
            else:
                return "No availability specified"
        
        # Apply the consolidation function
        simplified_df['Availability'] = df.apply(consolidate_availability, axis=1)
        
        # Save the simplified data
        simplified_df.to_csv(output_file, index=False)
        print(f"Successfully created: {output_file}")
        
        # Display summary
        print(f"\nSummary:")
        print(f"- Original records: {len(df)}")
        print(f"- Simplified records: {len(simplified_df)}")
        print(f"- Columns kept: {list(simplified_df.columns)}")
        
        # Show sample of the simplified data
        print(f"\nSample of simplified data:")
        print(simplified_df.head())
        
        return True
        
    except FileNotFoundError as e:
        print(f"Error: Could not find file - {e}")
        return False
    except Exception as e:
        print(f"Error processing data: {e}")
        return False

if __name__ == "__main__":
    print("Trinity College Orientation Leaders Data Simplification Script")
    print("=" * 65)
    
    # Change to the parent directory to access the CSV files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    os.chdir(parent_dir)
    
    print(f"Working directory: {os.getcwd()}")
    
    # Run the data simplification
    success = simplify_leaders_data()
    
    if success:
        print("\n✅ Data simplification completed successfully!")
    else:
        print("\n❌ Data simplification failed!")
