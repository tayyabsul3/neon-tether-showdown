class SimpleAudioController {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playBounce(freq = 280, duration = 0.08) {
        if (this.muted) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.4, this.ctx.currentTime + duration);
            
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    playStringSteal() {
        if (this.muted) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(380, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 0.12);
            
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.12);
        } catch (e) {}
    }

    playSpeedBoost() {
        if (this.muted) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(450, this.ctx.currentTime + 0.5);
            
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.5);
        } catch (e) {}
    }

    playEliminated() {
        if (this.muted) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.5);
            
            gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.5);
        } catch (e) {}
    }

    playScore(freq = 440, duration = 0.12) {
        if (this.muted) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + duration);
            
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }
}

const audio = new SimpleAudioController();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ARENA_RADIUS = 280;
let baseSpeed = 2.4;
let currentSpeedMultiplier = 1.0;
let lastSpeedupTime = 0;
const SPEEDUP_INTERVAL = 10000; // 10 seconds

let isPlaying = false; // Starts paused, waiting for character selection
const autoSimMode = true; // Hardcoded auto-sim
let isGameOver = false;
let screenShakeRemaining = 0;
const maxScore = 100;
const defaultStartScore = 1;
let twoPlayersLeftTime = 0; // Tracks when only 2 players are left for duel pacing

// Trailing active tethers
let activeStrings = [];

// Base canvas coordinates setup
canvas.width = 600;
canvas.height = 600;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Character parameters
const players = {
    yellow: {
        id: 'yellow',
        name: 'Yellow',
        color: '#eab308',
        expression: 'happy',
        startAngle: 225, 
        pos: { x: centerX - 70, y: centerY - 70 },
        vel: { x: -1.7, y: -1.7 },
        score: defaultStartScore,
        eliminated: false,
        paddleAngle: 225 * Math.PI / 180,
        targetPaddleAngle: 225 * Math.PI / 180,
        ballRadius: 25,
        reactionTimer: 0
    },
    blue: {
        id: 'blue',
        name: 'Blue',
        color: '#3b82f6',
        expression: 'happy',
        startAngle: 315, 
        pos: { x: centerX + 70, y: centerY - 70 },
        vel: { x: 1.7, y: -1.7 },
        score: defaultStartScore,
        eliminated: false,
        paddleAngle: 315 * Math.PI / 180,
        targetPaddleAngle: 315 * Math.PI / 180,
        ballRadius: 25,
        reactionTimer: 0
    },
    green: {
        id: 'green',
        name: 'Green',
        color: '#22c55e',
        expression: 'happy',
        startAngle: 135, 
        pos: { x: centerX - 70, y: centerY + 70 },
        vel: { x: -1.7, y: 1.7 },
        score: defaultStartScore,
        eliminated: false,
        paddleAngle: 135 * Math.PI / 180,
        targetPaddleAngle: 135 * Math.PI / 180,
        ballRadius: 25,
        reactionTimer: 0
    },
    red: {
        id: 'red',
        name: 'Red',
        color: '#ef4444',
        expression: 'happy',
        startAngle: 45, 
        pos: { x: centerX + 70, y: centerY + 70 },
        vel: { x: 1.7, y: 1.7 },
        score: defaultStartScore,
        eliminated: false,
        paddleAngle: 45 * Math.PI / 180,
        targetPaddleAngle: 45 * Math.PI / 180,
        ballRadius: 25,
        reactionTimer: 0
    }
};

// Find distance to line segment helper (Optimized: Squared distance check to avoid Math.sqrt)
function getDistanceSqToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) {
        const dx1 = px - x1;
        const dy1 = py - y1;
        return dx1 * dx1 + dy1 * dy1;
    }
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const dxProj = px - projX;
    const dyProj = py - projY;
    return dxProj * dxProj + dyProj * dyProj;
}

// Normalise speed with high deviation rotation factor
function applyScatteredReflection(p, rX, rY, isBallCollision = false) {
    const targetSpeed = baseSpeed * currentSpeedMultiplier;

    // Apply deviation: much higher scattering on ball collisions to deviate more
    const maxSpread = isBallCollision ? 1.74 : 0.52; // ~100 degrees vs ~30 degrees
    const scatterAngle = (Math.random() - 0.5) * maxSpread;
    const cosS = Math.cos(scatterAngle);
    const sinS = Math.sin(scatterAngle);

    // Rotate reflection vector and normalize to desired constant speed
    const scatX = rX * cosS - rY * sinS;
    const scatY = rX * sinS + rY * cosS;
    const scatMag = Math.sqrt(scatX * scatX + scatY * scatY);

    if (scatMag > 0) {
        p.vel.x = (scatX / scatMag) * targetSpeed;
        p.vel.y = (scatY / scatMag) * targetSpeed;
    }
}

// Update velocities proportionally
function resetTargetVelocities() {
    const desired = baseSpeed * currentSpeedMultiplier;
    Object.values(players).forEach(p => {
        if (p.eliminated) return;
        const mag = Math.sqrt(p.vel.x * p.vel.x + p.vel.y * p.vel.y);
        if (mag > 0) {
            p.vel.x = (p.vel.x / mag) * desired;
            p.vel.y = (p.vel.y / mag) * desired;
        }
    });
}

function updatePhysics() {
    if (!isPlaying || isGameOver) return;

    // Revert player expression to happy face if reaction timer has expired
    const nowTime = Date.now();
    Object.values(players).forEach(p => {
        if (!p.eliminated && p.reactionTimer && nowTime > p.reactionTimer) {
            p.expression = 'happy';
            p.reactionTimer = 0;
        }
    });

    const activePlayers = Object.values(players).filter(p => !p.eliminated);

    // Track when exactly 2 players are left
    if (activePlayers.length === 2) {
        if (!twoPlayersLeftTime) {
            twoPlayersLeftTime = Date.now();
        }
    } else {
        twoPlayersLeftTime = 0;
    }

    // Auto alignment calculations
    Object.values(players).forEach(p => {
        if (p.eliminated) return;

        const targetX = p.pos.x - centerX;
        const targetY = p.pos.y - centerY;
        let targetAngle = Math.atan2(targetY, targetX);
        if (targetAngle < 0) targetAngle += Math.PI * 2;
        p.targetPaddleAngle = targetAngle;

        let diff = p.targetPaddleAngle - p.paddleAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        p.paddleAngle += diff * 0.18;
    });

    // Handle character movement
    activePlayers.forEach(p => {
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;

        const dx = p.pos.x - centerX;
        const dy = p.pos.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist + p.ballRadius >= ARENA_RADIUS) {
            const normalX = dx / dist;
            const normalY = dy / dist;
            const dot = p.vel.x * normalX + p.vel.y * normalY;
            
            if (dot > 0) {
                // Calculate classic vector reflection
                const rX = p.vel.x - 2 * dot * normalX;
                const rY = p.vel.y - 2 * dot * normalY;

                // Lock coordinates inside bounds
                p.pos.x = centerX + normalX * (ARENA_RADIUS - p.ballRadius - 1.5);
                p.pos.y = centerY + normalY * (ARENA_RADIUS - p.ballRadius - 1.5);

                // Reflect with standard scatter reflection
                applyScatteredReflection(p, rX, rY, false);

                // Set reaction expression on wall bounce ( shocked face )
                p.expression = 'shocked';
                p.reactionTimer = Date.now() + 600;

                let bounceAngle = Math.atan2(dy, dx);
                if (bounceAngle < 0) bounceAngle += Math.PI * 2;

                checkBounceMechanic(p, bounceAngle);
            }
        }
    });

    // Characters Colliding with Each Other (Optimized: Squared distance check first)
    const len = activePlayers.length;
    for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
            const p1 = activePlayers[i];
            const p2 = activePlayers[j];

            const dx = p2.pos.x - p1.pos.x;
            const dy = p2.pos.y - p1.pos.y;
            const distSq = dx * dx + dy * dy;
            const minDist = p1.ballRadius + p2.ballRadius;
            const minDistSq = minDist * minDist;

            if (distSq < minDistSq) {
                const dist = Math.sqrt(distSq);
                const normalX = dx / (dist || 1);
                const normalY = dy / (dist || 1);
                const rvx = p2.vel.x - p1.vel.x;
                const rvy = p2.vel.y - p1.vel.y;
                const velAlongNormal = rvx * normalX + rvy * normalY;

                if (velAlongNormal < 0) {
                    const impulse = -velAlongNormal;
                    
                    // Normal impulse velocities
                    const rx1 = p1.vel.x - impulse * normalX;
                    const ry1 = p1.vel.y - impulse * normalY;
                    const rx2 = p2.vel.x + impulse * normalX;
                    const ry2 = p2.vel.y + impulse * normalY;

                    // Push out overlap
                    const overlap = minDist - dist;
                    p1.pos.x -= normalX * (overlap / 2);
                    p1.pos.y -= normalY * (overlap / 2);
                    p2.pos.x += normalX * (overlap / 2);
                    p2.pos.y += normalY * (overlap / 2);

                    // Distribute velocities with higher ball collision deviation (true)
                    applyScatteredReflection(p1, rx1, ry1, true);
                    applyScatteredReflection(p2, rx2, ry2, true);

                    // Set reaction expressions on ball-to-ball collision ( dizzy face )
                    p1.expression = 'dizzy';
                    p1.reactionTimer = Date.now() + 600;
                    p2.expression = 'dizzy';
                    p2.reactionTimer = Date.now() + 600;

                    audio.playBounce(220, 0.08);
                }
            }
        }
    }

    // Dynamic Tentacle/String Stealing & Health Consumption (Optimized: Squared distance checks)
    const indicesToRemove = new Set();
    
    activeStrings.forEach((str, strIdx) => {
        activePlayers.forEach(p => {
            if (str.ownerId !== p.id) {
                const ownerBall = players[str.ownerId];
                if (ownerBall && !ownerBall.eliminated) {
                    const distToLineSq = getDistanceSqToSegment(
                        p.pos.x, p.pos.y,
                        str.startX, str.startY,
                        ownerBall.pos.x, ownerBall.pos.y
                    );

                    const threshold = p.ballRadius + 2;
                    // Touch threshold triggers dynamic string consumption
                    if (distToLineSq <= threshold * threshold) {
                        // Deduct life/count from current string owner
                        ownerBall.score = Math.max(0, ownerBall.score - 1);
                        updateScoreUI(ownerBall.id, ownerBall.score);

                        // Award 1 point to the stealer (p) - Point Steal!
                        if (!p.eliminated) {
                            p.score = Math.min(maxScore, p.score + 1);
                            updateScoreUI(p.id, p.score);
                            
                            // Transfer ownership of the string to the stealer!
                            str.ownerId = p.id;

                            // Stealer reaction face ( cheeky / happy grin )
                            p.expression = 'cheeky';
                            p.reactionTimer = Date.now() + 700;
                            
                            // Check if stealer wins
                            if (p.score >= maxScore) {
                                endGame(p);
                            }
                        } else {
                            // If the stealer is somehow eliminated, delete the string
                            indicesToRemove.add(strIdx);
                        }

                        // Victim reaction face ( painful grimace )
                        ownerBall.expression = 'pain';
                        ownerBall.reactionTimer = Date.now() + 700;

                        // Eliminate player if score drops to zero
                        if (ownerBall.score <= 0) {
                            eliminatePlayer(ownerBall);
                        }     
                        
                        // Play striking sound
                        audio.playStringSteal();
                        triggerScreenShake(4);
                    }
                }
            }
        });
    });

    if (indicesToRemove.size > 0) {
        activeStrings = activeStrings.filter((_, idx) => !indicesToRemove.has(idx));
    }

    // Clean up strings of eliminated players at the end of the physics step
    const eliminatedIds = Object.values(players).filter(p => p.eliminated).map(p => p.id);
    if (eliminatedIds.length > 0) {
        activeStrings = activeStrings.filter(str => !eliminatedIds.includes(str.ownerId));
    }
}

// Bouncing and scoring triggers
function checkBounceMechanic(player, angle) {
    const activePlayers = Object.values(players).filter(p => !p.eliminated);
    const paddleWidth = getPaddleWidth(); 
    let hitPaddle = false;

    for (const p of activePlayers) {
        let diff = Math.abs(angle - p.paddleAngle);
        while (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (diff <= paddleWidth) {
            hitPaddle = true;

            if (p.id === player.id) {
                // Anchor a trailing neon tentacle string (only on own paddle hit)
                activeStrings.push({
                    startX: player.pos.x,
                    startY: player.pos.y,
                    ownerId: player.id 
                });

                player.score++;
                audio.playScore(320 + player.score * 3);
                updateScoreUI(player.id, player.score);

                if (player.score >= maxScore) {
                    endGame(player);
                }
            } else {
                audio.playBounce(180, 0.08);
            }
            break;
        }
    }

    if (!hitPaddle) {
        const ownerName = getQuadrantByAngle(angle);
        const owner = players[ownerName];
        if (owner && !owner.eliminated) {
            owner.score = Math.max(0, owner.score - 1);
            updateScoreUI(owner.id, owner.score);
            
            // Remove one active string of this owner to keep lines equal to score
            const idx = activeStrings.findIndex(str => str.ownerId === owner.id);
            if (idx !== -1) {
                activeStrings.splice(idx, 1);
            }

            audio.playBounce(140, 0.15);
            triggerScreenShake(6);

            if (owner.score <= 0) {
                eliminatePlayer(owner);
            }
        }
    }
}

function getQuadrantByAngle(angle) {
    const deg = (angle * 180 / Math.PI + 360) % 360;
    if (deg >= 270 || deg < 45) {
        if (deg >= 270 && deg < 360) return 'blue';
        return 'red';
    }
    if (deg >= 45 && deg < 135) return 'red';
    if (deg >= 135 && deg < 225) return 'green';
    return 'yellow';
}

function eliminatePlayer(player) {
    player.eliminated = true;
    player.score = 0;
    
    updateScoreUI(player.id, 0);
    audio.playEliminated();
    triggerScreenShake(18);
    showFlashText(`${player.name.toUpperCase()} ELIMINATED!`, player.color);

    // Clean up strings belonging to deleted bouncers
    activeStrings = activeStrings.filter(str => str.ownerId !== player.id);

    const remaining = Object.values(players).filter(p => !p.eliminated);
    if (remaining.length === 1) {
        endGame(remaining[0]);
    } else if (remaining.length === 0) {
        endGame(null);
    }
}

function drawGrid() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#01030a';
    ctx.fill();
    ctx.clip(); // Keep grid lines only inside circular boundary

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    const spacing = 30;
    
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawRubberStrings() {
    ctx.lineWidth = 2.5;
    activeStrings.forEach(str => {
        const ownerBall = players[str.ownerId];
        if (ownerBall && !ownerBall.eliminated) {
            ctx.save();
            ctx.strokeStyle = ownerBall.color;
            ctx.shadowColor = ownerBall.color;
            ctx.shadowBlur = 5;
            
            ctx.beginPath();
            ctx.moveTo(str.startX, str.startY);
            ctx.lineTo(ownerBall.pos.x, ownerBall.pos.y);
            ctx.stroke();
            
            // Anchor point dot
            ctx.fillStyle = ownerBall.color;
            ctx.beginPath();
            ctx.arc(str.startX, str.startY, 3.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    });
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    if (screenShakeRemaining > 0) {
        const dx = (Math.random() - 0.5) * screenShakeRemaining;
        const dy = (Math.random() - 0.5) * screenShakeRemaining;
        ctx.translate(dx, dy);
        screenShakeRemaining *= 0.9;
        if (screenShakeRemaining < 0.5) screenShakeRemaining = 0;
    }

    drawGrid();
    drawRubberStrings();

    // Outermost circular perimeter wall
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const activePlayers = Object.values(players).filter(p => !p.eliminated);

    // Render active paddles
    activePlayers.forEach(p => {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(p.paddleAngle);
        
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        
        const paddleWidth = getPaddleWidth(); 
        ctx.beginPath();
        ctx.arc(0, 0, ARENA_RADIUS - 10, -paddleWidth / 2, paddleWidth / 2);
        ctx.stroke();
        
        ctx.restore();
    });

    // Render remaining bouncing balls
    activePlayers.forEach(p => {
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);

        // Draw selected champion aura/glow ring
        if (p.id === userChosenColor) {
            ctx.save();
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3.5;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(0, 0, p.ballRadius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Turn off glow for inner emoji and bar

        // Draw crisp vector bouncer face inside the ball (eyes, pupils, mouth)
        drawBouncerFace(ctx, 0, 0, p.ballRadius, p.color, p.expression);

        // Progress Bar above ball head (indicates score percentage filled)
        const barWidth = 36;
        const barHeight = 6;
        const barY = -p.ballRadius - 12;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
        
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);

        const scoreRatio = Math.max(0, Math.min(1, p.score / maxScore));
        ctx.fillStyle = p.color;
        ctx.fillRect(-barWidth / 2, barY, barWidth * scoreRatio, barHeight);
        
        ctx.restore();
    });

    // Draw elegant pause overlay if paused
    if (!isPlaying && !isGameOver) {
        ctx.fillStyle = 'rgba(3, 7, 18, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, ARENA_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', centerX, centerY);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('Click arena to resume', centerX, centerY + 30);
    }

    ctx.restore();
}

let lastFrameTime = 0;
function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    
    updatePhysics();
    drawScene();
    updateAndDrawConfetti(); // Draw victory particles if game over

    if (isPlaying && !isGameOver) {
        const now = Date.now();
        const elapsed = now - lastSpeedupTime;
        
        // Speed up twice as fast (every 5 seconds instead of 10) when only 2 players remain
        const activePlayersCount = Object.values(players).filter(p => !p.eliminated).length;
        const currentSpeedupInterval = (activePlayersCount === 2) ? 5000 : SPEEDUP_INTERVAL;

        if (elapsed >= currentSpeedupInterval) {
            triggerSpeedup();
        } else {
            const percent = (elapsed / currentSpeedupInterval) * 100;
            document.getElementById('boostProgressBar').style.width = `${percent}%`;
        }
    }

    requestAnimationFrame(gameLoop);
}

function triggerSpeedup() {
    lastSpeedupTime = Date.now();
    currentSpeedMultiplier = parseFloat((currentSpeedMultiplier + 0.2).toFixed(2));
    
    showFlashText("SPEED UP!", '#22c55e');
    triggerScreenShake(10);
    audio.playSpeedBoost();

    resetTargetVelocities();
    document.getElementById('speedDisplay').textContent = `Speed: ${currentSpeedMultiplier.toFixed(2)}x`;
}

function triggerScreenShake(mag) {
    screenShakeRemaining = mag;
}

function showFlashText(text, color) {
    const overlay = document.getElementById('flashOverlay');
    const textSpan = document.getElementById('flashText');
    
    textSpan.textContent = text;
    textSpan.style.color = color;
    textSpan.style.filter = `drop-shadow(0 4px 8px ${color})`;

    overlay.classList.remove('opacity-0', 'scale-75');
    overlay.classList.add('opacity-100', 'scale-100');

    setTimeout(() => {
        overlay.classList.remove('opacity-100', 'scale-100');
        overlay.classList.add('opacity-0', 'scale-75');
    }, 1100);
}

function endGame(winner) {
    isGameOver = true;
    isPlaying = false;
    
    initConfetti(); // Spawn victory particles

    const winOverlay = document.getElementById('winnerOverlay');
    const avatarContainer = document.getElementById('winnerAvatarContainer');
    const winnerMsg = document.getElementById('winnerMessage');
    
    if (winner) {
        audio.playScore(580, 0.4);
        winnerMsg.textContent = `${winner.name.toUpperCase()} CHAMPION WINS!`;
        winnerMsg.style.color = winner.color;
        
        avatarContainer.innerHTML = `
            <svg class="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="${winner.color}" stroke="#ffffff" stroke-width="4" />
                <circle cx="35" cy="40" r="9" fill="#ffffff" />
                <circle cx="35" cy="40" r="4.5" fill="#000000" />
                <circle cx="65" cy="40" r="9" fill="#ffffff" />
                <circle cx="65" cy="40" r="4.5" fill="#000000" />
                <path d="M32 62 Q50 78 68 62" stroke="#000000" stroke-width="5" fill="none" stroke-linecap="round" />
            </svg>
        `;
    } else {
        winnerMsg.textContent = "BATTLE DRAW!";
        winnerMsg.style.color = "#ffffff";
        avatarContainer.innerHTML = `
            <div class="text-6xl text-center">🤝</div>
        `;
    }

    // Display winner modal overlay
    if (winOverlay) {
        winOverlay.style.opacity = '1';
        winOverlay.style.pointerEvents = 'auto';
    }
}

function resetGame() {
    isGameOver = false;
    isPlaying = false; // Stop execution until start button is pressed
    currentSpeedMultiplier = 1.0;
    lastSpeedupTime = Date.now();
    activeStrings = [];
    twoPlayersLeftTime = 0;
    document.getElementById('boostProgressBar').style.width = "0%";
    document.getElementById('speedDisplay').textContent = "Speed: 1.00x";

    // Set initial velocities in scattered paths
    Object.keys(players).forEach(key => {
        const p = players[key];
        p.score = defaultStartScore;
        p.eliminated = false;
        p.expression = 'happy';
        p.reactionTimer = 0;
        p.paddleAngle = p.startAngle * Math.PI / 180;
        p.targetPaddleAngle = p.paddleAngle;

        if (p.id === 'yellow') {
            p.pos = { x: centerX - 80, y: centerY - 80 };
            p.vel = { x: -1.7, y: -1.7 };
        } else if (p.id === 'blue') {
            p.pos = { x: centerX + 80, y: centerY - 80 };
            p.vel = { x: 1.7, y: -1.7 };
        } else if (p.id === 'green') {
            p.pos = { x: centerX - 80, y: centerY + 80 };
            p.vel = { x: -1.7, y: 1.7 };
        } else if (p.id === 'red') {
            p.pos = { x: centerX + 80, y: centerY + 80 };
            p.vel = { x: 1.7, y: 1.7 };
        }

        updateScoreUI(p.id, p.score);

        // Pre-initialize 1 string for each player projecting from their starting wall quadrant
        const angleRad = p.startAngle * Math.PI / 180;
        activeStrings.push({
            startX: centerX + Math.cos(angleRad) * ARENA_RADIUS,
            startY: centerY + Math.sin(angleRad) * ARENA_RADIUS,
            ownerId: p.id
        });
    });

    resetTargetVelocities();
}

// Get dynamic paddle width (shrinks in final duels to force resolution)
function getPaddleWidth() {
    const activePlayers = Object.values(players).filter(p => !p.eliminated);
    if (activePlayers.length === 2) {
        const secondsElapsed = (Date.now() - twoPlayersLeftTime) / 1000;
        // Shrink paddle width from 0.30 down to 0.10 based on elapsed seconds (caps around 25s)
        return Math.max(0.10, 0.30 - (secondsElapsed * 0.008));
    }
    return 0.45;
}

function updateScoreUI(playerId, score) {
    const scoreVal = document.getElementById(`score-${playerId}`);
    if (scoreVal) {
        if (score <= 0) {
            scoreVal.textContent = "0";
            scoreVal.style.opacity = "0.25";
        } else {
            scoreVal.textContent = `${score}/100`;
            scoreVal.style.opacity = "1.0";
        }
    }
    // Update player ball radius dynamically (starts at 25 and grows by 0.5 per score point)
    const p = players[playerId];
    if (p) {
        p.ballRadius = 25 + score * 0.5;
    }
}

// Click to play/pause on canvas
canvas.addEventListener('click', () => {
    if (isGameOver) return;
    audio.init();
    isPlaying = !isPlaying;
    if (isPlaying) {
        lastSpeedupTime = Date.now();
    }
});

// Sound Toggle click
const btnSound = document.getElementById('btnSound');
const soundIcon = document.getElementById('soundIcon');
if (btnSound && soundIcon) {
    btnSound.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent canvas click triggering pause
        audio.muted = !audio.muted;
        if (audio.muted) {
            soundIcon.className = "fa-solid fa-volume-xmark text-gray-600";
        } else {
            soundIcon.className = "fa-solid fa-volume-high text-cyan-400";
            audio.playBounce(300, 0.08);
        }
    });
}

// Start simulation on load (Start paused, wait for start selection)
window.onload = function() {
    resetGame();
    requestAnimationFrame(gameLoop);
};

// Selection State and Logic
let userChosenColor = null;

function selectChampion(color) {
    userChosenColor = color;
    
    // Remove selected border from all
    ['yellow', 'blue', 'green', 'red'].forEach(c => {
        const btn = document.getElementById(`select-${c}`);
        if (btn) {
            btn.classList.remove('border-yellow-500', 'border-blue-500', 'border-green-500', 'border-red-500');
            btn.style.boxShadow = 'none';
        }
    });

    // Add highlighted border to selected
    const activeBtn = document.getElementById(`select-${color}`);
    if (activeBtn) {
        let borderClass = '';
        let glowColor = '';
        if (color === 'yellow') { borderClass = 'border-yellow-500'; glowColor = 'rgba(234, 179, 8, 0.4)'; }
        else if (color === 'blue') { borderClass = 'border-blue-500'; glowColor = 'rgba(59, 130, 246, 0.4)'; }
        else if (color === 'green') { borderClass = 'border-green-500'; glowColor = 'rgba(34, 197, 94, 0.4)'; }
        else if (color === 'red') { borderClass = 'border-red-500'; glowColor = 'rgba(239, 68, 68, 0.4)'; }
        
        activeBtn.classList.add(borderClass);
        activeBtn.style.boxShadow = `0 0 20px ${glowColor}`;
    }

    // Enable Start Battle button
    const btnStart = document.getElementById('btnStartGame');
    if (btnStart) {
        btnStart.removeAttribute('disabled');
    }
}

// Wire up selection button clicks & Play Again button
document.addEventListener('DOMContentLoaded', () => {
    ['yellow', 'blue', 'green', 'red'].forEach(color => {
        const btn = document.getElementById(`select-${color}`);
        if (btn) {
            btn.addEventListener('click', () => {
                selectChampion(color);
                audio.init();
                audio.playBounce(350, 0.05);
            });
        }
    });

    const btnStart = document.getElementById('btnStartGame');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            const overlay = document.getElementById('startOverlay');
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
            }
            isPlaying = true;
            lastSpeedupTime = Date.now();
            audio.init();
            audio.playSpeedBoost();
        });
    }

    const btnPlayAgain = document.getElementById('btnPlayAgain');
    if (btnPlayAgain) {
        btnPlayAgain.addEventListener('click', () => {
            // Hide winner overlay
            const winnerOverlay = document.getElementById('winnerOverlay');
            if (winnerOverlay) {
                winnerOverlay.style.opacity = '0';
                winnerOverlay.style.pointerEvents = 'none';
            }

            // Reset selection borders
            ['yellow', 'blue', 'green', 'red'].forEach(c => {
                const btn = document.getElementById(`select-${c}`);
                if (btn) {
                    btn.classList.remove('border-yellow-500', 'border-blue-500', 'border-green-500', 'border-red-500');
                    btn.style.boxShadow = 'none';
                }
            });

            // Disable start button until champion selected again
            const btnStartGame = document.getElementById('btnStartGame');
            if (btnStartGame) {
                btnStartGame.setAttribute('disabled', 'true');
            }

            userChosenColor = null;
            resetGame();

            // Show start screen overlay
            const startOverlay = document.getElementById('startOverlay');
            if (startOverlay) {
                startOverlay.style.opacity = '1';
                startOverlay.style.pointerEvents = 'auto';
            }
        });
    }
});

// Draw bouncer vector face (eyes, pupils, mouth) on canvas instead of text emojis
function drawBouncerFace(ctx, x, y, radius, color, expression) {
    ctx.save();
    ctx.translate(x, y);

    // Eyes parameters
    ctx.fillStyle = '#ffffff';
    const eyeY = -radius * 0.15;
    const eyeSize = radius * 0.28;
    const pupilSize = radius * 0.13;
    const pupilOffset = radius * 0.05;

    // Draw Left Eye white
    ctx.beginPath();
    ctx.arc(-radius * 0.35, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw Right Eye white
    ctx.beginPath();
    ctx.arc(radius * 0.35, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw Pupils / Expressions
    ctx.fillStyle = '#000000';
    if (expression === 'dizzy') {
        // Draw X's instead of pupils
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = radius * 0.08;
        ctx.lineCap = 'round';
        
        // Left Eye X
        ctx.beginPath();
        ctx.moveTo(-radius * 0.5, eyeY - eyeSize * 0.6);
        ctx.lineTo(-radius * 0.2, eyeY + eyeSize * 0.6);
        ctx.moveTo(-radius * 0.2, eyeY - eyeSize * 0.6);
        ctx.lineTo(-radius * 0.5, eyeY + eyeSize * 0.6);
        ctx.stroke();

        // Right Eye X
        ctx.beginPath();
        ctx.moveTo(radius * 0.2, eyeY - eyeSize * 0.6);
        ctx.lineTo(radius * 0.5, eyeY + eyeSize * 0.6);
        ctx.moveTo(radius * 0.5, eyeY - eyeSize * 0.6);
        ctx.lineTo(radius * 0.2, eyeY + eyeSize * 0.6);
        ctx.stroke();
    } else if (expression === 'shocked') {
        // Very small pupils centered
        ctx.beginPath();
        ctx.arc(-radius * 0.35, eyeY, pupilSize * 0.5, 0, Math.PI * 2);
        ctx.arc(radius * 0.35, eyeY, pupilSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Pupils looking slightly up-right
        const pupilXOffset = pupilOffset;
        const pupilYOffset = -pupilOffset * 0.5;
        ctx.beginPath();
        ctx.arc(-radius * 0.35 + pupilXOffset, eyeY + pupilYOffset, pupilSize, 0, Math.PI * 2);
        ctx.arc(radius * 0.35 + pupilXOffset, eyeY + pupilYOffset, pupilSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Mouth rendering
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.09;
    ctx.lineCap = 'round';

    if (expression === 'shocked') {
        // O mouth
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, radius * 0.32, radius * 0.18, 0, Math.PI * 2);
        ctx.fill();
    } else if (expression === 'pain') {
        // Frowning / sad curved mouth
        ctx.beginPath();
        ctx.moveTo(-radius * 0.3, radius * 0.38);
        ctx.quadraticCurveTo(0, radius * 0.20, radius * 0.3, radius * 0.38);
        ctx.stroke();
    } else if (expression === 'cheeky') {
        // Cheeky smirk curve
        ctx.beginPath();
        ctx.moveTo(-radius * 0.28, radius * 0.25);
        ctx.quadraticCurveTo(radius * 0.05, radius * 0.55, radius * 0.28, radius * 0.32);
        ctx.stroke();
    } else {
        // Happy Smile (default)
        ctx.beginPath();
        ctx.moveTo(-radius * 0.32, radius * 0.25);
        ctx.quadraticCurveTo(0, radius * 0.56, radius * 0.32, radius * 0.25);
        ctx.stroke();
    }

    ctx.restore();
}

// Confetti System for winner celebration
let confettiParticles = [];

function initConfetti() {
    confettiParticles = [];
    const colors = ['#facc15', '#60a5fa', '#4ade80', '#f87171', '#ec4899', '#a78bfa', '#22d3ee'];
    for (let i = 0; i < 120; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height, // start above canvas
            vx: (Math.random() - 0.5) * 5,
            vy: Math.random() * 4 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 6 + 5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 8
        });
    }
}

function updateAndDrawConfetti() {
    if (!isGameOver) return;
    ctx.save();
    confettiParticles.forEach(c => {
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.rotationSpeed;
        
        // Wrap back to top if falls off
        if (c.y > canvas.height) {
            c.y = -10;
            c.x = Math.random() * canvas.width;
            c.vy = Math.random() * 4 + 3;
        }

        ctx.fillStyle = c.color;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation * Math.PI / 180);
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 1.6);
        ctx.restore();
    });
    ctx.restore();
}
