import pandas as pd
import os

def clean_orientation_leaders_data():
    """
    Script to filter orientation leaders data based on the final volunteer list.
    Reads the 'Leaders' CSV and filters it to only include leaders from the 'Final Volunteer List' CSV.
    Outputs a new CSV with full information for the final leaders.
    """
    
    # File paths
    leaders_file = "Trinity College Orientation Leaders 2025(Leaders) (1).csv"
    final_volunteers_file = "Trinity College Orientation Leaders 2025(Final Volunteer List).csv"
    output_file = "Trinity College Orientation Leaders 2025(Final with Full Info).csv"
    
    try:
        # Read the CSV files
        print("Reading CSV files...")
        
        # Try different encodings for the leaders file
        encodings_to_try = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        leaders_df = None
        
        for encoding in encodings_to_try:
            try:
                leaders_df = pd.read_csv(leaders_file, encoding=encoding)
                print(f"Successfully read Leaders file with {encoding} encoding")
                break
            except UnicodeDecodeError:
                continue
        
        if leaders_df is None:
            raise Exception("Could not read Leaders file with any encoding")
        
        print(f"Loaded {len(leaders_df)} records from Leaders file")
        
        # Read the final volunteers file (has basic info)
        final_volunteers_df = pd.read_csv(final_volunteers_file, header=None)
        final_volunteers_df.columns = ['First Name', 'Last Name', 'Email', 'Role', 'Completed Quercus']
        print(f"Loaded {len(final_volunteers_df)} records from Final Volunteer List file")
        
        # Create a set of final leader identifiers (First Name + Last Name + Email)
        # This helps avoid duplicates and ensures accurate matching
        final_leaders = set()
        for _, row in final_volunteers_df.iterrows():
            first_name = str(row['First Name']).strip()
            last_name = str(row['Last Name']).strip()
            email = str(row['Email']).strip()
            
            # Create a unique identifier
            identifier = f"{first_name}_{last_name}_{email}".lower()
            final_leaders.add(identifier)
        
        print(f"Identified {len(final_leaders)} final leaders to keep")
        
        # Filter the leaders data to only include final leaders
        filtered_records = []
        
        for _, row in leaders_df.iterrows():
            first_name = str(row['First Name']).strip()
            last_name = str(row['Last Name']).strip()
            email = str(row['Email']).strip()
            
            # Create the same identifier format for comparison
            identifier = f"{first_name}_{last_name}_{email}".lower()
            
            if identifier in final_leaders:
                filtered_records.append(row)
        
        # Create the filtered dataframe
        final_df = pd.DataFrame(filtered_records)
        
        print(f"Filtered to {len(final_df)} records matching final leaders")
        
        # Save the filtered data to a new CSV file
        final_df.to_csv(output_file, index=False)
        print(f"Successfully created: {output_file}")
        
        # Display summary statistics
        print("\nSummary:")
        print(f"- Original records: {len(leaders_df)}")
        print(f"- Final leaders to keep: {len(final_leaders)}")
        print(f"- Records in output file: {len(final_df)}")
        
        # Show some sample data
        if len(final_df) > 0:
            print(f"\nSample of final leaders:")
            # Use columns that actually exist in the leaders file
            display_columns = ['First Name', 'Last Name', 'Email', 'Training Complete']
            available_columns = [col for col in display_columns if col in final_df.columns]
            if available_columns:
                print(final_df[available_columns].head())
            else:
                print("No displayable columns found")
        
        return True
        
    except FileNotFoundError as e:
        print(f"Error: Could not find file - {e}")
        return False
    except Exception as e:
        print(f"Error processing data: {e}")
        return False

if __name__ == "__main__":
    print("Trinity College Orientation Leaders Data Cleaning Script")
    print("=" * 60)
    
    # Change to the parent directory to access the CSV files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    os.chdir(parent_dir)
    
    print(f"Working directory: {os.getcwd()}")
    
    # Run the data cleaning
    success = clean_orientation_leaders_data()
    
    if success:
        print("\n✅ Data cleaning completed successfully!")
    else:
        print("\n❌ Data cleaning failed!")
