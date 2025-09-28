# Railway Map React Component

This React component renders an exact replica of your railway network SVG map.

## Files Included

1. **RailwayMap.jsx** - The main React component
2. **RailwayMap.css** - Styles for the railway map
3. **App.jsx** - Example usage of the component
4. **App.css** - App-level styles
5. **railway_map_data.json** - Extracted data from your SVG

## Features

- **Exact replica**: All 92 railway line segments with precise coordinates
- **11 Railway stations** with names and positions:
  - Jaipur Junction
  - Bais Godam (BSGD)
  - Dahar Ka Balaji (DKBJ)
  - Gandhinagar Jaipur (GADJ)
  - Durgapura (DPA)
  - Kanakpura
  - Getor Jagatpura (GTJT)
  - Nindhar Benar (NDH)
  - Sanganer (SNGN)
  - Khatipura (KWP)
  - Bindayaka (BDYK)

- **Interactive elements**: Hover effects on stations
- **Responsive design**: Works on desktop and mobile
- **Scrollable**: Large map can be scrolled horizontally and vertically

## Installation

1. Copy the files to your React project
2. Import the component in your App.js or desired component
3. Make sure to import the CSS file for proper styling

## Usage

```jsx
import React from 'react';
import RailwayMap from './RailwayMap';
import './RailwayMap.css';

function App() {
  return (
    <div>
      <RailwayMap />
    </div>
  );
}

export default App;
```

## Customization

You can customize the appearance by modifying:
- Railway line colors and thickness in the `stroke` and `strokeWidth` attributes
- Station marker colors and sizes by changing the `fill` and `r` attributes
- Text styling by modifying the `fontSize`, `fontWeight`, and `fill` attributes
- Add click handlers to stations for interactivity

## Original SVG Dimensions

- Width: 10593px
- Height: 843px  
- ViewBox: -0.5 -0.5 10593 843

The component maintains these exact dimensions to ensure pixel-perfect accuracy.
