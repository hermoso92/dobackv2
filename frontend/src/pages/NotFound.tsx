import React from 'react';
import { Link } from 'react-router-dom';
import { t } from "../i18n";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">{t('pagina_no_encontrada')}</p>
        <p className="mt-2 text-gray-500">
          {t('lo_sentimos_la_pagina_que_estas_buscando_no_existe')}</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {t('volver_al_inicio')}</Link>
      </div>
    </div>
  );
};

export default NotFound; 