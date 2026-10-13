import React, { useState, useMemo } from 'react';
import { Lock, Sparkles, Zap, ShieldCheck, CheckCircle2, Info, Compass } from 'lucide-react';
import { SkillNode, SkillCategory } from '../../types/skills';

interface SkillTreeGraphProps {
  nodes: Record<string, SkillNode>;
  totalSkillXp: number;
  highlightedSkillIds?: string[];
  onSelectNode?: (node: SkillNode) => void;
}

// Branch angle assignments (in radians)
const BRANCH_ANGLES: Record<string, number> = {
  systems: -Math.PI / 2,                  // North (Top)
  software: -Math.PI / 2 + (2 * Math.PI / 5), // North-East
  logic: -Math.PI / 2 + (4 * Math.PI / 5),    // South-East
  fortitude: -Math.PI / 2 + (6 * Math.PI / 5),// South-West
  cognitive: -Math.PI / 2 + (8 * Math.PI / 5) // North-West
};

// Branch Colors
const BRANCH_COLORS: Record<string, { primary: string; glow: string; label: string }> = {
  systems: { primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.6)', label: 'Systems & Computing' },
  software: { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.6)', label: 'Software Architecture' },
  logic: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)', label: 'Analytical Logic' },
  fortitude: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', label: 'Mental Fortitude' },
  cognitive: { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.6)', label: 'Cognitive Stamina' }
};

// Radii for tiers
const TIER_RADII = [0, 85, 160, 235, 300];

export const SkillTreeGraph: React.FC<SkillTreeGraphProps> = ({
  nodes,
  totalSkillXp,
  highlightedSkillIds = [],
  onSelectNode
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'hard' | 'soft'>('all');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const CENTER_X = 350;
  const CENTER_Y = 350;

  // Compute positions of all nodes in radial space
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; tier: number; angle: number }> = {};

    // Group nodes by branch and calculate depth
    Object.values(nodes).forEach(node => {
      const baseAngle = BRANCH_ANGLES[node.branch] ?? 0;
      
      // Determine tier by walking up parent chain
      let tier = 1;
      let curr = node;
      let parentCount = 0;
      while (curr.parentId && nodes[curr.parentId] && parentCount < 5) {
        tier++;
        curr = nodes[curr.parentId];
        parentCount++;
      }

      // Add small angular offset for sub-branches if needed
      const angleOffset = (tier === 3 ? 0.05 : tier === 4 ? -0.05 : 0);
      const angle = baseAngle + angleOffset;
      const radius = TIER_RADII[Math.min(tier, TIER_RADII.length - 1)];

      const x = CENTER_X + radius * Math.cos(angle);
      const y = CENTER_Y + radius * Math.sin(angle);

      positions[node.id] = { x, y, tier, angle };
    });

    return positions;
  }, [nodes]);

  const activeHoveredNode = hoveredNodeId ? nodes[hoveredNodeId] : null;
  const activeSelectedNode = selectedNodeId ? nodes[selectedNodeId] : null;
  const activeDetailNode = activeSelectedNode || activeHoveredNode;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      {/* Top Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={18} color="var(--accent-purple)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
            Radial Neural Skill Constellation
          </span>
          <span className="badge badge-flow" style={{ fontSize: '0.72rem' }}>
            {totalSkillXp} Total Skill XP
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFilterCategory('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterCategory === 'all' ? 'var(--gradient-neuro)' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff'
            }}
          >
            All Branches
          </button>
          <button
            onClick={() => setFilterCategory('hard')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterCategory === 'hard' ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff'
            }}
          >
            Hard Skills (Systems / Web / Logic)
          </button>
          <button
            onClick={() => setFilterCategory('soft')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: filterCategory === 'soft' ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff'
            }}
          >
            Soft Skills (Fortitude / Stamina)
          </button>
        </div>
      </div>

      {/* Main SVG Spider Graph Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        background: 'radial-gradient(circle at center, #0e122b 0%, #060814 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 0 80px rgba(0, 0, 0, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px 0'
      }}>
        <svg
          viewBox="0 0 700 700"
          style={{ width: '100%', maxWidth: '680px', height: 'auto', display: 'block' }}
        >
          <defs>
            {/* Ambient Center Glow Filter */}
            <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Node Unlocked Glow Filter */}
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Concentric Tier Web Rings */}
          {TIER_RADII.slice(1).map((r, i) => (
            <circle
              key={i}
              cx={CENTER_X}
              cy={CENTER_Y}
              r={r}
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="1.2"
              strokeDasharray="4 6"
            />
          ))}

          {/* Radial Branch Spokes */}
          {Object.entries(BRANCH_ANGLES).map(([branchKey, angle]) => {
            const bx = CENTER_X + 310 * Math.cos(angle);
            const by = CENTER_Y + 310 * Math.sin(angle);
            const branchColor = BRANCH_COLORS[branchKey]?.primary || '#ffffff';

            return (
              <g key={branchKey}>
                <line
                  x1={CENTER_X}
                  y1={CENTER_Y}
                  x2={bx}
                  y2={by}
                  stroke={branchColor}
                  strokeOpacity="0.15"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Connecting Hierarchy Lines between Parent and Child Nodes */}
          {Object.values(nodes).map(node => {
            if (!node.parentId || !nodePositions[node.parentId] || !nodePositions[node.id]) return null;

            const parentPos = nodePositions[node.parentId];
            const childPos = nodePositions[node.id];
            const isChildUnlocked = node.unlocked;
            const branchColor = BRANCH_COLORS[node.branch]?.primary || '#8b5cf6';

            // Check if filtered out
            if (filterCategory !== 'all' && node.category !== filterCategory) return null;

            return (
              <line
                key={`edge-${node.parentId}-${node.id}`}
                x1={parentPos.x}
                y1={parentPos.y}
                x2={childPos.x}
                y2={childPos.y}
                stroke={isChildUnlocked ? branchColor : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={isChildUnlocked ? 2.5 : 1}
                strokeDasharray={isChildUnlocked ? 'none' : '3 3'}
                strokeOpacity={isChildUnlocked ? 0.8 : 0.3}
              />
            );
          })}

          {/* Center User Core Hub */}
          <g>
            {/* Outer Pulsing Aura */}
            <circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={46}
              fill="none"
              stroke="rgba(139, 92, 246, 0.35)"
              strokeWidth="2"
              filter="url(#coreGlow)"
            />
            {/* Center Background Circle */}
            <circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={36}
              fill="#1e1b4b"
              stroke="#8b5cf6"
              strokeWidth="3"
            />
            {/* Center Icon & Label */}
            <text
              x={CENTER_X}
              y={CENTER_Y - 4}
              textAnchor="middle"
              fontSize="20"
              fill="#ffffff"
            >
              🧠
            </text>
            <text
              x={CENTER_X}
              y={CENTER_Y + 16}
              textAnchor="middle"
              fontSize="8"
              fontWeight="700"
              fill="#c4b5fd"
              fontFamily="var(--font-mono)"
            >
              PFC CORE
            </text>
          </g>

          {/* Interactive Skill Nodes */}
          {Object.values(nodes).map(node => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            // Apply category filter
            if (filterCategory !== 'all' && node.category !== filterCategory) return null;

            const isHovered = hoveredNodeId === node.id;
            const isSelected = selectedNodeId === node.id;
            const isHighlighted = highlightedSkillIds.includes(node.id);
            const branchConfig = BRANCH_COLORS[node.branch] || BRANCH_COLORS.systems;
            const isUnlocked = node.unlocked;

            const radius = isUnlocked ? (isHovered || isSelected ? 24 : 20) : 17;

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  onSelectNode?.(node);
                }}
              >
                {/* Outer Glow Halo for Unlocked / Hovered */}
                {isUnlocked && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + (isHovered ? 8 : 4)}
                    fill="none"
                    stroke={branchConfig.primary}
                    strokeWidth="1.5"
                    strokeOpacity={isHovered ? 0.9 : 0.4}
                    filter="url(#nodeGlow)"
                  />
                )}

                {/* Node Main Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={
                    isUnlocked
                      ? (isHovered || isSelected ? branchConfig.primary : '#0c1024')
                      : '#111827'
                  }
                  stroke={
                    isUnlocked
                      ? branchConfig.primary
                      : 'rgba(255, 255, 255, 0.2)'
                  }
                  strokeWidth={isUnlocked ? 2.5 : 1.5}
                />

                {/* Node Center Icon / Symbol */}
                <text
                  x={pos.x}
                  y={pos.y + (isUnlocked ? 5 : 4)}
                  textAnchor="middle"
                  fontSize={isUnlocked ? '14' : '10'}
                  fill="#ffffff"
                  pointerEvents="none"
                >
                  {isUnlocked ? (node.icon || '✦') : '🔒'}
                </text>

                {/* Level Pill for Unlocked Nodes */}
                {isUnlocked && (
                  <g transform={`translate(${pos.x + 10}, ${pos.y - 14})`}>
                    <rect
                      x="0"
                      y="0"
                      width="18"
                      height="12"
                      rx="4"
                      fill="#000000"
                      stroke={branchConfig.primary}
                      strokeWidth="1"
                    />
                    <text
                      x="9"
                      y="9"
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="bold"
                      fill="#ffffff"
                      fontFamily="var(--font-mono)"
                    >
                      L{node.level}
                    </text>
                  </g>
                )}

                {/* Skill Name Label Below / Above */}
                <text
                  x={pos.x}
                  y={pos.y + radius + 12}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="600"
                  fill={isUnlocked ? (isHovered ? '#ffffff' : '#e2e8f0') : '#64748b'}
                  pointerEvents="none"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Selected Interactive Tooltip Card (Pinned to Top Right) */}
        {activeDetailNode && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            maxWidth: '280px',
            width: '100%',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            border: `1.5px solid ${BRANCH_COLORS[activeDetailNode.branch]?.primary || 'var(--border-subtle)'}`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="badge badge-flow" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                {activeDetailNode.category === 'hard' ? 'HARD SKILL' : 'COGNITIVE SOFT SKILL'}
              </span>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
                {activeDetailNode.unlocked ? `Level ${activeDetailNode.level}` : 'LOCKED'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem' }}>{activeDetailNode.icon}</span>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  {activeDetailNode.name}
                </div>
                {activeDetailNode.nameZh && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {activeDetailNode.nameZh}
                  </div>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: '8px 0 10px 0' }}>
              {activeDetailNode.description}
            </p>

            {/* XP Progress Bar */}
            {activeDetailNode.unlocked ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  <span>XP: {activeDetailNode.xp}</span>
                  <span>Next: {activeDetailNode.xpToNextLevel}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((activeDetailNode.xp / activeDetailNode.xpToNextLevel) * 100))}%`,
                    height: '100%',
                    background: BRANCH_COLORS[activeDetailNode.branch]?.primary || 'var(--accent-purple)'
                  }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--accent-amber)' }}>
                <Lock size={12} /> Unlocks by training parent node in focus sessions
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'center',
        padding: '10px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        {Object.entries(BRANCH_COLORS).map(([key, item]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.primary }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
