# Stability Analysis Services

## Overview
This directory contains the core services responsible for vehicle stability analysis in the DobackSoft system.

## Services

### StabilityProcessor
Processes raw stability measurements and calculates key metrics:
- Load Transfer Ratio (LTR)
- Static Stability Factor (SSF)
- Dynamic Rollover Stability (DRS)
- Roll Stability Control (RSC)

### StabilityAnalysisService
Orchestrates the analysis workflow and manages:
- Event generation
- Notification triggers
- Data validation
- Metric calculations

### StabilityUploadController
Handles HTTP endpoints for:
- Data upload
- Request validation
- File management
- Service coordination

## Testing
Run the test suite:
```bash
npm test
```

For coverage report:
```bash
npm test -- --coverage
```

## Configuration
Key configuration parameters:
```typescript
const CONFIG = {
    TRACK_WIDTH: 1.8,    // meters
    CG_HEIGHT: 0.6,      // meters
    PRECISION_DIGITS: 3, // decimal places
    BATCH_SIZE: 100      // measurements per batch
};
```

## Dependencies
- Express.js
- Jest
- TypeScript
- Winston (logging)

## Contributing
1. Follow TypeScript best practices
2. Write tests for new features
3. Update documentation
4. Maintain code coverage > 80%

## License
Proprietary - DobackSoft 