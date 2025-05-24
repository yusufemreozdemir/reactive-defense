const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let BOSS_LEVEL = 10; //Son level boss

//Giriş menüsündeki arkaplan resmi
const backgroundImage = new Image();
backgroundImage.src = "images/arkaplan.png"; 

//Oyuncu asseti
const tcellImage = new Image();
tcellImage.src = "images/assets/T_lenfosit.png";

//Aksion anındaki arkaplan resmi
const gameBackgroundImage = new Image();
gameBackgroundImage.src = "images/sahne.png";

//T hücresi
const player = {
    x: 50,
    y: canvas.height / 2,
    width: 60,
    height: 60,
    color: "green",
};

//Anlık oyun verileri
const gameState = {
    currentLevel: 1, 
    enemies: [], 
    bullets: [], 
    virusQueue: [],
    virusSpawnInterval: null,
    difficulty: null, //Zorluk seviyesini oyuncu seçecek.
    spawnTime: null, //Değeri seçilen zorluğa göre atanacak.
    gameStarted: false,
    gameOver: false, 
    gameSuccesful: false,
    canShoot: true,
    bodyHealth: 100, 
    missedShots: 0,
    allVirusesDefeated: true, //Level içinde bir virüs vücuda ulaştığında değeri false olur.
    healthInfoColor: "black"
};

//Anlık mouse verileri
const mouseState = {
    mousePos: {x: 0, y: 0}, 
    isMouseDown: false 
};

//Mermi
const bullet = {
    width: 10,
    height: 10,
    color: "black",
    speed: 20,
    damage: null //Seçilen zorluk değerine göre belirlenecek.
};

//Müzik ve ses efekti tanımlamaları
const sounds = {
    bossSound: new Audio("Sounds/bossSound.mp3"),
    levelUpSound: new Audio("Sounds/levelup.mp3"),
    fightMusic: new Audio("Sounds/backGroundMusic.mp3"),
    failSound: new Audio("Sounds/failSound.mp3"),
    gameSuccesfulSound: new Audio("Sounds/gameSuccesful.mp3"),
}

//Zorluk seviyesi seçimi için butonlar
const difficultyButtons = [
    {label: "Kolay", x: 240, y: canvas.height / 2 + 140, width: 100, height: 40, value: "easy"},
    {label: "Normal", x: 380, y: canvas.height / 2 + 140, width: 100, height: 40, value: "normal"},
    {label: "Zor", x: 520, y: canvas.height / 2 + 140, width: 100, height: 40, value: "hard"},
    {label: "Çok Zor", x: 660, y: canvas.height / 2 + 140, width: 100, height: 40, value: "expert"},
];

//Virüs tiplerinin özellikleri (sağlık değerleri zorluk seçimine göre bir katsayı ile çarpılır.)
const virusTypes = {
    alpha: {speed: 1.5, size: 85, color: "yellow", health: 10, damage: 15},
    delta: {speed: 2,size: 80, color: "navy", health: 20, damage: 20},
    omicron: {speed: 2.3,size: 70, color: "purple", health: 25, damage: 25},
    beta: {speed: 1.6,size: 95, color: "red", health: 35, damage: 30},
};

//Virüslerin assetlerini "${key}.png" yoluyla ekle.
for (let key in virusTypes) {
    const img = new Image();
    img.src = `images/assets/viruses/${key}.png`;
    virusTypes[key].image = img; 
}

//Level bilgileri (hangi levelde hangi virüsten kaç tane gelecek)
const levelData = [
    [ {type: "alpha",count: 3} ], //level 1
    [ {type: "alpha",count: 4} ], //level 2
    [ {type: "alpha",count: 5} ], //level 3
    [ {type: "alpha",count: 4}, {type: "delta",count: 1} ], //level 4
    [ {type: "alpha",count: 4}, {type: "delta",count: 2} ], //level 5
    [ {type: "alpha",count: 3}, {type: "delta",count: 3} ], //level 5
    [ {type: "alpha",count: 3}, {type: "delta",count: 3}, {type: "omicron",count: 1} ], //level 7
    [ {type: "alpha",count: 3}, {type: "delta",count: 3}, {type: "omicron",count: 2} ], //level 8
    [ {type: "alpha",count: 3}, {type: "delta",count: 3}, {type: "omicron",count: 3} ], //level 9
    [ {type: "alpha",count: 3}, {type: "delta",count: 3}, {type: "omicron",count: 3}, {type: "beta",count: 3} ] //level 10 
];

canvas.addEventListener("click", function (event) {

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    //Oyun başlamadan önce zorluk seviyesi seçimi
    if (!gameState.gameStarted) {
        
        //Zorluk butonuna tıklanmış mı kontrol et
        for (let btn of difficultyButtons) {

            if (clickX >= btn.x && clickX <= btn.x + btn.width && clickY >= btn.y && clickY <= btn.y + btn.height) {

                gameState.difficulty = btn.value;

                //Seçilen zorluğa göre ayarlar
                if (btn.value === "easy") {
                    gameState.spawnTime = 600;
                    bullet.damage = 15;
                    player.speed = 6;
                } 
                else if (btn.value === "normal") {
                    gameState.spawnTime = 500;
                    bullet.damage = 15;
                    player.speed = 5;
                } 
                else if (btn.value === "hard") {
                    gameState.spawnTime = 400;
                    bullet.damage = 10;
                    player.speed = 4;
                }
                else if (btn.value === "expert") {
                    gameState.spawnTime = 350;
                    bullet.damage = 10;
                    player.speed = 4;
                }

                //Virüslerin canlarını zorluk seviyesine göre ayarla
                for (let type in virusTypes) {
                    
                    if (btn.value === "easy") 
                        virusTypes[type].health *= 1;
    
                    else if (btn.value === "normal") 
                        virusTypes[type].health *= 1.3;

                    else if (btn.value === "hard") 
                        virusTypes[type].health *= 1.6;

                    else if (btn.value === "expert") 
                        virusTypes[type].health *= 1.8;
                }

                startGame(); //Zorluk seçildi, oyun başlasın.
                sounds.fightMusic.play();
                break;
            }
        }
    }
});

//Klavye kontrolü
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

//Mouse hareket ettiğinde pozisyonu güncelle
canvas.addEventListener("mousemove", function (event) {
    const rect = canvas.getBoundingClientRect();
    mouseState.mousePos.x = event.clientX - rect.left;
    mouseState.mousePos.y = event.clientY - rect.top;
});

//Mouse basıldığında
canvas.addEventListener("mousedown", function (event) {
    if (event.button === 0) 
        mouseState.isMouseDown = true;
});

//Mouse bırakıldığında
canvas.addEventListener("mouseup", function (event) {

    gameState.canShoot = true; //Mouse bırakıldıktan sonra tekrar ateş edilebilir.

    if (event.button === 0) 
        mouseState.isMouseDown = false;
});

//İsabet kontrolü
function isColliding(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

//Virüs oluşturma
function createEnemiesForLevel(level) {

    const enemyConfigs = levelData[level - 1];

    for (let i = 0; i < enemyConfigs.length; i++) {

        const config = enemyConfigs[i]; //varyant özelliklerini al. (örneğin config = {type: "alpha", count: 3} olacak)
        const typeInfo = virusTypes[config.type]; //Tip özelliklerini al (hız, renk, boyut vs.)

        for (let j = 0; j < config.count; j++) {   

            let newVirus = {
                x: canvas.width + Math.random() * 300, //X ekseninde ekran dışında bir konumdan başlat.
                y: Math.random() * (canvas.height - typeInfo.size), //Y ekseninde rastgele konumdan başalt.
                width: typeInfo.size,
                height: typeInfo.size,
                speed: typeInfo.speed,
                color: typeInfo.color,
                type: config.type,
                health: typeInfo.health,
                damage: typeInfo.damage,
            };

            gameState.virusQueue.push(newVirus); //Üretilen virüsü spawnlanmak üzere beklemesi için kuyruğa ekle.
        }
    }

    startSpawningViruses(gameState.spawnTime);
    return []; //enemies burada boş kalmalı çünkü virüsler zamanla spawnlanacak.
}

//Virüsleri belli bir süre aralıkla spawnlama fonksiyonu
function startSpawningViruses(intervalMs) {
    
    //Daha önce bir virüs üretme zamanlayıcısı varsa temizle.
    if (gameState.virusSpawnInterval !== null) {
        clearInterval(gameState.virusSpawnInterval);
        gameState.virusSpawnInterval = null;
    }

    //Virüs üretme fonksiyonu
    function spawnVirus() {

        //Kuyrukta virüs kalmadıysa dur.
        if (gameState.virusQueue.length === 0) {
            clearInterval(gameState.virusSpawnInterval);
            gameState.virusSpawnInterval = null;
            return;
        }

        //Rastgele bir virüs seçip sıradan çıkar
        let index = Math.floor(Math.random() * gameState.virusQueue.length);
        let selectedVirus = gameState.virusQueue.splice(index, 1)[0];
        gameState.enemies.push(selectedVirus);
    }

    //Her "intervalMs" milisaniyede bir virüs üret.
    gameState.virusSpawnInterval = setInterval(spawnVirus, intervalMs);
}

//Her bir frame için oyunu güncelle.
function update() {

    //Oyuncu hareketi
    if (keys["w"] || keys["W"] || keys["ArrowUp"]) player.y -= player.speed;
    if (keys["s"] || keys["S"] || keys["ArrowDown"]) player.y += player.speed;
    if (keys["a"] || keys["A"] || keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["d"] || keys["D"] || keys["ArrowRight"]) player.x += player.speed;

    //Ateş etme kontrolü
    if (mouseState.isMouseDown && gameState.canShoot) {

        //Oyuncu ile mouse arasındaki açı
        let angle = Math.atan2(mouseState.mousePos.y - (player.y + player.height / 2), mouseState.mousePos.x - (player.x + player.width / 2));

        //Sol tık basıldığında bir mermi üret.
        const newBullet = {
            x: player.x + player.width / 2, //Mermi oyuncunun tam ortasından çıksın.
            y: player.y + player.height / 2,
            dx: Math.cos(angle) * bullet.speed, //Mermi konumunun x eksenindeki değişimi
            dy: Math.sin(angle) * bullet.speed, //Mermi konumunun y eksenindeki değişimi
            width: bullet.width,
            height: bullet.height,
            color: bullet.color,
            speed: bullet.speed,
            damage: bullet.damage
        };

        gameState.canShoot = false; //Sol tıka basılı tutulduğunda seri atış yapılmasını engelle.
        gameState.bullets.push(newBullet);
    }

    //Mermi hareketi
    gameState.bullets.forEach(bullet => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
    });

    //Oyuncu ekran dışına çıkamasın
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    gameState.enemies.forEach(enemy => enemy.x -= enemy.speed); //Virüslerin hareketi
    
    //İsabet kontrolü, ekran dışına çıkan virüsleri ve mermileri silme
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {

        const targetEnemy = gameState.enemies[i];

        for (let j = gameState.bullets.length - 1; j >= 0; j--) {
            const currentBullet = gameState.bullets[j];

            //İsabet varsa
            if (isColliding(currentBullet, targetEnemy)) {

                targetEnemy.health -= currentBullet.damage;
                gameState.bullets.splice(j, 1); //isabet eden mermiyi sil

                //Ölen virüs oyundan silinsin.
                if (targetEnemy.health <= 0) 
                    gameState.enemies.splice(i, 1);

                break; //Bir mermi birden fazla kez hasar veremesin.
            }

            //Ekran dışına çıkan mermi silinsin ve kaçırılan atış bilgisi güncellensn.
            else if (currentBullet.x < 0 || currentBullet.x > canvas.width || currentBullet.y < 0 || currentBullet.y > canvas.height) {
                gameState.bullets.splice(j, 1);
                gameState.missedShots++;
            }
        }

        //Ekran dışına çıkan virüs oyundan silinsin.
        if (targetEnemy.x + targetEnemy.width < 0){

            gameState.allVirusesDefeated = false;
            gameState.enemies.splice(i, 1); 
            gameState.bodyHealth -= targetEnemy.damage;

            //Sağlık sıfıra düşmüşse oyun biter.
            if (gameState.bodyHealth <= 0){
                gameState.bodyHealth = 0;
                gameState.gameOver = true;
                break;
            }
        }
    }

    //Oyunda ve kuyrukta virüs kalmadıysa yeni seviyeye geç.
    if (gameState.enemies.length === 0 && gameState.virusQueue.length === 0 && !gameState.gameOver) {

        currentHealth = gameState.bodyHealth;
        
        gameState.currentLevel++;
        sounds.levelUpSound.play();

        //Boss levele gelindiyse müziği durdur ve bir ses efekti ver.
        if (gameState.currentLevel === BOSS_LEVEL) {
            sounds.fightMusic.pause();
            sounds.bossSound.loop = false;
            sounds.bossSound.play();
        }

        //Level içerisinde hiç mermi kaçmamışsa ve tüm virüsler ölmüşse sağlık bonusu ver.
        if (gameState.missedShots === 0 && gameState.allVirusesDefeated){
                currentHealth += 10;

            if(currentHealth > 100)
                currentHealth = 100; //Sağlık 100'den fazla olamaz.
        }
        
        gameState.bodyHealth = currentHealth;
        gameState.missedShots = 0;
        gameState.allVirusesDefeated = true;

        //Oyun henüz bitmediyse
        if (gameState.currentLevel <= levelData.length) 
            gameState.enemies = createEnemiesForLevel(gameState.currentLevel);

        //Oyun bittiyse
        else {
            gameState.gameSuccesful = true;
            gameState.gameOver = true;
            gameState.currentLevel = 10; //Oyun bittiğinde "level 11" yazmaması için
        } 
    }

    //Sağlık 40'ın altına düştüyse kırmızı fontla uyarı ver.
    if (gameState.bodyHealth <= 40)
        gameState.healthInfoColor = "red";    
        
    if (gameState.bodyHealth > 40)
        gameState.healthInfoColor = "black";
}

//Her bir frame için oyunun durumunu ekrana çiz.
function draw() {

    //Başlangıç menüsünü çiz.
    if (!gameState.gameStarted) {
        drawStartMenu();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height); //Her frame'den sonra canvası temizle.

    //Oyun başladıysa arka plana sahneyi çiz
    if(gameState.gameStarted) {

        if (gameBackgroundImage.complete) {
            ctx.save(); //önceki ayarları kaydet
            ctx.globalAlpha = 0.8; //biraz saydamlık ekle
            ctx.drawImage(gameBackgroundImage, 0, 0, canvas.width, canvas.height);
            ctx.restore(); //alpha ayarını sıfırla
        }
                    
        //Yedek olarak düz renkli bir arka plan çizimi
        else {
            ctx.fillStyle = "#f0f0f0";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
        
    //Oyuncuyu çiz.
    if (tcellImage.complete) 
        ctx.drawImage(tcellImage, player.x, player.y, player.width, player.height);

    //Oyuncu görseli yüklenmediyse ya da hata varsa yedek olarak kutu çiz.
    else {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    //Düşmanları çiz.
    for (let i = 0; i < gameState.enemies.length; i++) {
        let e = gameState.enemies[i];
        const virusImage = virusTypes[e.type] && virusTypes[e.type].image;

        if (virusImage && virusImage.complete) 
            ctx.drawImage(virusImage, e.x, e.y, e.width, e.height);

        else {
            //Virüs görseli yüklenmediyse ya da hata varsa yedek olarak kutu çiz.
            ctx.fillStyle = e.color;
            ctx.fillRect(e.x, e.y, e.width, e.height);
        }
    }

    //Mermileri çiz.
    for (let bullet of gameState.bullets) {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    
    //Seviye ve sağlık bilgilerini oyuncuya göster.
    ctx.fillStyle = "black";
    ctx.font = "25px Arial";
    ctx.fillText("Seviye: " + gameState.currentLevel, 65, 30);
    ctx.fillStyle = gameState.healthInfoColor;
    ctx.fillText("Sağlık: " + gameState.bodyHealth, 210, 30);

    //Boss levele gelindiği zaman güçlü temaya sahip bir "BOSS" yazısı göster.
    if (gameState.currentLevel === BOSS_LEVEL) {

        ctx.font = "bold 30px Impact, Arial";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 1;
        ctx.fillStyle = "red";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;

        ctx.fillText("== BOSS LEVEL ==", canvas.width/2 + 130, 30);
        ctx.strokeText("== BOSS LEVEL ==", canvas.width/2 + 130, 30);
    }

    drawHealthBar(); //Sağlık barı çiz.

    //Oyun bittiyse,
    if (gameState.gameOver) { 

        //Oyun kazanıldıysa,
        if (gameState.gameSuccesful){

            sounds.fightMusic.pause();
            sounds.gameSuccesfulSound.play();

            //Ses çok kısa olduğu için "gameSuccesfulSound.loop = false" yazmak işe yaramıyordu ben de sesi manuel durdurdum.
            setTimeout(() => {
                sounds.gameSuccesfulSound.pause();
                sounds.gameSuccesfulSound.currentTime = 0;
            }, 1500);

            ctx.fillStyle = "black";
            ctx.font = "60px Arial";
            ctx.fillText("🎉 Tebrikler Kazandınız! 🎉", canvas.width / 2, canvas.height / 2);
        }

        //Oyun kaybedildiyse,
        else {

            sounds.fightMusic.pause();
            sounds.failSound.play();

            //Aynı şekilde çok kısa sesi tekrar etmemesi için manuel durdur.
            setTimeout(() => {
                sounds.failSound.pause();
                sounds.failSound.currentTime = 0;
            }, 1000);

            ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "black";
            ctx.font = "40px Arial";
            ctx.fillText("💀 Virüsler Vücudu Ele Geçirdi! 💀", canvas.width / 2 , canvas.height / 2);
        }
    }
}

//Başlangıç menüsünü çizme fonksiyonu
function drawStartMenu() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Arka plan görselini çiz
    if (backgroundImage.complete) 
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    //Zorluk butonlarını çiz
    difficultyButtons.forEach(button => {
        ctx.fillStyle = "#00695c";
        ctx.fillRect(button.x, button.y, button.width, button.height);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(button.label, button.x + button.width / 2, button.y + 27);
    });
}

//Sağlık barı çizme fonksiyonu
function drawHealthBar() {

    const barWidth = 200;
    const barHeight = 20;
    const x = 285;
    const y = 10;

    ctx.fillStyle = "grey";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = gameState.healthInfoColor;
    ctx.fillRect(x, y, barWidth * (gameState.bodyHealth / 100), barHeight);

    ctx.strokeStyle = "black";
    ctx.strokeRect(x, y, barWidth, barHeight);
}

//Ana döngü
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

//Oyunu başlatma fonksiyonu
function startGame(){
    gameState.gameStarted = true;
    gameState.enemies = createEnemiesForLevel(gameState.currentLevel);
    gameLoop();
}

//Arka plan yüklendiğinde ilk çizimi yap
backgroundImage.onload = () => {
    draw(); 
};


