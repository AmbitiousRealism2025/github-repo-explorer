/**
 * Bio-Circuit Pattern Drawing Functions
 * Fusion of organic DNA helix with machine circuitry aesthetics
 *
 * @module components/RepositoryDNA/bioCircuitPatterns
 */

import { createSeededRandom } from './DNAGenerator.js';
import { hexToRgba } from './colors.js';

/**
 * Draw subtle helix trace in background
 * Two intertwining sinusoidal paths that hint at DNA structure
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawHelixTrace(ctx, cx, cy, radius, dnaData) {
  const random = createSeededRandom(dnaData.seed);
  const amplitude = radius * 0.15 * (0.8 + random() * 0.4); // Vary amplitude
  const frequency = 2 + Math.floor(random() * 3); // 2-4 waves
  const phase = random() * Math.PI * 2;
  const helixRadius = radius * 0.7;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((dnaData.geometry.rotation * Math.PI) / 180);

  // Draw two helix strands with different colors
  const strandColors = [
    dnaData.colors.helix || dnaData.colors.accent1 || dnaData.colors.primary,
    dnaData.colors.accent2 || dnaData.colors.trace || dnaData.colors.primary
  ];

  for (let strand = 0; strand < 2; strand++) {
    const strandOffset = strand * Math.PI; // 180 degree offset

    ctx.beginPath();

    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const angle = t * Math.PI * 2;

      // Sinusoidal modulation
      const wave = Math.sin(angle * frequency + phase + strandOffset) * amplitude;
      const r = helixRadius + wave;

      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.strokeStyle = hexToRgba(strandColors[strand], 0.2);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Draw cross-connections (base pairs hint)
  const connectionCount = 4 + dnaData.pattern.density;
  for (let i = 0; i < connectionCount; i++) {
    const angle = (i / connectionCount) * Math.PI * 2 + phase;

    const wave1 = Math.sin(angle * frequency + phase) * amplitude;
    const wave2 = Math.sin(angle * frequency + phase + Math.PI) * amplitude;

    const r1 = helixRadius + wave1;
    const r2 = helixRadius + wave2;

    const x1 = Math.cos(angle) * r1;
    const y1 = Math.sin(angle) * r1;
    const x2 = Math.cos(angle) * r2;
    const y2 = Math.sin(angle) * r2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = hexToRgba(dnaData.colors.trace || dnaData.colors.primary, 0.1);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw circuit nodes (terminal points)
 * Placement determined by repo hash for uniqueness
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 * @param {number} time - Animation time (for ripples)
 */
export function drawCircuitNodes(ctx, cx, cy, radius, dnaData, time = 0) {
  const random = createSeededRandom(dnaData.seed + 500);
  const nodeCount = 4 + Math.floor(dnaData.pattern.density * 1.5);
  const nodes = [];

  // Generate node positions
  for (let i = 0; i < nodeCount; i++) {
    const angle = random() * Math.PI * 2;
    const dist = radius * (0.3 + random() * 0.5);
    const size = 3 + random() * 3 + dnaData.pattern.complexity * 0.5;
    const type = random() < 0.3 ? 'filled' : random() < 0.6 ? 'empty' : 'glow';

    nodes.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      size,
      type,
      phase: random() * Math.PI * 2 // For ripple animation
    });
  }

  ctx.save();

  // Use multiple colors for nodes
  const nodeColors = [
    dnaData.colors.node || dnaData.colors.primary,
    dnaData.colors.accent1 || dnaData.colors.primary,
    dnaData.colors.accent2 || dnaData.colors.secondary
  ];

  // Draw nodes
  nodes.forEach((node, index) => {
    // Rotate through colors based on node index
    const nodeColor = nodeColors[index % nodeColors.length];

    // Ripple effect for glow nodes
    if (node.type === 'glow' && time > 0) {
      const ripplePhase = ((time / 2000) + node.phase) % 1;
      const rippleRadius = node.size + ripplePhase * 15;
      const rippleAlpha = (1 - ripplePhase) * 0.3;

      ctx.beginPath();
      ctx.arc(node.x, node.y, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(nodeColor, rippleAlpha);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Main node
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);

    if (node.type === 'filled') {
      ctx.fillStyle = nodeColor;
      ctx.fill();
    } else if (node.type === 'empty') {
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else { // glow
      ctx.fillStyle = nodeColor;
      ctx.fill();
      ctx.shadowColor = nodeColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Inner highlight for filled nodes
    if (node.type === 'filled' || node.type === 'glow') {
      ctx.beginPath();
      ctx.arc(node.x - node.size * 0.25, node.y - node.size * 0.25, node.size * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba('#ffffff', 0.4);
      ctx.fill();
    }
  });

  ctx.restore();

  return nodes; // Return for connection drawing
}

/**
 * Draw data bridges (horizontal connectors based on star tiers)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawDataBridges(ctx, cx, cy, radius, dnaData) {
  const stars = dnaData.metadata.stars;
  const random = createSeededRandom(dnaData.seed + 1000);

  // Determine bridge style based on star tier
  let bridgeStyle, bridgeCount;
  if (stars < 100) {
    bridgeStyle = 'simple';
    bridgeCount = 2;
  } else if (stars < 1000) {
    bridgeStyle = 'node';
    bridgeCount = 3;
  } else if (stars < 10000) {
    bridgeStyle = 'double';
    bridgeCount = 3;
  } else if (stars < 100000) {
    bridgeStyle = 'bus';
    bridgeCount = 4;
  } else {
    bridgeStyle = 'complex';
    bridgeCount = 5;
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((dnaData.geometry.rotation * Math.PI) / 180);

  const bridgeColor = dnaData.colors.bridge || dnaData.colors.secondary;

  for (let i = 0; i < bridgeCount; i++) {
    const yOffset = (i - (bridgeCount - 1) / 2) * (radius * 0.25);
    const bridgeWidth = radius * (0.4 + random() * 0.3);

    ctx.beginPath();

    switch (bridgeStyle) {
      case 'simple':
        // Simple line: ─────
        ctx.moveTo(-bridgeWidth, yOffset);
        ctx.lineTo(bridgeWidth, yOffset);
        ctx.strokeStyle = hexToRgba(bridgeColor, 0.4);
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 'node':
        // Line with center node: ──●──
        ctx.moveTo(-bridgeWidth, yOffset);
        ctx.lineTo(bridgeWidth, yOffset);
        ctx.strokeStyle = hexToRgba(bridgeColor, 0.5);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Center node
        ctx.beginPath();
        ctx.arc(0, yOffset, 3, 0, Math.PI * 2);
        ctx.fillStyle = bridgeColor;
        ctx.fill();
        break;

      case 'double':
        // Double line: ═════
        ctx.moveTo(-bridgeWidth, yOffset - 1.5);
        ctx.lineTo(bridgeWidth, yOffset - 1.5);
        ctx.moveTo(-bridgeWidth, yOffset + 1.5);
        ctx.lineTo(bridgeWidth, yOffset + 1.5);
        ctx.strokeStyle = hexToRgba(bridgeColor, 0.5);
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 'bus':
        // Bus with nodes: ═●═●═
        ctx.moveTo(-bridgeWidth, yOffset - 1.5);
        ctx.lineTo(bridgeWidth, yOffset - 1.5);
        ctx.moveTo(-bridgeWidth, yOffset + 1.5);
        ctx.lineTo(bridgeWidth, yOffset + 1.5);
        ctx.strokeStyle = hexToRgba(bridgeColor, 0.5);
        ctx.lineWidth = 1;
        ctx.stroke();
        // Nodes along bus
        for (let n = -1; n <= 1; n++) {
          ctx.beginPath();
          ctx.arc(n * bridgeWidth * 0.4, yOffset, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = bridgeColor;
          ctx.fill();
        }
        break;

      case 'complex':
        // Complex bus: ╪═●═╪
        ctx.moveTo(-bridgeWidth, yOffset - 2);
        ctx.lineTo(bridgeWidth, yOffset - 2);
        ctx.moveTo(-bridgeWidth, yOffset);
        ctx.lineTo(bridgeWidth, yOffset);
        ctx.moveTo(-bridgeWidth, yOffset + 2);
        ctx.lineTo(bridgeWidth, yOffset + 2);
        ctx.strokeStyle = hexToRgba(bridgeColor, 0.5);
        ctx.lineWidth = 1;
        ctx.stroke();
        // End caps
        ctx.beginPath();
        ctx.moveTo(-bridgeWidth, yOffset - 5);
        ctx.lineTo(-bridgeWidth, yOffset + 5);
        ctx.moveTo(bridgeWidth, yOffset - 5);
        ctx.lineTo(bridgeWidth, yOffset + 5);
        ctx.strokeStyle = hexToRgba(bridgeColor, 0.6);
        ctx.lineWidth = 2;
        ctx.stroke();
        // Center node
        ctx.beginPath();
        ctx.arc(0, yOffset, 4, 0, Math.PI * 2);
        ctx.fillStyle = bridgeColor;
        ctx.fill();
        break;
    }
  }

  ctx.restore();
}

/**
 * Draw branch traces (extending lines based on topics/name)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawBranchTraces(ctx, cx, cy, radius, dnaData) {
  const random = createSeededRandom(dnaData.seed + 2000);

  // Use repo name to determine branch angles
  const name = dnaData.repoName || '';
  const branchCount = 3 + Math.floor(dnaData.pattern.complexity / 2);

  ctx.save();
  ctx.translate(cx, cy);

  // Use branch color (accent2) for main branches, accent1 for sub-branches
  const mainColor = dnaData.colors.branch || dnaData.colors.accent2 || dnaData.colors.primary;
  const subColor = dnaData.colors.accent1 || dnaData.colors.trace || dnaData.colors.primary;

  for (let i = 0; i < branchCount; i++) {
    // Angle based on name hash + index
    const charCode = name.charCodeAt(i % name.length) || 65;
    const baseAngle = ((charCode - 65) / 26) * Math.PI * 2;
    const angle = baseAngle + (random() - 0.5) * 0.3;

    const startR = radius * 0.5;
    const endR = radius * (0.85 + random() * 0.15);

    const startX = Math.cos(angle) * startR;
    const startY = Math.sin(angle) * startR;
    const endX = Math.cos(angle) * endR;
    const endY = Math.sin(angle) * endR;

    // Main branch
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = hexToRgba(mainColor, 0.5);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Terminal node
    ctx.beginPath();
    ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = mainColor;
    ctx.fill();

    // Sub-branch (for higher complexity) - uses different accent color
    if (dnaData.pattern.complexity >= 3 && random() > 0.5) {
      const subAngle = angle + (random() - 0.5) * 0.8;
      const midR = startR + (endR - startR) * (0.4 + random() * 0.3);
      const midX = Math.cos(angle) * midR;
      const midY = Math.sin(angle) * midR;
      const subEndR = midR + (endR - midR) * 0.6;
      const subEndX = Math.cos(subAngle) * subEndR;
      const subEndY = Math.sin(subAngle) * subEndR;

      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(subEndX, subEndY);
      ctx.strokeStyle = hexToRgba(subColor, 0.4);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sub-terminal with accent color
      ctx.beginPath();
      ctx.arc(subEndX, subEndY, 2, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(subColor, 0.7);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Draw signal dots (unique constellation fingerprint)
 * Creates a unique pattern based on repo description/name hash
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawSignalDots(ctx, cx, cy, radius, dnaData) {
  // Create unique fingerprint from repo name
  const name = dnaData.repoName || 'default';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const random = createSeededRandom(Math.abs(hash));
  const dotCount = 8 + Math.floor(dnaData.pattern.density * 2);

  ctx.save();

  // Use multiple colors for constellation dots
  const dotColors = [
    dnaData.colors.dot || dnaData.colors.primary,
    dnaData.colors.accent1 || dnaData.colors.primary,
    dnaData.colors.accent2 || dnaData.colors.secondary
  ];

  // Generate constellation pattern
  const dots = [];
  for (let i = 0; i < dotCount; i++) {
    const angle = random() * Math.PI * 2;
    const dist = radius * (0.2 + random() * 0.6);
    const size = 1 + random() * 2;
    const alpha = 0.3 + random() * 0.4;
    const colorIndex = Math.floor(random() * dotColors.length);

    dots.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      size,
      alpha,
      color: dotColors[colorIndex]
    });
  }

  // Draw dots with varied colors
  dots.forEach(dot => {
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(dot.color, dot.alpha);
    ctx.fill();
  });

  // Connect some dots (constellation lines) with gradient effect
  const connectionCount = Math.floor(dotCount / 3);
  for (let i = 0; i < connectionCount; i++) {
    const dot1 = dots[i];
    const dot2 = dots[(i + 1) % dots.length];
    ctx.beginPath();
    ctx.moveTo(dot1.x, dot1.y);
    ctx.lineTo(dot2.x, dot2.y);
    // Use the first dot's color for the line
    ctx.strokeStyle = hexToRgba(dot1.color, 0.15);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw power rails (top/bottom frame lines based on license)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawPowerRails(ctx, cx, cy, radius, dnaData) {
  const railColor = dnaData.colors.rail || dnaData.colors.secondary;
  const railWidth = radius * 1.1;
  const railOffset = radius * 0.95;

  // Determine rail style based on license or owner type
  const isOrg = dnaData.metadata.ownerType === 'Organization';
  const license = dnaData.metadata.license || 'none';

  let railStyle;
  if (license.includes('MIT') || license.includes('Apache')) {
    railStyle = 'solid';
  } else if (license.includes('GPL')) {
    railStyle = 'double';
  } else if (license === 'none') {
    railStyle = 'dashed';
  } else {
    railStyle = 'dotted';
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((dnaData.geometry.rotation * Math.PI) / 180);

  // Draw top and bottom rails
  [-1, 1].forEach(direction => {
    const y = direction * railOffset;

    ctx.beginPath();

    switch (railStyle) {
      case 'solid':
        ctx.moveTo(-railWidth, y);
        ctx.lineTo(railWidth, y);
        ctx.strokeStyle = hexToRgba(railColor, 0.5);
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'double':
        ctx.moveTo(-railWidth, y - 2);
        ctx.lineTo(railWidth, y - 2);
        ctx.moveTo(-railWidth, y + 2);
        ctx.lineTo(railWidth, y + 2);
        ctx.strokeStyle = hexToRgba(railColor, 0.4);
        ctx.lineWidth = 1;
        ctx.stroke();
        break;

      case 'dashed':
        ctx.setLineDash([8, 4]);
        ctx.moveTo(-railWidth, y);
        ctx.lineTo(railWidth, y);
        ctx.strokeStyle = hexToRgba(railColor, 0.4);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
        break;

      case 'dotted':
        ctx.setLineDash([2, 4]);
        ctx.moveTo(-railWidth, y);
        ctx.lineTo(railWidth, y);
        ctx.strokeStyle = hexToRgba(railColor, 0.4);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
        break;
    }

    // End caps for org repos
    if (isOrg) {
      ctx.beginPath();
      ctx.moveTo(-railWidth, y - 4);
      ctx.lineTo(-railWidth, y + 4);
      ctx.moveTo(railWidth, y - 4);
      ctx.lineTo(railWidth, y + 4);
      ctx.strokeStyle = hexToRgba(railColor, 0.6);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  ctx.restore();
}

/**
 * Draw enhanced center element with owner type variation
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {Object} dnaData - DNA data structure
 */
export function drawEnhancedCenter(ctx, cx, cy, dnaData) {
  const centerRadius = dnaData.geometry.radius * 0.18;
  const isOrg = dnaData.metadata.ownerType === 'Organization';
  const nodeColor = dnaData.colors.node || dnaData.colors.primary;
  const glowColor = dnaData.colors.glow || dnaData.colors.primary;

  ctx.save();

  // Glow effect
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 15;

  // Shape based on owner type
  if (isOrg) {
    // Square for organizations
    const halfSize = centerRadius * 0.8;
    ctx.beginPath();
    ctx.rect(cx - halfSize, cy - halfSize, halfSize * 2, halfSize * 2);
  } else {
    // Circle for users
    ctx.beginPath();
    ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2);
  }

  // Gradient fill
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerRadius);
  gradient.addColorStop(0, hexToRgba(glowColor, 0.9));
  gradient.addColorStop(0.5, nodeColor);
  gradient.addColorStop(1, hexToRgba(nodeColor, 0.6));

  ctx.fillStyle = gradient;
  ctx.fill();

  // Reset shadow and add inner ring
  ctx.shadowBlur = 0;

  if (isOrg) {
    const innerSize = centerRadius * 0.5;
    ctx.strokeStyle = hexToRgba('#ffffff', 0.3);
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - innerSize, cy - innerSize, innerSize * 2, innerSize * 2);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, centerRadius * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba('#ffffff', 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Highlight
  ctx.beginPath();
  ctx.arc(cx - centerRadius * 0.25, cy - centerRadius * 0.25, centerRadius * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba('#ffffff', 0.4);
  ctx.fill();

  ctx.restore();
}

/**
 * Get all bio-circuit pattern functions in order
 * @param {number} complexity - Complexity level (1-5)
 * @returns {Function[]} - Array of pattern drawing functions
 */
export function getBioCircuitPatterns(complexity) {
  const patterns = [
    drawHelixTrace,      // Always draw subtle helix
    drawSignalDots,      // Always draw constellation
  ];

  if (complexity >= 1) patterns.push(drawDataBridges);
  if (complexity >= 2) patterns.push(drawCircuitNodes);
  if (complexity >= 3) patterns.push(drawBranchTraces);
  if (complexity >= 4) patterns.push(drawPowerRails);

  return patterns;
}
