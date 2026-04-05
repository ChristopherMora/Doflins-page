"use client";

import { useEffect, useRef, useCallback } from "react";

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: "square" | "circle" | "star";
}

const COLORS_BY_RARITY: Record<string, string[]> = {
  EPIC: ["#ff9500", "#ff6b00", "#ffc107", "#ff5722", "#ffeb3b"],
  LEGENDARY: ["#ffd700", "#ffb300", "#fff176", "#ffe082", "#ffffff"],
  ULTRA: ["#ff4444", "#ff1744", "#ff5252", "#ff8a80", "#ffd700"],
  MYTHIC: ["#ba68c8", "#9c27b0", "#e040fb", "#ea80fc", "#ffd700", "#ffffff"],
};

const DEFAULT_COLORS = ["#4e6f2a", "#8ab53c", "#ffd700", "#ff6b6b", "#4fc3f7"];

interface UseConfettiOptions {
  rarity?: string;
  particleCount?: number;
  duration?: number;
}

export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<ConfettiPiece[]>([]);

  const createParticle = useCallback((canvas: HTMLCanvasElement, colors: string[]): ConfettiPiece => {
    const shapes: ("square" | "circle" | "star")[] = ["square", "circle", "star"];
    return {
      x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.3,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 15,
      vy: -Math.random() * 20 - 10,
      size: Math.random() * 10 + 6,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      shape: shapes[Math.floor(Math.random() * shapes.length)]!,
    };
  }, []);

  const drawStar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size / 2;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(x, y - outerRadius);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fill();
  }, []);

  const fire = useCallback(({ rarity = "COMMON", particleCount = 100, duration = 3000 }: UseConfettiOptions = {}) => {
    // Create or get canvas
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
      document.body.appendChild(canvas);
      canvasRef.current = canvas;
    }

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = COLORS_BY_RARITY[rarity] ?? DEFAULT_COLORS;

    // Create particles
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(createParticle(canvas, colors));
    }

    const startTime = performance.now();
    const gravity = 0.5;
    const friction = 0.99;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      
      if (elapsed > duration || particlesRef.current.length === 0) {
        ctx.clearRect(0, 0, canvas!.width, canvas!.height);
        if (canvasRef.current) {
          canvasRef.current.remove();
          canvasRef.current = null;
        }
        animationRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        // Update physics
        p.vy += gravity;
        p.vx *= friction;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Remove if off screen
        if (p.y > canvas!.height + 50) return false;

        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "square") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.size / 2);
        }

        ctx.restore();
        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [createParticle, drawStar]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (canvasRef.current) {
        canvasRef.current.remove();
      }
    };
  }, []);

  return { fire };
}
