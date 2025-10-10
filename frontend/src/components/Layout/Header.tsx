import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
import React from 'react';
import { t } from "../../i18n";

const { Header: AntHeader } = Layout;

interface HeaderProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed = false, onToggle }) => {
    const { token } = theme.useToken();

    return (
        <AntHeader style={{ padding: 0, background: token.colorBgContainer }}>
            <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={onToggle}
                style={{
                    fontSize: '16px',
                    width: 64,
                    height: 64,
                }}
            />
            <Menu mode="horizontal" style={{ float: 'right' }}>
                <Menu.SubMenu
                    key="user"
                    icon={<UserOutlined />}
                    title="Usuario"
                    style={{ marginRight: '24px' }}
                >
                    <Menu.Item key="profile">{t('perfil_1')}</Menu.Item>
                    <Menu.Item key="settings">{t('configuracion_2')}</Menu.Item>
                    <Menu.Item key="logout">{t('cerrar_sesion_6')}</Menu.Item>
                </Menu.SubMenu>
            </Menu>
        </AntHeader>
    );
};

export default Header; 