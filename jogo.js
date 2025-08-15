         const emojis = ["🍒", "🍋", "🍉", "⭐", "💎", "🔔", "🃏"];
        const multipliers = {
            "🍒": 1.5,
            "🍋": 1.8,
            "🍉": 2.0,
            "⭐": 2.5,
            "💎": 5.0,
            "🔔": 10.0,
            "🃏": 0.0
        };

        const weights = {
            "🍒": 30,
            "🍋": 25,
            "🍉": 20,
            "⭐": 15,
            "💎": 7,
            "🔔": 3,
            "🃏": 5
        };

        let balance = 1000;
        const rows = 3;
        const cols = 3;
        let currentBet = 50;
        let isSpinning = false;
        let isBonusActive = false;
        let particlesInstance;
        let winMessages = [];
        let cardPrizes = [];

        // Variáveis para o modo Turbo
        let isTurboActive = false;
        const turboSpeedMultiplier = 5;

        function getWeightedSymbol() {
            const total = Object.values(weights).reduce((a, b) => a + b, 0);
            const rand = Math.random() * total;
            let sum = 0;
            for (const symbol of emojis) {
                sum += weights[symbol];
                if (rand <= sum) return symbol;
            }
            return emojis[0];
        }

        function initGrid() {
            const machine = document.getElementById("slotMachine");
            machine.innerHTML = "";
            for (let c = 0; c < cols; c++) {
                const col = document.createElement("div");
                col.className = "column";
                col.id = `col-${c}`;
                for (let r = 0; r < rows; r++) {
                    const cell = document.createElement("div");
                    cell.className = "symbol";
                    cell.id = `cell-${r}-${c}`;
                    cell.textContent = getWeightedSymbol();
                    col.appendChild(cell);
                }
                machine.appendChild(col);
            }
        }

        initGrid();

   function selectBet(betAmount, buttonElement) {
            currentBet = betAmount;
            document.querySelectorAll('.bet-menu-btn').forEach(btn => {
                btn.classList.remove('active-bet');
            });
            buttonElement.classList.add('active-bet');
            document.getElementById('customBetInputContainer').style.display = 'none'; // <--- Adicione esta linha
        }

        document.addEventListener('DOMContentLoaded', () => {
            const defaultBetBtn = document.querySelector(`.bet-menu-btn[data-bet="50"]`);
            if (defaultBetBtn) {
                defaultBetBtn.classList.add('active-bet');
            }
        });

        function spin() {
            if (isSpinning || isBonusActive) return;
            isSpinning = true;
            document.querySelector('.spin-btn').disabled = true;
            document.getElementById('turboBtn').disabled = true; // Desabilita o botão turbo durante a rodada
            toggleBetButtons(true); // <--- Adicione esta linha

            winMessages = [];

            const resultMessage = document.getElementById("resultMessage");
            resultMessage.className = "result-message";

            if (currentBet > balance) {
                resultMessage.textContent = "⚠️ Saldo insuficiente para essa aposta.";
                isSpinning = false;
                document.querySelector('.spin-btn').disabled = false;
                document.getElementById('turboBtn').disabled = false;
                return;
            }

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cell = document.getElementById(`cell-${r}-${c}`);
                    cell.classList.remove("highlight", "parallax");
                }
            }

            balance -= currentBet;
            document.getElementById("balance").textContent = balance;
            resultMessage.textContent = "";

            let finalGrid = Array.from({ length: rows }, () => Array(cols).fill(""));

            const forceBonus = Math.random() < 0.05;
            let winningConfig = null;

            if (forceBonus) {
                const winningRow = Math.floor(Math.random() * rows);
                winningConfig = { type: "horizontal", index: winningRow, symbol: "🃏" };
            } else {
                winningConfig = Math.random() < 0.1 ? { type: Math.random() < 0.5 ? "horizontal" : "diagonal", index: Math.floor(Math.random() * rows), symbol: getWeightedSymbol() } : null;
            }

            let finished = 0;
            for (let c = 0; c < cols; c++) {
                animateColumn(c, () => {
                    finished++;
                    if (finished === cols) {
                        checkWin(finalGrid, currentBet);
                        isSpinning = false;
                        if (!isBonusActive) {
                            document.querySelector('.spin-btn').disabled = false;
                            document.getElementById('turboBtn').disabled = false;
                        }
                    }
                }, finalGrid, winningConfig);
            }
        }

        function animateColumn(colIndex, callback, finalGrid, winConfig) {
            let count = 0;
            let steps = 20 + colIndex * 5;
            const speed = isTurboActive ? turboSpeedMultiplier : 1;
            let delay = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spin-delay-base')) / speed;

            const interval = setInterval(() => {
                for (let r = 0; r < rows; r++) {
                    let symbol;
                    if (count >= steps) {
                        if (winConfig) {
                            if (winConfig.type === "horizontal" && r === winConfig.index && colIndex < cols) {
                                symbol = winConfig.symbol;
                            } else if (winConfig.type === "diagonal" && ((r === colIndex && winConfig.index === 0) || (r + colIndex === 2 && winConfig.index === 1))) {
                                symbol = winConfig.symbol;
                            } else {
                                symbol = getWeightedSymbol();
                            }
                        } else {
                            symbol = getWeightedSymbol();
                        }
                        finalGrid[r][colIndex] = symbol;
                    } else {
                        symbol = getWeightedSymbol();
                    }

                    const cell = document.getElementById(`cell-${r}-${colIndex}`);
                    cell.textContent = symbol;
                    cell.classList.remove("parallax");
                    void cell.offsetWidth;
                    cell.classList.add("parallax");
                }

                count++;
                if (count > steps) {
                    clearInterval(interval);
                    callback();
                }
            }, delay + (colIndex * 15 / speed));
        }

        function showMultiplier(finalMultiplier) {
            const box = document.getElementById("multiplierBox");
            const value = document.getElementById("multiplierValue");

            box.classList.add('visible');
            box.style.pointerEvents = 'auto';
            value.textContent = "1.0x";

            const duration = 1000;
            let startTime = null;

            function animate(currentTime) {
                if (!startTime) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentMultiplier = 1.0 + (finalMultiplier - 1.0) * progress;

                value.textContent = `${currentMultiplier.toFixed(1)}x`;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    value.textContent = `${finalMultiplier.toFixed(1)}x`;
                    setTimeout(() => {
                        box.classList.remove('visible');
                        box.style.pointerEvents = 'none';
                    }, 1500);
                }
            }
            requestAnimationFrame(animate);
        }

        function checkWin(grid, betAmount) {
    const resultMessage = document.getElementById("resultMessage");
    let totalWinAmount = 0;
    let hasBonus = false;
    let messageDelay = 0;

    for (let r = 0; r < rows; r++) {
        if (grid[r][0] === grid[r][1] && grid[r][1] === grid[r][2]) {
            if (grid[r][0] === "🃏") {
                hasBonus = true;
            } else {
                const prize = betAmount * multipliers[grid[r][0]];
                totalWinAmount += prize;
                winMessages.push(`🎉 Trinca de ${grid[r][0]} na linha ${r + 1}! Você ganhou R$${prize.toFixed(2)}!`);
                setTimeout(() => {
                    showMultiplier(multipliers[grid[r][0]]);
                    for (let c = 0; c < cols; c++) {
                        document.getElementById(`cell-${r}-${c}`).classList.add("highlight");
                    }
                }, messageDelay);
            }
        }
    }

    if (grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2]) {
        if (grid[0][0] === "🃏") {
            hasBonus = true;
        } else {
            const prize = betAmount * multipliers[grid[0][0]];
            totalWinAmount += prize;
            winMessages.push(`🎉 Trinca diagonal de ${grid[0][0]}! Você ganhou R$${prize.toFixed(2)}!`);
            setTimeout(() => {
                showMultiplier(multipliers[grid[0][0]]);
                for (let i = 0; i < rows; i++) {
                    document.getElementById(`cell-${i}-${i}`).classList.add("highlight");
                }
            }, messageDelay);
        }
    }

    if (grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0]) {
        if (grid[0][2] === "🃏") {
            hasBonus = true;
        } else {
            const prize = betAmount * multipliers[grid[0][2]];
            totalWinAmount += prize;
            winMessages.push(`🎉 Trinca diagonal de ${grid[0][2]}! Você ganhou R$${prize.toFixed(2)}!`);
            setTimeout(() => {
                showMultiplier(multipliers[grid[0][2]]);
                for (let i = 0; i < rows; i++) {
                    document.getElementById(`cell-${i}-${2 - i}`).classList.add("highlight");
                }
            }, messageDelay);
        }
    }
    
    if (winMessages.length > 0) {
        balance += totalWinAmount;
        document.getElementById("balance").textContent = balance;
        resultMessage.innerHTML = winMessages.join('<br>');
        resultMessage.classList.add('win');
        startParticles('win');
    } else {
        resultMessage.textContent = "😢 Não foi dessa vez...";
        resultMessage.classList.add('lose');
    }

    if (hasBonus) {
        isBonusActive = true;
        startParticles('bonus');
        resultMessage.innerHTML = winMessages.length > 0 ? `${resultMessage.innerHTML}<br>🎉 Trinca de Coringa! Escolha uma carta!` : "🎉 Trinca de Coringa! Escolha uma carta!";
        startCardBonus();
    } else {
        isSpinning = false;
        document.querySelector('.spin-btn').disabled = false;
        document.getElementById('turboBtn').disabled = false;
        toggleBetButtons(false); // <--- Adicionei esta linha aqui
    }
}
        
        function startCardBonus() {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.classList.remove('revealed');
                card.style.pointerEvents = 'auto';
                card.querySelector('.card-front span').textContent = '';
                card.querySelector('.card-front').className = 'card-face card-front';
            });
            document.getElementById("cardBonusPopup").style.display = "flex";

            cardPrizes = [0, 0, 5, 30];
            cardPrizes.sort(() => Math.random() - 0.5);
        }

        function chooseCard(cardElement, index) {
            if (cardElement.classList.contains('revealed')) return;

            const cards = document.querySelectorAll('.card');
            cards.forEach(card => card.style.pointerEvents = 'none');
            
            cardElement.classList.add('revealed');
            
            const prize = cardPrizes[index];
            const prizeElement = cardElement.querySelector('.card-front span');
            
            let prizeClass = '';
            if (prize === 5) {
                prizeClass = 'win-5x';
            } else if (prize === 30) {
                prizeClass = 'win-30x';
            } else {
                prizeClass = 'lose';
            }
            cardElement.querySelector('.card-front').classList.add(prizeClass);
            
            prizeElement.textContent = `${prize}x`;

            const winAmount = currentBet * prize;
            
            setTimeout(() => {
                cards.forEach((card, i) => {
                    if (i !== index) {
                        card.classList.add('revealed');
                        const otherPrize = cardPrizes[i];
                        const otherPrizeElement = card.querySelector('.card-front span');
                        otherPrizeElement.textContent = `${otherPrize}x`;
                        
                        let otherPrizeClass = '';
                        if (otherPrize === 5) {
                            otherPrizeClass = 'win-5x';
                        } else if (otherPrize === 30) {
                            otherPrizeClass = 'win-30x';
                        } else {
                            otherPrizeClass = 'lose';
                        }
                        card.querySelector('.card-front').classList.add(otherPrizeClass);
                    }
                });

                balance += winAmount;
                document.getElementById("balance").textContent = balance;
                document.getElementById("cardPrize").textContent = `R$${winAmount.toFixed(2)} (${prize}x)`;

                if (prize > 0) {
                    showMultiplier(prize);
                }
                
                setTimeout(() => {
                    document.getElementById("cardBonusPopup").style.display = "none";
                    document.getElementById("resultMessage").textContent += `\n🎉 Bônus de Cartas: +R$${winAmount.toFixed(2)}!`;
                    isBonusActive = false;
                    document.querySelector('.spin-btn').disabled = false;
                    document.getElementById('turboBtn').disabled = false;
                    toggleBetButtons(false); // <--- Adicione esta linha

                }, 2000);

            }, 1000);
        }

        function toggleTurbo() {
            const turboBtn = document.getElementById('turboBtn');
            isTurboActive = !isTurboActive;

            const speed = isTurboActive ? turboSpeedMultiplier : 1;
            const duration = isTurboActive ? 0.8 / speed : 0.8;

            document.documentElement.style.setProperty('--spin-speed-duration', `${duration}s`);

            if (isTurboActive) {
                turboBtn.classList.add('turbo-active');
            } else {
                turboBtn.classList.remove('turbo-active');
            }
        }

        // Configuração do tsParticles
        const particlesOptionsWin = {
            particles: {
                number: { value: 50 },
                color: { value: ["#00aaff", "#ffffff", "#66b3ff"] },
                shape: { type: "star" },
                size: { value: { min: 1, max: 5 } },
                links: { enable: false },
                move: { enable: true, speed: 6, direction: "top", outModes: "out" },
            },
            interactivity: {
                events: { onClick: { enable: true, mode: "push" }, onHover: { enable: true, mode: "repulse" } },
                modes: { push: { quantity: 4 }, repulse: { distance: 100 } },
            },
        };

        const particlesOptionsBonus = {
            particles: {
                number: { value: 80 },
                color: { value: ["#00aaff", "#66b3ff", "#ffffff"] },
                shape: { type: ["circle", "star"] },
                size: { value: { min: 3, max: 7 } },
                links: { enable: false },
                move: { enable: true, speed: 8, direction: "top", outModes: "out" },
            },
            interactivity: {
                events: { onClick: { enable: true, mode: "push" }, onHover: { enable: true, mode: "repulse" } },
                modes: { push: { quantity: 4 }, repulse: { distance: 100 } },
            },
        };

        async function startParticles(type) {
            if (particlesInstance) {
                await particlesInstance.destroy();
            }
            const particlesConfig = type === 'bonus' ? particlesOptionsBonus : particlesOptionsWin;
            particlesInstance = await tsParticles.load("tsparticles", particlesConfig);

            setTimeout(() => {
                if (particlesInstance) {
                    particlesInstance.destroy();
                    particlesInstance = null;
                }
            }, 3000);
        }

        // ... (código existente) ...

        function deposit() {
            const depositAmount = prompt("Quanto você gostaria de depositar?");
            if (depositAmount && !isNaN(depositAmount) && depositAmount > 0) {
                balance += parseFloat(depositAmount);
                document.getElementById("balance").textContent = balance;
                alert(`Depósito de R$${parseFloat(depositAmount).toFixed(2)} realizado com sucesso! Novo saldo: R$${balance.toFixed(2)}`);
            } else {
                alert("Valor de depósito inválido.");
            }
        }

        function toggleBetButtons(disable) {
    const betButtons = document.querySelectorAll('.bet-menu-btn');
    betButtons.forEach(button => {
        button.disabled = disable;
    });
}

function showCustomBetInput(buttonElement) {
            document.querySelectorAll('.bet-menu-btn').forEach(btn => {
                btn.classList.remove('active-bet');
            });
            buttonElement.classList.add('active-bet');
            document.getElementById('customBetInputContainer').style.display = 'flex';
        }

        function setCustomBet() {
            const customBetValue = parseFloat(document.getElementById('customBetInput').value);
            const resultMessage = document.getElementById("resultMessage");

            if (isNaN(customBetValue) || customBetValue < 5) {
                resultMessage.textContent = "⚠️ Valor de aposta inválido. Mínimo R$5.";
                resultMessage.classList.add('lose');
                return;
            }

            currentBet = customBetValue;
            document.getElementById('customBetInputContainer').style.display = 'none';
            resultMessage.textContent = `Aposta definida em R$${currentBet.toFixed(2)}.`;
            resultMessage.classList.remove('lose', 'win');
        }
