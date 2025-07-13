import Layout from '../components/layout/Layout';
import { NotFoundError } from '../components/error/ErrorDisplay';
import logger from '../utils/logger';
import { useEffect } from 'react';

const NotFound = () => {
  useEffect(() => {
    logger.user.action('404_page_visited');
  }, []);

  return (
    <Layout>
      <NotFoundError />
    </Layout>
  );
};

export default NotFound;
