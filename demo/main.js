import { DxfViewer } from 'dxf-viewer'
import * as THREE from 'three'

window.THREE = THREE

class DxfViewerApp {
    constructor() {
        this.viewer = null
        this.currentTool = 'none'
        this.selectionStart = null
        this.regionBox = null
        this.entities = []
        this.highlightObjects = []

        this.init()
    }

    init() {
        const container = document.getElementById('viewer')

        this.viewer = new DxfViewer(container, {
            autoResize: true,
            clearColor: new THREE.Color('#2c3e50'),
            colorCorrection: true,
            retainParsedDxf: true
        })

        this.setupEventListeners()
        this.checkUrlParameter()
    }

    setupEventListeners() {
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click()
        })

        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0]
            if (file) {
                this.loadDxfFile(file)
            }
        })

        document.getElementById('loadUrlBtn').addEventListener('click', () => {
            const url = document.getElementById('urlInput').value.trim()
            if (url) {
                this.loadDxfUrl(url)
            }
        })

        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const url = e.target.value.trim()
                if (url) {
                    this.loadDxfUrl(url)
                }
            }
        })

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTool(e.target.dataset.tool)
            })
        })

        this.viewer.Subscribe('pointerdown', (e) => this.onPointerDown(e))
        this.viewer.Subscribe('pointermove', (e) => this.onPointerMove(e))
        this.viewer.Subscribe('pointerup', (e) => this.onPointerUp(e))
        this.viewer.Subscribe('loaded', () => this.onDxfLoaded())
    }

    setTool(tool) {
        this.currentTool = tool

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool)
        })

        this.hideSelectionInfo()

        if (tool === 'region') {
            document.getElementById('viewer').style.cursor = 'crosshair'
        } else {
            document.getElementById('viewer').style.cursor = 'default'
        }
    }

    async loadDxfFile(file) {
        const url = URL.createObjectURL(file)
        await this.loadDxfUrl(url)
        URL.revokeObjectURL(url)
    }

    async loadDxfUrl(url) {
        this.showLoading('Loading DXF file...')

        try {
            await this.viewer.Load({
                url: url,
                fonts: [],
                progressCbk: (phase, processed, total) => {
                    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0
                    this.updateLoading(`${phase}: ${percentage}%`)
                }
            })

            this.hideLoading()
        } catch (error) {
            console.error('Error loading DXF:', error)
            this.hideLoading()
            alert('Error loading DXF file: ' + error.message)
        }
    }

    onDxfLoaded() {
        this.updateLayersList()
        this.extractEntities()
    }

    extractEntities() {
        this.entities = []
        const dxf = this.viewer.GetDxf()

        if (!dxf || !dxf.entities) {
            console.warn('No DXF entities found')
            return
        }

        console.log('Total DXF entities:', dxf.entities.length)

        for (const entity of dxf.entities) {
            if (entity.type === 'LINE' && entity.vertices && entity.vertices.length >= 2) {
                this.entities.push({
                    type: 'line',
                    start: entity.vertices[0],
                    end: entity.vertices[1],
                    layer: entity.layer
                })
            } else if (entity.type === 'CIRCLE' && entity.center && entity.radius) {
                this.entities.push({
                    type: 'circle',
                    center: entity.center,
                    radius: entity.radius,
                    layer: entity.layer
                })
            } else if (entity.type === 'ARC' && entity.center && entity.radius) {
                this.entities.push({
                    type: 'arc',
                    center: entity.center,
                    radius: entity.radius,
                    startAngle: entity.startAngle,
                    endAngle: entity.endAngle,
                    layer: entity.layer
                })
            } else if ((entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') && entity.vertices) {
                this.entities.push({
                    type: 'polyline',
                    vertices: entity.vertices,
                    layer: entity.layer
                })
            }
        }

        console.log('Extracted entities:', {
            lines: this.entities.filter(e => e.type === 'line').length,
            circles: this.entities.filter(e => e.type === 'circle').length,
            arcs: this.entities.filter(e => e.type === 'arc').length,
            polylines: this.entities.filter(e => e.type === 'polyline').length,
            total: this.entities.length
        })
    }

    updateLayersList() {
        const layersList = document.getElementById('layersList')
        const layers = this.viewer.GetLayers(true)

        if (layers.length === 0) {
            layersList.innerHTML = '<p class="empty-state">No layers found</p>'
            return
        }

        layersList.innerHTML = ''

        layers.forEach(layer => {
            const layerItem = document.createElement('div')
            layerItem.className = 'layer-item'

            const checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            checkbox.className = 'layer-checkbox'
            checkbox.checked = true
            checkbox.addEventListener('change', (e) => {
                this.toggleLayer(layer.name, e.target.checked)
                layerItem.classList.toggle('inactive', !e.target.checked)
            })

            const colorBox = document.createElement('div')
            colorBox.className = 'layer-color'
            colorBox.style.backgroundColor = '#' + layer.color.toString(16).padStart(6, '0')

            const nameSpan = document.createElement('span')
            nameSpan.className = 'layer-name'
            nameSpan.textContent = layer.displayName || layer.name

            layerItem.appendChild(checkbox)
            layerItem.appendChild(colorBox)
            layerItem.appendChild(nameSpan)
            layersList.appendChild(layerItem)
        })
    }

    toggleLayer(layerName, show) {
        this.viewer.ShowLayer(layerName, show)
    }

    onPointerDown(e) {
        const pos = e.detail.position

        if (this.currentTool === 'line') {
            this.selectLine(pos)
        } else if (this.currentTool === 'hole') {
            this.selectHole(pos)
        } else if (this.currentTool === 'region') {
            this.startRegionSelection(e.detail.canvasCoord)
        }
    }

    onPointerMove(e) {
        if (this.currentTool === 'region' && this.selectionStart) {
            this.updateRegionSelection(e.detail.canvasCoord)
        }
    }

    onPointerUp(e) {
        if (this.currentTool === 'region' && this.selectionStart) {
            this.endRegionSelection(e.detail.position)
        }
    }

    selectLine(clickPos) {
        const threshold = this.getSelectionThreshold()
        let closestLine = null
        let minDistance = threshold

        console.log('Line selection - Click pos:', clickPos, 'Threshold:', threshold)
        console.log('Available lines:', this.entities.filter(e => e.type === 'line').length)

        for (const entity of this.entities) {
            if (entity.type === 'line') {
                const dist = this.pointToLineDistance(clickPos, entity.start, entity.end)
                if (dist < minDistance) {
                    minDistance = dist
                    closestLine = entity
                }
            }
        }

        if (closestLine) {
            console.log('Selected line:', closestLine)
            const length = this.calculateDistance(closestLine.start, closestLine.end)

            this.highlightLine(closestLine.start, closestLine.end)

            this.showSelectionInfo({
                type: 'Line',
                dimensions: {
                    'Length': length.toFixed(3),
                    'Start X': closestLine.start.x.toFixed(3),
                    'Start Y': closestLine.start.y.toFixed(3),
                    'End X': closestLine.end.x.toFixed(3),
                    'End Y': closestLine.end.y.toFixed(3)
                }
            })
        } else {
            console.log('No line found within threshold')
        }
    }

    selectHole(clickPos) {
        const threshold = this.getSelectionThreshold()

        console.log('Hole selection - Click pos:', clickPos, 'Threshold:', threshold)
        console.log('Available circles:', this.entities.filter(e => e.type === 'circle').length)

        for (const entity of this.entities) {
            if (entity.type === 'circle' || entity.type === 'arc') {
                const dist = this.calculateDistance(clickPos, entity.center)
                console.log('Circle check - dist:', dist, 'radius:', entity.radius)

                if (Math.abs(dist - entity.radius) < threshold || dist < entity.radius) {
                    console.log('Selected circle/hole:', entity)

                    this.highlightCircle(entity.center, entity.radius)

                    this.showSelectionInfo({
                        type: entity.type === 'arc' ? 'Arc' : 'Circle/Hole',
                        dimensions: {
                            'Diameter': (entity.radius * 2).toFixed(3),
                            'Radius': entity.radius.toFixed(3),
                            'Center X': entity.center.x.toFixed(3),
                            'Center Y': entity.center.y.toFixed(3),
                            'Area': (Math.PI * entity.radius * entity.radius).toFixed(3)
                        }
                    })
                    return
                }
            }
        }
        console.log('No circle/hole found within threshold')
    }

    startRegionSelection(canvasCoord) {
        this.selectionStart = canvasCoord
        this.regionBox = document.getElementById('regionSelector')
        this.regionBox.classList.remove('hidden')
        this.updateRegionBox(canvasCoord, canvasCoord)
    }

    updateRegionSelection(canvasCoord) {
        if (this.selectionStart) {
            this.updateRegionBox(this.selectionStart, canvasCoord)
        }
    }

    endRegionSelection(endPos) {
        if (!this.selectionStart) return

        const startPos = this.viewer._CanvasToSceneCoord(this.selectionStart.x, this.selectionStart.y)

        const minX = Math.min(startPos.x, endPos.x)
        const maxX = Math.max(startPos.x, endPos.x)
        const minY = Math.min(startPos.y, endPos.y)
        const maxY = Math.max(startPos.y, endPos.y)

        const entitiesInRegion = this.entities.filter(entity => {
            return this.isEntityInRegion(entity, minX, maxX, minY, maxY)
        })

        const width = maxX - minX
        const height = maxY - minY
        const area = width * height

        this.highlightRegion(minX, maxX, minY, maxY)

        this.showSelectionInfo({
            type: 'Region',
            dimensions: {
                'Width': width.toFixed(3),
                'Height': height.toFixed(3),
                'Area': area.toFixed(3),
                'Entities': entitiesInRegion.length
            }
        })

        this.regionBox.classList.add('hidden')
        this.selectionStart = null
    }

    updateRegionBox(start, end) {
        const left = Math.min(start.x, end.x)
        const top = Math.min(start.y, end.y)
        const width = Math.abs(end.x - start.x)
        const height = Math.abs(end.y - start.y)

        this.regionBox.style.left = left + 'px'
        this.regionBox.style.top = top + 'px'
        this.regionBox.style.width = width + 'px'
        this.regionBox.style.height = height + 'px'
    }

    isEntityInRegion(entity, minX, maxX, minY, maxY) {
        if (entity.type === 'line') {
            return this.isPointInRegion(entity.start, minX, maxX, minY, maxY) ||
                   this.isPointInRegion(entity.end, minX, maxX, minY, maxY)
        } else if (entity.type === 'circle') {
            return this.isPointInRegion(entity.center, minX, maxX, minY, maxY)
        } else if (entity.type === 'polyline') {
            return entity.vertices.some(v => this.isPointInRegion(v, minX, maxX, minY, maxY))
        }
        return false
    }

    isPointInRegion(point, minX, maxX, minY, maxY) {
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
    }

    showSelectionInfo(info) {
        const panel = document.getElementById('selectionInfo')
        const display = document.getElementById('dimensionsDisplay')

        let html = `<div class="dimension-row">
            <span class="dimension-label">Type:</span>
            <span class="dimension-value">${info.type}</span>
        </div>`

        for (const [key, value] of Object.entries(info.dimensions)) {
            html += `<div class="dimension-row">
                <span class="dimension-label">${key}:</span>
                <span class="dimension-value">${value}</span>
            </div>`
        }

        display.innerHTML = html
        panel.classList.remove('hidden')
    }

    hideSelectionInfo() {
        document.getElementById('selectionInfo').classList.add('hidden')
        this.clearHighlight()
    }

    clearHighlight() {
        const scene = this.viewer.GetScene()
        for (const obj of this.highlightObjects) {
            scene.remove(obj)
            if (obj.geometry) obj.geometry.dispose()
            if (obj.material) obj.material.dispose()
        }
        this.highlightObjects = []
        this.viewer.Render()
    }

    highlightLine(start, end) {
        this.clearHighlight()

        const scene = this.viewer.GetScene()
        const origin = this.viewer.GetOrigin()

        const points = [
            new THREE.Vector3(start.x - origin.x, start.y - origin.y, 0),
            new THREE.Vector3(end.x - origin.x, end.y - origin.y, 0)
        ]

        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            linewidth: 3,
            depthTest: false,
            depthWrite: false
        })

        const line = new THREE.Line(geometry, material)
        line.renderOrder = 999
        scene.add(line)
        this.highlightObjects.push(line)

        const pointGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(start.x - origin.x, start.y - origin.y, 0),
            new THREE.Vector3(end.x - origin.x, end.y - origin.y, 0)
        ])
        const pointMaterial = new THREE.PointsMaterial({
            color: 0x00ff00,
            size: 8,
            sizeAttenuation: false,
            depthTest: false,
            depthWrite: false
        })
        const points3d = new THREE.Points(pointGeometry, pointMaterial)
        points3d.renderOrder = 1000
        scene.add(points3d)
        this.highlightObjects.push(points3d)

        this.viewer.Render()
    }

    highlightCircle(center, radius) {
        this.clearHighlight()

        const scene = this.viewer.GetScene()
        const origin = this.viewer.GetOrigin()

        const segments = 64
        const geometry = new THREE.BufferGeometry()
        const positions = []

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const x = center.x - origin.x + Math.cos(angle) * radius
            const y = center.y - origin.y + Math.sin(angle) * radius
            positions.push(x, y, 0)
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

        const material = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            linewidth: 3,
            depthTest: false,
            depthWrite: false
        })

        const circle = new THREE.Line(geometry, material)
        circle.renderOrder = 999
        scene.add(circle)
        this.highlightObjects.push(circle)

        const centerPointGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(center.x - origin.x, center.y - origin.y, 0)
        ])
        const centerPointMaterial = new THREE.PointsMaterial({
            color: 0xff0000,
            size: 10,
            sizeAttenuation: false,
            depthTest: false,
            depthWrite: false
        })
        const centerPoint = new THREE.Points(centerPointGeometry, centerPointMaterial)
        centerPoint.renderOrder = 1000
        scene.add(centerPoint)
        this.highlightObjects.push(centerPoint)

        this.viewer.Render()
    }

    highlightRegion(minX, maxX, minY, maxY) {
        this.clearHighlight()

        const scene = this.viewer.GetScene()
        const origin = this.viewer.GetOrigin()

        const points = [
            new THREE.Vector3(minX - origin.x, minY - origin.y, 0),
            new THREE.Vector3(maxX - origin.x, minY - origin.y, 0),
            new THREE.Vector3(maxX - origin.x, maxY - origin.y, 0),
            new THREE.Vector3(minX - origin.x, maxY - origin.y, 0),
            new THREE.Vector3(minX - origin.x, minY - origin.y, 0)
        ]

        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({
            color: 0x00bfff,
            linewidth: 2,
            depthTest: false,
            depthWrite: false
        })

        const box = new THREE.Line(geometry, material)
        box.renderOrder = 999
        scene.add(box)
        this.highlightObjects.push(box)

        const fillGeometry = new THREE.BufferGeometry()
        fillGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
            minX - origin.x, minY - origin.y, 0,
            maxX - origin.x, minY - origin.y, 0,
            maxX - origin.x, maxY - origin.y, 0,
            minX - origin.x, maxY - origin.y, 0
        ], 3))
        fillGeometry.setIndex([0, 1, 2, 0, 2, 3])

        const fillMaterial = new THREE.MeshBasicMaterial({
            color: 0x00bfff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
        })

        const fill = new THREE.Mesh(fillGeometry, fillMaterial)
        fill.renderOrder = 998
        scene.add(fill)
        this.highlightObjects.push(fill)

        this.viewer.Render()
    }

    calculateDistance(p1, p2) {
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x
        const B = point.y - lineStart.y
        const C = lineEnd.x - lineStart.x
        const D = lineEnd.y - lineStart.y

        const dot = A * C + B * D
        const lenSq = C * C + D * D
        let param = -1

        if (lenSq != 0) {
            param = dot / lenSq
        }

        let xx, yy

        if (param < 0) {
            xx = lineStart.x
            yy = lineStart.y
        } else if (param > 1) {
            xx = lineEnd.x
            yy = lineEnd.y
        } else {
            xx = lineStart.x + param * C
            yy = lineStart.y + param * D
        }

        const dx = point.x - xx
        const dy = point.y - yy
        return Math.sqrt(dx * dx + dy * dy)
    }

    getSelectionThreshold() {
        const camera = this.viewer.GetCamera()
        const viewWidth = camera.right - camera.left
        return viewWidth * 0.02
    }

    showLoading(text) {
        document.getElementById('loadingText').textContent = text
        document.getElementById('loading').classList.remove('hidden')
    }

    updateLoading(text) {
        document.getElementById('loadingText').textContent = text
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden')
    }

    checkUrlParameter() {
        const urlParams = new URLSearchParams(window.location.search)
        const dxfUrl = urlParams.get('dxfUrl')

        if (dxfUrl) {
            document.getElementById('urlInput').value = dxfUrl
            this.loadDxfUrl(dxfUrl)
        }
    }
}

new DxfViewerApp()
