// static/js/task-animation.js

document.addEventListener('change', function (e) {
    if (e.target && e.target.classList.contains('task-completion-check')) {
        const checkbox = e.target;
        const taskId = checkbox.dataset.taskId;
        const isCompleted = checkbox.checked;

        if (!taskId) return;

        if (isCompleted) {
            const card = checkbox.closest('.task-card');
            const targetContainer = document.getElementById('completed-tasks-container');

            if (card) {
                card.classList.add('task-completing');
                
                card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                
                setTimeout(() => {
                    card.remove(); // Se quita del DOM
                    
                }, 200);

                // 1. ORIGEN EXACTO (Centro de la casilla pulsada)
                const rect = checkbox.getBoundingClientRect();
                const startX = rect.left + rect.width / 2;
                const startY = rect.top + rect.height / 2;

                // 2. DESTINO ROBUSTO (Si falla el contenedor, apunta al lateral derecho)
                let endX, endY;
                if (targetContainer) {
                    const targetRect = targetContainer.getBoundingClientRect();
                    endX = targetRect.left + 60;
                    endY = targetRect.top + 100;
                } else {
                    endX = window.innerWidth - 220;
                    endY = 180;
                }

                // 3. VÉRTICE DEL ÁNGULO (Cálculo estricto en V)
                // Altura fija de subida de 150px (mínimo a 80px del borde superior de la pantalla)
                const peakY = Math.max(80, startY - 150);
                // El vértice avanza un 20% hacia la derecha durante el ascenso
                const peakX = startX + ((endX - startX) * 0.20);

                // 4. CONFETTI LOCAL
                if (typeof confetti === 'function') {
                    confetti({
                        particleCount: 20,
                        spread: 45,
                        origin: { x: startX / window.innerWidth, y: startY / window.innerHeight },
                        colors: ['#10B981', '#3B82F6', '#F59E0B'],
                        disableForReducedMotion: true
                    });
                }

                // 5. CREACIÓN Y ESTILOS DE LA PARTÍCULA
                const particle = document.createElement('div');
                particle.className = 'flying-particle';
                particle.style.position = 'fixed';
                particle.style.zIndex = '999999';
                particle.style.width = '26px';
                particle.style.height = '26px';
                particle.style.borderRadius = '50%';
                particle.style.background = 'radial-gradient(circle, #ffffff 15%, #10B981 70%, #059669 100%)';
                particle.style.boxShadow = '0 0 18px rgba(16, 185, 129, 0.95), 0 0 30px rgba(16, 185, 129, 0.7)';
                particle.style.pointerEvents = 'none';
                particle.style.left = `${startX}px`;
                particle.style.top = `${startY}px`;
                particle.style.opacity = '1';
                particle.style.transform = 'translate(-50%, -50%) scale(1)';

                document.body.appendChild(particle);

                // 6. CONTROL DEL VUELO VECTORIAL (TRAMO 1 -> VÉRTICE -> TRAMO 2)
                const tSubida = 380;   // Subida rápida y empinada
                const tPausa = 80;     // Pausa estática para marcar el quiebre del ángulo
                const tCaida = 550;    // Caida diagonal en línea recta a completadas
                const tTotal = tSubida + tPausa + tCaida;

                const startTime = performance.now();

                function renderFlight(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / tTotal, 1);

                    let currentX, currentY, currentScale, currentOpacity = 1;

                    // RECTA 1: Subida hasta el vértice
                    if (elapsed < tSubida) {
                        const segmentProgress = elapsed / tSubida;
                        currentX = startX + (peakX - startX) * segmentProgress;
                        currentY = startY + (peakY - startY) * segmentProgress;
                        currentScale = 1 + (1.3 - 1) * segmentProgress;
                    } 
                    // PAUSA: Parada estática en el pico para fijar la esquina
                    else if (elapsed < tSubida + tPausa) {
                        currentX = peakX;
                        currentY = peakY;
                        currentScale = 1.3;
                    } 
                    // RECTA 2: Bajada hacia la derecha hasta la columna de completadas
                    else {
                        const segmentProgress = (elapsed - (tSubida + tPausa)) / tCaida;
                        currentX = peakX + (endX - peakX) * segmentProgress;
                        currentY = peakY + (endY - peakY) * segmentProgress;
                        currentScale = 1.3 + (0.4 - 1.3) * segmentProgress;

                        if (segmentProgress > 0.85) {
                            currentOpacity = 1 - (segmentProgress - 0.85) * 6.6;
                        }
                    }

                    particle.style.left = `${currentX}px`;
                    particle.style.top = `${currentY}px`;
                    particle.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
                    particle.style.opacity = currentOpacity;

                    if (progress < 1) {
                        requestAnimationFrame(renderFlight);
                    } else {
                        particle.remove();
                        if (typeof sendToggleRequest === 'function') {
                            sendToggleRequest(taskId, isCompleted, checkbox);
                        }
                        if (typeof updateMatrixAndSidebarCounts === 'function') {
                            updateMatrixAndSidebarCounts();
                        }
                    }
                }

                requestAnimationFrame(renderFlight);
                return;
            }
        }

        if (typeof sendToggleRequest === 'function') {
            sendToggleRequest(taskId, isCompleted, checkbox);
        }
    }
});