Now add validation for these STRICT rules (violations block submission, 
no exceptions allowed):

1. Full Name: Cannot be blank. Minimum 2 characters. No numbers allowed.
2. Email: Must be valid email format (contains @ and a domain).
3. Phone: Exactly 10 digits. Must start with 6, 7, 8, or 9.
4. Highest Qualification: Must select one from the dropdown (cannot be empty).
5. Interview Status: If "Rejected" is selected, block submission entirely 
   and show a red banner: "Rejected candidates cannot be enrolled."
6. Aadhaar Number: Exactly 12 digits. No alphabets or special characters.
7. Offer Letter Sent: Cannot be "Yes" unless Interview Status is 
   "Cleared" or "Waitlisted".

Show validation errors INLINE below each field in red text as the user 
types or changes values. The submit button stays disabled until ALL strict 
rules pass.