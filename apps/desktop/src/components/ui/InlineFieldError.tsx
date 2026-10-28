import React from 'react';

export interface FieldErrorItem {
  path: string;
  message: string;
}

export interface InlineFieldErrorProps {
  errors?: FieldErrorItem[] | null;
  fieldName: string;
}

export interface ParsedApiErrors {
  generalError: string;
  fieldErrors: FieldErrorItem[];
}

/**
 * InlineFieldError — مكون صغير لعرض أخطاء الحقول أسفل كل حقل إدخال.
 * يتلقى قائمة أخطاء Zod ({path, message}[]) واسم الحقل المطلوب.
 */
export default function InlineFieldError({ errors, fieldName }: InlineFieldErrorProps): React.JSX.Element | null {
  if (!errors || !Array.isArray(errors) || errors.length === 0) return null;

  const fieldError = errors.find((e) => e.path === fieldName);
  if (!fieldError) return null;

  return (
    <p className="text-destructive text-[11px] font-bold mt-1 mr-1 animate-in fade-in slide-in-from-top-1 duration-200">
      ⚠ {fieldError.message}
    </p>
  );
}

/**
 * parseApiErrors — يقرأ استجابة الخادم ويستخرج أخطاء الحقول.
 */
export function parseApiErrors(responseData?: { error?: string; details?: FieldErrorItem[] } | null): ParsedApiErrors {
  const result: ParsedApiErrors = {
    generalError: responseData?.error || 'حدث خطأ غير متوقع',
    fieldErrors: []
  };

  if (responseData?.details && Array.isArray(responseData.details)) {
    result.fieldErrors = responseData.details;
  }

  return result;
}
