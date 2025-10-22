import { Box, Button, Grid, MenuItem, Typography } from '@mui/material';
import { Formik } from 'formik';
import React from 'react';
import * as Yup from 'yup';
import FormField from '../FormField';
import { t } from "../../i18n";
import { logger } from '../../utils/logger';

const validationSchema = Yup.object().shape({
  title: Yup.string().required('El título es requerido'),
  description: Yup.string().required('La descripción es requerida'),
  location: Yup.string().required('La ubicación es requerida'),
  type: Yup.string().required('El tipo es requerido'),
});

const initialValues = {
  title: '',
  description: '',
  location: '',
  type: '',
};

const incidentTypes = [
  { value: 'accident', label: 'Accidente' },
  { value: 'near_miss', label: 'Casi Accidente' },
  { value: 'unsafe_condition', label: 'Condición Insegura' },
  { value: 'unsafe_act', label: 'Acto Inseguro' },
  { value: 'environmental', label: 'Ambiental' },
  { value: 'other', label: 'Otro' },
];

const IncidentForm: React.FC = () => {
  const handleSubmit = (values: typeof initialValues) => {
    logger.info(values);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t('reportar_incidente')}</Typography>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormField
                  name="title"
                  label="Título"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormField
                  name="description"
                  label="Descripción"
                  multiline
                  rows={4}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormField
                  name="location"
                  label="Ubicación"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormField
                  name="type"
                  label="Tipo"
                  select
                  fullWidth
                  required
                >
                  {incidentTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </FormField>
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {t('enviar')}</Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </Box>
  );
};

export default IncidentForm; 