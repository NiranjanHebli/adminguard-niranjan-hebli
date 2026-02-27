export interface ValidationRule {
  field: string;
  type: 'strict' | 'soft';
  validation: string;
  errorMessage: string;
  exceptionAllowed?: boolean;
  rationaleKeywords?: string[];
}

export const validationRules: ValidationRule[] = [
  {
    field: "fullName",
    type: "strict",
    validation: "required, minLength:2, noNumbers",
    errorMessage: "Name must be at least 2 characters with no numbers"
  },
  {
    field: "email",
    type: "strict",
    validation: "required, email",
    errorMessage: "Invalid email format"
  },
  {
    field: "phone",
    type: "strict",
    validation: "required, phone",
    errorMessage: "Must be 10 digits starting with 6-9"
  },
  {
    field: "dob",
    type: "soft",
    validation: "required, ageRange:18-35",
    errorMessage: "Candidate age must be between 18-35",
    exceptionAllowed: true,
    rationaleKeywords: ["approved by", "special case", "documentation pending", "waiver granted"]
  },
  {
    field: "aadhaar",
    type: "strict",
    validation: "required, aadhaar",
    errorMessage: "Must be exactly 12 digits"
  },
  {
    field: "qualification",
    type: "strict",
    validation: "required",
    errorMessage: "Qualification is required"
  },
  {
    field: "graduationYear",
    type: "soft",
    validation: "required, yearRange:2015-2025",
    errorMessage: "Graduation year should be between 2015 and 2025",
    exceptionAllowed: true,
    rationaleKeywords: ["approved by", "special case", "documentation pending", "waiver granted"]
  },
  {
    field: "score",
    type: "soft",
    validation: "required, minScore",
    errorMessage: "Academic score too low",
    exceptionAllowed: true,
    rationaleKeywords: ["approved by", "special case", "documentation pending", "waiver granted"]
  },
  {
    field: "screeningScore",
    type: "soft",
    validation: "required, min:40",
    errorMessage: "Screening score should be at least 40",
    exceptionAllowed: true,
    rationaleKeywords: ["approved by", "special case", "documentation pending", "waiver granted"]
  },
  {
    field: "interviewStatus",
    type: "strict",
    validation: "required, notRejected",
    errorMessage: "Interview status is required and cannot be Rejected"
  },
  {
    field: "offerLetterSent",
    type: "strict",
    validation: "offerStatusCheck, offerRequiredForCleared",
    errorMessage: "Offer letter status is invalid or missing"
  }
];
