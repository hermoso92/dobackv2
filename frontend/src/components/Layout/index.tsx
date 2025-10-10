import { Box, Flex } from '@chakra-ui/react';
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Sidebar from '../Sidebar';
import { t } from "../../i18n";

const Layout: React.FC = () => {
    return (
        <Flex h="100vh">
            <Sidebar />
            <Box flex="1" overflow="auto">
                <Header />
                <Box p={6}>
                    <Outlet />
                </Box>
            </Box>
        </Flex>
    );
};

export default Layout; 