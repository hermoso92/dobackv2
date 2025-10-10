import React, { ReactNode } from 'react';

interface FilteredPageWrapperProps {
    children: ReactNode;
}

const FilteredPageWrapper: React.FC<FilteredPageWrapperProps> = ({
    children
}) => {
    return (
        <div className="h-full w-full">
            {children}
        </div>
    );
};

export default FilteredPageWrapper;
