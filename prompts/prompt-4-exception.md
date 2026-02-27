Add a system-level rule: 

Count the number of active exceptions on the current form. Display this 
count prominently near the submit button as: 
"Active Exceptions: X/4"

If the count exceeds 2, show a warning banner:
"⚠️ This candidate has more than 2 exceptions. Entry will be flagged 
for manager review."

The submit button should still work, but the entry should be visually 
marked as "Flagged" in any data display.

Counter is not visible yet. Modify the database and form
to store exception text for any field where it may be required and flag for manager review.


Do a small change, change "SOFT RULE WARNING" text
to just "WARNING".