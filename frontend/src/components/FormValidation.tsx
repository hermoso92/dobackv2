import { Box, Button, TextField, TextFieldProps, Typography } from '@mui/material';
import { useFormik, useFormikContext } from 'formik';
import React from 'react';
import * as Yup from 'yup';
import { t } from "../i18n";

interface FormValidationProps {
  initialValues: any;
  validationSchema: Yup.ObjectSchema<any>;
  onSubmit: (values: any) => void;
  fields: {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
  }[];
  submitLabel?: string;
}

export const FormValidation: React.FC<FormValidationProps> = ({
  initialValues,
  validationSchema,
  onSubmit,
  fields,
  submitLabel = 'Submit'
}) => {
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
      {fields.map((field) => (
        <TextField
          key={field.name}
          margin="normal"
          required={field.required}
          fullWidth
          id={field.name}
          label={field.label}
          name={field.name}
          type={field.type || 'text'}
          autoComplete={field.name}
          value={formik.values[field.name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched[field.name] && Boolean(formik.errors[field.name])}
          helperText={formik.touched[field.name] && formik.errors[field.name] ? String(formik.errors[field.name]) : ''}
        />
      ))}

      {Object.keys(formik.errors).length > 0 && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {t('por_favor_corrija_los_errores_antes_de_continuar')}</Typography>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={formik.isSubmitting || !formik.isValid}
      >
        {submitLabel}
      </Button>
    </Box>
  );
};

interface FormFieldProps extends Omit<TextFieldProps, 'name'> {
  name: string;
}

const FormField: React.FC<FormFieldProps> = ({ name, ...props }) => {
  const { values, touched, errors, handleChange, handleBlur } = useFormikContext<any>();

  const error = touched[name] && errors[name];
  const errorMessage = error ? String(errors[name]) : '';

  return (
    <TextField
      {...props}
      name={name}
      value={values[name]}
      onChange={handleChange}
      onBlur={handleBlur}
      error={Boolean(error)}
      helperText={errorMessage}
    />
  );
};

export default FormField; 