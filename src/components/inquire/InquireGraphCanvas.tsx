/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Imperative three.js canvas (no @react-three/fiber) to avoid MUI TS2590
 * from R3F's global JSX.IntrinsicElements augmentation.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { layoutInquireGraph } from './inquireGraphLayout';
import { t } from '../../utils/translations';
import type {
  InquireGraphEdge,
  InquireGraphNode,
} from '../../types/inquire';

interface Props {
  nodes: InquireGraphNode[];
  edges: InquireGraphEdge[];
  pathNodeIds: string[];
  currentLanguage: string;
  selectedId: string | null;
  onSelectNode: (node: InquireGraphNode) => void;
  empty: boolean;
  loading?: boolean;
}

type NodeUserData = {
  node: InquireGraphNode;
  baseRadius: number;
};

const InquireGraphCanvas: React.FC<Props> = ({
  nodes,
  edges,
  pathNodeIds,
  currentLanguage,
  selectedId,
  onSelectNode,
  empty,
  loading,
}) => {
  const theme = useTheme();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoverLabel, setHoverLabel] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const questionColor = theme.palette.primary.main;
  const answerColor =
    theme.palette.mode === 'dark'
      ? theme.palette.grey[400]
      : theme.palette.secondary.main;
  const pathColor = theme.palette.warning.main;
  const mutedColor =
    theme.palette.mode === 'dark'
      ? theme.palette.grey[600]
      : theme.palette.grey[400];
  const bg =
    theme.palette.mode === 'dark' ? '#12141a' : theme.palette.grey[100];

  const positions = useMemo(
    () => layoutInquireGraph(nodes, edges, pathNodeIds),
    [nodes, edges, pathNodeIds]
  );

  const onSelectRef = useRef(onSelectNode);
  onSelectRef.current = onSelectNode;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  useEffect(() => {
    if (empty) return;
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 4, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(6, 8, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.25);
    fill.position.set(-4, 2, -6);
    scene.add(fill);

    // Boş uzay yerine hafif yıldız alanı — 3B derinlik hissi (kartezyen ızgara yok)
    const starCount = 900;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starPositions[i * 3] = (Math.random() - 0.5) * 90;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3)
    );
    const starsMat = new THREE.PointsMaterial({
      color: theme.palette.mode === 'dark' ? 0x9aa8bf : 0x6a7388,
      size: 0.055,
      sizeAttenuation: true,
      transparent: true,
      opacity: theme.palette.mode === 'dark' ? 0.75 : 0.55,
      depthWrite: false,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    scene.fog = new THREE.FogExp2(
      new THREE.Color(bg).getHex(),
      theme.palette.mode === 'dark' ? 0.018 : 0.012
    );

    const meshById = new Map<string, THREE.Mesh>();
    const clickable: THREE.Object3D[] = [];

    edges.forEach(e => {
      const a = positions.get(e.from);
      const b = positions.get(e.to);
      if (!a || !b) return;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(a.x, a.y, a.z),
        new THREE.Vector3(b.x, b.y, b.z),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: e.onPath ? pathColor : mutedColor,
        transparent: true,
        opacity: e.onPath ? 0.95 : 0.45,
      });
      scene.add(new THREE.Line(geo, mat));
    });

    nodes.forEach(node => {
      const p = positions.get(node.id);
      if (!p) return;
      const isQuestion = node.contentType === 'question';
      const radius = isQuestion ? 0.42 : 0.22;
      const color = isQuestion ? questionColor : answerColor;
      const geo = new THREE.SphereGeometry(radius, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: node.onPath ? 1 : 0.55,
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.userData = { node, baseRadius: radius } satisfies NodeUserData;
      scene.add(mesh);
      meshById.set(node.id, mesh);
      clickable.push(mesh);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredId: string | null = null;
    let frame = 0;
    let disposed = false;

    const setEmissive = (id: string | null, intensity: number) => {
      if (!id) return;
      const mesh = meshById.get(id);
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const data = mesh.userData as NodeUserData;
      const isQ = data.node.contentType === 'question';
      mat.emissive = new THREE.Color(isQ ? questionColor : answerColor);
      mat.emissiveIntensity = intensity;
      const scale = intensity > 0 ? 1.15 : 1;
      mesh.scale.setScalar(scale);
    };

    const syncSelection = () => {
      meshById.forEach((mesh, id) => {
        const selected = selectedRef.current === id;
        const hovered = hoveredId === id;
        setEmissive(id, selected ? 0.35 : hovered ? 0.2 : 0);
        if (!selected && !hovered) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0;
          mesh.scale.setScalar(1);
        }
      });
    };

    const onPointerMove = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickable, false);
      const nextId = hits[0]
        ? (hits[0].object.userData as NodeUserData).node.id
        : null;
      if (nextId !== hoveredId) {
        hoveredId = nextId;
        syncSelection();
        renderer.domElement.style.cursor = nextId ? 'pointer' : 'default';
      }
      if (hits[0]) {
        const data = hits[0].object.userData as NodeUserData;
        setHoverLabel({
          text: data.node.label,
          x: ev.clientX - rect.left,
          y: ev.clientY - rect.top - 18,
        });
      } else {
        setHoverLabel(null);
      }
    };

    const onClick = (ev: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickable, false);
      if (!hits[0]) return;
      const data = hits[0].object.userData as NodeUserData;
      onSelectRef.current(data.node);
    };

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || 640;
      const h = mount.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      syncSelection();
      controls.update();
      renderer.render(scene, camera);
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      scene.traverse(obj => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.Line ||
          obj instanceof THREE.Points
        ) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach(m => m.dispose());
          else mat?.dispose();
        }
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      setHoverLabel(null);
    };
  }, [
    empty,
    nodes,
    edges,
    positions,
    bg,
    questionColor,
    answerColor,
    pathColor,
    mutedColor,
    theme.palette.mode,
  ]);

  if (empty) {
    return (
      <Box
        component="div"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor={bg}
        borderRadius={1}
        px={3}
      >
        <Typography color="text.secondary" align="center">
          {loading ? '…' : t('inquire_empty_graph', currentLanguage)}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="div"
      height="100%"
      minHeight={420}
      borderRadius={1}
      overflow="hidden"
      bgcolor={bg}
      position="relative"
    >
      <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: 420 }} />
      {hoverLabel && (
        <div
          style={{
            position: 'absolute',
            left: hoverLabel.x,
            top: hoverLabel.y,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(20,20,24,0.88)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            maxWidth: 180,
            pointerEvents: 'none',
            lineHeight: 1.3,
            zIndex: 1,
          }}
        >
          {hoverLabel.text}
        </div>
      )}
    </Box>
  );
};

export default InquireGraphCanvas;
