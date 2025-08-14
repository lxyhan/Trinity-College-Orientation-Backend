# Data Cleaning Scripts

## Orientation Leaders Data Cleaning

The `data_cleaning.py` script processes Trinity College Orientation Leaders data to create a filtered dataset.

### What it does:

1. **Reads two CSV files:**
   - `Trinity College Orientation Leaders 2025(Leaders) (1).csv` - Contains full detailed information for all leaders including availability, program of study, pronouns, etc.
   - `Trinity College Orientation Leaders 2025(Final Volunteer List).csv` - Contains the final list of selected leaders

2. **Filters the data:**
   - Extracts only the leaders that appear in the final volunteer list
   - Preserves all the detailed information from the original dataset
   - Matches leaders based on First Name, Last Name, and Email address

3. **Outputs a new CSV file:**
   - `Trinity College Orientation Leaders 2025(Final with Full Info).csv`
   - Contains complete information for only the final selected leaders

## Data Simplification

The `simplify_leaders_data.py` script creates a simplified version of the cleaned data with only essential information.

### What it does:

1. **Reads the cleaned data:**
   - `Trinity College Orientation Leaders 2025(Final with Full Info).csv`

2. **Simplifies the data:**
   - Keeps only: First Name, Last Name, Email
   - Consolidates all availability information into a single, readable column
   - Removes all other detailed information (program of study, pronouns, personal statements, etc.)

3. **Outputs a simplified CSV file:**
   - `Trinity College Orientation Leaders 2025(Simplified).csv`
   - Much smaller file size (from ~100KB to ~20KB)
   - Easy to read and use for scheduling purposes

### How to use:

1. Make sure both input CSV files are in the parent directory (same level as the `scripts/` folder)
2. Run the data cleaning script first:
   ```bash
   python scripts/data_cleaning.py
   ```
3. Then run the simplification script:
   ```bash
   python scripts/simplify_leaders_data.py
   ```
4. The scripts will automatically:
   - Change to the correct directory
   - Handle different CSV encodings
   - Process the data
   - Create the output files
   - Display progress and summary information

### Requirements:

- Python 3.x
- pandas library (`pip install pandas`)

### Output:

The scripts will show:
- Number of records loaded from each file
- Number of final leaders identified
- Number of records in the output file
- Sample of the final leaders
- Success/failure status

### File Structure:

```
Trinity-College-Orientation-Backend/
├── scripts/
│   ├── data_cleaning.py
│   ├── simplify_leaders_data.py
│   └── README.md
├── Trinity College Orientation Leaders 2025(Leaders) (1).csv
├── Trinity College Orientation Leaders 2025(Final Volunteer List).csv
├── Trinity College Orientation Leaders 2025(Final with Full Info).csv (intermediate)
└── Trinity College Orientation Leaders 2025(Simplified).csv (final output)
```

### Data Fields Included:

**Full Info file contains comprehensive information for each final leader:**
- Personal details (Name, Email, Pronouns)
- Academic information (Program of Study, Years of Study)
- Experience (Previous Orientation involvement)
- Availability for each day of orientation week
- Personal statements and advice for incoming students
- Training completion status
- Shirt size and accessibility requirements

**Simplified file contains only:**
- First Name
- Last Name
- Email
- Availability (consolidated into one readable column)

### File Size Comparison:

- **Original Leaders file:** ~132KB (130 lines)
- **Full Info file:** ~105KB (99 lines)
- **Simplified file:** ~20KB (99 lines)
- **Simplification achieved:** ~80% reduction in file size
