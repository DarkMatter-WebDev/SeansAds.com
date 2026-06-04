(() => {
  const canvas = document.querySelector(".grid-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = {
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight * 0.42,
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.42,
    active: false
  };
  let dpr = 1;
  let width = 0;
  let height = 0;
  let time = 0;
  let orbTouched = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const orb = document.querySelector(".mobile-grid-orb");
    if (orb && !orbTouched) {
      orb.style.setProperty("--orb-x", `${Math.max(18, width - 68)}px`);
      orb.style.setProperty("--orb-y", `${Math.max(88, height - 92)}px`);
    }
  }

  function warpPoint(x, y, strength) {
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    const distance = Math.hypot(dx, dy) || 1;
    const radius = Math.min(width, height) * 0.32;
    const influence = Math.max(0, 1 - distance / radius);
    const falloff = influence * influence * (3 - 2 * influence);
    const orbit = Math.sin(distance * 0.028 - time * 0.045) * 0.52;
    const pull = -strength * falloff;
    const swirl = strength * 0.36 * falloff * orbit;

    return {
      x: x + (dx / distance) * pull + (-dy / distance) * swirl,
      y: y + (dy / distance) * pull + (dx / distance) * swirl
    };
  }

  function drawLine(points, color, widthPx) {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = widthPx;
    ctx.stroke();
  }

  function drawGrid() {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const spacing = width < 760 ? 42 : 54;
    const step = 10;
    const strength = pointer.active || !reduceMotion ? 76 : 0;
    const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.min(width, height) * 0.34);
    glow.addColorStop(0, "rgba(0, 240, 255, 0.16)");
    glow.addColorStop(0.42, "rgba(57, 255, 136, 0.08)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    for (let x = -spacing; x <= width + spacing; x += spacing) {
      const points = [];
      for (let y = -spacing; y <= height + spacing; y += step) points.push(warpPoint(x, y, strength));
      drawLine(points, "rgba(0, 240, 255, 0.16)", 1);
    }

    for (let y = -spacing; y <= height + spacing; y += spacing) {
      const points = [];
      for (let x = -spacing; x <= width + spacing; x += step) points.push(warpPoint(x, y, strength));
      drawLine(points, "rgba(57, 255, 136, 0.13)", 1);
    }

    ctx.restore();
  }

  function render() {
    time += reduceMotion ? 0 : 1;
    pointer.x += (pointer.targetX - pointer.x) * 0.13;
    pointer.y += (pointer.targetY - pointer.y) * 0.13;
    drawGrid();
    if (!reduceMotion) requestAnimationFrame(render);
  }

  window.addEventListener("pointermove", (event) => {
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  }, { passive: true });

  function setupMobileGridOrb() {
    const orb = document.createElement("button");
    orb.className = "mobile-grid-orb";
    orb.type = "button";
    orb.setAttribute("aria-label", "Drag to bend the background grid");
    document.body.appendChild(orb);

    let dragging = false;
    const setOrbPosition = (clientX, clientY) => {
      const size = 48;
      const x = Math.min(Math.max(12, clientX - size / 2), window.innerWidth - size - 12);
      const y = Math.min(Math.max(76, clientY - size / 2), window.innerHeight - size - 12);
      orb.style.setProperty("--orb-x", `${x}px`);
      orb.style.setProperty("--orb-y", `${y}px`);
      pointer.targetX = x + size / 2;
      pointer.targetY = y + size / 2;
      pointer.active = true;
      orbTouched = true;
    };

    orb.addEventListener("pointerdown", (event) => {
      dragging = true;
      orb.classList.add("is-dragging");
      orb.setPointerCapture?.(event.pointerId);
      setOrbPosition(event.clientX, event.clientY);
    });

    orb.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      setOrbPosition(event.clientX, event.clientY);
    });

    const stopDragging = (event) => {
      dragging = false;
      orb.classList.remove("is-dragging");
      orb.releasePointerCapture?.(event.pointerId);
    };

    orb.addEventListener("pointerup", stopDragging);
    orb.addEventListener("pointercancel", stopDragging);
  }

  window.addEventListener("resize", () => {
    resize();
    drawGrid();
  }, { passive: true });

  setupMobileGridOrb();
  resize();
  render();
})();
