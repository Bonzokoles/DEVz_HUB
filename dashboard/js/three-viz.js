/* ============================================================
   JIMBO HQ — Three.js 3D Library Visualization
   Three.js r128 loaded from CDN in index.html
   ============================================================ */

var _threeScriptLoaded = false;

function initThreeViz() {
  if (window._threeInitialized) return;

  var container = document.getElementById('three-canvas-container');
  if (!container) return;

  // Load Three.js from CDN if not present
  if (typeof THREE === 'undefined') {
    if (_threeScriptLoaded) {
      // Already tried, fallback to treemap
      container.innerHTML = '<div style="text-align:center;padding:60px;color:#ff0066">Three.js failed to load. Use Tree Map view.</div>';
      return;
    }
    _threeScriptLoaded = true;
    container.innerHTML = '<div style="text-align:center;padding:60px;color:#00d9ff">⏳ Loading Three.js...</div>';

    var script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script1.crossOrigin = 'anonymous';
    script1.onload = function() {
      var script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
      script2.crossOrigin = 'anonymous';
      script2.onload = function() { buildScene(container); };
      script2.onerror = function() { buildScene(container); }; // OrbitControls optional
      document.head.appendChild(script2);
    };
    script1.onerror = function() {
      container.innerHTML = '<div style="text-align:center;padding:60px;color:#ff0066">Three.js CDN unreachable. Use Tree Map view.</div>';
    };
    document.head.appendChild(script1);
    return;
  }

  buildScene(container);
}

function buildScene(container) {
  if (typeof THREE === 'undefined') return;
  window._threeInitialized = true;
  container.innerHTML = '';

  var d = JIMBO.data;

  // Scene
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090f, 0.012);

  // Camera
  var w = container.clientWidth, h = container.clientHeight;
  var camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
  camera.position.set(0, 8, 32);

  // Renderer
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Controls
  var controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 55;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
  }

  // Lighting
  scene.add(new THREE.AmbientLight(0x404040, 0.5));
  var L1 = new THREE.PointLight(0x00ff88, 1.2, 100); L1.position.set(10, 10, 10); scene.add(L1);
  var L2 = new THREE.PointLight(0x00aaff, 0.8, 100); L2.position.set(-10, -10, 10); scene.add(L2);
  var L3 = new THREE.PointLight(0xaa00ff, 0.6, 80); L3.position.set(0, -15, -5); scene.add(L3);

  var interactiveObjects = [];

  // ---- Sphere factory ----
  function createGlowingSphere(data, size) {
    size = size || 2;
    var group = new THREE.Group();

    var geo = new THREE.SphereGeometry(size, 32, 32);
    var mat = new THREE.MeshStandardMaterial({
      color: data.color, emissive: data.color, emissiveIntensity: 0.3,
      metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.9
    });
    var sphere = new THREE.Mesh(geo, mat);
    sphere.userData = data;
    group.add(sphere);
    interactiveObjects.push(sphere);

    // Glow
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.2, 32, 32),
      new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.15, side: THREE.BackSide })
    ));
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.5, 32, 32),
      new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.05, side: THREE.BackSide })
    ));

    // Label
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = 512; canvas.height = 128;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Courier New';
    ctx.textAlign = 'center';
    var displayName = data.name.length > 22 ? data.name.substring(0, 22) + '..' : data.name;
    ctx.fillText(displayName, 256, 50);
    if (data.files > 0) {
      ctx.fillStyle = '#00ff88';
      ctx.font = '16px Courier New';
      ctx.fillText(data.files.toLocaleString() + ' files', 256, 80);
    }
    var texture = new THREE.CanvasTexture(canvas);
    var label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    label.position.y = size + 1.3;
    label.scale.set(6, 1.5, 1);
    group.add(label);

    group.position.set(data.position.x, data.position.y, data.position.z);
    return group;
  }

  function createMiniSphere(data, size) {
    size = size || 0.5;
    var hasFiles = (data.files || 0) > 0 || (data.indexed || 0) > 0;
    var mat = new THREE.MeshStandardMaterial({
      color: data.color, emissive: data.color,
      emissiveIntensity: hasFiles ? 0.5 : 0.1,
      metalness: 0.5, roughness: 0.3,
      transparent: true, opacity: hasFiles ? 0.8 : 0.3
    });
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), mat);
    sphere.userData = data;
    sphere.position.set(data.position.x, data.position.y, data.position.z);
    interactiveObjects.push(sphere);
    return sphere;
  }

  function createConnection(start, end, color, opacity) {
    var geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(start.x, start.y, start.z),
      new THREE.Vector3(end.x, end.y, end.z)
    ]);
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity || 0.3 }));
  }

  // ---- Particles ----
  var pGeo = new THREE.BufferGeometry();
  var pCount = 1500;
  var pPos = new Float32Array(pCount * 3);
  for (var i = 0; i < pCount * 3; i += 3) {
    pPos[i] = (Math.random() - 0.5) * 80;
    pPos[i+1] = (Math.random() - 0.5) * 50;
    pPos[i+2] = (Math.random() - 0.5) * 80;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x00ff88, size: 0.08, transparent: true, opacity: 0.4 }));
  scene.add(particles);

  // Grid
  var grid = new THREE.GridHelper(40, 20, 0x00ff88, 0x00ff88);
  grid.position.y = -16; grid.material.transparent = true; grid.material.opacity = 0.08;
  scene.add(grid);

  // ---- Build from data ----
  // Main libraries
  d.libraries.forEach(function(lib) {
    var sz = Math.max(1.2, Math.min(3, Math.sqrt(lib.files) * 0.4 + 1));
    scene.add(createGlowingSphere(lib, sz));
  });

  // Additional libraries
  d.additionalLibraries.forEach(function(lib) {
    var sz = Math.max(0.6, Math.min(2.5, Math.sqrt(lib.files) * 0.04 + 0.6));
    scene.add(createGlowingSphere(lib, sz));
  });

  // KB categories
  d.knowledgeBase.forEach(function(kb) {
    var sz = kb.files > 0 ? Math.max(0.4, Math.min(1.5, Math.sqrt(kb.files) * 0.025 + 0.4)) : 0.25;
    scene.add(createMiniSphere(kb, sz));
  });

  // ChromaDB
  var chromaData = {
    name: "ChromaDB Vector Store",
    color: 0xff00ff,
    files: d.chromaDB.totalDocs,
    description: 'Vector DB: ' + d.chromaDB.totalDocs + ' docs, ' + d.chromaDB.collections + ' collections, ' + (d.chromaDB.sizeGB * 1024).toFixed(1) + ' MB',
    subfolders: [d.chromaDB.activeCategories + ' active categories', d.chromaDB.collections + ' collections'],
    position: d.chromaDB.position
  };
  scene.add(createGlowingSphere(chromaData, 1.8));

  // Connections
  var center = { x: 0, y: 0, z: 0 };
  d.libraries.forEach(function(lib) { scene.add(createConnection(center, lib.position, lib.color)); });
  d.knowledgeBase.forEach(function(kb) {
    if (kb.files > 0) scene.add(createConnection(kb.position, d.chromaDB.position, 0xff00ff, 0.15));
  });

  // ---- Raycaster ----
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var hoveredObj = null;

  function onPointer(event) {
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(interactiveObjects);
    if (hits.length > 0) {
      var obj = hits[0].object;
      if (hoveredObj !== obj) {
        if (hoveredObj) hoveredObj.material.emissiveIntensity = hoveredObj.userData._origEI || 0.3;
        hoveredObj = obj;
        hoveredObj.userData._origEI = hoveredObj.material.emissiveIntensity;
        hoveredObj.material.emissiveIntensity = 0.8;
      }
      renderer.domElement.style.cursor = 'pointer';
      showInfoPanel3D(obj.userData);
    } else {
      if (hoveredObj) {
        hoveredObj.material.emissiveIntensity = hoveredObj.userData._origEI || 0.3;
        hoveredObj = null;
      }
      renderer.domElement.style.cursor = 'default';
    }
  }
  renderer.domElement.addEventListener('mousemove', onPointer);
  renderer.domElement.addEventListener('click', onPointer);

  // Resize
  window.addEventListener('resize', function() {
    var w2 = container.clientWidth, h2 = container.clientHeight;
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
  });

  // Animation
  var time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    if (controls) controls.update();
    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0002;
    interactiveObjects.forEach(function(obj, idx) {
      obj.position.y += Math.sin(time * 0.8 + idx * 0.5) * 0.001;
    });
    renderer.render(scene, camera);
  }
  animate();
  console.log('[JIMBO HQ] 3D scene ready — ' + interactiveObjects.length + ' objects');
}

// ---- Info panel for 3D ----
function showInfoPanel3D(data) {
  var panel = document.getElementById('infoPanel');
  if (!panel) return;
  panel.style.display = 'block';
  document.getElementById('panelTitle').textContent = data.name;
  document.getElementById('panelDesc').textContent = data.description || '';
  document.getElementById('statPanelFiles').textContent = (data.files || 0).toLocaleString();
  var subCount = Array.isArray(data.subfolders) ? data.subfolders.length : (data.subfolders || 0);
  document.getElementById('statPanelSubs').textContent = subCount;
  var typeLabel = data.group ? 'Main Library' : (data.indexed !== undefined ? 'KB: ' + data.indexed + ' indexed' : 'Library');
  document.getElementById('statPanelType').textContent = typeLabel;
  var listEl = document.getElementById('subfolderList');
  if (Array.isArray(data.subfolders) && data.subfolders.length > 0) {
    listEl.innerHTML = data.subfolders.map(function(s) { return '<div>' + s + '</div>'; }).join('');
  } else {
    listEl.innerHTML = '';
  }
}

// ---- TreeMap view & toggle ----
function set3DView(mode, btn) {
  // Clear sibling tab active states
  if (btn && btn.parentNode) {
    btn.parentNode.querySelectorAll('.tab').forEach(function(b) { b.classList.remove('active'); });
  }
  if (btn) btn.classList.add('active');

  var canvasC = document.getElementById('three-canvas-container');
  var treeC = document.getElementById('treemap-container');
  var info = document.getElementById('infoPanel');
  var legend = document.querySelector('.legend-panel');

  if (mode === 'tree') {
    canvasC.style.display = 'none';
    treeC.style.display = 'block';
    if (info) info.style.display = 'none';
    if (legend) legend.style.display = 'none';
    renderTreemap(treeC);
  } else {
    canvasC.style.display = '';
    treeC.style.display = 'none';
    if (legend) legend.style.display = '';
    if (!window._threeInitialized) initThreeViz();
  }
}

function renderTreemap(container) {
  var d = JIMBO.data;
  function hexStr(n) { return '#' + n.toString(16).padStart(6, '0'); }

  var groups = [
    { label: 'MAIN LIBRARIES', items: d.libraries.map(function(l) { return { name: l.name, files: l.files, color: hexStr(l.color), desc: l.description }; }) },
    { label: 'ADDITIONAL', items: d.additionalLibraries.map(function(l) { return { name: l.name, files: l.files, color: hexStr(l.color), desc: l.description }; }) },
    { label: 'KNOWLEDGE BASE', items: d.knowledgeBase.map(function(k) { return { name: k.name, files: k.files, indexed: k.indexed, color: hexStr(k.color), desc: k.description }; }) }
  ];

  container.innerHTML = groups.map(function(g) {
    return '<div style="margin-bottom:24px">' +
      '<div style="font:700 11px/1 var(--mono);color:#00ff88;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">' + g.label + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">' +
      g.items.map(function(item) {
        return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:12px;border-left:3px solid ' + item.color + ';opacity:' + (item.files > 0 ? 1 : 0.35) + '">' +
          '<div style="font:700 12px/1 var(--sans);color:#fff;margin-bottom:4px">' + item.name + '</div>' +
          '<div style="font:10px/1.3 var(--sans);color:#737373;margin-bottom:6px">' + (item.desc || '') + '</div>' +
          '<div style="display:flex;gap:12px;font:10px/1 var(--mono)">' +
            '<span style="color:' + item.color + '">' + item.files.toLocaleString() + ' files</span>' +
            (item.indexed ? '<span style="color:#ff00ff">' + item.indexed + ' indexed</span>' : '') +
          '</div></div>';
      }).join('') +
      '</div></div>';
  }).join('');
}
