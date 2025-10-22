import { ChartBarIcon } from '@heroicons/react/24/outline';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../components/KPICard';

describe('KPICard', () => {
    test('debe renderizar correctamente con props básicas', () => {
        render(
            <KPICard
                title="Test KPI"
                value={100}
                icon={<ChartBarIcon data-testid="test-icon" />}
            />
        );

        expect(screen.getByText('Test KPI')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    test('debe renderizar unidad cuando se proporciona', () => {
        render(
            <KPICard
                title="Distancia"
                value={150}
                unit="km"
                icon={<ChartBarIcon />}
            />
        );

        expect(screen.getByText('km')).toBeInTheDocument();
    });

    test('debe renderizar subtitle cuando se proporciona', () => {
        render(
            <KPICard
                title="Velocidad"
                value={80}
                subtitle="Velocidad promedio"
                icon={<ChartBarIcon />}
            />
        );

        expect(screen.getByText('Velocidad promedio')).toBeInTheDocument();
    });

    test('debe renderizar description cuando se proporciona', () => {
        render(
            <KPICard
                title="KPI Test"
                value={50}
                description="Descripción detallada"
                icon={<ChartBarIcon />}
            />
        );

        expect(screen.getByText('Descripción detallada')).toBeInTheDocument();
    });

    test('debe aplicar clase de color rojo correctamente', () => {
        const { container } = render(
            <KPICard
                title="Test"
                value={100}
                colorClass="text-red-600"
                icon={<ChartBarIcon />}
            />
        );

        const iconWrapper = container.querySelector('.bg-red-50');
        expect(iconWrapper).toBeInTheDocument();
    });

    test('debe aplicar clase de color verde correctamente', () => {
        const { container } = render(
            <KPICard
                title="Test"
                value={100}
                colorClass="text-green-600"
                icon={<ChartBarIcon />}
            />
        );

        const iconWrapper = container.querySelector('.bg-green-50');
        expect(iconWrapper).toBeInTheDocument();
    });

    test('debe aplicar clase de color azul correctamente', () => {
        const { container } = render(
            <KPICard
                title="Test"
                value={100}
                colorClass="text-blue-600"
                icon={<ChartBarIcon />}
            />
        );

        const iconWrapper = container.querySelector('.bg-blue-50');
        expect(iconWrapper).toBeInTheDocument();
    });

    test('debe aplicar clase de color naranja correctamente', () => {
        const { container } = render(
            <KPICard
                title="Test"
                value={100}
                colorClass="text-orange-600"
                icon={<ChartBarIcon />}
            />
        );

        const iconWrapper = container.querySelector('.bg-orange-50');
        expect(iconWrapper).toBeInTheDocument();
    });

    test('debe ser clickeable cuando se proporciona onClick', () => {
        const handleClick = jest.fn();
        const { container } = render(
            <KPICard
                title="Test"
                value={100}
                icon={<ChartBarIcon />}
                onClick={handleClick}
            />
        );

        const card = container.querySelector('.cursor-pointer');
        expect(card).toBeInTheDocument();

        if (card) {
            card.click();
            expect(handleClick).toHaveBeenCalledTimes(1);
        }
    });

    test('no debe ser clickeable cuando no se proporciona onClick', () => {
        const { container } = render(
            <KPICard
                title="Test"
                value={100}
                icon={<ChartBarIcon />}
            />
        );

        const card = container.querySelector('.cursor-pointer');
        expect(card).not.toBeInTheDocument();
    });
});

