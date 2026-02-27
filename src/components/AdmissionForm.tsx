import { useState, useEffect, cloneElement, ReactElement } from 'react';
import { Formik, Form, Field, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { FormField } from './FormField';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { differenceInYears, parseISO } from 'date-fns';
import { validationRules, ValidationRule } from '../config/validationRules';

// Helper component to sync offerLetterSent state with interviewStatus
const FormWatcher = () => {
  const { values, setFieldValue } = useFormikContext<any>();
  
  useEffect(() => {
    const isEligibleForOffer = values.interviewStatus === 'Cleared' || values.interviewStatus === 'Waitlisted';
    if (!isEligibleForOffer && values.offerLetterSent) {
      setFieldValue('offerLetterSent', false);
    }
  }, [values.interviewStatus, values.offerLetterSent, setFieldValue]);

  return null;
};

const SoftRuleWrapper = ({ 
  name, 
  condition, 
  children 
}: { 
  name: string; 
  condition: boolean; 
  children: ReactElement 
}) => {
  const { values, setFieldValue, touched } = useFormikContext<any>();
  const isViolated = !condition;
  const exceptionRequestedField = `${name}ExceptionRequested`;
  const rationaleField = `${name}ExceptionRationale`;
  
  const isRequested = values[exceptionRequestedField];
  const fieldTouched = touched[name];
  
  const rule = validationRules.find(r => r.field === name);
  const warningMessage = rule?.errorMessage || 'Validation warning';
  const status = (isViolated && fieldTouched) ? 'warning' : undefined;
  const customError = (isViolated && fieldTouched) ? warningMessage : undefined;

  const keywords = rule?.rationaleKeywords || [];
  const helperText = `Must include one of: ${keywords.map(k => `'${k}'`).join(', ')}`;

  return (
    <div className="space-y-4">
      {cloneElement(children as any, { status, customError })}
      
      {isViolated && fieldTouched && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Warning</p>
              <p className="text-xs text-amber-700">{warningMessage}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-amber-200/50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Request Exception</span>
            <button
              type="button"
              onClick={() => setFieldValue(exceptionRequestedField, !isRequested)}
              className={`
                w-10 h-6 rounded-full p-1 transition-colors duration-200 flex items-center
                ${isRequested ? 'bg-amber-600 justify-end' : 'bg-amber-200 justify-start'}
              `}
            >
              <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </button>
          </div>
          
          <AnimatePresence>
            {isRequested && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="pt-2"
              >
                <FormField 
                  label="Exception Rationale" 
                  name={rationaleField} 
                  type="textarea" 
                  placeholder="Provide a detailed rationale (min 30 chars, include approval phrases)..."
                  helperText={helperText}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

const STEPS = [
  { id: 'personal', title: 'Personal', description: 'Identity & Contact' },
  { id: 'academic', title: 'Academic', description: 'Qualifications' },
  { id: 'interview', title: 'Interview', description: 'Final Status' }
];

const validateRationale = (val: string, keywords: string[]) => {
  if (!val) return false;
  if (val.length < 30) return false;
  return keywords.some(phrase => val.toLowerCase().includes(phrase));
};

const buildInitialValues = (rules: ValidationRule[]) => {
  const values: any = {
    scoreType: 'percentage',
    isFlagged: false,
  };
  rules.forEach(rule => {
    if (rule.field === 'graduationYear') values[rule.field] = 2024;
    else if (rule.field === 'offerLetterSent') values[rule.field] = false;
    else if (rule.field === 'score' || rule.field === 'screeningScore') values[rule.field] = '';
    else values[rule.field] = '';

    if (rule.type === 'soft' && rule.exceptionAllowed) {
      values[`${rule.field}ExceptionRequested`] = false;
      values[`${rule.field}ExceptionRationale`] = '';
    }
  });
  return values;
};

const buildSchema = (rules: ValidationRule[]) => {
  const schema: any = {};
  rules.forEach(rule => {
    let fieldSchema: any;
    
    if (rule.field === 'dob') fieldSchema = Yup.date();
    else if (['graduationYear', 'score', 'screeningScore'].includes(rule.field)) fieldSchema = Yup.number().nullable().transform((value, originalValue) => originalValue === "" ? null : value);
    else if (rule.field === 'offerLetterSent') fieldSchema = Yup.boolean();
    else fieldSchema = Yup.string();

    const validations = rule.validation.split(',').map(v => v.trim());

    validations.forEach(v => {
      if (v === 'required') fieldSchema = fieldSchema.required(rule.errorMessage || 'Required');
      if (v === 'email') fieldSchema = fieldSchema.email('Invalid email format');
      if (v.startsWith('minLength:')) {
        const min = parseInt(v.split(':')[1]);
        fieldSchema = fieldSchema.min(min, `Minimum ${min} characters`);
      }
      if (v === 'noNumbers') fieldSchema = fieldSchema.matches(/^[^0-9]*$/, 'Numbers are not allowed');
      if (v === 'phone') fieldSchema = fieldSchema.matches(/^[6-9]\d{9}$/, 'Must be 10 digits starting with 6-9');
      if (v === 'aadhaar') fieldSchema = fieldSchema.matches(/^\d{12}$/, 'Must be exactly 12 digits');
      
      if (v.startsWith('ageRange:')) {
        const [min, max] = v.split(':')[1].split('-').map(Number);
        fieldSchema = fieldSchema.test('soft-age', rule.errorMessage, function(value: any) {
          if (!value) return true;
          const age = differenceInYears(new Date(), value);
          const isViolated = age < min || age > max;
          const { dobExceptionRequested, dobExceptionRationale } = this.parent;
          if (isViolated) {
            if (!dobExceptionRequested) return false;
            return validateRationale(dobExceptionRationale, rule.rationaleKeywords || []);
          }
          return true;
        });
      }

      if (v.startsWith('yearRange:')) {
        const [min, max] = v.split(':')[1].split('-').map(Number);
        fieldSchema = fieldSchema.test('soft-grad', rule.errorMessage, function(value: any) {
          if (!value) return true;
          const isViolated = value < min || value > max;
          const { graduationYearExceptionRequested, graduationYearExceptionRationale } = this.parent;
          if (isViolated) {
            if (!graduationYearExceptionRequested) return false;
            return validateRationale(graduationYearExceptionRationale, rule.rationaleKeywords || []);
          }
          return true;
        });
      }

      if (v === 'minScore') {
        fieldSchema = fieldSchema.test('soft-score', rule.errorMessage, function(value: any) {
          if (value === undefined || value === null || value === '') return true;
          const { scoreType, scoreExceptionRequested, scoreExceptionRationale } = this.parent;
          const min = scoreType === 'percentage' ? 60 : 6.0;
          const isViolated = value < min;
          if (isViolated) {
            if (!scoreExceptionRequested) return false;
            return validateRationale(scoreExceptionRationale, rule.rationaleKeywords || []);
          }
          return true;
        });
      }

      if (v.startsWith('min:')) {
        const min = parseInt(v.split(':')[1]);
        fieldSchema = fieldSchema.test('soft-min', rule.errorMessage, function(value: any) {
          if (value === undefined || value === null || value === '') return true;
          const isViolated = value < min;
          const exceptionRequestedField = `${rule.field}ExceptionRequested`;
          const rationaleField = `${rule.field}ExceptionRationale`;
          const isRequested = this.parent[exceptionRequestedField];
          const rationale = this.parent[rationaleField];
          if (isViolated) {
            if (!isRequested) return false;
            return validateRationale(rationale, rule.rationaleKeywords || []);
          }
          return true;
        });
      }

      if (v === 'notRejected') {
        fieldSchema = fieldSchema.test('not-rejected', rule.errorMessage, value => value !== 'Rejected');
      }

      if (v === 'offerStatusCheck') {
        fieldSchema = fieldSchema.test('offer-status-check', 'Offer can only be sent to Cleared or Waitlisted candidates', function(value: any) {
          const { interviewStatus } = this.parent;
          if (value === true && interviewStatus !== 'Cleared' && interviewStatus !== 'Waitlisted') return false;
          return true;
        });
      }

      if (v === 'offerRequiredForCleared') {
        fieldSchema = fieldSchema.test('offer-required', 'Offer letter must be sent for Cleared candidates', function(value: any) {
          const { interviewStatus } = this.parent;
          if (interviewStatus === 'Cleared' && value !== true) return false;
          return true;
        });
      }
    });

    schema[rule.field] = fieldSchema;

    if (rule.type === 'soft' && rule.exceptionAllowed) {
      const rationaleField = `${rule.field}ExceptionRationale`;
      const requestedField = `${rule.field}ExceptionRequested`;
      schema[rationaleField] = Yup.string().when(requestedField, {
        is: true,
        then: (schema) => schema.min(30, 'Min 30 characters').test('phrase-check', 'Must include approval phrase', (val) => validateRationale(val || '', rule.rationaleKeywords || []))
      });
    }
  });

  return Yup.object(schema);
};

const initialValues = buildInitialValues(validationRules);
const validationSchema = buildSchema(validationRules);

export function AdmissionForm({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    const softRules = validationRules.filter(r => r.type === 'soft' && r.exceptionAllowed);
    const exceptionCount = softRules
      .map(r => values[`${r.field}ExceptionRequested`])
      .filter(Boolean).length;

    const isFlagged = exceptionCount > 2;
    const payload = {
      ...values,
      isFlagged
    };

    try {
      const response = await fetch('/api/admission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Audit Log Persistence
        const auditEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          candidateName: values.fullName,
          email: values.email,
          values: values,
          exceptionCount,
          exceptions: softRules
            .filter(r => values[`${r.field}ExceptionRequested`])
            .map(r => ({
              field: r.field,
              rationale: values[`${r.field}ExceptionRationale`]
            })),
          isFlagged
        };

        const existingLogs = JSON.parse(localStorage.getItem('admission_audit_log') || '[]');
        localStorage.setItem('admission_audit_log', JSON.stringify([auditEntry, ...existingLogs]));

        onComplete();
      }
    } catch (error) {
      console.error('Submission failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = async (validateForm: any, setTouched: any, touched: any) => {
    const errors = await validateForm();
    
    const getFieldsForStep = (step: number) => {
      const baseFields: Record<number, string[]> = {
        0: ['fullName', 'email', 'phone', 'dob', 'aadhaar'],
        1: ['qualification', 'graduationYear', 'score'],
        2: ['screeningScore', 'interviewStatus', 'offerLetterSent']
      };
      
      const fields = [...baseFields[step]];
      const extraFields: string[] = [];
      fields.forEach(f => {
        const rule = validationRules.find(r => r.field === f);
        if (rule?.type === 'soft' && rule.exceptionAllowed) {
          extraFields.push(`${f}ExceptionRequested`);
          extraFields.push(`${f}ExceptionRationale`);
        }
      });
      return [...fields, ...extraFields];
    };

    const currentFields = getFieldsForStep(currentStep);
    const stepErrors = currentFields.filter(field => errors[field]);

    if (stepErrors.length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    } else {
      // Mark all fields in current step as touched to show errors
      const newTouched = currentFields.reduce((acc, field) => ({ ...acc, [field]: true }), touched);
      setTouched(newTouched);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
      {/* Step Tracker */}
      <div className="bg-gray-50/50 border-b border-black/5 px-8 py-6">
        <div className="flex justify-between items-center max-w-md mx-auto relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500" 
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
          
          {STEPS.map((step, idx) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${idx <= currentStep ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-2 border-gray-200 text-gray-400'}
              `}>
                {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              <div className="absolute -bottom-8 whitespace-nowrap text-center">
                <span className={`text-[10px] uppercase font-bold tracking-widest ${idx <= currentStep ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {step.title}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="h-8" /> {/* Spacer for labels */}
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        validateOnMount={true}
      >
        {({ values, errors, touched, isValid, isSubmitting, setFieldValue, validateForm, setTouched }) => {
          const exceptionCount = validationRules
            .filter(r => r.type === 'soft' && r.exceptionAllowed)
            .map(r => values[`${r.field}ExceptionRequested`])
            .filter(Boolean).length;

          const isFlagged = exceptionCount > 2;

          return (
            <Form className="p-8 space-y-8">
              <FormWatcher />
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <FormField 
                      label="Full Name" 
                      name="fullName" 
                      placeholder="John Doe" 
                      className="md:col-span-2"
                    />
                    <FormField 
                      label="Email Address" 
                      name="email" 
                      type="email" 
                      placeholder="john@example.com" 
                    />
                    <FormField 
                      label="Phone Number" 
                      name="phone" 
                      placeholder="10-digit mobile" 
                      helperText="Enter without country code"
                    />
                    <SoftRuleWrapper 
                      name="dob" 
                      condition={!values.dob || (differenceInYears(new Date(), values.dob) >= 18 && differenceInYears(new Date(), values.dob) <= 35)}
                    >
                      <FormField 
                        label="Date of Birth" 
                        name="dob" 
                        type="date" 
                      />
                    </SoftRuleWrapper>
                    <FormField 
                      label="Aadhaar Number" 
                      name="aadhaar" 
                      placeholder="12-digit UID" 
                      helperText="Strictly 12 digits required"
                    />
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <FormField 
                      label="Highest Qualification" 
                      name="qualification" 
                      type="select" 
                      options={["B.Tech", "B.E.", "B.Sc", "BCA", "M.Tech", "M.Sc", "MCA", "MBA"]}
                      className="md:col-span-2"
                    />
                    <SoftRuleWrapper
                      name="graduationYear"
                      condition={!values.graduationYear || (values.graduationYear >= 2015 && values.graduationYear <= 2025)}
                    >
                      <FormField 
                        label="Graduation Year" 
                        name="graduationYear" 
                        type="number" 
                      />
                    </SoftRuleWrapper>
                    
                    <div className="space-y-4 md:col-span-2 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Academic Score</span>
                        <button
                          type="button"
                          onClick={() => setFieldValue('scoreType', values.scoreType === 'percentage' ? 'cgpa' : 'percentage')}
                          className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {values.scoreType === 'percentage' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          Switch to {values.scoreType === 'percentage' ? 'CGPA' : 'Percentage'}
                        </button>
                      </div>
                      <SoftRuleWrapper
                        name="score"
                        condition={values.score === '' || values.score === null || Number(values.score) >= (values.scoreType === 'percentage' ? 60 : 6.0)}
                      >
                        <FormField 
                          label={values.scoreType === 'percentage' ? 'Percentage (%)' : 'CGPA (out of 10)'} 
                          name="score" 
                          type="number" 
                          placeholder={values.scoreType === 'percentage' ? 'e.g. 85' : 'e.g. 8.5'}
                        />
                      </SoftRuleWrapper>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {values.interviewStatus === 'Rejected' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200"
                      >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-bold uppercase tracking-wide">
                          Rejected candidates cannot be enrolled.
                        </p>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SoftRuleWrapper
                        name="screeningScore"
                        condition={values.screeningScore === '' || values.screeningScore === null || Number(values.screeningScore) >= 40}
                      >
                        <FormField 
                          label="Screening Test Score" 
                          name="screeningScore" 
                          type="number" 
                          placeholder="0-100"
                        />
                      </SoftRuleWrapper>
                      <FormField 
                        label="Interview Status" 
                        name="interviewStatus" 
                        type="select" 
                        options={["Cleared", "Waitlisted", "Rejected"]}
                      />
                    </div>

                    <div className={`flex items-center justify-between p-6 rounded-2xl border transition-colors duration-200 ${
                      (values.interviewStatus === 'Cleared' || values.interviewStatus === 'Waitlisted') 
                        ? 'bg-emerald-50 border-emerald-100' 
                        : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}>
                      <div className="space-y-1">
                        <h4 className={`text-sm font-semibold ${
                          (values.interviewStatus === 'Cleared' || values.interviewStatus === 'Waitlisted') ? 'text-emerald-900' : 'text-gray-500'
                        }`}>Offer Letter Sent</h4>
                        <p className={`text-xs ${
                          (values.interviewStatus === 'Cleared' || values.interviewStatus === 'Waitlisted') ? 'text-emerald-700' : 'text-gray-400'
                        }`}>
                          {values.interviewStatus === 'Cleared' || values.interviewStatus === 'Waitlisted' 
                            ? 'Has the official offer letter been dispatched?' 
                            : 'Status must be Cleared or Waitlisted to send an offer.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={values.interviewStatus !== 'Cleared' && values.interviewStatus !== 'Waitlisted'}
                        onClick={() => setFieldValue('offerLetterSent', !values.offerLetterSent)}
                        className={`
                          w-14 h-8 rounded-full p-1 transition-all duration-200 flex items-center
                          ${values.offerLetterSent ? 'bg-emerald-600 justify-end' : 'bg-gray-300 justify-start'}
                          ${(values.interviewStatus !== 'Cleared' && values.interviewStatus !== 'Waitlisted') ? 'cursor-not-allowed' : 'hover:ring-4 hover:ring-emerald-500/10'}
                        `}
                      >
                        <motion.div 
                          layout
                          className="w-6 h-6 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Flagging Warning Banner */}
              <AnimatePresence>
                {isFlagged && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-amber-100 border border-amber-200 p-4 rounded-2xl flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-bold text-amber-900">
                      ⚠️ This candidate has more than 2 exceptions. Entry will be flagged for manager review.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Footer */}
              <div className="pt-8 border-t border-black/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <div className="px-6 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isFlagged ? 'text-amber-600' : 'text-gray-400'}`}>
                      Active Exceptions: {exceptionCount}/4
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {currentStep < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => nextStep(validateForm, setTouched, touched)}
                      className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      className="flex items-center gap-2 px-10 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all shadow-lg shadow-emerald-200 active:scale-95"
                    >
                      {isSubmitting ? 'Processing...' : 'Submit Application'}
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
