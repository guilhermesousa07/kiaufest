import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createVenue(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090612);
  scene.fog = new THREE.Fog(0x090612, 24, 65);
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 200);
  camera.position.set(17, 15, 22);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0x9f8aff, 0x171020, 2));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(8, 18, 10); key.castShadow = true; scene.add(key);
  const cyanLight = new THREE.PointLight(0x22d3ee, 45, 28); cyanLight.position.set(-8, 7, -8); scene.add(cyanLight);
  const pinkLight = new THREE.PointLight(0xec4899, 50, 25); pinkLight.position.set(8, 6, 4); scene.add(pinkLight);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(42, 32), new THREE.MeshStandardMaterial({color:0x151020, roughness:.9}));
  ground.rotation.x = -Math.PI/2; ground.position.y = -.12; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(42, 42, 0x5b2b87, 0x2c2040); grid.position.y = -.1; scene.add(grid);

  const mat = (color, emissive = 0x000000, intensity = 0) => new THREE.MeshStandardMaterial({color, roughness:.48, metalness:.25, emissive, emissiveIntensity:intensity});
  const addBox = (name, x,y,z, sx,sy,sz, material, clickable=true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
    mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.label = name;
    scene.add(mesh); if(clickable) pickables.push(mesh); return mesh;
  };
  const pickables = [];
  addBox('PALCO PRINCIPAL', 0, 1.15, -10, 12, 2.3, 3, mat(0x241047,0x8b5cf6,1.2));
  addBox('TELÃO LED', 0, 3.4, -11.35, 8, 2.2, .22, mat(0x102b45,0x22d3ee,2));
  addBox('PISTA', 0, .12, 0, 18, .22, 13, mat(0x27164a,0x6d28d9,.45));
  addBox('ÁREA VIP', -13, .5, -1, 5, 1, 9, mat(0x4b1740,0xec4899,.8));
  addBox('CAMAROTE', 13, .7, -1, 5, 1.4, 9, mat(0x153b4a,0x22d3ee,.7));
  addBox('BAR', -13, .55, 9, 5, 1.1, 3, mat(0x493512,0xfbbf24,.7));
  addBox('ENTRADA', 0, .55, 14, 7, 1.1, 2, mat(0x193a34,0x34d399,.7));
  for(let i=0;i<7;i++){
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,9,8),mat(i%2?0x22d3ee:0xec4899,i%2?0x22d3ee:0xec4899,2));
    beam.position.set(-8+i*2.65,4,-10); scene.add(beam);
  }
  for(let i=0;i<30;i++){
    const x=(Math.random()-.5)*16, z=(Math.random()-.5)*10;
    const person=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.5,7),mat(i%3?0x8b5cf6:0x22d3ee));
    person.position.set(x,.38,z); scene.add(person);
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.maxPolarAngle = Math.PI/2.05; controls.minDistance = 8; controls.maxDistance = 45;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const tooltip = document.createElement('div');
  tooltip.style.cssText = 'position:absolute;left:16px;bottom:16px;padding:10px 13px;background:#100b1ddd;border:1px solid #8b5cf6;color:#fff;border-radius:5px;font:11px DM Sans,sans-serif;pointer-events:none';
  tooltip.textContent = 'Selecione um setor do espaço';
  container.appendChild(tooltip);
  renderer.domElement.addEventListener('pointerdown', event => {
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
    pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(pickables)[0];
    if(hit) tooltip.textContent=hit.object.userData.label;
  });
  let customModel = null;
  function loadModel(url) {
    return new Promise((resolve,reject)=>{
      new GLTFLoader().load(url, gltf=>{
        if(customModel) scene.remove(customModel);
        customModel=gltf.scene;
        const box=new THREE.Box3().setFromObject(customModel);
        const size=box.getSize(new THREE.Vector3());
        const scale=18/Math.max(size.x,size.y,size.z);
        customModel.scale.setScalar(scale);
        const center=box.getCenter(new THREE.Vector3());
        customModel.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
        scene.add(customModel); resolve();
      },undefined,reject);
    });
  }
  function resize(){const w=container.clientWidth,h=container.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  let frame;
  function animate(){frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);}
  animate();
  return {
    reset(){camera.position.set(17,15,22);controls.target.set(0,0,0);controls.update();},
    toggle(){camera.position.set(0,34,.1);controls.target.set(0,0,0);controls.update();},
    loadModel,
    destroy(){cancelAnimationFrame(frame);observer.disconnect();renderer.dispose();}
  };
}
