
const characters = {
    shamie: { name: "MA'AM SHAMIE", spriteSrc: "sprites/ma'am shamie.jpg", speed: 10 },
    reyou: { name: "SIR REYOUUO", spriteSrc: "sprites/reyou.jpg", speed: 10 },
    lenvie: { name: "MA'AM LENVIE", spriteSrc: "sprites/ma'am lenvie.jpg", speed: 10 },
    winna: { name: "MA'AM WINNA", spriteSrc: "sprites/winna.jpg", speed: 10 },
    mayeth: { name: "MA'AM MAYETH", spriteSrc: "samurai/ma'am mayeth.jpg", speed: 10 },
    gian: { name: "SIR GIAN", spriteSrc: "samurai/Sir Gian.jpg", speed: 10 },
    kristine: { name: "MA'AM KRISTINE", spriteSrc: "samurai/tine.jpg", speed: 10 },
    ferl: { name: "SIR JOHNFERL", spriteSrc: "samurai/Sir ferl.jpg", speed: 10 }
  };
  
  let selectedPlayerCharacter = characters.shamie;
  let selectedEnemyCharacter = characters.mayeth;
  
  let isCountdownActive = false;

  document.addEventListener("DOMContentLoaded", () => {
  
    // === Canvas Setup ===
    const canvas = document.querySelector("canvas");
    const c = canvas.getContext("2d");
  
    const GAME_WIDTH = 1024;
    const GAME_HEIGHT = 645;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
  
    const gravity = 0.5;
    const groundLevel = canvas.height - 13;
  
    // === UI Elements ===
    const mainMenu = document.getElementById("mainMenu");
    const gameContainer = document.getElementById("gameContainer");
    const exitButton = document.getElementById('exitButton');
    const gameOverScreen = document.getElementById("gameOverScreen");
    const startButton = document.getElementById("startButton");
    const restartButton = document.getElementById("restartButton");
    const backToSelectionButton = document.getElementById("backToSelectionButton"); // ✅ ADDED
    const winnerText = document.getElementById("winnerText");
    const timerText = document.getElementById("timer");

    
  
    // === Audio Elements ===
    const startSFX = document.getElementById("startSFX");
    const tickSFX = document.getElementById("tickSFX");
    const gameOverSFX = document.getElementById("gameOverSFX");
  
    startSFX.volume = 0.6;
    tickSFX.volume = 0.4;
    gameOverSFX.volume = 0.8;

   
    const volumeSlider = document.getElementById("volumeSlider");
  
    // Set initial volumes based on the default values
    startSFX.volume = volumeSlider.value;
    tickSFX.volume = volumeSlider.value;
    gameOverSFX.volume = volumeSlider.value;
    
    // Update audio volumes whenever the slider value changes
    volumeSlider.addEventListener("input", () => {
        const volume = volumeSlider.value;
        startSFX.volume = volume;
        tickSFX.volume = volume;
        gameOverSFX.volume = volume;
    });
  
    
  
    // === Background ===
    const background = new Image();
    background.src = "samurai/STI.jpg";
    
  
    // === Global State ===
    let gameRunning = false;
    let countdownInterval = null;
    let animationId = null;
    let timer = 10;
    let shakeMagnitude = 0;
    let zoomLevel = 1;

let currentRound = 1; // Initialize the current round
const totalRounds = 1;  // Set the total number of rounds



  
    class Fighter {
        constructor({ position, spriteSrc, healthBarId, frames }) {
            this.startPosition = { ...position };
            this.position = { ...position };
            this.velocity = { x: 0, y: 0 };
            this.width = 150;
            this.height = 150;
            this.health = 100;
            this.isAttacking = false;
            this.attackCooldown = 700;
            this.speed = 10;
            this.healthBar = document.getElementById(healthBarId);
            this.facingRight = true;
            this.image = new Image();
            this.image.src = spriteSrc;
           
        }
        draw() {
            c.save();
            c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);
            c.scale(this.facingRight ? 1 : -1, 1);
    
            const radius = Math.min(this.width, this.height) / 2;
            c.beginPath();
            c.arc(0, 0, radius, 0, Math.PI * 2);
            c.clip();
    
            c.drawImage(this.image, -radius, -radius, radius * 2, radius * 2);
            c.restore();
        }
    
        update() {
            if (!gameRunning) return;
            this.draw();
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
    
            if (this.position.y + this.height < groundLevel) {
                this.velocity.y += gravity;
            } else {
                this.velocity.y = 0;
                this.position.y = groundLevel - this.height;
            }
    
            this.position.x = Math.max(0, Math.min(canvas.width - this.width, this.position.x));
    
           
            
        }
    
  
        attack(opponent) {
            if (this.isAttacking) return;
            this.isAttacking = true;
            setTimeout(() => this.isAttacking = false, this.attackCooldown);
  
            const attackRange = 20;
            const attackX = this.facingRight ? this.position.x + this.width : this.position.x - attackRange;
  
            const isHit =
                attackX < opponent.position.x + opponent.width &&
                attackX + attackRange > opponent.position.x &&
                this.position.y + this.height >= opponent.position.y &&
                this.position.y <= opponent.position.y + opponent.height;
  
            if (isHit) opponent.takeHit();
        }
  
        takeHit() {
            this.health = Math.max(0, this.health - 10);
            this.healthBar.style.transition = "width 0.3s ease";
            this.healthBar.style.width = `${this.health}%`;
            shakeMagnitude = 10;
  
            if (this.health <= 0) {
                const winner = this === player ? selectedEnemyCharacter.name : selectedPlayerCharacter.name;
            
                if (this === player) {
                    enemyWins++;
                } else {
                    playerWins++;
                }
            
                if (playerWins === Math.ceil(totalRounds / 2)) {
                    endGame(`${selectedPlayerCharacter.name} WINS THE MATCH!`);
                } else if (enemyWins === Math.ceil(totalRounds / 2)) {
                    endGame(`${selectedEnemyCharacter.name} WINS THE MATCH!`);
                } else {
                    currentRound++;
                    setTimeout(() => {
                        startNextRound();
                    }, 2000);
                }
            }
            
            
        }
  
        reset() {
            this.health = 100;
            this.healthBar.style.transition = "none";
            this.healthBar.style.width = "100%";
            this.position = { ...this.startPosition };
            this.velocity = { x: 0, y: 0 };
            this.isAttacking = false;
        }
    }
  
    let player, enemy;
  
    function initFighters() {
        player = new Fighter({
            position: { x: 200, y: groundLevel - 100 },
            spriteSrc: selectedPlayerCharacter.spriteSrc,
            healthBarId: "playerHealth"
        });
  
        enemy = new Fighter({
            position: { x: 700, y: groundLevel - 100 },
            spriteSrc: selectedEnemyCharacter.spriteSrc,
            healthBarId: "enemyHealth",
            frames: characters.gian.frames
        });
  
        player.speed = selectedPlayerCharacter.speed;
        enemy.speed = selectedEnemyCharacter.speed;

            // Initialize rounds won
    player.roundsWon = 0;
    enemy.roundsWon = 0;
    }
  
    const keys = { a: false, d: false, ArrowLeft: false, ArrowRight: false };
  
    window.addEventListener("keydown", (e) => {
        if (!gameRunning || isCountdownActive) return;
        
  
        switch (e.key) {
            case " ": e.preventDefault(); player.attack(enemy); break;
            case "d": keys.d = true; player.facingRight = true; break;
            case "a": keys.a = true; player.facingRight = false; break;
            case "w": if (!player.velocity.y) player.velocity.y = -13; break;
            case "ArrowRight": keys.ArrowRight = true; enemy.facingRight = true; break;
            case "ArrowLeft": keys.ArrowLeft = true; enemy.facingRight = false; break;
            case "ArrowUp": if (!enemy.velocity.y) enemy.velocity.y = -13; break;
            case "ArrowDown": enemy.attack(player); break;
            case "r": if (!gameRunning) resetGame(); break;
        }
    });
  
    window.addEventListener("keyup", ({ key }) => {
        if (keys.hasOwnProperty(key)) keys[key] = false;
    });
  
    function animate() {
        animationId = requestAnimationFrame(animate);
        if (!gameRunning) return;
  
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.scale(zoomLevel, zoomLevel);
        c.drawImage(background, 0, 0, canvas.width, canvas.height);
  
        if (shakeMagnitude > 1) {
            c.save();
            c.translate(Math.random() * shakeMagnitude - shakeMagnitude / 2, Math.random() * shakeMagnitude - shakeMagnitude / 2);
            shakeMagnitude *= 0.9;
        }
  
        player.update();
        enemy.update();

        if(shakeMagnitude > 1)c.restore();
        
  
        player.velocity.x = keys.a ? -player.speed : keys.d ? player.speed : 0;
        enemy.velocity.x = keys.ArrowLeft ? -enemy.speed : keys.ArrowRight ? enemy.speed : 0;
  
        if (shakeMagnitude > 2) c.restore();
    }

    function showCountdown() {
        isCountdownActive = true;
        mainMenu.style.display = "none";
        gameContainer.style.display = "flex";
        gameOverScreen.style.display = "none";
        
        let countdownTimer = 5; // Countdown start value
        timerText.innerText = countdownTimer; // Update the timer text to show countdown
    
        // Clear any existing countdown interval to avoid overlaps
        clearInterval(countdownInterval);
    
        countdownInterval = setInterval(() => {
            if (countdownTimer > 1) {
                countdownTimer--;
                timerText.innerText = countdownTimer; // Update countdown number
            } else {
                clearInterval(countdownInterval); // Stop countdown at 1
                timerText.innerText = "GO!"; // Show "Go!" text
                setTimeout(() => {
                    gameRunning = true; // Start the game after countdown
                    winnerText.innerText = `Round ${currentRound} / ${totalRounds}`;
                    timerText.style.opacity = "1";
                    resetGame();
                }, 800); // Delay before starting the game
            }
        }, 1000);
    }
    

    

    function startGame() {
        gameRunning = false;
        isCountdownActive = true;
        timer = 10;
        zoomLevel = 1.5;
        timerText.innerText = formatTime(timer);
        timerText.style.opacity = '1';
        currentRound = 1;
        winnerText.innerText = ``;
        mainMenu.style.display = "none";
        gameContainer.style.display = "flex";
        gameOverScreen.style.display = "none";
        startSFX.play();
        initFighters();
        resetGame();
        showCountdown(); // Begin with countdown
    }
    
  
function resetGame() {
    gameRunning = true;
    isCountdownActive = false;
    zoomLevel = 1;
    player.reset();
    enemy.reset();
    initFighters();
    clearInterval(countdownInterval);
    cancelAnimationFrame(animationId);
    gameOverScreen.classList.remove("show");
    winnerText.innerText = "";  // Clear winner text
    timer = 5;
    timerText.innerText = formatTime(timer);
    startTimer();
    animate();
    
 // Update round display after reset
}

function resetForNextRound() {
    player.reset();
    enemy.reset();
    timer = 10;
    startCountdown();
}


function startTimer() {
    // Clear any existing countdown interval before starting the game timer
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        if (!gameRunning) return;

        if (timer > 0) {
            timer--;
            timerText.innerText = formatTime(timer);

            // Play ticking sound in last 10 seconds
            if (timer <= 5) {
                tickSFX.currentTime = 0;
                tickSFX.play();
                timerText.classList.add("warning"); // CSS class for flashing red

                // Add flashing red text effect
                timerText.style.color = "red";
                timerText.style.animation = "flashTimer 0.5s infinite alternate";
            } else {
                // Reset color and animation when above 10
                timerText.style.color = "";
                timerText.style.animation = "";
                timerText.classList.remove = ("warning");
            }

        } else {
            clearInterval(countdownInterval);

            // Decide the winner based on health at timeout
            if (player.health > enemy.health) {
                endGame(`${selectedPlayerCharacter.name} WINS!`);
            } else if (enemy.health > player.health) {
                endGame(`${selectedEnemyCharacter.name} WINS!`);
            } else {
                endGame("It's a draw!");
            }
            determineWinner();
        }
    }, 1000);
}
  
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
  
    function endGame(message) {
        gameRunning = false;
        clearInterval(countdownInterval);
        cancelAnimationFrame(animationId);
    
        if (message.includes("WINS")) {
            if (currentRound < totalRounds) {
                // Update round counter
                currentRound++;
                winnerText.innerText = `${message} - Round ${currentRound} / ${totalRounds}`;
    
                setTimeout(() => {
                    showRound();
                    resetGame(); // Start next round
                }, 2000);  // Delay before the next round startss
            } else {
                // If all rounds are completed, end the game
                winnerText.innerText = message;
                setTimeout(() => {
                    gameOverScreen.style.display = "flex"; // Show final game over screen
                }, 100);
    
                gameOverScreen.style.display = "flex";
                setTimeout(() => gameOverScreen.classList.add("show"), 100);
                gameOverSFX.play();
                startButton.style.display = "none";
                restartButton.style.display = "inline-block";
                backToSelectionButton.style.display = "inline-block";
            }
        } else {
            // If it's a draw, just reset the round.
            winnerText.innerText = "It's a draw!";
            setTimeout(() => {
                resetGame(); // Start the next round
            }, 2000);  // Delay before the next round starts
        }
    }
  
    
    // === Button Events ===
    startButton.addEventListener("click", () => {
        startSFX.currentTime = 0;
        startSFX.play();
        startGame();
        showCountdown();
    });
  
    restartButton.addEventListener("click", () => {
        startSFX.currentTime = 0;
        startSFX.play();
        startGame();
        showCountdown();
    });
  
    if (exitButton) {
        exitButton.addEventListener('click', () => {
            // Hide game and Game Over screen
            gameContainer.style.display = 'none';
            gameOverScreen.style.display = 'none';

            // Show Main Menu
            mainMenu.style.display = 'flex';
            // Show Start Button
            startButton.style.display = 'flex';
          

            // Optional: reset score, timer, health, etc. here if needed
        });
    } else {
        console.warn('Exit button not found!');
    }
});

backToSelectionButton.addEventListener("click", () => {
    gameOverScreen.style.display = "none";
    mainMenu.style.display = "flex";
});
