import { Box, Icon, Text, useColorMode, VStack } from '@chakra-ui/react';
import React from 'react';
import { FiHome, FiSettings, FiUser } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { t } from "../../i18n";

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { colorMode } = useColorMode();

    const menuItems = [
        { icon: FiHome, label: 'Dashboard', path: '/' },
        { icon: FiUser, label: 'Profile', path: '/profile' },
        { icon: FiSettings, label: 'Settings', path: '/settings' },
    ];

    return (
        <Box
            w="240px"
            h="100vh"
            bg={colorMode === 'light' ? 'white' : 'gray.800'}
            borderRight="1px"
            borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
            py={6}
        >
            <VStack spacing={2} align="stretch">
                {menuItems.map((item) => (
                    <Link key={item.path} to={item.path}>
                        <Box
                            px={6}
                            py={3}
                            bg={location.pathname === item.path ? 'blue.500' : 'transparent'}
                            color={location.pathname === item.path ? 'white' : 'inherit'}
                            _hover={{
                                bg: location.pathname === item.path ? 'blue.600' : 'gray.100',
                            }}
                        >
                            <Box display="flex" alignItems="center">
                                <Icon as={item.icon} mr={3} />
                                <Text>{item.label}</Text>
                            </Box>
                        </Box>
                    </Link>
                ))}
            </VStack>
        </Box>
    );
};

export default Sidebar; 