import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { useField } from 'formik';
interface FormFieldProps extends Omit<TextFieldProps, 'name'> {
  name: string;
}

const FormField: React.FC<FormFieldProps> = ({ name, ...props }) => {
  const [field, meta] = useField(name);

  const error = meta.touched && meta.error;
  const errorMessage = error ? String(meta.error) : '';

  return (
    <TextField
      {...props}
      {...field}
      error={Boolean(error)}
      helperText={errorMessage}
    />
  );
};

export default FormField; 