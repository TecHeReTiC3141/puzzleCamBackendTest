let canvas = document.getElementById('mainCanvas');
let context = canvas.getContext('2d');

let VIDEO;
let camPromise = navigator.mediaDevices.getUserMedia(
    {video: true});
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let SIZE = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rows: 3,
    columns: 3,
}
let PIECES = [];
const SCALER = .8;
let curDifficulty = 'easy';
let DIFFICULTIES = ['easy', 'medium', 'hard', 'insane'];

let MENU_SECTION = document.querySelector('.menu');
let TOP_OFFSET = MENU_SECTION.getBoundingClientRect().height;

let START_TIME = null, END_TIME = null;
let CURTIME = document.querySelector('.cur-time');
let TIMEPASSED = CURTIME.querySelector('span');

let ENDSCREEN = document.querySelector('.endScreen');
let YOUWIN = document.querySelector('.you-win');

let NAMEINPUT = document.getElementById('name');

let SCORESTABLE = document.querySelector('.scoresTable');

let POP_SOUND = new Audio('pop.mp3');
POP_SOUND.volume = .25;
let WIN_SOUND = new Audio('win_sound.wav');
WIN_SOUND.volume = .25;

let DIFFICULTIES_BTNS = document.querySelectorAll('.difficulties li');

DIFFICULTIES_BTNS.forEach(diff => {
    diff.addEventListener('click', () => {
        DIFFICULTIES_BTNS.forEach(d => d.classList.remove('active'));
        diff.classList.add('active');
        setDifficulty(diff);
    });
})

let SELECTED_SEGMENT = null;
let WIN = false;

function getPosAndSize() {
    let resizer = SCALER * Math.min(
        window.innerWidth / VIDEO.videoWidth,
        window.innerHeight / VIDEO.videoHeight,
    );
    SIZE.width = resizer * VIDEO.videoWidth;
    SIZE.height = resizer * VIDEO.videoHeight;
    SIZE.x = window.innerWidth / 2 - SIZE.width / 2;
    SIZE.y = window.innerHeight / 2 - SIZE.height / 2;
}

camPromise.then(signal => {
    VIDEO = document.createElement('video');
    VIDEO.classList.add('web-cam')
    VIDEO.srcObject = signal;
    VIDEO.play();
    VIDEO.addEventListener('loadeddata', () => {
        getPosAndSize();
        initiatePieces(SIZE.rows, SIZE.columns);
        addEventListeners();
        console.log(PIECES);
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            getPosAndSize()
        });
        updateCanvas();
    });
}).catch(err => {
    console.log(`Camera error: ${err}`);
})

function updateCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (curDifficulty == 'easy') {
        context.globalAlpha = .5;
        context.drawImage(VIDEO, SIZE.x, SIZE.y, SIZE.width, SIZE.height);
        context.globalAlpha = 1;
    } else {
        context.beginPath();
        context.rect(SIZE.x, SIZE.y, SIZE.width, SIZE.height);
        context.stroke();
    }
    PIECES.filter(p => p.isCorrect).forEach(p => {
        p.draw(context);
    });
    PIECES.filter(p => !p.isCorrect).forEach(p => {
        p.draw(context);
    });
    window.requestAnimationFrame(updateCanvas);
}

function initiatePieces(rows, cols) {
    PIECES = [];
    SIZE.rows = rows;
    SIZE.columns = cols;
    for (let i = 0; i < SIZE.rows; ++i) {
        for (let j = 0; j < SIZE.columns; ++j) {
            PIECES.push(new Piece(i, j));
        }
    }

    for (let i = 0; i < SIZE.rows; ++i) {
        for (let j = 0; j < SIZE.columns; ++j) {
            let piece = PIECES[i * SIZE.columns + j];
            // bottom tab
            if (i !== SIZE.rows - 1) {
                let dir = (Math.random() - .5) < 0 ? -1 : 1;
                piece.bottom = dir * (Math.random() * .4 + .3);
            }
            // right tab
            if (j !== SIZE.columns - 1) {
                let dir = (Math.random() - .5) < 0 ? -1 : 1;
                piece.right = dir * (Math.random() * .4 + .3);
            }
            // top tab
            if (i !== 0) {
                piece.top = -PIECES[(i - 1) * SIZE.columns + j].bottom;
            }
            // left tab
            if (j !== 0) {
                piece.left = -PIECES[i * SIZE.columns + j - 1].right;
            }
        }
    }
}

function randomizePositions() {
    PIECES.forEach(p => {
        p.x = Math.random() * (canvas.width - p.width);
        p.y = Math.random() * (canvas.height - p.height);
        p.isCorrect = false;
    });
}

function getSelected(event) {
    event.y -= TOP_OFFSET;
    for (let i = PIECES.length - 1; i >= 0; --i) {
        let p = PIECES[i];
        if (!p.isCorrect &&
            p.x <= event.x && event.x <= p.x + p.width
            && p.y <= event.y && event.y <= p.y + p.height) {
            return p;
        }
    }
    return null;
}

function win() {
    WIN = true;
    YOUWIN.innerHTML = `You win! your time is ${TIMEPASSED.innerHTML}`;
    CURTIME.style.display = 'none';
    YOUWIN.style.display = 'block'
    ENDSCREEN.style.display = 'block';
    document.querySelector('.saveBtn').innerHTML = 'Save';
    document.querySelector('.saveBtn').disabled = false;
    END_TIME = Date.now();
    WIN_SOUND.play();
}

function mouseMoveEvent(event) {
    event.y -= TOP_OFFSET;
    if (SELECTED_SEGMENT != null) {
        SELECTED_SEGMENT.x = event.x - SELECTED_SEGMENT.offset.x;
        SELECTED_SEGMENT.y = event.y - SELECTED_SEGMENT.offset.y;
    }
}

function mouseUpEvent() {
    if (SELECTED_SEGMENT instanceof Piece && SELECTED_SEGMENT.isClose()) {
        SELECTED_SEGMENT.isCorrect = true;
        POP_SOUND.play();
        if (PIECES.filter(p => p.isCorrect).length === PIECES.length) {
            win();
        }
    }
    SELECTED_SEGMENT = null;
}

function touchStartEvent(event) {
    let loc = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY - TOP_OFFSET,
    }
    mouseDownEvent(loc);
}

function touchMoveEvent(event) {
    let loc = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY - TOP_OFFSET,
    }
    mouseMoveEvent(loc);
}

function touchEndEvent() {
    mouseUpEvent();
}

function addEventListeners() {
    // For computers
    canvas.addEventListener('mousedown', mouseDownEvent);
    canvas.addEventListener('mousemove', mouseMoveEvent);
    canvas.addEventListener('mouseup', mouseUpEvent);
    // For mobile devices
    canvas.addEventListener('touchstart', touchStartEvent);
    canvas.addEventListener('touchmove', touchMoveEvent);
    canvas.addEventListener('touchend', touchEndEvent);
}

function setDifficulty(curDirr) {
    curDifficulty = curDirr.innerText.toLowerCase();
    switch (curDifficulty) {
        case "easy":
            initiatePieces(3, 3,);
            break;
        case "medium":
            initiatePieces(4, 4,);
            break;
        case "hard":
            initiatePieces(5, 5,);
            break;
        case "insane":
            initiatePieces(7, 7,);
            break;
    }

}

function restart() {
    WIN = false;
    randomizePositions();
    MENU_SECTION.style.display = 'none';
    START_TIME = Date.now();
    CURTIME.style.display = 'block';
    updateTime();
    setInterval(updateTime, 1000);
}

// TODO: implemented saveScore;
function saveScore() {
    let timePassed = Math.round((END_TIME - START_TIME) / 1000);
    let name = NAMEINPUT.value;
    if (!name) {
        alert('Enter your name');
        return;
    }
    console.log(`server.php?info={"name": "${name}", "time": "${timePassed}", "difficulty": "${curDifficulty}"}`);
    fetch(`server.php?info={"name": "${name}", "time": "${timePassed}", "difficulty": "${curDifficulty}"}`)
        .then(resp => {
            console.log(resp.text());
            document.querySelector('.saveBtn').innerHTML = 'OK!';
            document.querySelector('.saveBtn').disabled = true;
        }).catch(err => {
        console.log(err);
    })

}

function updateTime() {
    if (START_TIME != null) {
        let timePassed = new Date(Date.now() - START_TIME);
        TIMEPASSED.innerHTML = timePassed.toLocaleString('ru', TIME_OPTIONS);
    }
}

function goToMenu() {
    MENU_SECTION.style.display = 'block';
    ENDSCREEN.style.display = 'none';
}

function showScores() {
    MENU_SECTION.style.display = 'none';
    ENDSCREEN.style.display = 'none';
    SCORESTABLE.style.display = 'block';
    getScores();
}

function getScores() {
    fetch('server.php').then(response => {
        response.json().then(data => {
            console.log(data);
            createScoresTable(data);
        });
    });
}

function createScoresTable(data) {
    let table = SCORESTABLE.querySelector('.scores');
    table.replaceChildren();
    DIFFICULTIES.forEach(diff => {
        let header = document.createElement('tr');
        header.innerHTML = `<th></th><th>${diff}</th><th>Time</th>`;
        table.insertAdjacentElement('beforeend', header);
        let counter = 0;
        for (let ind in data[diff]) {
            let row = data[diff][ind];
            let tr = document.createElement('tr');
            tr.innerHTML = `<td>${++counter}</td><td>${row.NAME}</td><td>${row.TIME}</td>`;
            table.insertAdjacentElement('beforeend', tr);
        }
    })

}

function backToEndScreen() {
    ENDSCREEN.style.display = 'block';
    SCORESTABLE.style.display = 'none';

}

function mouseDownEvent(event) {
    SELECTED_SEGMENT = getSelected(event);
    if (SELECTED_SEGMENT != null) {
        let selInd = PIECES.indexOf(SELECTED_SEGMENT);
        PIECES.splice(selInd, 1);
        PIECES.push(SELECTED_SEGMENT);
        SELECTED_SEGMENT.offset = {
            x: event.x - SELECTED_SEGMENT.x,
            y: event.y - SELECTED_SEGMENT.y,
        }
    }
}

const TIME_OPTIONS = {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
}

class Piece {
    errorRate = 25;

    constructor(rowInd, colInd) {
        this.rowInd = rowInd;
        this.colInd = colInd;
        this.isCorrect = false;
        this.getPosAndSize();
        this.x = SIZE.x + this.colInd * this.width;
        this.y = SIZE.y + this.rowInd * this.height;
        this.top = null;
        this.left = null;
        this.right = null;
        this.bottom = null;
    }

    getPosAndSize() {
        this.width = SIZE.width / SIZE.columns;
        this.height = SIZE.height / SIZE.rows;
        if (this.isCorrect) {
            this.x = SIZE.x + this.colInd * this.width;
            this.y = SIZE.y + this.rowInd * this.height;
        }
    }

    isClose() {
        let correctLocX = SIZE.x + this.colInd * this.width;
        let correctLocY = SIZE.y + this.rowInd * this.height;
        if (Math.abs(correctLocX - this.x) <= this.errorRate
            && Math.abs(correctLocY - this.y) <= this.errorRate) {
            this.isCorrect = true;
            this.x = correctLocX;
            this.y = correctLocY;
            return true;
        }
        return false;
    }

    draw(context) {
        context.beginPath();

        const sz = Math.min(this.width, this.height);
        const neck = 0.05 * sz;
        const tabWidth = 0.25 * sz;
        const tabHeight = 0.25 * sz;

        if (this.isCorrect) {
            context.strokeStyle = 'green';
        } else {
            context.strokeStyle = 'black';
        }

        //context.rect(this.x,this.y,this.width,this.height);
        //from top left
        context.moveTo(this.x, this.y);
        //to top right
        if (this.top) {
            context.lineTo(this.x + this.width * Math.abs(this.top) - neck,
                this.y);
            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.top) - neck,
                this.y - tabHeight * Math.sign(this.top) * 0.2,

                this.x + this.width * Math.abs(this.top) - tabWidth,
                this.y - tabHeight * Math.sign(this.top),

                this.x + this.width * Math.abs(this.top),
                this.y - tabHeight * Math.sign(this.top)
            );

            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.top) + tabWidth,
                this.y - tabHeight * Math.sign(this.top),

                this.x + this.width * Math.abs(this.top) + neck,
                this.y - tabHeight * Math.sign(this.top) * 0.2,

                this.x + this.width * Math.abs(this.top) + neck,
                this.y
            );
        }
        context.lineTo(this.x + this.width, this.y);

        //to bottom right
        if (this.right) {
            context.lineTo(this.x + this.width, this.y + this.height * Math.abs(this.right) - neck);
            context.bezierCurveTo(
                this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
                this.y + this.height * Math.abs(this.right) - neck,

                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right) - tabWidth,

                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right)
            );
            context.bezierCurveTo(
                this.x + this.width - tabHeight * Math.sign(this.right),
                this.y + this.height * Math.abs(this.right) + tabWidth,

                this.x + this.width - tabHeight * Math.sign(this.right) * 0.2,
                this.y + this.height * Math.abs(this.right) + neck,

                this.x + this.width,
                this.y + this.height * Math.abs(this.right) + neck
            );
        }
        context.lineTo(this.x + this.width, this.y + this.height);

        //to bottom left
        if (this.bottom) {
            context.lineTo(this.x + this.width * Math.abs(this.bottom) + neck,
                this.y + this.height)

            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.bottom) + neck,
                this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

                this.x + this.width * Math.abs(this.bottom) + tabWidth,
                this.y + this.height + tabHeight * Math.sign(this.bottom),

                this.x + this.width * Math.abs(this.bottom),
                this.y + this.height + tabHeight * Math.sign(this.bottom)
            );

            context.bezierCurveTo(
                this.x + this.width * Math.abs(this.bottom) - tabWidth,
                this.y + this.height + tabHeight * Math.sign(this.bottom),

                this.x + this.width * Math.abs(this.bottom) - neck,
                this.y + this.height + tabHeight * Math.sign(this.bottom) * 0.2,

                this.x + this.width * Math.abs(this.bottom) - neck,
                this.y + this.height
            );
        }
        context.lineTo(this.x, this.y + this.height);

        //to top left
        if (this.left) {
            context.lineTo(this.x, this.y + this.height * Math.abs(this.left) + neck);

            context.bezierCurveTo(
                this.x + tabHeight * Math.sign(this.left) * 0.2,
                this.y + this.height * Math.abs(this.left) + neck,

                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left) + tabWidth,

                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left)
            );

            context.bezierCurveTo(
                this.x + tabHeight * Math.sign(this.left),
                this.y + this.height * Math.abs(this.left) - tabWidth,

                this.x + tabHeight * Math.sign(this.left) * 0.2,
                this.y + this.height * Math.abs(this.left) - neck,

                this.x,
                this.y + this.height * Math.abs(this.left) - neck
            );
        }
        context.lineTo(this.x, this.y);

        context.save();
        context.clip();

        let scaleTabHeight = Math.min(VIDEO.videoHeight / SIZE.rows,
        VIDEO.videoWidth / SIZE.columns) * tabHeight / sz;

        context.drawImage(VIDEO,
            this.colInd * VIDEO.videoWidth / SIZE.columns - scaleTabHeight,
            this.rowInd * VIDEO.videoHeight / SIZE.rows - scaleTabHeight,
            VIDEO.videoWidth / SIZE.columns + scaleTabHeight * 2,
            VIDEO.videoHeight / SIZE.rows + scaleTabHeight * 2,
            this.x - tabHeight,
            this.y - tabHeight,
            this.width + tabHeight * 2,
            this.height + tabHeight * 2);

        context.restore();
        context.stroke();
    }
}