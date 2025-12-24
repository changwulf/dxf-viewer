# DXF Viewer Demo

A comprehensive DXF viewer application with interactive selection tools and layer management.

## Features

### 1. File Loading
- **Upload DXF Files**: Click "Upload DXF" button to select and load local DXF files
- **Load from URL**: Enter a DXF file URL and click "Load" to fetch and display remote files
- **URL Parameter**: Add `?dxfUrl=<your-url>` to the page URL to auto-load a DXF file

### 2. Selection Tools

#### Line Tool
- Click near any line to select it
- Displays:
  - Line length
  - Start point coordinates (X, Y)
  - End point coordinates (X, Y)

#### Hole Tool
- Click on or near circular features (circles/arcs)
- Displays:
  - Diameter
  - Radius
  - Center coordinates (X, Y)
  - Area

#### Region Tool
- Click and drag to select a rectangular region
- Displays:
  - Region width
  - Region height
  - Total area
  - Number of entities within the region

### 3. Layer Management
- View all layers in the DXF file
- Each layer shows:
  - Layer color indicator
  - Layer name
  - Visibility checkbox
- Toggle layer visibility by clicking the checkbox

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The application will open at `http://localhost:3000`

## Build

```bash
npm run build
```

## Usage

1. **Load a DXF file** using one of the methods:
   - Upload a local file
   - Enter a URL
   - Use URL parameter: `?dxfUrl=https://example.com/file.dxf`

2. **Select a tool** from the toolbar:
   - **Line**: Click near lines to measure length
   - **Hole**: Click on circles to measure diameter
   - **Region**: Click and drag to select an area
   - **None**: Default pan/zoom mode

3. **Manage layers** using the left sidebar:
   - Check/uncheck layers to show/hide them
   - Layer colors indicate the original DXF layer colors

## Technical Details

### Selection Logic

**Line Selection:**
- Calculates the perpendicular distance from click point to each line
- Selects the closest line within threshold
- Computes Euclidean distance between endpoints

**Hole Selection:**
- Checks distance from click point to circle center
- Selects if click is near circumference or inside circle
- Calculates diameter, area using radius

**Region Selection:**
- Creates a bounding box from drag start to end points
- Finds all entities with vertices inside the box
- Calculates region dimensions and area

### Dimension Calculations

All dimensions are extracted from the DXF coordinate system:
- **Length**: `√((x₂-x₁)² + (y₂-y₁)²)`
- **Diameter**: `2 × radius`
- **Area (circle)**: `π × radius²`
- **Area (region)**: `width × height`

## Browser Compatibility

- Modern browsers with WebGL support
- Chrome, Firefox, Safari, Edge (latest versions)

## License

MPL-2.0
