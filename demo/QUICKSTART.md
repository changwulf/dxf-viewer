# Quick Start Guide

## Installation & Running

### Development Mode

```bash
cd demo
npm install
npm run dev
```

The application will automatically open at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## How to Use

### 1. Load a DXF File

Three ways to load DXF files:

**Option A: Upload Local File**
- Click the "Upload DXF" button
- Select a .dxf file from your computer

**Option B: Load from URL**
- Enter the DXF file URL in the input field
- Click "Load" button (or press Enter)

**Option C: URL Parameter**
- Add `?dxfUrl=<your-url>` to the page URL
- Example: `http://localhost:3000?dxfUrl=https://example.com/drawing.dxf`

### 2. Select Measurement Tools

Click on the tool buttons to activate different selection modes:

**Line Tool**
- Click near any line in the drawing
- View: Length, Start coordinates, End coordinates

**Hole Tool**
- Click on or near any circle
- View: Diameter, Radius, Center coordinates, Area

**Region Tool**
- Click and drag to create a selection box
- View: Width, Height, Area, Number of entities in region

**None**
- Default mode for pan and zoom
- Left mouse: Pan
- Mouse wheel: Zoom

### 3. Manage Layers

Use the left sidebar to control layer visibility:

- Check/uncheck layers to show/hide them
- Each layer displays its color and name
- Hidden layers are grayed out

## Keyboard Shortcuts

- **Enter** in URL field: Load DXF from URL

## Tips

1. **For Region Selection**:
   - Click and hold left mouse button
   - Drag to create selection area
   - Release to see measurements

2. **Finding Entities**:
   - Use the layer panel to isolate specific layers
   - Hide unwanted layers for easier selection

3. **Measurement Accuracy**:
   - All measurements use DXF coordinate system
   - Values are displayed with 3 decimal places

## Troubleshooting

**Problem: DXF file won't load**
- Ensure the file is a valid DXF format
- Check if URL is accessible (for remote files)
- Check browser console for error messages

**Problem: Can't select entities**
- Make sure you've selected the correct tool (Line/Hole/Region)
- Try zooming in closer to the entity
- Check if the entity's layer is visible

**Problem: Selection not working**
- Click closer to the entity
- For lines: click directly on or very close to the line
- For circles: click on the circumference or inside the circle

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL support.
